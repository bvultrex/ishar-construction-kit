import {restoreOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-restore.ts';
import {createHash} from 'node:crypto';
const cases=[];
for(const width of [0,1,8,16])for(const rows of [1,3,16])for(const stride of [20,320])for(const offset of [0,250,64000])for(const segment of [0x1c0b,0x5000]){
 if(offset+(rows-1)*stride+width>65536)continue;
 const destination=Uint8Array.from({length:65536},(_,i)=>(i*13+7)&255),payload=Uint8Array.from({length:width*rows},(_,i)=>(i*17+99)&255);
 const result=restoreOriginalDosCursor(destination,payload,offset,width,rows,stride);
 cases.push({width,rows,stride,offset,segment,sha256:createHash('sha256').update(result).digest('hex')});
}
console.log(JSON.stringify(cases));
