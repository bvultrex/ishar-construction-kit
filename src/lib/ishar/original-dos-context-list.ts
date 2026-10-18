/** Opcode156 prefix 1000:51AF..51DD ->4BC4..4BA1, stops before291B.
 * Enumerates raw nonzero context-table links; does NOT execute the trailing result operand.
 * Distinct context/globals segments; bounded, acyclic list (at most127 entries).
 */
export function enumerateOriginalDosContexts(context:Uint8Array,globals:Uint8Array){
 if(context.length!==65536||globals.length!==65536)throw Error('Invalid native context-list buffers');
 const memory=globals.slice(),word=(buf:Uint8Array,at:number)=>{at&=65535;if(at===65535)throw Error('Context-list word straddles host segment window');return buf[at]|(buf[at+1]<<8);};
 const put=(at:number,value:number)=>{at&=65535;if(at===65535)throw Error('Context-list word straddles host segment window');memory[at]=value&255;memory[at+1]=value>>>8;};
 const table=word(memory,0xbd2),entries:number[]=[],seen=new Set<number>();let slot=0,di=0x1e7e;
 while(true){
  slot=word(context,(table+slot+4)&65535);if(!slot)break;
  if(seen.has(slot))throw Error('Cyclic native context list');
  if(entries.length>=127)throw Error('Native context list exceeds disjoint 127-entry host window');
  seen.add(slot);entries.push(slot);put(di+0x100,0);put(di,slot);di+=2;
 }
 put(di,65535);memory[0xc96]=0;put(0xc80,0x1e7e);
 const value=word(memory,0x1e7e);if(value<32768)put(0xc80,0x1e80);
 return {memory,entries,value,di,bx:0x1e7e,boundary:0x291b};
}
