import JSZip from "jszip";
import { classifyFile } from "./classify";
import { PACKER_NEW, unpackSilm } from "./silm-pack";
import type { DiscoveredAssetPreview, LoadedAssetPack } from "./asset-pack";
import { extractAlisIndexedImages, type AlisIndexedImage } from "./alis-assets";
import type { DungeonAssetEntry, DungeonAssetManifest, DungeonAssetRole, FileRecord, GameId } from "./types";

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
  alisImagesRejected: number;
  alisImagesSkippedForBudget: number;
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

function detectGame(records: FileRecord[]): GameId {
  const has = (predicate: (record: FileRecord) => boolean) => records.some(predicate);
  if (has((record)=>baseName(record.path).toUpperCase()==="IMP2.SAV")) return "ishar2";
  if (has((record)=>/^CONT\d+\.FIC$/i.test(baseName(record.path)) && record.size===10800)) return "ishar2";
  if (has((record)=>baseName(record.path).toUpperCase()==="EN1.FIC" && record.size===6050)) return "ishar2";
  if (has((record)=>record.ext===".SAV" && record.size===8359)) return "ishar2";
  if (has((record)=>/^CONT\d+\.FIC$/i.test(baseName(record.path)) && record.size===4860)) return "ishar1";
  if (has((record)=>baseName(record.path).toUpperCase()==="EN1.FIC" && record.size===3640)) return "ishar1";
  if (has((record)=>record.ext===".SAV" && record.size===5216)) return "ishar1";
  return "unknown";
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

function textureLike(image: AlisIndexedImage) {
  const aspect=image.width/image.height;
  return image.width>=8 && image.height>=8 && image.width<=256 && image.height<=256 && aspect>=0.35 && aspect<=2.85;
}

function roleScore(image: AlisIndexedImage, role: DungeonAssetRole, preferredSource?: string) {
  const path=image.sourcePath.toLowerCase();
  let score=0;
  if(preferredSource && image.sourcePath===preferredSource) score+=12;
  if(DUNGEON_SOURCE.test(path)) score+=18;
  if(ENTITY_SOURCE.test(path)) score-=28;
  if(textureLike(image)) score+=8;

  if(role==="surface.floor"){
    if(/(floor|ground|sol|dalle|pave|pavement)/i.test(path)) score+=42;
    if(image.width>=image.height) score+=4;
  } else if(role==="surface.ceiling"){
    if(/(ceiling|plafond|sky|ciel|roof|toit|voute)/i.test(path)) score+=42;
    if(image.width>=image.height) score+=3;
  } else if(role==="wall.front" || role==="wall.left" || role==="wall.right"){
    if(/(wall|mur|stone|pierre|brick|brique|decor)/i.test(path)) score+=38;
    if(image.width>=16 && image.height>=16) score+=4;
  } else if(role==="door.front.closed"){
    if(/(door|porte|gate|portal|grille|entry|entree)/i.test(path)) score+=52;
    if(image.height>=image.width*1.12 && image.height>=28 && image.height<=300) score+=12;
    if(image.width>180 || image.height>320) score-=6;
  } else if(role==="viewport.background"){
    if(/(sky|ciel|background|backdrop|fond|scene|landscape|horizon)/i.test(path)) score+=48;
    if(image.width>=160 && image.height>=80 && image.width>image.height) score+=12;
  }
  return score;
}

function bestByScore(images: AlisIndexedImage[], role: DungeonAssetRole, preferredSource?: string, minimum=1) {
  let best: {image: AlisIndexedImage; score: number} | undefined;
  for(const image of images){
    const score=roleScore(image,role,preferredSource);
    if(score<minimum) continue;
    if(!best || score>best.score || (score===best.score && image.width*image.height>best.image.width*best.image.height)){
      best={image,score};
    }
  }
  return best;
}

function chooseDefaultDungeonAssets(images: AlisIndexedImage[]): IsharDefaultAssignment[] {
  if(!images.length) return [];
  const sourceScores=new Map<string,number>();
  for(const image of images){
    if(ENTITY_SOURCE.test(image.sourcePath)) continue;
    let score=textureLike(image) ? 2 : 0;
    if(DUNGEON_SOURCE.test(image.sourcePath)) score+=8;
    if(/(wall|mur|floor|sol|door|porte|ceiling|plafond|decor)/i.test(image.sourcePath)) score+=10;
    sourceScores.set(image.sourcePath,(sourceScores.get(image.sourcePath)??0)+score);
  }
  const preferredSource=[...sourceScores.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];

  const assignments: IsharDefaultAssignment[]=[];
  const add=(role:DungeonAssetRole, pick:ReturnType<typeof bestByScore>, reason:string, threshold=28)=>{
    if(!pick) return;
    assignments.push({
      role,
      sourcePath:pick.image.sourcePath,
      entryIndex:pick.image.entryIndex,
      confidence:pick.score>=threshold ? "probable" : "possible",
      reason:`${reason} (Score ${pick.score}).`,
    });
  };

  const wall=bestByScore(images,"wall.front",preferredSource,4);
  const floor=bestByScore(images,"surface.floor",preferredSource,4) ?? wall;
  const ceiling=bestByScore(images,"surface.ceiling",preferredSource,4) ?? wall;
  const door=bestByScore(images,"door.front.closed",preferredSource,8);
  const background=bestByScore(images,"viewport.background",preferredSource,24);

  add("wall.front",wall,"Dungeon-/Wandkandidat als Standardwand");
  add("wall.left",wall,"gleiche Basistexur für linke Wand");
  add("wall.right",wall,"gleiche Basistexur für rechte Wand");
  add("surface.floor",floor,"Boden-Kandidat; fällt bei Bedarf auf Dungeon-Basistexur zurück");
  add("surface.ceiling",ceiling,"Decken/Himmel-Kandidat; fällt bei Bedarf auf Dungeon-Basistexur zurück");
  add("door.front.closed",door,"Türkandidat aus Dateikontext und Hochformat");
  if(background) add("viewport.background",background,"großformatiger Himmel/Hintergrundkandidat",40);

  return assignments;
}

function defaultChoiceKey(sourcePath:string,entryIndex:number){
  return `${sourcePath}#${entryIndex}`;
}

function tileSize(image: AlisIndexedImage){
  const width=Math.max(24,Math.min(128,image.width));
  const height=Math.max(24,Math.min(128,image.height));
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
  const detectedGame=detectGame(inventory);

  const foundImages: FoundImage[]=[];
  const alisImages: AlisIndexedImage[]=[];
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
      alisImages.push(...extracted.images);
    }
  }

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

  const defaultAssignments=chooseDefaultDungeonAssets(alisImages);
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
  const orderedAlisImages=[...alisImages].sort((a,b)=>{
    const ad=defaultsByImage.has(defaultChoiceKey(a.sourcePath,a.entryIndex)) ? 1 : 0;
    const bd=defaultsByImage.has(defaultChoiceKey(b.sourcePath,b.entryIndex)) ? 1 : 0;
    return bd-ad;
  });
  for(const image of orderedAlisImages){
    const imageDefaults=defaultsByImage.get(defaultChoiceKey(image.sourcePath,image.entryIndex)) ?? [];
    const forceForDefault=imageDefaults.length>0;
    if(!forceForDefault && (alisPreviewCount>=MAX_ALIS_IMAGES || alisPixelCount+image.width*image.height>MAX_ALIS_PIXELS)){
      alisImagesSkippedForBudget++;
      continue;
    }
    alisPixelCount+=image.width*image.height;
    alisPreviewCount++;
    const blob=await indexedImageToPngBlob(image);
    const url=URL.createObjectURL(blob);
    const role=guessRole(image.sourcePath);
    const suggestion=role ?? suggestRoleByDimensions(image.width,image.height);
    const id=safeId(image.sourcePath)+"-alis-"+image.entryIndex;
    const entityRole=role ? ["encounter","item","portrait"].includes(role) : false;
    const runtimeAssigned=imageDefaults.length>0 || (!!role && !entityRole);
    discoveredAssets.push({
      id,
      path:`${image.sourcePath} · ALIS #${image.entryIndex}`,
      url,
      source:"alis",
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
      else tilesetEntries.push(entry);
      mappedImages++;
    } else {
      unmappedImages++;
    }
  }

  const gameLabel=detectedGame==="ishar1" ? "Ishar 1" : detectedGame==="ishar2" ? "Ishar 2" : "Ishar";
  const packId="auto-"+safeId(gameLabel+"-"+file.name);
  const manifest: DungeonAssetManifest={
    format:"ishar-ck-asset-pack",
    version:1,
    id:packId,
    name:gameLabel+" Auto-Import",
    viewport:{width:640,height:400},
    defaultTilesetId:"auto-default",
    shared,
    tilesets:[{id:"auto-default",name:gameLabel+" Auto Dungeon",entries:[...defaultTilesetEntries,...tilesetEntries]}],
  };

  const candidateResources=inventory.filter((record)=>record.silm || record.ext===".IO" || record.ext===".FIC").length;
  const notes=[
    detectedGame==="unknown" ? "Spielversion konnte aus Dateinamen/-größen nicht sicher erkannt werden." : gameLabel+" wurde anhand des lokalen Dateibestands erkannt.",
    decodedOldPacker ? decodedOldPacker+" Datei(en) mit altem Silmarils-Packer wurden für die Bildsuche entpackt." : "Keine Old-Packer-Ressource musste entpackt werden.",
    decodedA1Packer ? decodedA1Packer+" A1/New-Packer-Datei(en) wurden mit dem bounded DOS-Decoder entpackt." : "Keine A1-Ressource konnte decodiert werden.",
    failedPackedDecode ? failedPackedDecode+" gepackte Datei(en) konnten trotz erkanntem Header nicht sicher decodiert werden." : "Alle erkannten gepackten Ressourcen wurden decodiert.",
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
    alisImagesRejected,
    alisImagesSkippedForBudget,
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
