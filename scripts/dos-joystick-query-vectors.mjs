import assert from 'node:assert/strict';
import {queryOriginalDosJoystick} from '../src/lib/ishar/original-dos-joystick-query.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;const q=JSON.parse(text),source=new Uint8Array(Buffer.from(q.memory,'base64'));
const results=q.cases.map(c=>{
 const m=source.slice(),g=0x1c0b0,v=new DataView(m.buffer);m[g+0xca1]=c.disabled;m[g+0x288a]=m[g+0x288b]=c.configured;
 v.setUint16(g+0x2886,c.calibration,true);v.setUint16(g+0x2888,c.calibration,true);
 for(let n=0;n<6;n++)m[0x10390+n]=1;
 const before=m.slice(),result=queryOriginalDosJoystick(m,0x1c0b,c.selector,c.replies);assert.deepEqual(m,before);return result;
});
assert.throws(()=>queryOriginalDosJoystick(new Uint8Array(1),0x1c0b,0,[]));
console.log(JSON.stringify(results));
