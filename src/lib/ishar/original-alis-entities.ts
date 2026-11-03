/** Old DOS ALIS linked live-entity table, reconstructed from the local C
 * reference (script_live/clivin/cfindtyp/cfindcla). Not a DOS RAM emulator.
 * VRAM words use normalized BE bytes, as the toolkit save/operand APIs do. */
export interface DosEntityModule {id:number;vramBytes:number}
export interface DosEntitySnapshot {handle:number;moduleId:number;vram:Uint8Array;form:number;mirror:boolean}
interface Entity extends DosEntitySnapshot {next:number}
export class DosAlisEntities {
 private entities=new Map<number,Entity>();
 private free:number[];
 readonly capacity:number;
 constructor(capacity:number,main:DosEntityModule){
  this.capacity=capacity;
  if(!Number.isInteger(capacity)||capacity<1||capacity>5462)throw Error('Invalid DOS entity capacity');
  this.checkModule(main);if(main.id!==0)throw Error('Root entity must be MAIN');
  this.entities.set(0,{handle:0,moduleId:0,vram:new Uint8Array(main.vramBytes),form:-1,mirror:false,next:0});
  this.free=Array.from({length:capacity-1},(_,i)=>(i+1)*6);
 }
 private checkModule(module:DosEntityModule){if(!Number.isInteger(module.id)||module.id<0||module.id>65535||!Number.isInteger(module.vramBytes)||module.vramBytes<14||module.vramBytes>65535)throw Error('Unsupported old DOS entity module/VRAM size');}
 private get(handle:number){const entity=this.entities.get(handle);if(!entity)throw Error('Unknown live entity handle');return entity;}
 spawn(caller:number,module:DosEntityModule):number{
  const parent=this.get(caller);this.checkModule(module);const handle=this.free[0];if(handle===undefined)return -1;
  const vram=new Uint8Array(module.vramBytes);vram.set(parent.vram.subarray(0,11));
  const entity:Entity={handle,moduleId:module.id,vram,form:-1,mirror:false,next:parent.next};
  this.free.shift();this.entities.set(handle,entity);parent.next=handle;return handle;
 }
 snapshot(handle:number):DosEntitySnapshot{const e=this.get(handle);return {handle:e.handle,moduleId:e.moduleId,vram:e.vram.slice(),form:e.form,mirror:e.mirror};}
 /** Structural killent subset only: no heap compaction, audio wait or cerasall.
  * The returned scheduler effect must be applied by a future VM adapter. */
 removeStructure(handle:number,current:number):{current:number;restartLoop:boolean;stopCurrent:boolean}{
  this.get(current);const removed=this.get(handle);
  if(handle===0)throw Error('Removing MAIN is unsupported by this entity model');
  let previous=0;
  const seen=new Set<number>();
  while(this.get(previous).next!==handle){
   if(seen.has(previous))throw Error('Entity missing from live list');
   seen.add(previous);previous=this.get(previous).next;
   if(previous===0)throw Error('Entity missing from live list');
  }
  this.get(previous).next=removed.next;
  this.entities.delete(handle);this.free.unshift(handle);
  const stopped=current===handle;
  return {current:stopped?previous:current,restartLoop:stopped,stopCurrent:stopped};
 }
 ordered():DosEntitySnapshot[]{
  const result:DosEntitySnapshot[]=[],seen=new Set<number>();let handle=0;
  do{if(seen.has(handle))throw Error('Cyclic live entity list');seen.add(handle);result.push(this.snapshot(handle));handle=this.get(handle).next;}while(handle!==0);
  return result;
 }
 readByte(handle:number,offset:number):number{const e=this.get(handle);if(!Number.isInteger(offset)||offset<0||offset>=e.vram.length)throw Error('Entity byte outside VRAM');return e.vram[offset]!;}
 readWord(handle:number,offset:number):number{return (this.readByte(handle,offset)<<8)|this.readByte(handle,offset+1);}
 writeByte(handle:number,offset:number,value:number){if(!Number.isInteger(value)||value< -128||value>255)throw Error('Invalid entity byte');this.readByte(handle,offset);this.get(handle).vram[offset]=value&255;}
 writeWord(handle:number,offset:number,value:number){if(!Number.isInteger(value)||value< -32768||value>65535)throw Error('Invalid entity word');this.readWord(handle,offset);this.writeByte(handle,offset,(value>>8)&255);this.writeByte(handle,offset+1,value&255);}
 setForm(handle:number,index:number){if(!Number.isInteger(index)||index< -32768||index>32767)throw Error('Invalid entity form');this.get(handle).form=index;}
 setMirror(handle:number,value:boolean){if(typeof value!=='boolean')throw Error('Invalid entity mirror');this.get(handle).mirror=value;}
 findType(caller:number,id:number,all=false):number[]{
  this.get(caller);if(!Number.isInteger(id)||id< -32768||id>32767)throw Error('Invalid DOS type operand');
  const target=id<0?id&255:id,result:number[]=[];
  for(const entity of this.ordered())if(entity.handle!==caller&&entity.moduleId===target){result.push(entity.handle);if(!all)break;}
  return result;
 }
 findClass(caller:number,id:number,all=false):number[]{
  this.get(caller);if(!Number.isInteger(id)||id< -32768||id>32767)throw Error('Invalid DOS class operand');const result:number[]=[];
  for(const entity of this.ordered())if(entity.handle!==caller&&entity.vram[12]===(id&255)){result.push(entity.handle);if(!all)break;}
  return result;
 }
}
