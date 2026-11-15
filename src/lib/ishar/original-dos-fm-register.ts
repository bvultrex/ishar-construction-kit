export type OriginalDosFmIo={kind:'read';port:number}|{kind:'write';port:number;value:number};
/** 1941:240A..2427. Status reads impose the native wait order; values ignored. */
export function writeOriginalDosFmRegister(shadow:Uint8Array,register:number,value:number){
 if(shadow.length!==256||![register,value].every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw new Error('Invalid native FM register write');
 const bytes=Uint8Array.from(shadow),io:OriginalDosFmIo[]=[{kind:'write',port:0x388,value:register}];
 for(let i=0;i<4;i++)io.push({kind:'read',port:0x388});
 io.push({kind:'write',port:0x389,value});
 for(let i=0;i<23;i++)io.push({kind:'read',port:0x388});
 bytes[register]=value;return {shadow:bytes,io};
}
/** 1941:2666..269E, composed with the register helper, no real hardware. */
export function stopOriginalDosFmRegisters(shadow:Uint8Array){
 if(shadow.length!==256)throw new Error('Expected native FM shadow');
 let bytes=Uint8Array.from(shadow);const io:OriginalDosFmIo[]=[];
 const write=(register:number,value:number)=>{const result=writeOriginalDosFmRegister(bytes,register,value);bytes=result.shadow;io.push(...result.io);};
 for(let register=0x55;register>=0x40;register--)write(register,0x3f);
 for(let register=0xb8;register>=0xb0;register--)write(register,0);
 write(0xbd,0);return {shadow:bytes,io};
}
