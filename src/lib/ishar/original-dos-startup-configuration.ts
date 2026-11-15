/** Captured DOS configuration decode: Ishar2 F43..10C4; Ishar1 EC2..1043.
 * Seven tag/value pairs live at module:0386. Invalid tags preserve selections,
 * set B90=1 and still run the original bounds/default normalization.
 * No DOS file access or device probing is implied by this bounded helper.
 */
export function decodeOriginalDosStartupConfiguration(source:Uint8Array,segment:number,profile:'ishar1'|'ishar2'='ishar2',loaded=true){
 if(!['ishar1','ishar2'].includes(profile)||source.length!==0x100000||!Number.isInteger(segment)||segment<0||segment>65535||segment*16+0xb91>source.length)throw Error('Invalid configuration module memory');
 const memory=source.slice(),base=segment*16,b=(offset:number)=>memory[base+offset],set=(offset:number,value:number)=>{memory[base+offset]=value&255;};
 const valid=loaded&&[82,86,83,80,74,77,75].every((tag,i)=>b(0x386+i*2)===tag);
 if(valid){
  const video=b(0x389),sound=b(0x38b),keyboard=b(0x393);
  set(0x3a6,video===67?0:video===69?1:video===86?2:3);
  set(0x5fc,sound===66?2:sound===71||sound===67?4:sound===65?1:sound===78?3:0);
  if(sound===67)set(0xb8e,8);
  set(0x66a,b(0x38d)-49);set(0x402,b(0x38f)-48);set(0x48a,b(0x391)-48);
  set(0x574,keyboard===90?2:keyboard===81?1:0);
 }else set(0xb90,1);
 for(const [at,limit,fallback] of [[0x3a6,4,0x3ef],[0x5fc,5,0x657],[0x66a,4,0x6b3],[0x48a,2,0x523],[0x402,3,0x439],[0x574,3,0x5ab]])if(b(at)>=limit)set(at,b(fallback));
 return {memory,valid,boundary:profile==='ishar1'?0x1044:0x10c5};
}

export interface OriginalStartupConfigurationFileReply{
 openError:boolean;readError:boolean;closeError:boolean;handle:number;readBytes:Uint8Array;
}
/** Complete Ishar1 E96..1044 / Ishar2 EFC..10E0 memory/service path.
 * DOS replies are explicit. A successful short read preserves the buffer tail;
 * the original does not check AX against14. Read failure skips close.
 * Registers/flags and external drive state are outside this memory-only API.
 */
export function loadOriginalDosStartupConfiguration(source:Uint8Array,segment:number,profile:'ishar1'|'ishar2',reply:OriginalStartupConfigurationFileReply){
 if(source.length!==0x100000||!Number.isInteger(segment)||segment<0||segment>65535||segment*16+0xb9a>source.length||!['ishar1','ishar2'].includes(profile)||![reply.openError,reply.readError,reply.closeError].every(v=>typeof v==='boolean')||!Number.isInteger(reply.handle)||reply.handle<0||reply.handle>65535||reply.readBytes.length>14)throw Error('Invalid configuration file reply');
 const staged=source.slice(),base=segment*16,events:Array<Record<string,number|string>>=[];
 const drive=(at:number)=>events.push({service:'select-drive',drive:staged[base+at]});
 if(profile==='ishar2')drive(0xb99);
 events.push({service:'open',access:0x82,segment,offset:0x36c});
 let loaded=false;
 if(!reply.openError){
  new DataView(staged.buffer).setUint16(base+0x376,reply.handle,true);
  events.push({service:'read',handle:reply.handle,count:14,segment,offset:0x386});
  if(!reply.readError){
   staged.set(reply.readBytes,base+0x386);
   events.push({service:'close',handle:reply.handle});loaded=!reply.closeError;
  }
 }
 const result=decodeOriginalDosStartupConfiguration(staged,segment,profile,loaded);
 if(profile==='ishar2')drive(0xb98);
 return {...result,boundary:profile==='ishar1'?0x1044:0x10e0,events};
}
