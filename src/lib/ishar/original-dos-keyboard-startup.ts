/** Original08F0 ->0FDD; optional following08F3 ->0BE0 to08F6.
 * Table bytes are read from the user's original shared image. DF is inherited,
 * not silently cleared. DOS vector replies are explicit and IVT updates modeled.
 */
export function initializeOriginalDosKeyboardStartup(source:Uint8Array,ss:number,r:{vectorOffset:number;vectorSegment:number;directionFlag:boolean},includeCheck=false){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+65536>source.length||![r.vectorOffset,r.vectorSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||typeof r.directionFlag!=='boolean'||typeof includeCheck!=='boolean')throw Error('Invalid keyboard startup state');
 const memory=source.slice(),g=ss*16,view=new DataView(memory.buffer),events:Array<Record<string,number|string>>=[];
 memory[g+0xcc6]=0;const selection=memory[g+0x2893];
 if(selection===65||selection===90){
  memory[g+0xcc6]=selection===65?1:2;const direction=r.directionFlag?-1:1;
  for(const [start,destination] of [[selection===65?0x3c3:0x415,0x4cc],[selection===65?0x39a:0x3ec,0x44c]])for(let i=0;i<41;i++)memory[0x10000+destination+i*direction]=memory[0x10000+start+i*direction];
 }
 events.push({service:'get-vector',number:9});view.setUint16(0x10314,r.vectorOffset,true);view.setUint16(0x10316,r.vectorSegment,true);
 events.push({service:'set-vector',number:9,segment:0x1000,offset:0x1072});view.setUint16(9*4,0x1072,true);view.setUint16(9*4+2,0x1000,true);
 // BE0 writes1 and immediately compares it with1: normal no-IRQ path returns.
 if(includeCheck)memory[g+0xcc6]=1;
 return {memory,events,boundary:includeCheck?0x8f6:0x8f3,directionFlag:r.directionFlag};
}
