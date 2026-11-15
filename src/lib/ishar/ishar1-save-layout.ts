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

/** MAIN data bytes normalized to saved big-endian word order, not CPU RAM. */
function savedByteMap(layout:Ishar1SaveLayout){
 if(layout.game!=='ishar1'||layout.mainSha256!==ISHAR1_MAIN_SHA256||layout.size!==5216||layout.fields.length!==107)throw Error('Unsupported Ishar-1 save layout');
 const map=new Map<number,{offset:number;scalarOffset?:number}>();let end=0;
 for(const field of layout.fields){
  const scalar=field.storage==='be16';
  if(![field.fileOffset,field.fileBytes,field.memoryAddress,field.memoryBytes].every(Number.isInteger)||field.fileOffset!==end||field.memoryBytes<1||field.memoryAddress<0||field.memoryAddress+field.memoryBytes>65536||field.fileOffset+field.fileBytes>5216||
   (scalar?field.fileBytes!==2||![1,2].includes(field.memoryBytes):field.storage!=='opaque'||field.fileBytes!==field.memoryBytes))throw Error('Invalid Ishar-1 save layout range/storage');
  end+=field.fileBytes;
  for(let i=0;i<field.memoryBytes;i++){
   const address=field.memoryAddress+i;if(map.has(address))throw Error('Ambiguous Ishar-1 saved address');
   map.set(address,{offset:field.fileOffset+(scalar&&field.memoryBytes===1?1:i),scalarOffset:scalar&&field.memoryBytes===1?field.fileOffset:undefined});
  }
 }
 if(end!==5216)throw Error('Incomplete Ishar-1 save layout');return map;
}
export function readIshar1SavedMain(bytes:Uint8Array,layout:Ishar1SaveLayout):Map<number,number>{
 if(bytes.length!==5216)throw Error('Ishar-1 save size mismatch');
 return new Map([...savedByteMap(layout)].map(([address,target])=>[address,bytes[target.offset]!]));
}
/** Surgical writes into a private SAV copy. Unmapped/transient addresses fail. */
export function patchIshar1SavedMain(bytes:Uint8Array,layout:Ishar1SaveLayout,writes:readonly {address:number;width:1|2;value:number}[]):Uint8Array{
 if(bytes.length!==5216)throw Error('Ishar-1 save size mismatch');
 const map=savedByteMap(layout),copy=bytes.slice();
 for(const write of writes){
  if(!write||!Number.isInteger(write.address)||![1,2].includes(write.width)||!Number.isInteger(write.value)||write.value<-(write.width===1?128:32768)||write.value>(write.width===1?255:65535))throw Error('Invalid Ishar-1 saved write');
  for(let i=0;i<write.width;i++){
   const target=map.get(write.address+i);if(!target)throw Error('Unsaved Ishar-1 address');
   const value=(write.value>>>((write.width-1-i)*8))&255;
   if(copy[target.offset]!==value){copy[target.offset]=value;if(target.scalarOffset!==undefined)copy[target.scalarOffset]=value>=128?255:0;}
  }
 }
 return copy;
}
