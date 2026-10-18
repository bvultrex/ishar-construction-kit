/** Opcode70, native2DED..2E90 including3288 append and32E4 products.
 * DF=0; shared physical memory preserves sequential copy/alias effects.
 * Returns at handler RET or BEFORE error8468; flags/stack bytes are not modeled.
 */
export function createOriginalDosScriptObject(source:Uint8Array,ss:number,registers:{ds:number;es:number;si:number;bx:number;di:number;dx:number}){
 if(source.length!==0x100000||![ss,...Object.values(registers)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word registers');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const addr=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Object access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,v?:number)=>{const at=addr(s,o);if(v!==undefined)memory[at]=v&255;return memory[at];};
 const w=(s:number,o:number,v?:number)=>{const at=addr(s,o,true);if(v!==undefined){memory[at]=v&255;memory[at+1]=(v>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const es=registers.es;let ds=registers.ds,si=registers.si;
 const relative=w(ds,si);si=u(si+2);const bx=u(relative+w(ss,0xbf6));b(es,bx,b(es,bx)|0x40);
 b(es,bx+1,b(ds,si));si=u(si+1);let destination=u(bx+6);
 for(let cx=32;cx>0;cx--){const value=b(ds,si);b(es,destination,value);si=u(si+1);destination=u(destination+1);}
 let di=w(ss,0xbe8);ds=w(ss,0xbea);di=u(di+w(ss,0xbec));
 if(di===0)return {memory,registers:{...registers,ds,si,bx,di,ax:10,cx:0},error:10 as number|null,stackDelta:-6};
 w(ss,0xbec,w(ds,di+4));w(es,bx+2,di);w(ds,di+6,0);w(es,bx+4,0);b(ds,di+1,b(es,bx+1));
 w(ds,di+12,w(es,bx+14)&0xfff0);w(ds,di+14,w(es,bx+16));w(ds,di+16,0x7fff);
 w(ds,di+22,u(w(es,bx+14)+w(es,bx+18))|15);w(ds,di+24,u(w(es,bx+16)+w(es,bx+20)));
 for(const at of [42,44,46])w(es,bx+at,0);
 const root=w(ss,0xbf6),link=u(bx-root);w(es,root+link+4,0);
 let previous=w(ss,0xc16),walks=0;
 if(previous===0)w(ss,0xc16,link);
 else{
  while(true){if(++walks>65536)throw Error('Object chain exceeds host step bound');const next=w(es,previous+root+4);if(next===0)break;previous=next;}
  w(es,previous+root+4,link);
 }
 const s8=(value:number)=>value&128?value-256:value;
 const product=(a:number,c:number)=>u(s8(b(es,bx+a))*s8(b(es,bx+c)));
 let ax=product(36,34),dx=u(product(33,37)-ax);w(es,bx+38,dx);
 // Recompute in native order: destination words deliberately overlap at38/39/40.
 const second=product(34,35);ax=product(37,32);dx=u(second-ax);w(es,bx+39,dx);
 const third=product(32,36);ax=product(35,33);dx=u(third-ax);w(es,bx+40,dx);
 return {memory,registers:{...registers,si,ax,cx:0,dx},error:null,stackDelta:0};
}
