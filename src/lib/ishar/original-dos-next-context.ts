/** Native1000:2632..264F, stopping before frame service3D3C when link is0.
 * Slot offsets are raw byte offsets, not array indices; no null-context fixup.
 */
export function selectOriginalDosNextContext(tableSegment:Uint8Array,tableOffset:number,currentSlot:number,previousBp:number){
 if(tableSegment.length!==65536||![tableOffset,currentSlot,previousBp].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native context table inputs');
 const u=(v:number)=>v&65535,word=(at:number)=>{at=u(at);if(at===65535)throw Error('Straddling native table word outside host contract');return tableSegment[at]|(tableSegment[at+1]<<8);};
 const slot=word(tableOffset+currentSlot+4);
 return slot===0?{slot,si:tableOffset,bp:previousBp,phase:'frame' as const}:{slot,si:tableOffset,bp:word(tableOffset+slot),phase:'context' as const};
}
