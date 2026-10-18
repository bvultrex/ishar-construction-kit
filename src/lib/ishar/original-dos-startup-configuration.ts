/** Ishar2 captured DOS configuration module F43..10C4 after the START.STP read/close.
 * Seven tag/value pairs live at module:0386. Invalid tags preserve selections,
 * set B90=1 and still run the original bounds/default normalization.
 * No DOS file access or device probing is implied by this bounded helper.
 */
export function decodeOriginalDosStartupConfiguration(source:Uint8Array,segment:number){
 if(source.length!==0x100000||!Number.isInteger(segment)||segment<0||segment>65535||segment*16+0xb91>source.length)throw Error('Invalid configuration module memory');
 const memory=source.slice(),base=segment*16,b=(offset:number)=>memory[base+offset],set=(offset:number,value:number)=>{memory[base+offset]=value&255;};
 const valid=[82,86,83,80,74,77,75].every((tag,i)=>b(0x386+i*2)===tag);
 if(valid){
  const video=b(0x389),sound=b(0x38b),keyboard=b(0x393);
  set(0x3a6,video===67?0:video===69?1:video===86?2:3);
  set(0x5fc,sound===66?2:sound===71||sound===67?4:sound===65?1:sound===78?3:0);
  if(sound===67)set(0xb8e,8);
  set(0x66a,b(0x38d)-49);set(0x402,b(0x38f)-48);set(0x48a,b(0x391)-48);
  set(0x574,keyboard===90?2:keyboard===81?1:0);
 }else set(0xb90,1);
 for(const [at,limit,fallback] of [[0x3a6,4,0x3ef],[0x5fc,5,0x657],[0x66a,4,0x6b3],[0x48a,2,0x523],[0x402,3,0x439],[0x574,3,0x5ab]])if(b(at)>=limit)set(at,b(fallback));
 return {memory,valid,boundary:0x10c5};
}
