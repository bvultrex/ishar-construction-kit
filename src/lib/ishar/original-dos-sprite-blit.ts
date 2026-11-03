import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** Graphics far entry1E97:0008 ->01A8, through clipped format selection.
 * Stops before format-specific pixel code or its original early RET.
 * Input boundary is4305, before the graphics far CALL. No pixel/device stub.
 */
export function prepareOriginalDosSpriteBlit(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,di:number){
 if(source.length!==0x100000||![ss,di,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid sprite blit inputs');
 const memory=source.slice(),u=(v:number)=>v&65535,s=(v:number)=>v&32768?v-65536:v;
 const address=(segment:number,o:number,wide=false)=>{o=u(o);const at=segment*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Sprite blit access outside bounded real-mode window');return at;};
 const b=(segment:number,o:number)=>memory[address(segment,o)];
 const w=(segment:number,o:number,value?:number)=>{const at=address(segment,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const g=(at:number,value?:number)=>w(ss,at,value),pool=input.ds,tableOffset=w(pool,u(di+8)),tableSegment=w(pool,u(di+10));
 let offset=tableOffset,high=w(tableSegment,u(offset+2)),sum=offset+w(tableSegment,offset);if(sum>65535)high=u(high+1);offset=u(sum);
 const paragraph=(high>>>4)|((high&15)<<12),segment=u(tableSegment+paragraph+(offset>>>4)),si=offset&15;
 const registers={...input,ds:segment,es:pool,si},type=b(segment,si),width=w(segment,u(si+2)),height=w(segment,u(si+4));
 const result=(phase:string,entry:number,extra:Record<string,number>={})=>({memory,registers,phase,entry,graphicsSegment:0x1e97,stackDelta:-6,di,...extra});
 const x=w(pool,u(di+12));if(s(x)>s(g(0xc44)))return result('return',0x1f0);
 const y=w(pool,u(di+14));if(s(y)>s(g(0xc46)))return result('return',0x1fc);const right=u(x+width);registers.cx=right;
 if(s(right)<s(g(0xc40)))return result('return',0x209);
 const bottom=u(y+height);registers.dx=bottom;if(s(bottom)<s(g(0xc42)))return result('return',0x216);
 g(0xc2c,x);if(s(x)<s(g(0xc40)))g(0xc2c,g(0xc40));g(0xc2e,y);if(s(y)<s(g(0xc42)))g(0xc2e,g(0xc42));
 g(0xc30,right);if(s(right)>s(g(0xc44)))g(0xc30,g(0xc44));g(0xc32,bottom);if(s(bottom)>s(g(0xc46)))g(0xc32,g(0xc46));
 if(type===127)return result('format',0x749,{type,bx:y,mirror:b(pool,u(di+34))&1});
 const mirror=b(pool,u(di+34))&1,entries:Record<number,number>=mirror?{16:0x5aa,20:0x4bf,0:0x541,18:0x670,22:0x515,2:0x614,1:0x6c2}:{16:0x553,20:0x482,0:0x531,18:0x626,22:0x500,2:0x604,1:0x6c2};
 return result(type in entries?'format':'return',entries[type]??(mirror?0x2dc:0x2a8),{type,bx:y,mirror});
}
