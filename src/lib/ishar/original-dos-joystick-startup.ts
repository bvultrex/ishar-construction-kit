/** Original 1000:10CC..1136 and axis measurement 13F1..1423.
 * Finite explicit port replies; no wall-clock or synthetic axis defaults.
 */
export function initializeOriginalDosJoystick(source:Uint8Array,ss:number,replies:readonly number[],initialBx:number){
 if(source.length!==0x100000||ss!==0x1c0b||!Number.isInteger(initialBx)||initialBx<0||initialBx>65535||!replies.every(x=>Number.isInteger(x)&&x>=0&&x<=255))throw Error('Invalid joystick startup state');
 const memory=source.slice(),v=new DataView(memory.buffer),g=ss*16,events:Array<{kind:string;port:number;value:number}>=[];let index=0,ax=0,bx=initialBx,cx=200;
 const read=()=>{if(index===replies.length)throw Error('Joystick requires another port reply');const value=replies[index++];events.push({kind:'in',port:0x201,value});return value;};
 const high=read()&0xf0;ax=(high<<8)|high;
 for(;;){const value=read()&0xf0;ax=(high<<8)|value;if(value!==high)return result();cx=(cx-1)&65535;if(cx===0)break;}
 ax=(ax&0xff00)|((~ax)&255);if(ax&0x30)return result();
 const axis=(mask:number)=>{bx=(bx&0xff00)|mask;let count=0,value=0;
  do{value=read();count=(count-1)&65535;}while((value&mask)!==0&&count!==0);
  if(count===0)return 65535;
  events.push({kind:'out',port:0x201,value});count=0;
  do{value=read();count=(count-1)&65535;}while((value&mask)!==0&&count!==0);
  return count===0?65535:(-count)&65535;
 };
 ax=axis(1);if(ax!==65535){v.setUint16(g+0x2886,ax,true);ax=axis(2);if(ax!==65535){v.setUint16(g+0x2888,ax,true);v.setUint16(g+0xc9d,v.getUint16(g+0xc9d,true)|1,true);}else memory[g+0x288a]=0;}else memory[g+0x288a]=0;
 ax=axis(4);if(ax!==65535){ax=axis(8);if(ax!==65535)v.setUint16(g+0xc9d,v.getUint16(g+0xc9d,true)|2,true);else memory[g+0x288b]=0;}else memory[g+0x288b]=0;
 return result();
 function result(){return {memory,events,repliesConsumed:index,registers:{ax,bx,cx,dx:0x201},boundary:0x902};}
}
