import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {initializeOriginalDosKeyboardStartup as initialize} from '../src/lib/ishar/original-dos-keyboard-startup.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(const selection of [0,65,81,90,255])for(const directionFlag of [false,true])for(const includeCheck of [false,true]){
 const m=source.slice();m[0x1c0b0+0x2893]=selection;const before=m.slice(),{memory,...result}=initialize(m,0x1c0b,{vectorOffset:0x1234,vectorSegment:0x7000,directionFlag},includeCheck);
 if(!m.every((x,i)=>x===before[i]))throw Error('Keyboard startup mutated source');memory.fill(0,0x1c0b0+0xfefa,0x1c0b0+0xff00);cases.push({selection,directionFlag,includeCheck,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
