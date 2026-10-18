/** Native 1000:264F..26AF, stops at first 26EB dispatch or next-context2632.
 * Scan callbacks take precedence; no opcode or callback body is executed here.
 */
export function prepareOriginalDosScriptDispatch(contextMemory:Uint8Array,moduleMemory:Uint8Array,bp:number,initialDs:number,initialSi:number){
 if(contextMemory.length!==65536||moduleMemory.length!==65536||![bp,initialDs,initialSi].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected word registers and two 64KiB segments');
 const memory=contextMemory.slice(),u=(n:number)=>n&65535,b=(at:number)=>memory[u(bp+at)],w=(at:number)=>b(at)|(b(at+1)<<8);
 const globals:Record<number,number>={0xc96:0,0xc19:0};
 const snapshot=()=>{for(let at=0;at<8;at+=2)globals[0xbfa+at]=w(at);};
 const flag=b(-0x24);
 let ds=initialDs,si=initialSi;
 if((flag&128)!==0&&(flag&2)===0){
  const base=w(-0x14),scan=moduleMemory[u(base+10)]|(moduleMemory[u(base+11)]<<8);
  ds=w(-0x12);si=base;
  if(scan!==0){snapshot();globals[0xc56]=w(-10);return {memory,globals,phase:'scan' as const,ds:w(-0x12),si:u(base+10+scan)};}
 }
 const active=b(-4);
 if(active===0)return {memory,globals,phase:'skip' as const,ds,si};
 if(active&128)memory[u(bp-4)]=1;
 memory[u(bp-1)]=(b(-1)-1)&255;
 if(b(-1)!==0)return {memory,globals,phase:'skip' as const,ds,si};
 snapshot();globals[0xc19]=1;
 return {memory,globals,phase:'main' as const,ds:w(-6),si:w(-8)};
}
