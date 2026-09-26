import JSZip from "jszip";
import { classifyFile } from "./classify";
import { unpackSilm } from "./silm-pack";
import type { LoadedAssetPack } from "./asset-pack";
import type { DungeonAssetEntry, DungeonAssetManifest, DungeonAssetRole, FileRecord, GameId } from "./types";

export interface IsharAutoImportReport {
  mode: "ishar-auto";
  detectedGame: GameId;
  totalFiles: number;
  packedFiles: number;
  decodedOldPacker: number;
  blockedNewPacker: number;
  directImages: number;
  embeddedImages: number;
  mappedImages: number;
  unmappedImages: number;
  candidateResources: number;
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
  if (/(portrait|face|head|avatar)/.test(name)) return "portrait";
  if (/(monster|enemy|ennemi|creature|guardian|guard|orc|wolf|spider|dragon)/.test(name)) return "encounter";
  if (/(item|object|objet|pickup|icon|potion|key|rune|sword|shield)/.test(name)) return "item";
  if (/(ceiling|plafond)/.test(name)) return "surface.ceiling";
  if (/(floor|ground|sol)/.test(name)) return "surface.floor";
  if (/(front-wall|wall-front|frontwall|mur-front|murface)/.test(name)) return "wall.front";
  if (/(left-wall|wall-left|mur-left)/.test(name)) return "wall.left";
  if (/(right-wall|wall-right|mur-right)/.test(name)) return "wall.right";
  return undefined;
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
  return {
    id: safeId(image.path)+"-"+index,
    role,
    file: image.path,
    ...placementFor(role),
  };
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
  let directImages=0;
  let embeddedImages=0;
  let decodedOldPacker=0;
  let blockedNewPacker=0;
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
        decodedOldPacker++;
        const embedded=scanEmbeddedImages(unpacked.data,record.path);
        embeddedImages+=embedded.length;
        foundImages.push(...embedded);
      } else if(record.silm.packerKind===0xa1) {
        blockedNewPacker++;
      }
    } else if(record.ext===".IO") {
      const embedded=scanEmbeddedImages(bytes,record.path);
      embeddedImages+=embedded.length;
      foundImages.push(...embedded);
    }
  }

  const shared: DungeonAssetEntry[]=[];
  const tilesetEntries: DungeonAssetEntry[]=[];
  const urls: Record<string,string>={};
  const paths: Record<string,string>={};
  let mappedImages=0;
  let unmappedImages=0;

  foundImages.forEach((image,index)=>{
    const entry=buildEntry(image,index+1);
    if(!entry) {
      unmappedImages++;
      return;
    }
    mappedImages++;
    const blobBytes=new Uint8Array(image.bytes.length);
    blobBytes.set(image.bytes);
    const blob=new Blob([blobBytes.buffer],{type:image.mime});
    urls[entry.id]=URL.createObjectURL(blob);
    paths[entry.id]=image.path;
    if(["encounter","item","portrait"].includes(entry.role)) shared.push(entry);
    else tilesetEntries.push(entry);
  });

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
    tilesets:[{id:"auto-default",name:gameLabel+" Auto",entries:tilesetEntries}],
  };

  const candidateResources=inventory.filter((record)=>record.silm || record.ext===".IO" || record.ext===".FIC").length;
  const notes=[
    detectedGame==="unknown" ? "Spielversion konnte aus Dateinamen/-größen nicht sicher erkannt werden." : gameLabel+" wurde anhand des lokalen Dateibestands erkannt.",
    decodedOldPacker ? decodedOldPacker+" Datei(en) mit altem Silmarils-Packer wurden für die Bildsuche entpackt." : "Keine mit dem vorhandenen Old-Packer-Decoder nutzbare Ressource gefunden.",
    blockedNewPacker ? blockedNewPacker+" A1/New-Packer-Datei(en) bleiben bis zu einem verifizierten Decoder blockiert." : "Keine blockierte A1/New-Packer-Ressource erkannt.",
    mappedImages ? mappedImages+" Bild(er) wurden anhand eindeutiger Dateinamen automatisch einer Engine-Rolle zugeordnet." : "Noch keine Grafik konnte sicher einer Engine-Rolle zugeordnet werden; der SVG-Fallback bleibt aktiv.",
    unmappedImages ? unmappedImages+" gefundene Standardbild(er) blieben absichtlich unzugeordnet, weil die Rolle nicht eindeutig war." : "Keine zusätzlich gefundenen Standardbilder blieben unzugeordnet.",
  ];

  const report: IsharAutoImportReport={
    mode:"ishar-auto",
    detectedGame,
    totalFiles:inventory.length,
    packedFiles,
    decodedOldPacker,
    blockedNewPacker,
    directImages,
    embeddedImages,
    mappedImages,
    unmappedImages,
    candidateResources,
    notes,
  };

  const pack: LoadedAssetPack={
    manifest,
    urls,
    paths,
    missingEntryIds:[],
    sourceLabel:file.name+" · automatischer Ishar-Import",
    fileCount:inventory.length,
  };
  return {pack,inventory,report};
}
