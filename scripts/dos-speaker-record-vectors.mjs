import {applyOriginalDosSpeakerRecord} from '../src/lib/ishar/original-dos-speaker-record.ts';
const cases=[];
for(const mode of [1,4])for(const flag of [0,1,2,3])for(const word of [0,255,32767,65535])for(const port61 of [0,1,2,3,255])for(const first of [0,7,255])for(const equal of [false,true]){
 const record=new Uint8Array(16);record[2]=flag;new DataView(record.buffer).setUint16(10,word,true);record[7]=word?1:0;
 const cached=equal?(word+100)&65535:99,inputs=[first,123];let reads=0;
 const result=applyOriginalDosSpeakerRecord(record,mode,port61,cached,()=>inputs[reads++]);
 cases.push({record:[...record],mode,port61,cached,inputs,reads,...result});
 // Preserve initial port state separately from the result.
 cases.at(-1).initialPort61=port61;
}
console.log(JSON.stringify(cases));
