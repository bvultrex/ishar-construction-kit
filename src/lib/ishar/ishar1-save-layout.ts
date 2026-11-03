import {readAlisModule} from './alis-module.ts';
import {sha256} from './cont-patch.ts';
/** Local Ishar-1 DOS profile, not a claim about all editions/platforms. */
export const ISHAR1_MAIN_SHA256='27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b';
export interface Ishar1SaveField {
 fileOffset:number;fileBytes:number;memoryAddress:number;memoryBytes:number;
 storage:'be16'|'opaque';writePc:number;readPc:number;
}
export interface Ishar1SaveLayout {game:'ishar1';mainSha256:string;size:5216;fields:Ishar1SaveField[]}
/** Decode straight-line original file-I/O instructions, not a hand-invented table. */
function sequence(image:Uint8Array,start:number,end:number,write:boolean){
 const view=new DataView(image.buffer,image.byteOffset,image.byteLength),fields:Omit<Ishar1SaveField,'writePc'|'readPc'>[]=[],pcs:number[]=[];
 let pc=start,offset=0;
 while(pc<end){
  const op=image[pc],begin=pc;let address:number,memoryBytes:number,fileBytes:number,storage:Ishar1SaveField['storage'];
  if(op===(write?0x75:0x74)){
   if(pc+4>end||![6,8].includes(image[pc+1]!))throw Error('Unsupported Ishar-1 value I/O operand');
   address=view.getUint16(pc+2,true);memoryBytes=image[pc+1]===6?1:2;fileBytes=2;storage='be16';pc+=4;
  }else if(op===(write?0x78:0x77)){
   if(pc+5>end)throw Error('Truncated Ishar-1 block I/O');
   address=view.getUint16(pc+1,true);memoryBytes=view.getUint16(pc+3,true);fileBytes=memoryBytes;storage='opaque';pc+=5;
  }else throw Error(`Unexpected Ishar-1 file-I/O opcode at ${pc.toString(16)}`);
  if(!fileBytes||offset+fileBytes>5216)throw Error('Ishar-1 save size overflow');
  pcs.push(begin);fields.push({fileOffset:offset,fileBytes,memoryAddress:address,memoryBytes,storage});offset+=fileBytes;
 }
 if(pc!==end||image[end]!==0x71||offset!==5216)throw Error('Ishar-1 save sequence/size mismatch');
 return {fields,pcs};
}
export async function deriveIshar1SaveLayout(main:Uint8Array):Promise<Ishar1SaveLayout>{
 const mainSha256=await sha256(main);
 if(mainSha256!==ISHAR1_MAIN_SHA256)throw Error('Unverified Ishar-1 MAIN.IO profile; refusing fixed addresses');
 const module=readAlisModule(main),writer=sequence(module.image,0x4816,0x4a1c,true),reader=sequence(module.image,0x4a43,0x4c49,false);
 if(JSON.stringify(writer.fields)!==JSON.stringify(reader.fields))throw Error('Ishar-1 reader/writer layouts disagree');
 if(writer.fields.length!==107)throw Error('Unexpected Ishar-1 save field count');
 return {game:'ishar1',mainSha256,size:5216,fields:writer.fields.map((field,index)=>({...field,writePc:writer.pcs[index]!,readPc:reader.pcs[index]!}))};
}
/** Stored values only: block byte order/meaning deliberately remains opaque. */
export function inspectIshar1Save(bytes:Uint8Array,layout:Ishar1SaveLayout){
 if(layout.mainSha256!==ISHAR1_MAIN_SHA256||layout.size!==5216||bytes.length!==layout.size)throw Error('Ishar-1 save/layout size or profile mismatch');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 return layout.fields.map(field=>({...field,value:field.storage==='be16'?view.getUint16(field.fileOffset,false):bytes.slice(field.fileOffset,field.fileOffset+field.fileBytes)}));
}
