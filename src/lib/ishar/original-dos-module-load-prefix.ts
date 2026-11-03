import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Opcode69:2DBD..2DD9, including78F9/8106 loaded-module lookup.
 * A cache hit completes the original return. A miss stops before CALL1F97 at
 * 7917; module0 stops before replacement69B8/765C. No file-load success stub.
 * stackDelta is relative to handler2DBD with its existing return word.
 */
export function prepareOriginalDosModuleLoad(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,engineSegment=0x1000){
 if(source.length!==0x100000||![ss,engineSegment,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid module-load prefix');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const at=(segment:number,offset:number,wide=false)=>{offset=u(offset);const a=segment*16+offset;if(wide&&offset===65535||a+(wide?2:1)>memory.length)throw Error('Module prefix outside bounded memory');return a;};
 const b=(s:number,o:number)=>memory[at(s,o)];
 const w=(s:number,o:number,value?:number)=>{const a=at(s,o,true);if(value!==undefined){memory[a]=value&255;memory[a+1]=value>>>8;}return memory[a]|memory[a+1]<<8;};
 if(b(engineSegment,0x318)===0x73)return {memory,registers:{...input},phase:'keyboard',entry:0x2dbd,stackDelta:0};
 const moduleId=w(input.ds,input.si),si=u(input.si+2);
 if(moduleId===0)return {memory,registers:{...input,si},moduleId,phase:'replace',entry:0x2dd9,stackDelta:0};
 w(ss,0xb04,moduleId);let di=w(ss,0xbc2);const cx=u(w(ss,0xbc2)+u(w(ss,0xbce)*4));let visited=0;
 for(;;){
  const pointer=w(input.es,di),segment=w(input.es,di+2);di=u(di+4);visited++;
  // LDS precedes range comparison in8106, including the empty-table case.
  if(di>cx)break;
  const id=w(segment,pointer);
  if(moduleId>id){if(visited>16384)throw Error('Module lookup exceeds host traversal bound');continue;}
  if(moduleId===id){
   let cursor=si,terminated=false;
   for(let n=0;n<65536;n++){const value=b(input.ds,cursor);cursor=u(cursor+1);if(value===0){terminated=true;break;}}
   if(!terminated)throw Error('Module filename exceeds host traversal bound');
   return {memory,registers:{...input,si:cursor,dx:si,cx},moduleId,visited,di,phase:'return',entry:0x26f7,stackDelta:2};
  }
  break;
 }
 return {memory,registers:{...input,si,dx:si,cx:6},moduleId,visited,di,phase:'file-open',entry:0x7917,stackDelta:-4};
}
