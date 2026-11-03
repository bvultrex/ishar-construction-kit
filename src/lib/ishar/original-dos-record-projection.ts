/** Native36E1..3942, including3955 transform and resource type3 indirection.
 * Updates original projection globals, preserves the caller's register frame.
 * No pixel writes. Division faults and unbounded real-mode accesses throw
 * atomically instead of silently coercing the original arithmetic.
 */
export function projectOriginalDosRecord(source:Uint8Array,ss:number,ds:number,es:number,di:number){
 if(source.length!==0x100000||![ss,ds,es,di].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid projection inputs');
 const memory=source.slice(),u=(v:number)=>v&65535,s=(v:number)=>v&32768?v-65536:v,s8=(v:number)=>v&128?v-256:v;
 const address=(segment:number,o:number,wide=false)=>{o=u(o);const at=segment*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Projection access outside bounded real-mode window');return at;};
 const b=(segment:number,o:number,value?:number)=>{const at=address(segment,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(segment:number,o:number,value?:number)=>{const at=address(segment,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const g=(at:number,value?:number)=>w(ss,at,value),owner=u(g(0xbf6)+w(ds,u(di+2)));
 b(ss,0xc68,b(ds,u(di+35)));
 let ax=u(w(ds,u(di+22))-w(es,u(owner+22))),cx=u(w(ds,u(di+24))-w(es,u(owner+24))),dx=u(w(ds,u(di+26))-w(es,u(owner+26)));
 g(0xb3a,ax);g(0xb1a,ax);g(0xb3e,cx);g(0xb1c,cx);g(0xb1e,dx);
 if(b(es,u(owner+1))<128){const oldCx=cx;cx=u(s8(b(es,u(owner+36)))*s(cx)-dx);dx=oldCx;}
 else{
  g(0xb14,ax);g(0xb1a,ax);g(0xb16,cx);g(0xb18,dx);
  const product=(offset:number,global:number)=>u(s8(b(es,u(owner+offset)))*s(g(global)));
  g(0xb1a,product(32,0xb14));g(0xb1a,u(g(0xb1a)+product(33,0xb16)));g(0xb1a,u(g(0xb1a)+product(34,0xb18)));
  cx=product(35,0xb14);cx=u(cx+product(36,0xb16));cx=u(cx+product(37,0xb18));
  g(0xb12,product(38,0xb14));g(0xb12,u(g(0xb12)+product(39,0xb16)));g(0xb12,u(g(0xb12)+product(40,0xb18)));ax=g(0xb1a);dx=g(0xb12);
 }
 g(0xb1a,ax);g(0xb1c,cx);g(0xb1e,dx);g(0xb18,0);g(0xb12,u(s8(b(es,u(owner+29)))));
 const sar=(value:number,count:number)=>u(s(value)>>(count&31));
 if(b(es,u(owner+29))<128&&b(ds,u(di+28))<128){
  const shifted=(value:number)=>BigInt.asIntN(32,BigInt(s(value))<<BigInt(g(0xb12)));
  const x=shifted(g(0xb1a));g(0xb3a,Number(BigInt.asUintN(16,x)));g(0xb3c,Number(BigInt.asUintN(16,x>>16n)));
  const y=shifted(g(0xb1c));g(0xb3e,Number(BigInt.asUintN(16,y)));g(0xb40,Number(BigInt.asUintN(16,y>>16n)));
  if(g(0xb1e)===0)g(0xb1e,1);
  const divide=(value:bigint)=>{const q=value/BigInt(s(g(0xb1e)));if(q< -32768n||q>32767n)throw Error('Original projection reaches INT0 division fault');return u(Number(q));};
  g(0xb1c,divide(y));g(0xb1a,divide(x));g(0xb18,g(0xb1e));
  g(0xb18,sar(g(0xb18),b(ds,u(di+28))));g(0xb18,u(g(0xb18)+s8(b(ds,u(di+29)))));
  if(s(g(0xb18))<0)g(0xb18,0);
  else{g(0xb20,u(s8(b(es,u(owner+30)))));if(g(0xb18)>g(0xb20))g(0xb18,g(0xb20));g(0xb18,u(g(0xb18)*4));}
 }
 const scale=b(es,u(owner+28));g(0xb1a,sar(g(0xb1a),scale));g(0xb1c,sar(g(0xb1c),scale));g(0xb1a,u(g(0xb1a)+w(es,u(owner+10))));g(0xb1c,u(g(0xb1c)+w(es,u(owner+12))));
 let offset=w(ds,u(di+18)),segment=w(ds,u(di+20));g(0xb12,segment);offset=u(offset+g(0xb18));ax=offset;
 const resolve=(seg:number,at:number)=>{let high=w(seg,u(at+2)),sum=at+w(seg,at);if(sum>65535)high=u(high+1);const low=u(sum),extra=u(((high&255)<<8|(high>>>8))<<4);return {segment:u(seg+extra+(low>>>4)),offset:low&15};};
 let resource=resolve(segment,offset);
 if(b(resource.segment,resource.offset)===3){
  const x=w(resource.segment,u(resource.offset+4));g(0xb1a,u(g(0xb1a)+(b(ds,u(di+35))!==0?-x:x)));g(0xb1c,u(g(0xb1c)+w(resource.segment,u(resource.offset+6))));
  cx=w(resource.segment,u(resource.offset+2));if(b(resource.segment,u(resource.offset+1))!==0)b(ss,0xc68,b(ss,0xc68)^1);
  ax=u(ax+u(cx*4));offset=ax;segment=g(0xb12);resource=resolve(segment,offset);
 }
 let grid=b(ds,u(di+36));
 if(grid!==0){
  if(b(ds,u(di+37))<128){
   ax=g(0xb18)>>>2;const threshold=b(ds,u(di+37));
   if((ax&255)>threshold){
    const denominator=((g(0xb20)&255)-threshold)&255;
    if(denominator!==0&&denominator<128){
     const product=(((ax&255)-threshold)&255)*grid,quotient=Math.trunc(product/denominator),remainder=product%denominator;
     if(quotient>255)throw Error('Original projection reaches INT0 byte division fault');ax=quotient|(remainder<<8);grid=remainder;
    }
   }
  }
  const count=grid&31;g(0xb1a,u((g(0xb1a)>>>count)<<count));
 }
 g(0xc5e,ax);g(0xc60,g(0xb12));g(0xb1a,u(g(0xb1a)-(w(resource.segment,u(resource.offset+2))>>>1)));g(0xb1c,u(g(0xb1c)-(w(resource.segment,u(resource.offset+4))>>>1)));
 g(0xc62,g(0xb1a));g(0xc64,g(0xb1c));g(0xc66,g(0xb1e));
 return {memory,resource,owner};
}
