/** Native opcode17:2808..2836, yield exit2D94..2D97.
 * mainMode is raw SS:C19, boundary raw SS:C56. No scheduler body executed.
 */
export function returnOriginalDosScript(context:Uint8Array,bp:number,si:number,mainMode:number,boundary:number){
 if(context.length!==65536||![bp,si,boundary].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||!Number.isInteger(mainMode)||mainMode<0||mainMode>255)throw Error('Invalid native script return inputs');
 const memory=context.slice(),u=(v:number)=>v&65535,w=(at:number)=>memory[u(bp+at)]|(memory[u(bp+at+1)]<<8),write=(at:number,v:number)=>{memory[u(bp+at)]=v&255;memory[u(bp+at+1)]=(v>>>8)&255;},signed=(v:number)=>v>=32768?v-65536:v;
 const stack=w(-10);
 if(mainMode===0&&signed(stack)>=signed(boundary))return {memory,si,phase:'yield' as const};
 const next=w(stack);if(stack===w(-12))write(-12,0);write(-10,u(stack+2));
 return {memory,si:next,phase:'return' as const};
}
