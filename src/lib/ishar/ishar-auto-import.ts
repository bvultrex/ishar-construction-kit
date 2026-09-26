import JSZip from "jszip";
import { classifyFile } from "./classify";
import { PACKER_NEW, unpackSilm } from "./silm-pack";
import type { DiscoveredAssetPreview, LoadedAssetPack } from "./asset-pack";
import { extractAlisIndexedImages, type AlisCompositeResource, type AlisIndexedImage, type AlisPaletteResource } from "./alis-assets";
import type { DungeonAssetEntry, DungeonAssetManifest, DungeonAssetRole, FileRecord, GameId } from "./types";
import { renderProfileForGame } from "./render-profile";

export interface IsharDefaultAssignment {
  role: DungeonAssetRole;
  sourcePath: string;
  entryIndex: number;
  confidence: "probable" | "possible";
  reason: string;
}

export interface IsharAutoImportReport {
  mode: "ishar-auto";
  detectedGame: GameId;
  totalFiles: number;
  packedFiles: number;
  decodedOldPacker: number;
  decodedA1Packer: number;
  failedPackedDecode: number;
  alisTablesFound: number;
  alisImagesExtracted: number;
  alisTerrainTexturesExtracted: number;
  alisFlatColorAssets: number;
  alisImagesRejected: number;
  alisImagesSkippedForBudget: number;
  alisPaletteResources: number;
  alisCompositeResources: number;
  alisCompositePreviews: number;
  alisResourceFormatCounts: Record<string, number>;
  stagePaletteBaseFound: boolean;
  paletteBaseLabel: string;
  paletteBaseVerified: boolean;
  localPaletteOverlayImages: number;
  globalPaletteFallbackImages: number;
  alisPaletteSuspectAssets: number;
  directImages: number;
  embeddedImages: number;
  mappedImages: number;
  unmappedImages: number;
  candidateResources: number;
  defaultAssignments: IsharDefaultAssignment[];
  notes: string[];
}

export interface IsharAutoImportResult {
  pack: LoadedAssetPack;
  inventory: FileRecord[];
  report: IsharAutoImportReport;
}

interface FoundImage {
  path: string;
  bytes: Uint8Array;
  mime: string;
}

const SKIP = /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)/i;

function baseName(path: string) {
  return path.split(/[/\\]/).pop() ?? path;
}

function extension(path: string) {
  const base = baseName(path).toLowerCase();
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot) : "";
}

function directImageMime(path: string) {
  const ext = extension(path);
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".bmp") return "image/bmp";
  if (ext === ".svg") return "image/svg+xml";
  return undefined;
}

function detectGame(records: FileRecord[], archiveName = ""): GameId {
  let ishar1 = 0;
  let ishar2 = 0;
  const archive = archiveName.toLowerCase();
  if (/ishar[ _.-]*1\b|ishar1\b/.test(archive)) ishar1 += 12;
  if (/ishar[ _.-]*2\b|ishar2\b/.test(archive)) ishar2 += 12;

  for (const record of records) {
    const name = baseName(record.path).toUpperCase();
    const path = record.path.toLowerCase();
    if (/(^|[/\\])ishar[ _.-]*1([/\\]|$)/i.test(path)) ishar1 += 4;
    if (/(^|[/\\])ishar[ _.-]*2([/\\]|$)/i.test(path)) ishar2 += 4;

    // Verified corpus signatures. File names alone are deliberately weak:
    // Ishar 1 itself can contain IMP2.SAV (5216 bytes).
    if (/^CONT\d+\.FIC$/.test(name)) {
      if (record.size === 4860) ishar1 += 6;
      if (record.size === 10800) ishar2 += 6;
    }
    if (name === "EN1.FIC") {
      if (record.size === 3640) ishar1 += 8;
      if (record.size === 6050) ishar2 += 8;
    }
    if (record.ext === ".SAV") {
      if (record.size === 5216) ishar1 += 5;
      if (record.size === 8359) ishar2 += 5;
    }
    if (name === "IMP2.SAV") {
      if (record.size === 5216) ishar1 += 4;
      else if (record.size === 8359) ishar2 += 4;
    }
  }

  if (ishar1 === 0 && ishar2 === 0) return "unknown";
  if (ishar1 === ishar2) return "unknown";
  return ishar1 > ishar2 ? "ishar1" : "ishar2";
}

function guessRole(path: string): DungeonAssetRole | undefined {
  const name = baseName(path).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (/(background|backgr|backdrop|fond|decor|scene)/.test(name)) return "viewport.background";
  if (/(door|porte|gate|portal)/.test(name)) return "door.front.closed";
  if (/(portrait|face|head|avatar|perso|visage|tete)/.test(name)) return "portrait";
  if (/(monster|monstre|enemy|ennemi|creature|guardian|guard|combat|orc|wolf|spider|dragon)/.test(name)) return "encounter";
  if (/(item|object|objet|pickup|icon|invent|potion|key|clef|rune|sword|shield|arme)/.test(name)) return "item";
  if (/(ceiling|plafond)/.test(name)) return "surface.ceiling";
  if (/(floor|ground|sol)/.test(name)) return "surface.floor";
  if (/(front-wall|wall-front|frontwall|mur-front|murface)/.test(name)) return "wall.front";
  if (/(left-wall|wall-left|mur-left|mur-gauche)/.test(name)) return "wall.left";
  if (/(right-wall|wall-right|mur-right|mur-droite)/.test(name)) return "wall.right";
  return undefined;
}

function suggestRoleByDimensions(width: number, height: number): DungeonAssetRole | undefined {
  if (width <= 56 && height <= 56) return "item";
  if (width >= 32 && width <= 120 && height >= 42 && height <= 150) return "portrait";
  if (width >= 220 && height >= 120) return "viewport.background";
  return undefined;
}

const DUNGEON_SOURCE = /(dungeon|donjon|decor|dekor|crypt|crypte|cave|cavern|grotte|castle|chateau|interior|inside|temple|fort|stone|pierre|brick|brique|wall|mur|labyr)/i;
const ENTITY_SOURCE = /(perso|portrait|face|head|avatar|monster|monstre|enemy|ennemi|creature|combat|item|object|objet|invent|icon|potion|spell|magic|menu|font|cursor|logo|title|intro)/i;

function transparentRatio(image: AlisIndexedImage) {
  if (image.transparentIndex === undefined || !image.pixels.length) return 0;
  let transparent = 0;
  for (const pixel of image.pixels) if (pixel === image.transparentIndex) transparent++;
  return transparent / image.pixels.length;
}

function edgeContinuity(image: AlisIndexedImage) {
  if (image.width < 2 || image.height < 2) return 0;
  let horizontal = 0;
  for (let y = 0; y < image.height; y++) {
    if (image.pixels[y * image.width] === image.pixels[y * image.width + image.width - 1]) horizontal++;
  }
  let vertical = 0;
  const bottom = (image.height - 1) * image.width;
  for (let x = 0; x < image.width; x++) {
    if (image.pixels[x] === image.pixels[bottom + x]) vertical++;
  }
  return ((horizontal / image.height) + (vertical / image.width)) / 2;
}

function paletteVariety(image: AlisIndexedImage) {
  const values = new Set<number>();
  const stride = Math.max(1, Math.floor(image.pixels.length / 2048));
  for (let i = 0; i < image.pixels.length; i += stride) values.add(image.pixels[i] ?? 0);
  return values.size;
}

function isFlatColorImage(image: AlisIndexedImage) {
  if (!image.pixels.length) return true;
  const counts = new Map<number, number>();
  const stride = Math.max(1, Math.floor(image.pixels.length / 4096));
  let sampled = 0;
  let max = 0;
  for (let i = 0; i < image.pixels.length; i += stride) {
    const value = image.pixels[i] ?? 0;
    const next = (counts.get(value) ?? 0) + 1;
    counts.set(value, next);
    sampled++;
    if (next > max) max = next;
  }
  return sampled > 0 && max / sampled >= 0.96;
}

function textureFitness(image: AlisIndexedImage) {
  const aspect = Math.min(image.width, image.height) / Math.max(image.width, image.height);
  const transparency = transparentRatio(image);
  const continuity = edgeContinuity(image);
  const variety = paletteVariety(image);
  let score = 0;
  if (image.width >= 12 && image.width <= 160) score += 8;
  if (image.height >= 12 && image.height <= 160) score += 8;
  if (image.assetKind === "terrain") score += 70;
  score += aspect * 22;
  score += continuity * 16;
  if (transparency <= 0.01) score += 12;
  else if (transparency <= 0.08) score += 3;
  else score -= 24 * transparency;
  if (variety >= 4 && variety <= 96) score += 7;
  if (aspect < 0.48) score -= 20;
  if (image.width > 220 || image.height > 220) score -= 12;
  return score;
}

function roleScore(image: AlisIndexedImage, role: DungeonAssetRole, preferredSource: string | undefined, game: GameId) {
  const path = image.sourcePath.toLowerCase();
  const profile = renderProfileForGame(game);
  let score = 0;
  if (preferredSource && image.sourcePath === preferredSource) score += 12;
  if (DUNGEON_SOURCE.test(path)) score += 18;
  if (ENTITY_SOURCE.test(path)) score -= 30;
  const fitness = textureFitness(image);
  const fullDrawspace = image.width === profile.drawWidth && image.height === profile.drawHeight;

  if (role === "surface.floor") {
    score += fitness;
    if (image.assetKind === "terrain") score += 65;
    if (/(floor|ground|sol|dalle|pave|pavement)/i.test(path)) score += 48;
  } else if (role === "surface.ceiling") {
    score += fitness;
    if (image.assetKind === "terrain") score += 65;
    if (/(ceiling|plafond|sky|ciel|roof|toit|voute)/i.test(path)) score += 48;
  } else if (role === "wall.front" || role === "wall.left" || role === "wall.right") {
    score += fitness;
    if (image.assetKind === "terrain") score += 80;
    if (/(wall|mur|stone|pierre|brick|brique|decor|dungeon|donjon|crypt|crypte)/i.test(path)) score += 40;
  } else if (role === "door.front.closed") {
    if (/(door|porte|gate|portal|grille|entry|entree)/i.test(path)) score += 58;
    const aspect = image.width / image.height;
    if (aspect >= 0.22 && aspect <= 0.82 && image.height >= 32 && image.height <= profile.drawHeight * 1.45) score += 22;
    if (transparentRatio(image) >= 0.03) score += 8;
    if (image.width > profile.drawWidth * 0.8) score -= 15;
  } else if (role === "viewport.background") {
    if (/(sky|ciel|background|backdrop|fond|scene|landscape|horizon|decor|dungeon|donjon)/i.test(path)) score += 34;
    if (fullDrawspace) score += 58;
    else if (image.width >= profile.drawWidth * 0.8 && image.height >= profile.drawHeight * 0.75) score += 18;
  }
  return score;
}

function bestByScore(images: AlisIndexedImage[], role: DungeonAssetRole, preferredSource: string | undefined, minimum: number, game: GameId) {
  let best: { image: AlisIndexedImage; score: number } | undefined;
  for (const image of images) {
    const score = roleScore(image, role, preferredSource, game);
    if (score < minimum) continue;
    if (!best || score > best.score || (score === best.score && image.width * image.height > best.image.width * best.image.height)) best = { image, score };
  }
  return best;
}

function chooseSeamlessTextureSet(images: AlisIndexedImage[]) {
  const terrainImages = images.filter((image)=>image.assetKind==="terrain" && !isFlatColorImage(image));
  const pool = terrainImages.length ? terrainImages : images;
  const eligible = pool.filter((image) => {
    const ratio = image.width / image.height;
    return image.width >= 12 && image.height >= 12
      && image.width <= 160 && image.height <= 160
      && ratio >= 0.62 && ratio <= 1.62
      && transparentRatio(image) <= 0.03
      && textureFitness(image) >= 30
      && !isFlatColorImage(image)
      && !ENTITY_SOURCE.test(image.sourcePath);
  });
  const bySource = new Map<string, AlisIndexedImage[]>();
  for (const image of eligible) bySource.set(image.sourcePath, [...(bySource.get(image.sourcePath) ?? []), image]);
  let best: { source: string; images: AlisIndexedImage[]; score: number } | undefined;
  for (const [source, candidates] of bySource) {
    const ranked = [...candidates].sort((a,b)=>textureFitness(b)-textureFitness(a));
    const top = ranked.slice(0, 6);
    let score = top.slice(0,3).reduce((sum,image)=>sum+textureFitness(image),0);
    if (DUNGEON_SOURCE.test(source)) score += 35;
    if (top.some((image)=>image.assetKind==="terrain")) score += 120;
    if (top.length >= 3) score += 18;
    if (!best || score > best.score) best = { source, images: ranked, score };
  }
  return best;
}
function chooseDefaultDungeonAssets(images: AlisIndexedImage[], game: GameId): IsharDefaultAssignment[] {
  if (!images.length) return [];
  const trueTerrain=images.filter((image)=>image.assetKind==="terrain" && !isFlatColorImage(image));
  // For known Ishar games, do not fabricate floor/wall/ceiling defaults from
  // ordinary sprites. If the importer has not reached the terrain path yet,
  // keep the SVG fallback visible and report the missing terrain explicitly.
  if (game !== "unknown" && trueTerrain.length === 0) return [];
  const assignments: IsharDefaultAssignment[] = [];
  const add = (role: DungeonAssetRole, image: AlisIndexedImage | undefined, score: number, reason: string, threshold = 55) => {
    if (!image) return;
    assignments.push({
      role,
      sourcePath: image.sourcePath,
      entryIndex: image.entryIndex,
      confidence: score >= threshold ? "probable" : "possible",
      reason: reason + " (Score " + Math.round(score) + "; " + image.width + "×" + image.height + ").",
    });
  };

  // First preference: three repeatable opaque tiles from one ALIS source group.
  // This is much safer for Ishar-like brick wall/floor/roof rendering than
  // stretching a complete room/background or a tall decorative sprite.
  const set = chooseSeamlessTextureSet(images);
  const wall = set?.images[0];
  const floor = set?.images[1] ?? wall;
  const ceiling = set?.images[2] ?? wall;
  if (wall) {
    const base = textureFitness(wall) + (DUNGEON_SOURCE.test(wall.sourcePath) ? 24 : 0);
    add("wall.front", wall, base, "repeatable ALIS texture from coherent dungeon set");
    add("wall.left", wall, base, "same repeatable base texture for left wall");
    add("wall.right", wall, base, "same repeatable base texture for right wall");
  }
  if (floor) add("surface.floor", floor, textureFitness(floor), "second repeatable tile from the same ALIS texture group", 44);
  if (ceiling) add("surface.ceiling", ceiling, textureFitness(ceiling), "third repeatable tile from the same ALIS texture group", 44);

  // Door auto-mapping is intentionally strict. Shape alone is not enough.
  const explicitDoorImages = images.filter((image)=>/(door|porte|gate|portal|grille|entry|entree)/i.test(image.sourcePath));
  const door = bestByScore(explicitDoorImages, "door.front.closed", set?.source, 50, game);
  if (door) add("door.front.closed", door.image, door.score, "explicit door/portal source context", 62);

  // For an interior dungeon we deliberately do NOT assign a generic full-screen
  // background. It previously masked the textured perspective and made every
  // room look like one constant scene. Only explicit sky/background resources
  // are allowed to become a viewport background.
  if (game === "unknown") {
    const explicitBackgrounds = images.filter((image)=>/(sky|ciel|background|backdrop|fond|landscape|horizon)/i.test(image.sourcePath));
    const background = bestByScore(explicitBackgrounds, "viewport.background", set?.source, 75, game);
    if (background) add("viewport.background", background.image, background.score, "explicit sky/background source", 82);
  }

  return assignments;
}
function defaultChoiceKey(sourcePath:string,entryIndex:number){
  return `${sourcePath}#${entryIndex}`;
}

function tileSize(image: AlisIndexedImage){
  const width=Math.max(8,Math.min(96,image.width));
  const height=Math.max(8,Math.min(96,image.height));
  return {tileWidth:width,tileHeight:height};
}

function placementFor(role: DungeonAssetRole) {
  if (role === "encounter") return { x: 220, y: 85, width: 200, height: 270 };
  if (role === "item") return { x: 455, y: 250, width: 105, height: 115 };
  if (role === "portrait") return { x: 0, y: 0, width: 96, height: 96 };
  return {};
}

function readU32LE(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] ?? 0) | ((bytes[offset+1] ?? 0)<<8) | ((bytes[offset+2] ?? 0)<<16) | ((bytes[offset+3] ?? 0)<<24)) >>> 0;
}

function indexOf(bytes: Uint8Array, needle: number[], start=0) {
  outer: for (let i=start; i<=bytes.length-needle.length; i++) {
    for (let n=0;n<needle.length;n++) if (bytes[i+n]!==needle[n]) continue outer;
    return i;
  }
  return -1;
}

function scanEmbeddedImages(bytes: Uint8Array, sourcePath: string): FoundImage[] {
  const out: FoundImage[] = [];
  const push = (start: number, end: number, mime: string, ext: string, index: number) => {
    if (start < 0 || end <= start || end > bytes.length) return;
    out.push({ path: sourcePath + "#embedded-" + index + ext, bytes: bytes.slice(start,end), mime });
  };

  let count=0;
  for (let pos=0;(pos=indexOf(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a],pos))>=0;pos+=8) {
    const endMarker=indexOf(bytes,[0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82],pos+8);
    if(endMarker<0) break;
    push(pos,endMarker+8,"image/png",".png",++count);
    pos=endMarker+8;
  }
  for (let pos=0;(pos=indexOf(bytes,[0xff,0xd8,0xff],pos))>=0;pos+=3) {
    const end=indexOf(bytes,[0xff,0xd9],pos+3);
    if(end<0) break;
    push(pos,end+2,"image/jpeg",".jpg",++count);
    pos=end+2;
  }
  for (let pos=0;pos<bytes.length-10;pos++) {
    const gif = String.fromCharCode(...bytes.slice(pos,pos+6));
    if(gif!=="GIF87a" && gif!=="GIF89a") continue;
    const end=bytes.indexOf(0x3b,pos+6);
    if(end>pos) push(pos,end+1,"image/gif",".gif",++count);
    if(end>pos) pos=end;
  }
  for (let pos=0;(pos=indexOf(bytes,[0x42,0x4d],pos))>=0;pos+=2) {
    if(pos+6>bytes.length) break;
    const len=readU32LE(bytes,pos+2);
    if(len>=54 && pos+len<=bytes.length) {
      push(pos,pos+len,"image/bmp",".bmp",++count);
      pos+=len;
    }
  }
  for (let pos=0;(pos=indexOf(bytes,[0x52,0x49,0x46,0x46],pos))>=0;pos+=4) {
    if(pos+12>bytes.length) break;
    const webp=String.fromCharCode(...bytes.slice(pos+8,pos+12));
    if(webp!=="WEBP") continue;
    const len=readU32LE(bytes,pos+4)+8;
    if(len>=12 && pos+len<=bytes.length) {
      push(pos,pos+len,"image/webp",".webp",++count);
      pos+=len;
    }
  }
  return out;
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70) || "asset";
}

function buildEntry(image: FoundImage, index: number): DungeonAssetEntry | undefined {
  const role=guessRole(image.path);
  if(!role) return undefined;
  const id=safeId(image.path)+"-"+index;
  const entityRole=["encounter","item","portrait"].includes(role);
  return {
    id,
    role,
    file: image.path,
    targetId: entityRole ? "ishar-source:"+id : undefined,
    ...placementFor(role),
  };
}


interface CompositePlacement {
  image: AlisIndexedImage;
  x: number;
  y: number;
  z: number;
  flipX: boolean;
}

function compositeKey(sourcePath: string, entryIndex: number) {
  return sourcePath+"#"+entryIndex;
}

function expandComposite(
  composite: AlisCompositeResource,
  imageMap: Map<string, AlisIndexedImage>,
  compositeMap: Map<string, AlisCompositeResource>,
  offsetX=0,
  offsetY=0,
  offsetZ=0,
  flipX=false,
  seen=new Set<string>(),
): CompositePlacement[] {
  const key=compositeKey(composite.sourcePath,composite.entryIndex);
  if(seen.has(key) || seen.size>16) return [];
  const nextSeen=new Set(seen);
  nextSeen.add(key);
  const placements: CompositePlacement[]=[];
  for(const child of composite.children){
    const childKey=compositeKey(composite.sourcePath,child.entryIndex);
    const childFlip=flipX!==child.flipX;
    const image=imageMap.get(childKey);
    if(image){
      placements.push({
        image,
        x:offsetX+child.x,
        y:offsetY+child.y,
        z:offsetZ+child.z,
        flipX:childFlip,
      });
      continue;
    }
    const nested=compositeMap.get(childKey);
    if(nested){
      placements.push(...expandComposite(
        nested,imageMap,compositeMap,
        offsetX+child.x,offsetY+child.y,offsetZ+child.z,childFlip,nextSeen
      ));
    }
  }
  return placements;
}

function indexedImageToCanvas(image: AlisIndexedImage) {
  const canvas=document.createElement("canvas");
  canvas.width=image.width;
  canvas.height=image.height;
  const context=canvas.getContext("2d");
  if(!context) throw new Error("Canvas 2D ist im Browser nicht verfügbar.");
  const output=context.createImageData(image.width,image.height);
  for(let index=0;index<image.pixels.length;index++){
    const paletteIndex=image.pixels[index] ?? 0;
    const source=paletteIndex*3;
    const target=index*4;
    output.data[target]=image.palette[source] ?? 0;
    output.data[target+1]=image.palette[source+1] ?? 0;
    output.data[target+2]=image.palette[source+2] ?? 0;
    output.data[target+3]=image.transparentIndex===paletteIndex ? 0 : 255;
  }
  context.putImageData(output,0,0);
  return canvas;
}

async function compositeToPngBlob(
  composite: AlisCompositeResource,
  imageMap: Map<string, AlisIndexedImage>,
  compositeMap: Map<string, AlisCompositeResource>,
) {
  if(typeof document==="undefined") return undefined;
  const placements=expandComposite(composite,imageMap,compositeMap).sort((a,b)=>a.z-b.z);
  if(!placements.length) return undefined;
  const minX=Math.min(...placements.map((placement)=>placement.x));
  const minY=Math.min(...placements.map((placement)=>placement.y));
  const maxX=Math.max(...placements.map((placement)=>placement.x+placement.image.width));
  const maxY=Math.max(...placements.map((placement)=>placement.y+placement.image.height));
  const width=maxX-minX;
  const height=maxY-minY;
  if(width<=0 || height<=0 || width>1024 || height>1024) return undefined;

  const canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  const context=canvas.getContext("2d");
  if(!context) return undefined;
  for(const placement of placements){
    const child=indexedImageToCanvas(placement.image);
    const x=placement.x-minX;
    const y=placement.y-minY;
    context.save();
    if(placement.flipX){
      context.translate(x+placement.image.width,y);
      context.scale(-1,1);
      context.drawImage(child,0,0);
    }else{
      context.drawImage(child,x,y);
    }
    context.restore();
  }
  const blob=await new Promise<Blob|undefined>((resolve)=>canvas.toBlob((value)=>resolve(value??undefined),"image/png"));
  return blob ? {
    blob,
    width,
    height,
    components:placements.length,
    paletteSuspect:placements.some((placement)=>isPaletteSuspect(placement.image)),
  } : undefined;
}

async function indexedImageToPngBlob(image: AlisIndexedImage): Promise<Blob> {
  if (typeof document === "undefined") throw new Error("ALIS-Bildkonvertierung benötigt einen Browser.");
  const canvas=document.createElement("canvas");
  canvas.width=image.width;
  canvas.height=image.height;
  const context=canvas.getContext("2d");
  if(!context) throw new Error("Canvas 2D ist im Browser nicht verfügbar.");
  const output=context.createImageData(image.width,image.height);
  for(let index=0;index<image.pixels.length;index++){
    const paletteIndex=image.pixels[index] ?? 0;
    const source=paletteIndex*3;
    const target=index*4;
    output.data[target]=image.palette[source] ?? 0;
    output.data[target+1]=image.palette[source+1] ?? 0;
    output.data[target+2]=image.palette[source+2] ?? 0;
    output.data[target+3]=image.transparentIndex===paletteIndex ? 0 : 255;
  }
  context.putImageData(output,0,0);
  return new Promise((resolve,reject)=>canvas.toBlob((blob)=>blob ? resolve(blob) : reject(new Error("PNG-Konvertierung fehlgeschlagen.")),"image/png"));
}


function paletteColorfulness(palette: Uint8Array) {
  let score=0;
  let colored=0;
  for(let index=0;index<256;index++){
    const at=index*3;
    const r=palette[at] ?? 0;
    const g=palette[at+1] ?? 0;
    const b=palette[at+2] ?? 0;
    const max=Math.max(r,g,b);
    const min=Math.min(r,g,b);
    const chroma=max-min;
    if(chroma>12) colored++;
    score+=chroma;
  }
  return score + colored*24;
}

function mergeFormatCounts(target: Record<string, number>, source: Record<string, number>) {
  for (const [format, count] of Object.entries(source)) target[format] = (target[format] ?? 0) + count;
}

function stageBasePalette(palettes: AlisPaletteResource[]) {
  return palettes.find((palette) => baseName(palette.sourcePath).toUpperCase() === "STAGE.IO" && palette.entryIndex === 4);
}

function nearestLocalPalette(image: AlisIndexedImage, palettes: AlisPaletteResource[]) {
  const local = palettes.filter((palette) => palette.sourcePath === image.sourcePath);
  if (!local.length) return undefined;
  return local.reduce((best, current) =>
    Math.abs(current.entryIndex - image.entryIndex) < Math.abs(best.entryIndex - image.entryIndex) ? current : best
  );
}

function precedingLocalPalette(image: AlisIndexedImage, palettes: AlisPaletteResource[]) {
  let best: AlisPaletteResource | undefined;
  for (const palette of palettes) {
    if (palette.sourcePath !== image.sourcePath || palette.entryIndex > image.entryIndex) continue;
    if (!best || palette.entryIndex > best.entryIndex) best = palette;
  }
  return best;
}

function paletteBaseScore(palette: AlisPaletteResource, game: GameId) {
  const name=baseName(palette.sourcePath).toUpperCase();
  let score=paletteColorfulness(palette.palette);
  score += Math.min(256,palette.colorCount)*16;
  if(palette.firstColor===0) score+=1800;
  if(palette.colorCount>=192) score+=4500;
  else if(palette.colorCount>=128) score+=2200;
  if(game==="ishar2"){
    if(name==="DJCOL.IO") score+=30000;
    else if(/(?:^|[_-])(DJ)?COL|PAL/.test(name)) score+=9000;
    if(name==="MAIN.IO") score+=1600;
    if(/MONSTER|GUARD|DRAGON|OBJET|ANIMAL|ARBO|BUSTE/.test(name)) score-=4500;
  }
  return score;
}

function chooseGameBasePalette(palettes: AlisPaletteResource[], game: GameId) {
  const stage=stageBasePalette(palettes);
  if(game==="ishar1" && stage){
    return {palette:stage,label:"STAGE.IO / #4",verified:true};
  }
  let best: AlisPaletteResource | undefined;
  let bestScore=-Infinity;
  for(const palette of palettes){
    const score=paletteBaseScore(palette,game);
    if(score>bestScore){ best=palette; bestScore=score; }
  }
  return {
    palette:best,
    label:best ? baseName(best.sourcePath)+" / #"+best.entryIndex : "keine",
    verified:false,
  };
}

function overlayPalette(base: Uint8Array, local: AlisPaletteResource) {
  const result = base.slice();
  const start = Math.max(0, local.firstColor);
  const end = Math.min(256, start + local.colorCount);
  for (let color = start; color < end; color++) {
    const at = color * 3;
    result[at] = local.palette[at] ?? result[at];
    result[at + 1] = local.palette[at + 1] ?? result[at + 1];
    result[at + 2] = local.palette[at + 2] ?? result[at + 2];
  }
  return result;
}

function chooseGlobalPalette(palettes: AlisPaletteResource[]) {
  let best: AlisPaletteResource | undefined;
  let bestScore=-1;
  for(const palette of palettes){
    const score=paletteColorfulness(palette.palette)+(palette.colorCount>=128 ? 2500 : palette.colorCount*8);
    if(score>bestScore){
      best=palette;
      bestScore=score;
    }
  }
  return best;
}

function redDominance(image: AlisIndexedImage) {
  if(!image.pixels.length) return 0;
  const stride=Math.max(1,Math.floor(image.pixels.length/2048));
  let strongRed=0;
  let visible=0;
  for(let i=0;i<image.pixels.length;i+=stride){
    const index=image.pixels[i] ?? 0;
    if(image.transparentIndex===index) continue;
    const at=index*3;
    const r=image.palette[at] ?? 0;
    const g=image.palette[at+1] ?? 0;
    const b=image.palette[at+2] ?? 0;
    if(Math.max(r,g,b)<20) continue;
    visible++;
    if(r>=120 && r>g*1.7 && r>b*1.7) strongRed++;
  }
  return visible ? strongRed/visible : 0;
}

function isPaletteSuspect(image: AlisIndexedImage) {
  return redDominance(image)>=0.78 && paletteVariety(image)>=2;
}

export async function autoImportIsharZip(file: File): Promise<IsharAutoImportResult> {
  const zip=await JSZip.loadAsync(file);
  const entries=Object.values(zip.files).filter((entry)=>!entry.dir && !SKIP.test(entry.name));
  const inventory: FileRecord[]=[];
  const bytesByPath=new Map<string,Uint8Array>();

  for(const entry of entries) {
    const bytes=new Uint8Array(await entry.async("uint8array"));
    bytesByPath.set(entry.name,bytes);
    inventory.push(classifyFile(entry.name,bytes));
  }
  inventory.sort((a,b)=>a.path.localeCompare(b.path));
  const detectedGame=detectGame(inventory,file.name);

  const foundImages: FoundImage[]=[];
  const alisImages: AlisIndexedImage[]=[];
  const alisPalettes: AlisPaletteResource[]=[];
  const alisComposites: AlisCompositeResource[]=[];
  const alisResourceFormatCounts: Record<string, number> = {};
  let alisCompositeResources=0;
  let alisTablesFound=0;
  let alisImagesRejected=0;
  let directImages=0;
  let embeddedImages=0;
  let decodedOldPacker=0;
  let decodedA1Packer=0;
  let failedPackedDecode=0;
  let packedFiles=0;

  for(const record of inventory) {
    const bytes=bytesByPath.get(record.path);
    if(!bytes) continue;

    const directMime=directImageMime(record.path);
    if(directMime) {
      foundImages.push({path:record.path,bytes,mime:directMime});
      directImages++;
    }

    if(record.silm) {
      packedFiles++;
      const unpacked=unpackSilm(bytes);
      if(unpacked?.data) {
        if(record.silm.packerKind===PACKER_NEW) decodedA1Packer++;
        else decodedOldPacker++;
        const embedded=scanEmbeddedImages(unpacked.data,record.path);
        embeddedImages+=embedded.length;
        foundImages.push(...embedded);
        if(record.ext===".IO"){
          const extracted=extractAlisIndexedImages(unpacked.data,record.path,true);
          if(extracted.tableFound) alisTablesFound++;
          alisImagesRejected+=extracted.rejectedImages;
          mergeFormatCounts(alisResourceFormatCounts, extracted.formatCounts);
          alisPalettes.push(...extracted.palettes);
          alisCompositeResources+=extracted.composites.length;
          alisComposites.push(...extracted.composites);
          alisImages.push(...extracted.images);
        }
      } else {
        failedPackedDecode++;
      }
    } else if(record.ext===".IO") {
      const embedded=scanEmbeddedImages(bytes,record.path);
      embeddedImages+=embedded.length;
      foundImages.push(...embedded);
      const extracted=extractAlisIndexedImages(bytes,record.path,false);
      if(extracted.tableFound) alisTablesFound++;
      alisImagesRejected+=extracted.rejectedImages;
      mergeFormatCounts(alisResourceFormatCounts, extracted.formatCounts);
      alisPalettes.push(...extracted.palettes);
      alisCompositeResources+=extracted.composites.length;
      alisComposites.push(...extracted.composites);
      alisImages.push(...extracted.images);
    }
  }

  // Ishar 1 has a verified shared scene palette (STAGE.IO / #4).
  // Ishar 2 does not expose that same resource in the tested corpus, so its
  // base palette is selected separately (DJCOL/PAL/COL modules are preferred)
  // and local palettes are applied only when they precede the image resource.
  const stagePalette=stageBasePalette(alisPalettes);
  const paletteBase=chooseGameBasePalette(alisPalettes,detectedGame);
  const globalPalette=paletteBase.palette ?? chooseGlobalPalette(alisPalettes);
  let globalPaletteFallbackImages=0;
  let localPaletteOverlayImages=0;
  if(globalPalette){
    for(const image of alisImages){
      const local=detectedGame==="ishar1" && stagePalette
        ? nearestLocalPalette(image,alisPalettes)
        : precedingLocalPalette(image,alisPalettes);
      if(local){
        image.palette=overlayPalette(globalPalette.palette,local);
        image.paletteSource="embedded";
        image.paletteEntryIndex=local.entryIndex;
        localPaletteOverlayImages++;
      } else {
        image.palette=globalPalette.palette.slice();
        image.paletteSource="global";
        image.paletteEntryIndex=globalPalette.entryIndex;
        globalPaletteFallbackImages++;
      }
    }
  }

  const alisTerrainTexturesExtracted=alisImages.filter((image)=>image.assetKind==="terrain").length;
  const alisFlatColorAssets=alisImages.filter(isFlatColorImage).length;
  const alisPaletteSuspectAssets=alisImages.filter(isPaletteSuspect).length;

  const shared: DungeonAssetEntry[]=[];
  const defaultTilesetEntries: DungeonAssetEntry[]=[];
  const tilesetEntries: DungeonAssetEntry[]=[];
  const urls: Record<string,string>={};
  const paths: Record<string,string>={};
  const discoveredAssets: DiscoveredAssetPreview[]=[];
  let mappedImages=0;
  let unmappedImages=0;

  foundImages.forEach((image,index)=>{
    const entry=buildEntry(image,index+1);
    const blobBytes=new Uint8Array(image.bytes.length);
    blobBytes.set(image.bytes);
    const blob=new Blob([blobBytes.buffer],{type:image.mime});
    const url=URL.createObjectURL(blob);
    const id=entry?.id ?? safeId(image.path)+"-standard-"+(index+1);
    discoveredAssets.push({
      id,
      path:image.path,
      url,
      source:"standard",
      suggestedRole:entry?.role,
      runtimeAssigned:!!entry && !["encounter","item","portrait"].includes(entry.role),
    });
    if(!entry) {
      unmappedImages++;
      return;
    }
    mappedImages++;
    urls[entry.id]=url;
    paths[entry.id]=image.path;
    if(["encounter","item","portrait"].includes(entry.role)) shared.push(entry);
    else tilesetEntries.push(entry);
  });

  const defaultAssignments=chooseDefaultDungeonAssets(alisImages,detectedGame);
  const defaultsByImage=new Map<string,IsharDefaultAssignment[]>();
  for(const assignment of defaultAssignments){
    const key=defaultChoiceKey(assignment.sourcePath,assignment.entryIndex);
    defaultsByImage.set(key,[...(defaultsByImage.get(key)??[]),assignment]);
  }

  const MAX_ALIS_IMAGES=1500;
  const MAX_ALIS_PIXELS=64_000_000;
  let alisPixelCount=0;
  let alisPreviewCount=0;
  let alisImagesSkippedForBudget=0;
  const alisImageMap=new Map(alisImages.map((image)=>[compositeKey(image.sourcePath,image.entryIndex),image] as const));
  const alisCompositeMap=new Map(alisComposites.map((composite)=>[compositeKey(composite.sourcePath,composite.entryIndex),composite] as const));

  const orderedAlisImages=[...alisImages].sort((a,b)=>{
    const ad=defaultsByImage.has(defaultChoiceKey(a.sourcePath,a.entryIndex)) ? 1 : 0;
    const bd=defaultsByImage.has(defaultChoiceKey(b.sourcePath,b.entryIndex)) ? 1 : 0;
    if (ad !== bd) return bd-ad;
    const at=a.assetKind==="terrain" ? 1 : 0;
    const bt=b.assetKind==="terrain" ? 1 : 0;
    if (at !== bt) return bt-at;
    const af=isFlatColorImage(a) ? 1 : 0;
    const bf=isFlatColorImage(b) ? 1 : 0;
    return af-bf;
  });
  for(const image of orderedAlisImages){
    const imageDefaults=defaultsByImage.get(defaultChoiceKey(image.sourcePath,image.entryIndex)) ?? [];
    const forceForDefault=imageDefaults.length>0;
    const forceTerrain=image.assetKind==="terrain";
    if(!forceForDefault && !forceTerrain && (alisPreviewCount>=MAX_ALIS_IMAGES || alisPixelCount+image.width*image.height>MAX_ALIS_PIXELS)){
      alisImagesSkippedForBudget++;
      continue;
    }
    alisPixelCount+=image.width*image.height;
    alisPreviewCount++;
    const blob=await indexedImageToPngBlob(image);
    const url=URL.createObjectURL(blob);
    const role=guessRole(image.sourcePath);
    const suggestion=image.assetKind==="terrain" ? "wall.front" : (role ?? suggestRoleByDimensions(image.width,image.height));
    const id=safeId(image.sourcePath)+"-alis-"+image.entryIndex;
    const entityRole=role ? ["encounter","item","portrait"].includes(role) : false;
    const unsafeSceneGuess=!!role && detectedGame!=="unknown" && [
      "viewport.background","surface.floor","surface.ceiling","wall.front","wall.left","wall.right"
    ].includes(role);
    const runtimeAssigned=imageDefaults.length>0 || (!!role && !entityRole && !unsafeSceneGuess);
    discoveredAssets.push({
      id,
      path:`${image.sourcePath} · ALIS #${image.entryIndex}`,
      url,
      source:"alis",
      assetKind:image.assetKind,
      paletteStatus:image.paletteSource,
      visualStatus:isFlatColorImage(image) ? "flat-color" : isPaletteSuspect(image) ? "palette-suspect" : "normal",
      width:image.width,
      height:image.height,
      suggestedRole:imageDefaults[0]?.role ?? suggestion,
      runtimeAssigned,
    });

    for(const assignment of imageDefaults){
      const idRole=assignment.role.replace(/[^a-z0-9]+/gi,"-");
      const defaultId=`${id}-default-${idRole}`;
      const textureRole=assignment.role!=="viewport.background";
      const entry: DungeonAssetEntry={
        id:defaultId,
        role:assignment.role,
        file:`${image.sourcePath}#alis-${image.entryIndex}.png`,
        renderMode:textureRole ? "texture" : "layer",
        opacity:assignment.role==="surface.ceiling" ? 0.9 : 1,
        ...(textureRole ? tileSize(image) : {}),
      };
      urls[defaultId]=url;
      paths[defaultId]=entry.file;
      defaultTilesetEntries.push(entry);
    }

    if(role){
      const entry: DungeonAssetEntry={
        id,
        role,
        file:`${image.sourcePath}#alis-${image.entryIndex}.png`,
        targetId:entityRole ? "ishar-source:"+id : undefined,
        ...placementFor(role),
      };
      urls[id]=url;
      paths[id]=entry.file;
      if(entityRole) shared.push(entry);
      else if(!unsafeSceneGuess) tilesetEntries.push(entry);
      mappedImages++;
    } else {
      unmappedImages++;
    }
  }

  let alisCompositePreviews=0;
  for(const composite of alisComposites.slice(0,500)){
    const rendered=await compositeToPngBlob(composite,alisImageMap,alisCompositeMap);
    if(!rendered) continue;
    const id=safeId(composite.sourcePath)+"-composite-"+composite.entryIndex;
    const url=URL.createObjectURL(rendered.blob);
    discoveredAssets.push({
      id,
      path:`[COMPOSITE] ${composite.sourcePath} · ALIS #${composite.entryIndex}`,
      url,
      source:"alis",
      assetKind:"composite",
      visualStatus:rendered.paletteSuspect ? "palette-suspect" : "normal",
      width:rendered.width,
      height:rendered.height,
      runtimeAssigned:false,
    });
    alisCompositePreviews++;
  }

  const gameLabel=detectedGame==="ishar1" ? "Ishar 1" : detectedGame==="ishar2" ? "Ishar 2" : "Ishar";
  const renderProfile=renderProfileForGame(detectedGame);
  const packId="auto-"+safeId(gameLabel+"-"+file.name);
  const manifest: DungeonAssetManifest={
    format:"ishar-ck-asset-pack",
    version:1,
    id:packId,
    name:gameLabel+" Auto-Import",
    viewport:{width:renderProfile.drawWidth,height:renderProfile.drawHeight},
    renderProfileId:renderProfile.id,
    pixelAspectY:renderProfile.pixelAspectY,
    defaultTilesetId:"auto-default",
    shared,
    tilesets:[{id:"auto-default",name:gameLabel+" Auto Dungeon",entries:[...defaultTilesetEntries,...tilesetEntries]}],
  };

  const candidateResources=inventory.filter((record)=>record.silm || record.ext===".IO" || record.ext===".FIC").length;
  const notes=[
    detectedGame==="unknown" ? "Spielversion konnte aus Dateinamen/-größen nicht sicher erkannt werden." : gameLabel+" wurde anhand des lokalen Dateibestands erkannt.",
    "Renderprofil: "+renderProfile.label+" · Drawspace "+renderProfile.drawWidth+"×"+renderProfile.drawHeight+" · Pixel-Aspekt Y "+renderProfile.pixelAspectY+".",
    decodedOldPacker ? decodedOldPacker+" Datei(en) mit altem Silmarils-Packer wurden für die Bildsuche entpackt." : "Keine Old-Packer-Ressource musste entpackt werden.",
    decodedA1Packer ? decodedA1Packer+" A1/New-Packer-Datei(en) wurden mit dem bounded DOS-Decoder entpackt." : "Keine A1-Ressource konnte decodiert werden.",
    failedPackedDecode ? failedPackedDecode+" gepackte Datei(en) konnten trotz erkanntem Header nicht sicher decodiert werden." : "Alle erkannten gepackten Ressourcen wurden decodiert.",
    alisPalettes.length ? alisPalettes.length+" ALIS-Palettenressource(n) wurden rekonstruiert; partielle Paletten-Offsets werden berücksichtigt." : "Keine ALIS-Palette wurde statisch gefunden.",
    paletteBase.palette
      ? "Palettenbasis: "+paletteBase.label+(paletteBase.verified ? " · verifiziert." : " · heuristisch, bis der Skript-Palettenwechsel statisch rekonstruiert ist.")
      : "Keine belastbare Palettenbasis gefunden.",
    localPaletteOverlayImages ? localPaletteOverlayImages+" Bild(er) erhielten eine lokale Teil-/Szenenpalette über der gewählten Basis." : "Keine lokale Palettenüberlagerung war nötig.",
    alisPaletteSuspectAssets ? alisPaletteSuspectAssets+" Bild(er) sind nach der aktuellen Palettenauflösung stark rot-dominiert und werden als Palette-offen markiert." : "Keine auffällig rot-dominierte Palette erkannt.",
    alisTerrainTexturesExtracted ? alisTerrainTexturesExtracted+" echte ALIS-Terraintextur(en) im Format 0x1C/0x1E wurden extrahiert." : ((alisResourceFormatCounts["0x1c"]??0)+(alisResourceFormatCounts["0x1e"]??0) ? "0x1C/0x1E-Header wurden gesehen, aber keine Terraintextur konnte gültig decodiert werden." : "In den gelesenen Grafiktabellen existiert kein einziger 0x1C/0x1E-Eintrag; der Terrainpfad liegt damit noch außerhalb unserer aktuellen Tabellen-Auswertung."),
    alisFlatColorAssets ? alisFlatColorAssets+" nahezu einfarbige Ressource(n) wurden als Diagnose-/Maskenkandidaten markiert und bei der Dungeon-Texturwahl abgewertet." : "Keine auffällig einfarbigen ALIS-Bilder erkannt.",
    globalPaletteFallbackImages ? globalPaletteFallbackImages+" Bild(er) ohne vorausgehende lokale Palette verwenden die gewählte Spiel-/Szenenbasis." : "Keine globale Palettenbasis musste direkt verwendet werden.",
    alisCompositeResources ? alisCompositeResources+" ALIS-Composite-Ressource(n) referenzieren mehrere gestapelte Grafikbausteine; "+alisCompositePreviews+" davon wurden als zusammengesetzte Vorschau gerendert." : "Keine ALIS-Composite-Ressource erkannt.",
    alisImages.length ? alisImages.length+" proprietäre ALIS-Bildressource(n) wurden aus den decodierten Skripten extrahiert." : "In den decodierten Skripten wurde noch keine unterstützte ALIS-Bildressource gefunden.",
    defaultAssignments.length ? defaultAssignments.length+" Standard-Dungeon-Rolle(n) wurden heuristisch als sofort nutzbares Default-Tileset belegt." : "Kein ausreichend plausibles Default-Dungeon-Tileset konnte gewählt werden.",
    mappedImages ? mappedImages+" Bild(er) wurden anhand eindeutiger Dateinamen automatisch katalogisiert/zugeordnet." : "Noch keine weitere Grafik konnte sicher einer Engine-Rolle zugeordnet werden; der SVG-Fallback bleibt aktiv.",
    unmappedImages ? unmappedImages+" gefundene Standardbild(er) blieben absichtlich unzugeordnet, weil die Rolle nicht eindeutig war." : "Keine zusätzlich gefundenen Standardbilder blieben unzugeordnet.",
  ];

  const report: IsharAutoImportReport={
    mode:"ishar-auto",
    detectedGame,
    totalFiles:inventory.length,
    packedFiles,
    decodedOldPacker,
    decodedA1Packer,
    failedPackedDecode,
    alisTablesFound,
    alisImagesExtracted: alisImages.length,
    alisTerrainTexturesExtracted,
    alisFlatColorAssets,
    alisImagesRejected,
    alisImagesSkippedForBudget,
    alisPaletteResources: alisPalettes.length,
    alisCompositeResources,
    alisCompositePreviews,
    alisResourceFormatCounts,
    stagePaletteBaseFound: !!stagePalette,
    paletteBaseLabel: paletteBase.label,
    paletteBaseVerified: paletteBase.verified,
    localPaletteOverlayImages,
    globalPaletteFallbackImages,
    alisPaletteSuspectAssets,
    directImages,
    embeddedImages,
    mappedImages,
    unmappedImages,
    candidateResources,
    defaultAssignments,
    notes,
  };

  const pack: LoadedAssetPack={
    manifest,
    urls,
    paths,
    missingEntryIds:[],
    sourceLabel:file.name+" · automatischer Ishar-Import",
    fileCount:inventory.length,
    discoveredAssets,
  };
  return {pack,inventory,report};
}
