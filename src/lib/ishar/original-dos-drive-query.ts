/** Explicit DOS/BIOS replies for original expression160 (6F6D ->15A1).
 * readSector is BIOS INT13 AH02, CH=1 CL=1 DH=0, one 512-byte sector.
 * Data is required even on errors: BIOS can alter the destination before failing.
 */
export interface OriginalDosDriveServices {
 currentDrive:()=>number;
 selectDrive:(drive:number)=>number;
 equipmentWord:()=>number;
 readSector:(drive:number,attempt:number)=>{status:number;data:Uint8Array};
}
export function queryOriginalDosDrive(source:Uint8Array,engineSegment:number,selector:number,services?:OriginalDosDriveServices){
 if(source.length!==0x100000||![engineSegment,selector].every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||engineSegment*16+65536>source.length)throw Error('Invalid drive-query state');
 const memory=source.slice(),g=engineSegment*16;
 let drive=selector===65||selector===97?0:selector===66||selector===98?1:selector===67||selector===99?2:selector===63?-1:-2;
 if(drive===-2)return {memory,dx:0};
 if(memory[g+0xe940]!==0)throw Error('Original drive-selection dialog8AE4 is not reconstructed');
 if(!services)throw Error('Expression160 requires explicit DOS/BIOS drive services');
 const checked=(value:number,max:number)=>{if(!Number.isInteger(value)||value<0||value>max)throw Error('Invalid explicit drive service reply');return value;};
 if(drive===-1)drive=checked(services.currentDrive(),255);
 else{
  if(drive===1&&(checked(services.equipmentWord(),65535)&192)===0)return {memory,dx:0};
  if(drive<2){
   let good=false;
   for(let attempt=0;attempt<2;attempt++){
    const reply=services.readSector(drive,attempt);checked(reply.status,255);
    if(!(reply.data instanceof Uint8Array)||reply.data.length!==512)throw Error('Expected explicit BIOS sector-buffer contents');
    memory.set(reply.data,g+0x227e);
    if(reply.status===0){good=true;break;}
   }
   if(!good)return {memory,dx:0};
  }
  checked(services.selectDrive(drive),255); // Original ignores DOS AL drive count.
 }
 // Native CBW before signed test, then only A/B/C accepted.
 return {memory,dx:drive<=2?65+drive:0};
}
