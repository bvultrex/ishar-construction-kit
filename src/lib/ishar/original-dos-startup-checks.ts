/** Original 1000:0902..0952. Stop before RET or the low-memory handler0A6F.
 * DOS text output is an explicit external effect; the handler is not replaced.
 */
export function checkOriginalDosStartup(source:Uint8Array,ss:number,registers:{ax:number;bx:number;dx:number},profile:'ishar1'|'ishar2'){
 if(source.length!==0x100000||ss!==0x1c0b||!Object.values(registers).every(x=>Number.isInteger(x)&&x>=0&&x<=65535))throw Error('Invalid startup check state');
 if(!['ishar1','ishar2'].includes(profile))throw Error('Unknown startup check profile');
 const minimum=profile==='ishar1'?0x67c0:0x6f80;
 const memory=source.slice(),v=new DataView(memory.buffer),g=ss*16,events:Array<Record<string,number|string>>=[];
 let {ax,bx,dx}=registers;
 memory[g+0x2892]=v.getUint16(g+0xc9f,true)<=150?1:0;
 if(memory[g+0x2898]!==0&&memory[g+0xc69]<16){
  memory[g+0xbc0]=0;memory[g+0xbc1]=0;events.push({kind:'cursor',dx:0});
  ax=0x200;bx=0; // F7C preserves DX, returns AH2, BH0.
  ax=(ax&0xff00)|(memory[g+0xc69]===0?0x2a:0x2e);
  events.push({kind:'character',value:ax&255}); // F92 preserves AX/DX.
 }
 ax=(v.getUint16(g+0xb96,true)-v.getUint16(g+0xb92,true))&65535;
 if(ax<=minimum){ax=(ax-minimum)&65535;return {memory,events,registers:{ax,bx,dx},boundary:0xa6f,stackDelta:-2,reason:'low-memory'};}
 return {memory,events,registers:{ax,bx,dx},boundary:0x953,stackDelta:0,reason:'return'};
}
