export interface OriginalRenderedCpu {ax:number;bx:number;cx:number;dx:number;di:number;si:number;ds:number;es:number;bp:number;sp:number}
/** Normal43D0 present return through pixel/object/frame saved-register frames.
 * Dirty records, further visible owners and special records stop at real entries.
 * No saved context/register frame is synthesized.
 */
export function finishOriginalDosRenderedFrame(source:Uint8Array,ss:number,input:OriginalRenderedCpu){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535))throw Error('Invalid rendered-frame return');
 const memory=source.slice(),r={...input},u=(x:number)=>x&65535;
 const at=(s:number,o:number,wide=false)=>{o=u(o);const a=s*16+o;if(wide&&o===65535||a+(wide?2:1)>memory.length)throw Error('Frame return access outside physical window');return a;};
 const b=(s:number,o:number,value?:number)=>{const a=at(s,o);if(value!==undefined)memory[a]=value&255;return memory[a];};
 const w=(s:number,o:number,value?:number)=>{const a=at(s,o,true);if(value!==undefined){memory[a]=value&255;memory[a+1]=(value>>>8)&255;}return memory[a]|memory[a+1]<<8;};
 const pop=()=>{const value=w(ss,r.sp);r.sp=u(r.sp+2);return value;};
 const restore=()=>{for(const key of ['bp','es','ds','si','di','dx','cx','bx','ax'] as const)r[key]=pop();};
 const expect=(value:number)=>{if(pop()!==value)throw Error('Unexpected original frame-return caller');};
 const result=(phase:string,entry:number)=>({memory,registers:r,phase,entry,stackDelta:r.sp-input.sp,records,hidden});let records=0,hidden=0;
 expect(0x44f5);restore();expect(0x416b);r.di=r.bx;
 const seen=new Set<number>();
 for(;;){r.bx=r.di;r.di=w(r.ds,u(r.di+w(ss,0xb26))+6);if(r.di===0)break;if(seen.has(r.di))throw Error('Rendered record cycle');seen.add(r.di);records++;b(ss,0xc18,0);const type=b(r.ds,r.di);r.ax=(r.ax&0xff00)|type;if(type===0)continue;b(ss,0xb56,0);b(ss,0xc48,1);return result('dirty-record',type===2?0x409b:type===255?0x4084:0x40b4);}
 restore();expect(0x3de7);const active=new Set<number>();
 for(;;){r.ax=w(r.es,r.bx+4);if(r.ax===0)break;if(active.has(r.ax))throw Error('Rendered active-object cycle');active.add(r.ax);r.bx=u(w(ss,0xbf6)+r.ax);if(b(r.es,r.bx)&64){hidden++;continue;}w(ss,0xb32,r.bx);r.ax=r.es;w(ss,0xb34,r.ax);r.cx=w(r.es,r.bx+2);w(ss,0xb18,r.cx);return result('object',0x3de4);}
 b(ss,0xc49,0);
 if(b(ss,0xc37)===0&&b(ss,0xcb0)!==0){b(ss,0xc18,0);r.di=w(ss,0xbe8);r.ds=w(ss,0xbea);r.di=u(r.di+w(ss,0xcae));r.cx=w(ss,0xbee);const type=b(r.ds,r.di);r.ax=(r.ax&0xff00)|type;if(type!==0&&type!==254)return result('special-record',0x3e24);}
 restore();expect(0x264c);return result('return',0x264c);
}
