import type {OriginalConfigurationDriveReplies} from './original-dos-configuration-drives.ts';
export interface OriginalDosStartupServiceReplies extends OriginalConfigurationDriveReplies{
 vector24:{offset:number;segment:number};vector0:{offset:number;segment:number};
 diskResetWrites:Array<Array<{address:number;data:Uint8Array}>>;
}
/** Engine078F..0832 including215D drive probe, both captured DOS profiles.
 * DOS/BIOS replies explicit; IVT updates model the declared DOS set-vector service.
 * BIOS writes are supplied by the caller; no physical disk/host service is invoked.
 */
export function prepareOriginalDosStartupServices(source:Uint8Array,ss:number,r:OriginalDosStartupServiceReplies){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+0x28a1>source.length||!Number.isInteger(r.currentDrive)||r.currentDrive<0||r.currentDrive>25||!Number.isInteger(r.driveCount)||r.driveCount<0||r.driveCount>26||!Number.isInteger(r.handle)||r.handle<0||r.handle>65535||r.currentDirectory.length<1||r.currentDirectory.length>64||r.currentDirectory.at(-1)!==0||![r.vector24.offset,r.vector24.segment,r.vector0.offset,r.vector0.segment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||r.diskResetWrites.length!==2||!r.attempts.every(v=>typeof v.chdirError==='boolean'&&typeof v.createError==='boolean'))throw Error('Invalid DOS startup service replies');
 const memory=source.slice(),base=ss*16,v=new DataView(memory.buffer),set=(at:number,value:number)=>{memory[base+at]=value;},word=(at:number,value:number)=>v.setUint16(base+at,value,true),events:Array<Record<string,number|string>>=[];
 for(const [number,reply,at,handler] of [[0x24,r.vector24,0xcbf,0xe9d],[0,r.vector0,0xb78,0xe47]] as const){
  events.push({service:'get-vector',number});word(at,reply.offset);word(at+2,reply.segment);
  events.push({service:'set-vector',number,segment:0x1000,offset:handler});v.setUint16(number*4,handler,true);v.setUint16(number*4+2,0x1000,true);
 }
 events.push({service:'current-drive'});set(0x28a0,r.currentDrive);set(0xcc5,r.currentDrive>=2?0:r.currentDrive);
 events.push({service:'current-directory',drive:0,segment:ss,offset:0x1d66});memory.set(r.currentDirectory,base+0x1d66);set(0x1d65,memory[base+0x1d63]);set(0x289b,1);
 const select=(drive:number)=>events.push({service:'select-drive',drive});select(r.currentDrive);set(0x289f,r.driveCount);set(0x289e,1);
 let accepted=false,attempts=0;
 for(let drive=2;;drive++){
  set(0x289e,drive);if(drive>=r.driveCount)break;
  const reply=r.attempts[attempts++];if(!reply)throw Error('DOS startup drive probe needs another reply');
  select(drive);events.push({service:'change-directory',segment:ss,offset:0x1d65});if(reply.chdirError)continue;
  events.push({service:'create',segment:0x1000,offset:0x2154,attributes:0});if(reply.createError)continue;
  events.push({service:'close',handle:r.handle},{service:'delete',segment:0x1000,offset:0x2154});set(0x289c,r.currentDrive);set(0x289d,drive);accepted=true;break;
 }
 if(!accepted){set(0x289c,r.currentDrive);set(0x289d,2);select(2);events.push({service:'change-directory',segment:0x1000,offset:0x2152});set(0x289b,1);}
 select(r.currentDrive);
 for(let reset=0;reset<2;reset++){
  events.push({service:'disk-reset',al:reset});
  for(const patch of r.diskResetWrites[reset]){if(!Number.isInteger(patch.address)||patch.address<0||patch.address+patch.data.length>memory.length)throw Error('BIOS reset patch outside memory');memory.set(patch.data,patch.address);}
 }
 const systemId=memory[0xffffe];if(systemId===0xfe||systemId===0xff)set(0x2892,1);
 return {memory,events,boundary:0x833,ds:ss,interruptsEnabled:true,accepted,attempts};
}
