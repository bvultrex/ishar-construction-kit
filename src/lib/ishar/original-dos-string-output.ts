import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
import {executeOriginalDosResourceDrawAtEntry} from './original-dos-resource-draw.ts';
/**185 at2A78: string-buffer swap/copy, then mode2 characters via2C77/2B93.
 * String forms4/10/34, normal/compound glyphs. No invented Unicode/font system.
 * Input SI is after185; CPU scratch/flags and stack saves are not modeled.
 */
export function outputOriginalDosString(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid string output inputs');
 let memory=source.slice();const u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('String output access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 b(ss,0xbac,2);const previous=w(ss,0xc58);w(ss,0xc58,w(ss,0xc5a));w(ss,0xc5a,previous);
 let si=input.si;const tag=b(input.ds,si);si=u(si+1);let segment=input.ds,cursor=si;
 if(tag===10||tag===34){const offset=w(input.ds,si);si=u(si+2);segment=input.es;cursor=u((tag===10?input.bp:w(ss,0xbf6))+offset);}
 else if(tag!==4)throw Error(`String output operand${tag} is not reconstructed`);
 let destination=w(ss,0xc58),terminated=false;
 for(let count=0;count<65536;count++){
  const value=b(segment,cursor);cursor=u(cursor+1);b(ss,destination,value);destination=u(destination+1);
  if(value===0){terminated=true;break;}
 }
 if(!terminated)throw Error('String output copy exceeds host traversal bound');if(tag===4)si=cursor;
 cursor=w(ss,0xc58);const records:number[]=[];let characters=0,finished=false;
 for(let count=0;count<65536;count++){
  const value=b(ss,cursor);cursor=u(cursor+1);if(value===0){finished=true;break;}characters++;
  if(value===13){w(ss,0xc02,0);continue;}
  if(value===10){w(ss,0xc06,u(w(ss,0xc06)-b(ss,0xba4)));continue;}
  if(value!==32){
   const base=w(ss,0xba0);if(base&0x8000)continue;
   const index=u(value-w(ss,0xba8));
   if(!(index&0x8000)&&index<w(ss,0xba6)){
    b(ss,0xc15,1);b(ss,0xc12,0);b(ss,0xc14,1);
    const next=executeOriginalDosResourceDrawAtEntry(memory,ss,{...input,si,dx:u(index+base)});memory=next.memory;records.push(...(next.records??[]));
   }
  }
  w(ss,0xc02,u(w(ss,0xc02)+b(ss,0xba2)));
 }
 if(!finished)throw Error('String output traversal exceeds host bound');
 return {memory,registers:{...input,si},characters,records};
}
