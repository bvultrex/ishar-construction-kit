/** Native 1000:185E..1B9D, normal SS:2896=0 conversion only.
 * Shared physical memory includes code scratch and segment aliases. Stack save
 * bytes/flags are outside this API; all nine saved registers are preserved.
 * Requires the native forward-string (DF=0) entry contract. Alternate 1B9E
 * conversion and A20/straddling word accesses are not supported.
 */
export function prepareOriginalDosResourceGraphics(source:Uint8Array,ss:number,cs:number,moduleSegment:number,moduleOffset:number){
 if(source.length!==0x100000||![ss,cs,moduleSegment,moduleOffset].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB memory and word segments/offset');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Graphics access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,v?:number)=>{const at=address(s,o);if(v!==undefined)memory[at]=v&255;return memory[at];};
 const w=(s:number,o:number,v?:number)=>{const at=address(s,o,true);if(v!==undefined){memory[at]=v&255;memory[at+1]=(v>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const signed=(v:number)=>v&0x8000?v-65536:v;
 const relative=(s:number,o:number,lo:number,hi:number)=>{const sum=o+lo,off=u(sum),high=u(hi+(sum>65535?1:0));return {s:u(s+((high>>>4)|((high&15)<<12))+(off>>>4)),o:off&15};};
 let resource=relative(moduleSegment,moduleOffset,w(moduleSegment,moduleOffset+14),w(moduleSegment,moduleOffset+16));
 w(ss,0xb16,u(w(resource.s,resource.o+4)-1));
 if(signed(w(ss,0xb16))<0)return {memory,assets:0,groups:0};
 if(b(ss,0x2896)!==0)throw Error('Alternate graphics conversion1B9E is not reconstructed');
 let list=relative(resource.s,resource.o,w(resource.s,resource.o),w(resource.s,resource.o+2));
 const palette=relative(resource.s,resource.o,w(resource.s,resource.o+18),w(resource.s,resource.o+20));
 const es=palette.s,di=u(palette.o+32);b(cs,0x1851,0);
 for(let n=0;n<16;n++)w(es,di+n*2,w(es,di+n*2)&0xf0f);
 w(cs,0x1858,w(es,di));let assets=0,groups=0;
 do{
  if(assets>=65536)throw Error('Graphics asset host bound exceeded');
  const asset=relative(list.s,list.o,w(list.s,list.o),w(list.s,list.o+2));const ds=asset.s;let si=asset.o;
  if(b(cs,0x1851)!==0)throw Error('Aliased graphics mode requires unsupported1B9E conversion');
  b(cs,0x1850,0);b(cs,0x1853,0);b(cs,0x1852,0);
  const type=b(ds,si);
  if(type===1){
   w(es,di,w(cs,0x1858));let index=b(ds,si+1);
   if(index>=16)index=b(es,di+64+index)>>>4;
   b(ds,si+1,b(es,di+index*2));
  }else if([0,2,0x10,0x12,0x14,0x16].includes(type)){
   if(type===0||type===0x10||type===0x14){if(type!==0)b(ds,si,0);w(es,di,0);}
   else{
    b(ds,si,2);b(cs,0x1850,1);
    if(type===0x12&&b(ds,si+4)===0x74){b(ds,si,0);b(cs,0x1850,0);}
    w(es,di,w(cs,0x1858));
   }
   if(type>=0x10)b(cs,0x1852,1);
   if(type===0x14||type===0x16)b(cs,0x1853,1);
   let ax=u((u(w(ds,si+2)+1)>>>2)-1);w(ss,0xb20,w(ds,si+4));w(ss,0xb1e,ax);
   si=u(si+8);let bp=si;
   if(b(cs,0x1852)!==0){if(b(cs,0x1853)===0)b(cs,0x1854,b(ds,si));si=u(si+2);}
   w(ss,0xb42,ax);
   do{
    w(ss,0xb1e,w(ss,0xb42));
    do{
     if(++groups>4000000)throw Error('Graphics conversion host bound exceeded');
     let dx=0;
     if(b(cs,0x1853)===0){const value=w(ds,si);si=u(si+2);ax=((value&255)<<8)|(value>>>8);}
     for(let cx=4;cx>0;cx--){
      let bl:number;
      if(b(cs,0x1853)!==0){bl=b(ds,si);si=u(si+1);bl=(b(es,di+64+bl)>>>3)&30;}
      else{
       bl=(ax>>>11)&30;
       if(b(cs,0x1852)!==0){bl>>>=1;if(bl!==0)bl=(bl+b(cs,0x1854))&255;bl=(b(es,di+64+bl)>>>3)&30;}
      }
      if(cx&1)bl|=1;if(w(ss,0xb20)&1)bl^=1;
      dx=u((dx<<2)|(b(es,di+bl)<<8));if((bl&30)===0)dx|=3;
      if(cx>1&&b(cs,0x1853)===0)ax=u(ax<<4);
     }
     if(b(cs,0x1850)===0){w(ds,bp,dx);bp=u(bp+2);}else{b(ds,bp,dx>>>8);bp=u(bp+1);}
     w(ss,0xb1e,u(w(ss,0xb1e)-1));
    }while(signed(w(ss,0xb1e))>=0);
    w(ss,0xb20,u(w(ss,0xb20)-1));
   }while(signed(w(ss,0xb20))>=0);
  }
  assets++;list.o=u(list.o+4);w(ss,0xb16,u(w(ss,0xb16)-1));
 }while(signed(w(ss,0xb16))>=0);
 return {memory,assets,groups};
}
