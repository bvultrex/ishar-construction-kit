/** 43-byte FindFirst DTA record, observed against the local DOSBox reference.
 * The first21 bytes are opaque search state. Raw bytes, including bytes after
 * the filename terminator, must survive a no-op write unchanged.
 * This record alone is NOT a proven cursor snapshot: the DOSBox rewind oracle
 * retains enumeration progress even after all43 DTA bytes are restored.
 */
export function readDosFindFirstDta(bytes:Uint8Array){
 if(bytes.length!==43)throw Error('Expected a 43-byte DOS FindFirst DTA record');
 const raw=bytes.slice(),view=new DataView(raw.buffer),name=raw.slice(30),end=name.indexOf(0);
 return {raw,searchState:raw.slice(0,21),attributes:raw[21],time:view.getUint16(22,true),date:view.getUint16(24,true),size:view.getUint32(26,true),name:name.slice(0,end<0?13:end),nameTerminated:end>=0};
}
export function writeDosFindFirstDta(bytes:Uint8Array,changes:{attributes?:number;time?:number;date?:number;size?:number;name?:Uint8Array}={}){
 const parsed=readDosFindFirstDta(bytes),raw=parsed.raw,view=new DataView(raw.buffer);
 for(const [key,max] of [['attributes',255],['time',65535],['date',65535],['size',4294967295]] as const){
  const value=changes[key];if(value===undefined)continue;
  if(!Number.isInteger(value)||value<0||value>max)throw Error(`Invalid DTA ${key}`);
  if(key==='attributes')raw[21]=value;else if(key==='size')view.setUint32(26,value,true);else view.setUint16(key==='time'?22:24,value,true);
 }
 if(changes.name!==undefined){
  if(changes.name.length>12||changes.name.includes(0))throw Error('DTA filename must fit12 nonzero bytes plus terminator');
  raw.fill(0,30);raw.set(changes.name,30);
 }
 return raw;
}
