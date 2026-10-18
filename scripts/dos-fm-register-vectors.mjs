import {writeOriginalDosFmRegister,stopOriginalDosFmRegisters} from '../src/lib/ishar/original-dos-fm-register.ts';
const writes=[],stops=[],serialize=r=>({...r,shadow:[...r.shadow]});
for(let register=0;register<256;register++)for(const value of [0,63,255]){
 const shadow=Uint8Array.from({length:256},(_,i)=>i^170);writes.push({register,value,expected:serialize(writeOriginalDosFmRegister(shadow,register,value))});
}
for(const fill of [0,255])stops.push({fill,expected:serialize(stopOriginalDosFmRegisters(new Uint8Array(256).fill(fill)))});
console.log(JSON.stringify({writes,stops}));
