/** Opcode148 prefix510F..515C ->4BC4/4B8F ->291B (result target not included).
 * Literal module-ID comparison against context-10h. Root slot0 is examined too.
 * Host: separate bounded segments, acyclic list, at most127 matches.
 */
export function findOriginalDosContextsByModule(context:Uint8Array,globals:Uint8Array,bp:number,id:number){
 if(context.length!==65536||globals.length!==65536||![bp,id].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native context query inputs');
 const memory=globals.slice(),word=(buf:Uint8Array,at:number)=>{at&=65535;if(at===65535)throw Error('Query word straddles host segment window');return buf[at]|(buf[at+1]<<8);};
 const put=(at:number,v:number)=>{memory[at]=v&255;memory[at+1]=v>>>8;};
 const table=word(memory,0xbd2),all=memory[0xc96]!==0,entries:number[]=[],seen=new Set<number>();let slot=0,cursor=0x1e7e;
 while(true){
  if(seen.has(slot))throw Error('Cyclic native query list');seen.add(slot);
  const pointer=word(context,table+slot);
  if(word(context,pointer-0x10)===id&&pointer!==bp){
   if(entries.length>=127)throw Error('Native query exceeds disjoint127-entry host window');
   put(cursor+0x100,0);put(cursor,slot);cursor+=2;entries.push(slot);if(!all)break;
  }
  slot=word(context,table+slot+4);if(!slot)break;
 }
 put(cursor,65535);memory[0xc96]=0;put(0xc80,0x1e7e);
 const value=word(memory,0x1e7e);if(value<32768)put(0xc80,0x1e80);
 return {memory,value,cx:cursor,entries,boundary:0x291b};
}
