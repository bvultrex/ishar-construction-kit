import {createHash} from 'node:crypto';
import {copyOriginalDosFrame,runOriginalDosFrameCopyService} from '../src/lib/ishar/original-dos-frame-copy.ts';
const source=Uint8Array.from({length:65536},(_,i)=>(i*13+7)&255),destination=new Uint8Array(65536).fill(0xa5),cases=[];
for(const sourceOffset of [0,13,57536])for(const destinationOffset of [0,123,57536])for(const rectangleOffset of [0,64000])for(const [width,rows] of [[0,1],[8,3],[16,16]])for(const stride of [20,320]){
 if(rectangleOffset+(rows-1)*stride+width>65536)continue;
 const payload=Uint8Array.from({length:width*rows},(_,i)=>(i*17)&255),result=copyOriginalDosFrame(source,destination,sourceOffset,destinationOffset,payload,rectangleOffset,width,rows,stride);
 const row={sourceOffset,destinationOffset,rectangleOffset,width,rows,stride,payload:[...payload],expected:createHash('sha256').update(result).digest('hex')};
 if(process.argv[2]==='--frame-service'){
  const globals=new Uint8Array(65536),view=new DataView(globals.buffer);
  for(const [at,value] of [[0xb84,sourceOffset],[0xb86,0x6000],[0xb88,destinationOffset],[0xb8a,0x7000],[0xcaa,0x2780],[0xcac,0x5000],[0x1dd5,stride],[0x2780,rectangleOffset],[0x2782,width],[0x2784,rows]])view.setUint16(at,value,true);
  globals[0xc4a]=1;globals[0x2898]=1;globals[0xc49]=255;globals[0xc99]=sourceOffset===13?1:0;
  const frame=runOriginalDosFrameCopyService(globals,source,destination,payload,0);
  row.globals=Buffer.from(globals.subarray(0,0x28c0)).toString('base64');row.phase=frame.phase;row.expectedGlobals=createHash('sha256').update(frame.memory.subarray(0,0x28c0)).digest('hex');
 }
 cases.push(row);
}
console.log(JSON.stringify(cases));
