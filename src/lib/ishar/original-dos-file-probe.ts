export interface OriginalDosFileSearch {
 /** Explicit DOS boundary: true means carry/error from FindFirst AH4E.
  * drive=null denotes the caller's current drive, not an invented drive0.
  * Implementations must be read-only; DTA effects are not modeled here.
  */
 findFirst:(pattern:Uint8Array,attributes:number,drive:number|null)=>boolean;
}
/** Expression156:6F55..6F6C ->2064..20B4,2151 RET in identified captures.
 * Controlled DOS response contract, not a host-filesystem existence shortcut.
 */
export function probeOriginalDosFile(globals:Uint8Array,service:OriginalDosFileSearch){
 if(globals.length!==65536)throw Error('Expected original global segment');
 const pointer=globals[0xc58]|(globals[0xc59]<<8),end=globals.indexOf(0,pointer);
 if(end<0)throw Error('DOS filename crosses host segment window');
 const pattern=globals.slice(pointer,end),events:Array<{operation:'find-first'|'select-drive';drive:number|null;carry?:boolean}>=[];
 const find=(drive:number|null)=>{
  const carry=service.findFirst(pattern.slice(),0,drive);
  if(typeof carry!=='boolean')throw Error('FindFirst must return explicit DOS carry status');
  events.push({operation:'find-first',drive,carry});return carry;
 };
 let carry=find(null);
 if(carry&&globals[0x289b]===1){
  const alternate=globals[0x289d];events.push({operation:'select-drive',drive:alternate});carry=find(alternate);
  if(carry)events.push({operation:'select-drive',drive:globals[0x289c]});
 }
 return {dx:carry?0:65535,cx:0,events};
}
