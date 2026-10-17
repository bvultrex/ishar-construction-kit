import {planOriginalDosResourceTables} from '../src/lib/ishar/original-dos-resource-memory.ts';
const cases=[];
for(const seed of [0,3,4,15,16,1721,1722,65535])for(const segment of [0,16384,65535])for(const offset of [0,65520])for(const frontier of [0,32768,65535]){
 const header=new Uint8Array(16),view=new DataView(header.buffer);for(let at=0;at<16;at+=2)view.setUint16(at,seed,true);
 cases.push({header:[...header],segment,offset,frontier,expected:planOriginalDosResourceTables(header,segment,offset,frontier,0x1234)});
}
for(let field=0;field<16;field+=2)for(const value of [1,16,65535]){
 const header=new Uint8Array(16);new DataView(header.buffer).setUint16(field,value,true);
 cases.push({header:[...header],segment:16384,offset:0,frontier:32768,expected:planOriginalDosResourceTables(header,16384,0,32768,0x1234)});
}
console.log(JSON.stringify(cases));
