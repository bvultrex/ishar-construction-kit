import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** 325F/3279: show moves the object to the active-list tail; hide only sets40.
 * Input SI points after opcode78/79. Shared physical memory and word wrapping.
 * Host cycle/access guards reject malformed lists, without changing the input.
 */
export function setOriginalDosObjectVisibility(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode:number){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![78,79].includes(opcode))throw Error('Invalid object visibility inputs');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Object visibility access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const object=w(input.ds,input.si),base=w(ss,0xbf6),es=input.es,record=u(object+base);
 if(opcode===79)b(es,record,b(es,record)|0x40);
 else{
  b(es,record,b(es,record)&0xbf);w(es,record,w(es,record)|0x80);
  let current=w(ss,0xc16);
  if(current===object&&current!==0)w(ss,0xc16,w(es,u(record+4)));
  else{
   const seen=new Set<number>();
   while(current!==0){
    if(seen.has(current))throw Error('Object visibility remove-list cycle');seen.add(current);
    const next=w(es,u(current+base+4));
    if(next===object){w(es,u(current+base+4),w(es,u(record+4)));break;}
    current=next;
   }
  }
  w(es,u(record+4),0);current=w(ss,0xc16);
  if(current===0)w(ss,0xc16,object);
  else{
   const seen=new Set<number>();
   while(true){
    if(seen.has(current))throw Error('Object visibility append-list cycle');seen.add(current);
    const next=w(es,u(current+base+4));
    if(next===0){w(es,u(current+base+4),object);break;}
    current=next;
   }
  }
 }
 return {memory,registers:{...input,si:u(input.si+2)}};
}
