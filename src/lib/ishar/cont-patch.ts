import type {IsharGrid} from './types';
import {importCont,exportCont,setGridCell} from './cont-grid.ts';
export interface ContPatchEdit {layer:'A'|'B';row:number;col:number;before:number;after:number}
/** CK interchange format, not an original Ishar script/resource format. */
export interface ContPatch {
 format:'ishar-ck-cont-patch';version:1;game:'ishar1'|'ishar2';resource:string;
 sourceSha256:string;targetSha256:string;edits:ContPatchEdit[];
 compatibility:'original-layout';verification:'not-tested-in-original';
}
export async function sha256(bytes:Uint8Array){
 const digest=await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes).buffer);
 return Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');
}
function resourceName(name:unknown):asserts name is string {
 if(typeof name!=='string'||!/^CONT[1-9]\d*\.FIC$/i.test(name))throw Error('Resource must be a CONTn.FIC filename without a path');
}
function decode(bytes:Uint8Array,name:string){const result=importCont(bytes,name,'');if(!result.ok)throw Error(result.error);return result.grid;}
export async function createContPatch(source:Uint8Array,target:Uint8Array,resource:string):Promise<ContPatch>{
 resourceName(resource);const grid=decode(source,resource),next=decode(target,resource);
 if(grid.game!==next.game||source.length!==target.length)throw Error('CONT layout/profile changed');
 const edits:ContPatchEdit[]=[],layerSize=grid.rows*grid.cols;
 for(let offset=0;offset<source.length;offset++)if(source[offset]!==target[offset]){
  const index=offset%layerSize;
  edits.push({layer:offset<layerSize?'A':'B',row:Math.floor(index/grid.cols),col:index%grid.cols,before:source[offset]!,after:target[offset]!});
 }
 return {format:'ishar-ck-cont-patch',version:1,game:grid.game,resource:resource.toUpperCase(),sourceSha256:await sha256(source),targetSha256:await sha256(target),edits,compatibility:'original-layout',verification:'not-tested-in-original'};
}
export async function applyContPatch(source:Uint8Array,value:unknown):Promise<Uint8Array>{
 if(!value||typeof value!=='object')throw Error('Patch must be an object');
 const patch=value as ContPatch;
 if(patch.format!=='ishar-ck-cont-patch'||patch.version!==1||!['ishar1','ishar2'].includes(patch.game)||patch.compatibility!=='original-layout'||patch.verification!=='not-tested-in-original')throw Error('Unsupported CONT patch format/profile');
 resourceName(patch.resource);
 for(const hash of [patch.sourceSha256,patch.targetSha256])if(typeof hash!=='string'||!/^([a-f0-9]{64})$/.test(hash))throw Error('Invalid SHA-256 in patch');
 if(await sha256(source)!==patch.sourceSha256)throw Error('Source SHA-256 mismatch; refusing another game version or changed file');
 let grid=decode(source,patch.resource);
 if(grid.game!==patch.game)throw Error('Game/profile mismatch');
 if(!Array.isArray(patch.edits)||patch.edits.length>source.length)throw Error('Invalid edit list');
 const used=new Set<number>(),layerSize=grid.rows*grid.cols;
 for(const edit of patch.edits){
  if(!edit||!['A','B'].includes(edit.layer)||!Number.isInteger(edit.row)||!Number.isInteger(edit.col)||edit.row<0||edit.col<0||edit.row>=grid.rows||edit.col>=grid.cols||(edit.layer==='B'&&grid.game!=='ishar2'))throw Error('Invalid layer or cell coordinates');
  for(const byte of [edit.before,edit.after])if(!Number.isInteger(byte)||byte<0||byte>255)throw Error('Patch bytes must be integers 0..255');
  const offset=(edit.layer==='B'?layerSize:0)+edit.row*grid.cols+edit.col;
  if(used.has(offset))throw Error('Duplicate edit cell');used.add(offset);
  if(source[offset]!==edit.before)throw Error(`Before-byte mismatch at ${edit.layer}/${edit.row}/${edit.col}`);
  grid=setGridCell(grid,edit.layer,edit.row,edit.col,edit.after);
 }
 const result=exportCont(grid);
 if(await sha256(result)!==patch.targetSha256)throw Error('Target SHA-256 mismatch; patch is incomplete or inconsistent');
 return result;
}

/** Export an editor snapshot only against its recorded original source. */
export async function createGridContPatch(grid:IsharGrid,original:Uint8Array):Promise<ContPatch>{
 if(!grid.source||!/^[a-f0-9]{64}$/.test(grid.source.sha256))throw Error('Keine verifizierte Originalquelle für diese Karte gespeichert.');
 resourceName(grid.source.file);
 if(await sha256(original)!==grid.source.sha256)throw Error('Die gewählte Datei stimmt nicht mit der Originalquelle dieser Karte überein.');
 const baseline=decode(original,grid.source.file);
 if(grid.game!==baseline.game||grid.rows!==baseline.rows||grid.cols!==baseline.cols)throw Error('Kartenprofil oder Abmessungen stimmen nicht mit der Originalquelle überein.');
 return createContPatch(original,exportCont(grid),grid.source.file);
}
