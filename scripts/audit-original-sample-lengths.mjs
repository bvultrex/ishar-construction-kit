import {readdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readAlisSoundDirectory} from '../src/lib/ishar/original-alis-sounds.ts';
for(const key of ['ISHAR1_DIR','ISHAR2_DIR']){
 const root=process.env[key];if(!root)throw Error(`Missing ${key}`);
 const report={profile:key,examined:0,littleEndianFitsImage:0,exceptions:[]};
 for(const name of readdirSync(root).filter(n=>/\.io$/i.test(n))){
  const raw=readFileSync(`${root}/${name}`),image=readAlisModule(raw).image,v=new DataView(image.buffer,image.byteOffset,image.byteLength);
  for(const e of readAlisSoundDirectory(image))if(e.sampleHeader){
   report.examined++;const le=e.sampleHeader.declaredLength,be=v.getUint32(e.offset+2,false),remaining=image.length-e.offset;
   if(le>=16&&le<=remaining)report.littleEndianFitsImage++;
   else report.exceptions.push({module:name,sha256:createHash('sha256').update(raw).digest('hex'),sample:e.index,offset:e.offset,headerHex:Buffer.from(image.subarray(e.offset,e.offset+16)).toString('hex'),littleEndianLength:le,bigEndianLength:be,remainingImageBytes:remaining,bigEndianExactlyReachesImageEnd:be===remaining});
  }
 }
 console.log(JSON.stringify(report));
}
