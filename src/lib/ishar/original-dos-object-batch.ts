import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
import {prepareOriginalDosVisibleObject} from './original-dos-visible-object.ts';
import {projectOriginalDosRecord} from './original-dos-record-projection.ts';
import {finishOriginalDosProjectedRecord,mergeOriginalDosRecordBounds,retireOriginalDosProjectedRecord} from './original-dos-projected-record.ts';
/** Normal first FF batch through4132..4168 (before43FB), or40D1 for B22<0.
 * Other first-record/clip boundaries remain explicit rather than skipped.
 */
export function prepareOriginalDosObjectBatch(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,object:number){
 const initial=prepareOriginalDosVisibleObject(source,ss,input,object);
 if(initial.phase!=='new-record')return {...initial,projected:0,retired:0};
 let memory=initial.memory;const registers=initial.registers,ds=registers.ds,u=(v:number)=>v&65535;
 const address=(segment:number,o:number,wide=false)=>{o=u(o);const at=segment*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Object batch access outside bounded real-mode window');return at;};
 const b=(segment:number,o:number,value?:number)=>{const at=address(segment,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(segment:number,o:number)=>{const at=address(segment,o,true);return memory[at]|memory[at+1]<<8;};
 let projected=0,retired=0;
 const process=(previous:number,record:number,status:number)=>{
  if(status>=128||status===2){
   if(status===2)memory=mergeOriginalDosRecordBounds(memory,ss,ds,record).memory;
   memory=projectOriginalDosRecord(memory,ss,ds,registers.es,record).memory;
   memory=finishOriginalDosProjectedRecord(memory,ss,registers,previous,record).memory;projected++;
  }else{memory=retireOriginalDosProjectedRecord(memory,ss,ds,previous,record).memory;retired++;}
  return previous;
 };
 if(initial.di===undefined||initial.bx===undefined)throw Error('Missing original record boundary state');
 const first=initial.di,previous=initial.bx;let di=process(previous,first,255);
 const result=(entry:number)=>{b(ss,0xc18,1);return {memory,registers,phase:'pixels',entry,stackDelta:-20,di:first,bx:previous,projected,retired};};
 if(w(ss,0xb22)&32768)return result(0x40d1);
 for(let count=0;count<65536;count++){
  const bx=di;di=w(ds,u(di+6));if(di===0)return result(0x4168);
  if(w(ds,u(di+30))!==w(ss,0xb22))continue;
  const status=b(ds,di);if(status===0)continue;di=process(bx,di,status);
 }
 throw Error('Object batch exceeds explicit host traversal bound');
}
