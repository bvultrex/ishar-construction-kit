import {readAlisModule} from './alis-module.ts';
import {sha256} from './cont-patch.ts';
export const ISHAR2_IO_SHA256='0df1f34cf2519341ef20825d49c7f1e7ff204878814db744f7e5cb58ce6b5918';
export interface Ishar2SavedField {fileOffset:number;fileBytes:number;memoryAddress:number;memoryBytes:number;space:'main'|'local';storage:'be16-byte'|'be16-word'|'block';readPc:number;writePc:number}
export interface Ishar2SaveLayout {game:'ishar2';ioSha256:string;size:8359;fields:Ishar2SavedField[]}
function sequence(image:Uint8Array,start:number,end:number,writing:boolean){
 const v=new DataView(image.buffer,image.byteOffset,image.byteLength),fields:Omit<Ishar2SavedField,'readPc'|'writePc'>[]=[],pcs:number[]=[];
 let pc=start,offset=0;
 while(pc<end){
  const begin=pc,op=image[pc];let address:number,space:'main'|'local',memoryBytes:number,fileBytes:number,storage:Ishar2SavedField['storage'];
  if(op===(writing?0x75:0x74)){
   if(pc+4>end)throw Error('Truncated Ishar-2 scalar I/O');
   const operand=image[pc+1];if(![6,8,0x1e,0x20].includes(operand!))throw Error('Unsupported Ishar-2 scalar operand');
   address=v.getUint16(pc+2,true);space=operand===6||operand===8?'local':'main';memoryBytes=operand===6||operand===0x1e?1:2;fileBytes=2;storage=memoryBytes===1?'be16-byte':'be16-word';pc+=4;
  }else if(op===(writing?0x78:0x77)){
   if(pc+7>end||v.getUint16(pc+1,true)!==0)throw Error('Unsupported Ishar-2 block operand');
   address=v.getUint16(pc+3,true);space='main';memoryBytes=v.getUint16(pc+5,true);fileBytes=memoryBytes;storage='block';pc+=7;
  }else throw Error(`Unexpected Ishar-2 I/O at ${pc.toString(16)}`);
  if(!fileBytes||offset+fileBytes>8359)throw Error('Ishar-2 save size overflow');
  pcs.push(begin);fields.push({fileOffset:offset,fileBytes,memoryAddress:address,memoryBytes,space,storage});offset+=fileBytes;
 }
 if(pc!==end||image[end]!==0x71||offset!==8359)throw Error('Ishar-2 I/O sequence/size mismatch');
 return {fields,pcs};
}
export async function deriveIshar2SaveLayout(io:Uint8Array):Promise<Ishar2SaveLayout>{
 const hash=await sha256(io);if(hash!==ISHAR2_IO_SHA256)throw Error('Unverified Ishar-2 IO.IO profile');
 const module=readAlisModule(io),writer=sequence(module.image,0xa9d,0xdeb,true),reader=sequence(module.image,0xdf4,0x1142,false);
 // Header is written from MAIN 0x4ef7 but read to IO-local 0x06f6.
 const first=reader.fields[0]!,written=writer.fields[0]!;
 if(first.space!=='local'||first.memoryAddress!==0x6f6||written.space!=='main'||written.memoryAddress!==0x4ef7||first.fileBytes!==2||written.fileBytes!==2)throw Error('Unexpected Ishar-2 save header');
 if(JSON.stringify(writer.fields.slice(1))!==JSON.stringify(reader.fields.slice(1)))throw Error('Ishar-2 reader/writer mappings disagree');
 return {game:'ishar2',ioSha256:hash,size:8359,fields:reader.fields.map((field,i)=>({...field,readPc:reader.pcs[i]!,writePc:writer.pcs[i]!}))};
}
function byteMap(layout:Ishar2SaveLayout){
 if(layout.ioSha256!==ISHAR2_IO_SHA256||layout.size!==8359)throw Error('Unsupported Ishar-2 save layout');
 const map=new Map<number,{offset:number;scalar?:Ishar2SavedField}>();
 let fileEnd=0;
 for(const field of layout.fields){
  if(![field.fileOffset,field.fileBytes,field.memoryAddress,field.memoryBytes].every(Number.isInteger)||field.fileOffset!==fileEnd||field.fileBytes<1||field.memoryBytes<1||field.memoryAddress<0||field.memoryAddress+field.memoryBytes>65536||field.fileOffset+field.fileBytes>8359||!['main','local'].includes(field.space))throw Error('Invalid save layout range');
  if(field.storage==='block'?field.fileBytes!==field.memoryBytes:field.fileBytes!==2||field.memoryBytes!==(field.storage==='be16-byte'?1:2)||!['be16-byte','be16-word'].includes(field.storage))throw Error('Invalid save field storage');
  fileEnd+=field.fileBytes;if(field.space!=='main')continue;
  for(let i=0;i<field.memoryBytes;i++){
   const address=field.memoryAddress+i;if(map.has(address))throw Error('Ambiguous saved MAIN address');
   map.set(address,{offset:field.fileOffset+(field.storage==='be16-byte'?1:i),scalar:field.storage==='be16-byte'?field:undefined});
  }
 }
 if(fileEnd!==8359)throw Error('Incomplete save layout');return map;
}
function verifySave(bytes:Uint8Array){if(bytes.length!==8359||bytes[0]!==0||bytes[1]!==2)throw Error('Unsupported Ishar-2 DOS save header/size');}
/** MAIN is normalized to big-endian word bytes, matching savedMainMemory.
 * This is NOT the host DOS VM's raw in-memory endian representation. */
export function readIshar2SavedMain(bytes:Uint8Array,layout:Ishar2SaveLayout):Map<number,number>{
 verifySave(bytes);const memory=new Map<number,number>();for(const [address,target] of byteMap(layout))memory.set(address,bytes[target.offset]!);return memory;
}
export interface Ishar2MainWrite {address:number;width:1|2;value:number}
/** Apply explicit known MAIN writes to a copy, preserve all other SAV bytes.
 * Byte scalars occupy signed BE16 file slots; canonicalize that slot only when
 * its low byte actually changes. Missing/transient addresses fail closed. */
export function patchIshar2SavedMain(bytes:Uint8Array,layout:Ishar2SaveLayout,writes:readonly Ishar2MainWrite[]):Uint8Array{
 verifySave(bytes);const map=byteMap(layout),copy=bytes.slice();
 for(const write of writes){
  if(!write||typeof write!=='object'||!Number.isInteger(write.address)||![1,2].includes(write.width)||!Number.isInteger(write.value)||write.value<-(write.width===1?128:32768)||write.value>(write.width===1?255:65535))throw Error('Invalid MAIN write');
  for(let i=0;i<write.width;i++){
   const target=map.get(write.address+i);if(!target)throw Error(`Unsaved/transient MAIN ${(write.address+i).toString(16)}`);
   const value=(write.value>>((write.width-1-i)*8))&255;
   if(copy[target.offset]!==value){copy[target.offset]=value;if(target.scalar)copy[target.scalar.fileOffset]=value>=128?255:0;}
  }
 }
 return copy;
}
