import {createHash} from 'node:crypto';
import {copyOriginalDosFrame} from '../src/lib/ishar/original-dos-frame-copy.ts';
const source=Uint8Array.from({length:65536},(_,i)=>(i*13+7)&255),destination=new Uint8Array(65536).fill(0xa5),cases=[];
for(const sourceOffset of [0,13,57536])for(const destinationOffset of [0,123,57536])for(const rectangleOffset of [0,64000])for(const [width,rows] of [[0,1],[8,3],[16,16]])for(const stride of [20,320]){
 if(rectangleOffset+(rows-1)*stride+width>65536)continue;
 const payload=Uint8Array.from({length:width*rows},(_,i)=>(i*17)&255),result=copyOriginalDosFrame(source,destination,sourceOffset,destinationOffset,payload,rectangleOffset,width,rows,stride);
 cases.push({sourceOffset,destinationOffset,rectangleOffset,width,rows,stride,payload:[...payload],expected:createHash('sha256').update(result).digest('hex')});
}
console.log(JSON.stringify(cases));
