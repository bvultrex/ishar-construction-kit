import {isOriginalSave} from './original-commerce.ts';
export interface SaveWorldItem {id:number;row:number;col:number;scene:number;facing:number}
/** IO.IO 0x00eda–0x00ee8 and 0x01134. Object ID is the AFFOBJ table index. */
export function readSaveWorldItems(bytes:Uint8Array):SaveWorldItem[]|null {
  if(!isOriginalSave(bytes))return null;
  return Array.from({length:200},(_,id)=>({id,row:bytes[336+id]!,col:bytes[536+id]!,scene:bytes[736+id]!,facing:bytes[8039+id]!}));
}
export function worldItemViewCandidate(view:{row:number;col:number;facing:number;map:number;scene:number},item:SaveWorldItem) {
  // AFFOBJ scans only 0..110, despite the save containing 200 records.
  // AFFOBJ compares MAIN 0x2d18 (map), not actor scene 0x4ef2.
  if(item.id>110||item.scene!==view.map|| (view.map!==1&&item.facing!==view.facing))return null;
  const dr=item.row-view.row,dc=item.col-view.col;
  const pair:Record<number,[number,number]>={1:[-dc,dr],2:[dr,dc],3:[dc,-dr],4:[-dr,-dc]};
  const relative=pair[view.facing];if(!relative)return null;
  const [distance,lateral]=relative;
  return distance>=0&&distance<7&&Math.abs(lateral)<=distance?{distance,lateral}:null;
}
/** Audit offsets using IO.IO's uninterrupted block load after 0x00eda. */
export function originalSaveBlockLayout(listing:string) {
  const lines=listing.split(/\r?\n/),start=lines.findIndex(line=>/^\s*00eda\s/.test(line)&&line.includes('cfreadb'));
  if(start<0)throw new Error('IO.IO: Blockladefolge fehlt.');
  let offset=336;
  const blocks:{memory:number;offset:number;length:number}[]=[];
  for(const line of lines.slice(start)) {
    if(/^L_/.test(line))break;
    const match=line.match(/cfreadb\s+main:0x([0-9a-f]+), 0x([0-9a-f]+)/);
    if(match){const memory=parseInt(match[1]!,16),length=parseInt(match[2]!,16);blocks.push({memory,offset,length});offset+=length;}
  }
  if(blocks[0]?.memory!==0x2aba||blocks.find(b=>b.memory===0x3412)?.offset!==2601)throw new Error('IO.IO: unbekanntes Save-Layout.');
  return blocks;
}
