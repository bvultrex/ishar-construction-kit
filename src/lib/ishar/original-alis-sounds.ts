import {readAlisImageHeader} from './alis-module.ts';

/** Static on-disk directory. Does not perform script_init sample conversion. */
export interface AlisSoundEntry {
 index:number;tableEntry:number;offset:number;type:number;
 sampleHeader?:{speed:number;declaredLength:number;packing:number;loopField:number};
}
/** Layout from separate ALIS reference adresmus/script_init, not a DOS execution proof.
 * Unknown resource types remain entries and are never guessed to be PCM. */
export function readAlisSoundDirectory(image:Uint8Array):AlisSoundEntry[] {
 const root=readAlisImageHeader(image).resourceOffset;if(root===0)return [];
 const view=new DataView(image.buffer,image.byteOffset,image.byteLength);
 const range=(at:number,size:number)=>{if(!Number.isSafeInteger(at)||at<0||at+size>image.length)throw Error('ALIS sound directory outside image');};
 range(root,18);const count=view.getUint16(root+16,true);
 if(count===0)return [];
 const table=root+view.getUint32(root+12,true);range(table,count*4);
 const entries:AlisSoundEntry[]=[];
 for(let index=0;index<count;index++){
  const tableEntry=table+index*4,offset=tableEntry+view.getUint32(tableEntry,true);range(offset,1);
  const type=image[offset]!,entry:AlisSoundEntry={index,tableEntry,offset,type};
  if(type===1||type===2){
   range(offset,16);
   entry.sampleHeader={speed:image[offset+1]!,declaredLength:view.getUint32(offset+2,true),packing:image[offset+6]!,loopField:view.getUint32(offset+12,true)};
  }
  entries.push(entry);
 }
 return entries;
}

/** Length-preserving raw header edit. No frequency interpretation or sample conversion.
 * Aliased entries share the same byte and are explicitly reported to the caller. */
export function editAlisSampleSpeed(image:Uint8Array,index:number,speed:number){
 if(!Number.isInteger(index)||index<0||!Number.isInteger(speed)||speed<0||speed>255)throw Error('Invalid sample index/speed');
 const entries=readAlisSoundDirectory(image),entry=entries[index];
 if(!entry?.sampleHeader)throw Error('Selected sound is not a supported sample header');
 const result=Uint8Array.from(image);result[entry.offset+1]=speed;
 return {image:result,offset:entry.offset+1,affectedIndices:entries.filter(e=>e.offset===entry.offset).map(e=>e.index)};
}
