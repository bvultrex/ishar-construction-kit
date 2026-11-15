import {selectOriginalDosNextContext} from '../src/lib/ishar/original-dos-next-context.ts';
const cases=[];
for(const tableOffset of [0x100,0xfffc])for(const currentSlot of [0,6,18])for(const nextSlot of [0,6,18])for(const bp of [0,0x1234,65535]){
 const table=new Uint8Array(65536).fill(0xa5),v=new DataView(table.buffer);v.setUint16((tableOffset+currentSlot+4)&65535,nextSlot,true);v.setUint16((tableOffset+nextSlot)&65535,bp,true);
 cases.push({tableOffset,currentSlot,nextSlot,bp,expected:selectOriginalDosNextContext(table,tableOffset,currentSlot,0x7777)});
}
console.log(JSON.stringify(cases));
