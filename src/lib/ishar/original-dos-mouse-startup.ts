/** Original08F9 ->11C3..1242, with explicit INT33 reset response.
 * Records driver calls only; no host cursor/device or delivered mouse callback.
 * The callback data segment1C0B is literal in these captured binaries.
 */
export function initializeOriginalDosMouseStartup(source:Uint8Array,ss:number,resetAX:number){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+65536>source.length||!Number.isInteger(resetAX)||resetAX<0||resetAX>65535)throw Error('Invalid mouse startup state');
 const memory=source.slice(),g=ss*16,v=new DataView(memory.buffer),events:Array<Record<string,number>>=[];
 const result=(phase:'skip'|'absent'|'present',callbackRegistered=false)=>{memory[g+0xcb1]=255;return {memory,events,phase,callbackRegistered,boundary:0x8fc};};
 if(memory[g+0xca3]!==0)return result('skip');
 memory[g+0xca3]=1;events.push({interrupt:0x33,ax:0});if(resetAX===0)return result('absent');
 events.push({interrupt:0x33,ax:15,cx:16,dx:32});v.setUint16(g+0xcaa,0x2780,true);v.setUint16(g+0xcac,0x1c0b,true);
 const callback=memory[g+0x2896]===1;
 if(callback)events.push({interrupt:0x33,ax:4,cx:160,dx:100},{interrupt:0x33,ax:7,cx:0,dx:319},{interrupt:0x33,ax:8,cx:0,dx:199},{interrupt:0x33,ax:15,cx:32,dx:32},{interrupt:0x33,ax:12,cx:63,dx:0x1249,es:0x1000});
 memory[g+0xca3]=0;v.setUint16(g+0xc9d,v.getUint16(g+0xc9d,true)|4,true);
 return result('present',callback);
}
