import {expandReferenceDosSampleDelta} from './reference-dos-sample-delta.ts';
import {normalizeReferenceDosSample} from './reference-dos-sample-normalize.ts';

/** PC script_init sample path from separate C reference. Caller supplies a
 * bounded resource buffer and original module pack byte. Not a DOS proof. */
export function importReferenceDosSample(resource:Uint8Array,modulePackByte:number,engineVersion:number){
 if(!Number.isInteger(modulePackByte)||modulePackByte<0||modulePackByte>255)throw Error('Invalid module pack byte');
 if(resource.length<16||![1,2].includes(resource[0]!))throw Error('Unsupported sample resource');
 const bytes=resource.slice(),v=new DataView(bytes.buffer);
 if(bytes[6]===1&&modulePackByte!==0){
  const total=v.getUint32(2,true),expanded=expandReferenceDosSampleDelta(bytes.subarray(16),total);
  if(16+expanded.length>bytes.length)throw Error('Expanded sample outside resource buffer');
  bytes.set(expanded,16);const adjusted=total-2;v.setUint32(2,adjusted,true);
  if(bytes[0]===2){
   const loop=v.getUint32(12,true);
   const mark=(at:number)=>{if(at<16||at+8>bytes.length)throw Error('Type-2 marker outside resource buffer');bytes.fill(255,at,at+8);};
   if(loop!==0)mark(16+loop);
   mark(loop!==0?adjusted-8:adjusted-16);
  }
 }
 return normalizeReferenceDosSample(bytes,engineVersion);
}
