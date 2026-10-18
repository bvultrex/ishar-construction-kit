import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
/** 72/73 preamble and39F5 resource lookup, through the native type branch.
 * Follows first-child compound recursion; stops before record allocation or FE.
 * Input SI is after the opcode. Five pushed CPU words remain at this boundary.
 */
export function prepareOriginalDosResourceDraw(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode:number,complete=false){
 if(source.length!==0x100000||![ss,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![72,73].includes(opcode))throw Error('Invalid resource draw inputs');
 const memory=source.slice(),u=(v:number)=>v&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Resource draw access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const {ds,es,bp}=input;let si=input.si,dx=input.dx,cx=input.cx;
 const operand=()=>{
  cx=dx;const tag=b(ds,si);si=u(si+1);let value:number;
  if(tag===0){value=b(ds,si);si=u(si+1);dx=value&128?value+65280:value;return dx;}
  if(![2,6,8,30,32].includes(tag))throw Error(`Resource draw numeric tag${tag} is not reconstructed`);
  const raw=w(ds,si);si=u(si+2);
  if(tag===2)dx=raw;
  else{const at=u((tag>=30?w(ss,0xbf6):bp)+raw);if(tag===8||tag===32)dx=w(es,at);else{value=b(es,at);dx=value&128?value+65280:value;}}
  return dx;
 };
 b(ss,0xc15,0);b(ss,0xc12,b(es,u(bp-3)));
 if(opcode===73){for(const at of [0xc02,0xc04,0xc06])w(ss,at,operand());operand();const resource=dx;operand();cx=dx;dx=resource;w(ss,0xc0e,cx);}
 else{operand();for(const at of [0xc02,0xc04,0xc06,0xc0e])w(ss,at,0);}
 b(ss,0xc13,0);
 const entryPointer=()=>{
  let offset=w(es,u(bp-20));const segment=w(es,u(bp-18));
  offset=u(offset+w(segment,u(offset+14)));offset=u(offset+w(segment,offset));offset=u(offset+4*dx);
  return {segment,offset};
 };
 const lookup=()=>{
  let {segment,offset}=entryPointer();
  const relative=w(segment,offset);let high=w(segment,u(offset+2)),sum=offset+relative;offset=u(sum);if(sum>65535)high=u(high+1);
  high=u(((high&255)<<8|(high>>>8))<<4);cx=offset>>>4;
  return {segment:u(segment+high+cx),offset:offset&15};
 };
 if(complete){
  const savedCx=cx,records:number[]=[];let removed=0;
  const signed=(v:number,bits=16)=>v&(1<<(bits-1))?v-(1<<bits):v;
  const selected=()=>w(es,u(bp-22)),group=()=>b(ss,0xc0e);
  const matches=(pool:number,di:number)=>di!==0&&w(pool,u(di+2))===selected()&&b(pool,u(di+1))===group();
  const find=(pool:number)=>{
   let bx=0,di=w(es,u(bp-24));const seen=new Set<number>();
   while(di!==0){
    if(seen.has(di))throw Error('Draw record search cycle');seen.add(di);
    const object=selected(),id=w(pool,u(di+2));
    if(signed(object)<signed(id)||object===id&&signed(group(),8)<signed(b(pool,u(di+1)),8)){bx=di;di=w(pool,u(di+4));continue;}
    return {bx,di,found:object===id&&group()===b(pool,u(di+1))};
   }
   return {bx,di,found:false};
  };
  const remove=(pool:number,bx:number,di:number)=>{
   const next=w(pool,u(di+4));if(bx===0)w(es,u(bp-24),next);else w(pool,u(bx+4),next);
   if(b(ss,0xbf3)===0&&b(pool,di)<128)b(pool,di,1);
   else{
    w(pool,u(di+4),w(ss,0xbec));w(ss,0xbec,di);
    const object=w(pool,u(di+2)),at=u(w(ss,0xbf6)+object+2);let current=w(es,at);
    if(current===di)w(es,at,w(pool,u(di+6)));
    else{
     const seen=new Set<number>();
     while(current!==0&&w(pool,u(current+6))!==di){if(seen.has(current))throw Error('Draw object unlink cycle');seen.add(current);current=w(pool,u(current+6));}
     if(current===0)throw Error('Draw object unlink target absent');w(pool,u(current+6),w(pool,u(di+6)));
    }
   }
   removed++;return bx===0?w(es,u(bp-24)):w(pool,u(bx+4));
  };
  const cleanup=(pool:number)=>{
   if(b(ss,0xc13)!==0)return;
   let {bx,di,found}=find(pool);const seen=new Set<number>();
   while(found){
    if(seen.has(di))throw Error('Draw cleanup cycle');seen.add(di);
    if(b(pool,di)===0){di=remove(pool,bx,di);found=matches(pool,di);}
    else{bx=di;di=w(pool,u(di+4));found=matches(pool,di);}
   }
  };
  const record=()=>{
   const pool=w(ss,0xbea);let {bx,di,found}=find(pool);
   if(b(ss,0xc14)!==0||b(ss,0xc13)!==0){
    const seen=new Set<number>();
    while(found&&b(pool,di)!==0){if(seen.has(di))throw Error('Draw record reuse cycle');seen.add(di);bx=di;di=w(pool,u(di+4));found=matches(pool,di);}
   }
   if(!found){
    const free=w(ss,0xbec);if(free===0)throw Error('Original draw record allocation reaches error10');
    w(ss,0xbec,w(pool,u(free+4)));if(bx===0)w(es,u(bp-24),free);else w(pool,u(bx+4),free);
    w(pool,u(free+4),di);di=free;w(pool,u(di+2),selected());b(pool,u(di+1),group());b(pool,di,255);
    const object=u(selected()+w(ss,0xbf6)),owner=w(es,u(object+2));
    w(pool,u(di+6),w(pool,u(owner+6)));w(pool,u(owner+6),di);
   }else if(b(pool,di)<128)b(pool,di,2);
   const pointer=entryPointer();w(pool,u(di+18),pointer.offset);w(pool,u(di+20),pointer.segment);
   b(pool,u(di+35),b(ss,0xc12));w(pool,u(di+30),w(es,u(bp-42)));
   for(const [destination,sourceOffset] of [[32,-43],[36,-44],[37,-45],[28,-37]])b(pool,u(di+destination),b(es,u(bp+sourceOffset)));
   if(b(pool,u(di+28))<128){
    b(pool,u(di+29),b(es,u(bp-39)));b(pool,u(di+28),b(es,u(bp-38)));
    if(b(pool,u(di+28))>=128){b(pool,u(di+29),0);b(pool,u(di+28),b(es,u(w(ss,0xbf6)+selected()+31)));}
   }
   const coordinates=[0xbfa,0xbfc,0xbfe].map((at,i)=>u(w(ss,at)+w(ss,0xc02+2*i)));
   coordinates.forEach((value,i)=>w(pool,u(di+22+2*i),value));records.push(di);cleanup(pool);b(ss,0xc14,0);
  };
  const path=new Set<string>();
  const visit=(depth:number)=>{
   if(depth>32)throw Error('Compound resource host depth bound');
   const resource=lookup(),type=b(resource.segment,resource.offset);
   if(type===254)throw Error('Original FE draw special path is not reconstructed');
   if(type<128){record();return;}
   const key=`${resource.segment}:${resource.offset}`;if(path.has(key))throw Error('Compound resource cycle');path.add(key);
   const count=b(resource.segment,u(resource.offset+1));
   for(let index=0;index<count;index++){
    const saved=[0xc12,0xc02,0xc04,0xc06].map(at=>w(ss,at)),at=u(resource.offset+2+8*index);
    b(ss,0xc13,1);dx=w(resource.segment,at);let x=w(resource.segment,u(at+2));if(b(ss,0xc12)!==0)x=u(-x);
    w(ss,0xc02,u(w(ss,0xc02)+x));w(ss,0xc04,u(w(ss,0xc04)+w(resource.segment,u(at+4))));w(ss,0xc06,u(w(ss,0xc06)+w(resource.segment,u(at+6))));
    if(dx&0x8000){dx&=0x7fff;b(ss,0xc12,b(ss,0xc12)^1);}
    visit(depth+1);[0xc06,0xc04,0xc02,0xc12].forEach((target,i)=>w(ss,target,saved[3-i]));
   }
   path.delete(key);cleanup(w(ss,0xbea));b(ss,0xc14,0);
  };
  visit(0);
  return {memory,registers:{...input,si,dx,cx:savedCx},phase:'return',entry:0x26f7,stackDelta:0,resourceOffset:0,resourceType:-1,pending:[],records,removed};
 }
 let resource=lookup(),type=b(resource.segment,resource.offset);const pending=[];const seen=new Set<string>();
 while(type>=128&&type!==254){
  const key=`${resource.segment}:${resource.offset}`;if(seen.has(key))throw Error('Compound resource first-child cycle');seen.add(key);
  if(pending.length>=32)throw Error('Compound resource host depth bound');
  const remaining=b(resource.segment,u(resource.offset+1));
  // Native jumps to LOOP before the first body: zero means no children.
  if(remaining===0)return {memory,registers:{...input,ds:resource.segment,si,dx,cx:0},phase:'empty-compound',entry:0x34af,stackDelta:-10-20*pending.length,resourceOffset:resource.offset,resourceType:type,pending};
  pending.push({segment:resource.segment,offset:resource.offset,remaining,flip:w(ss,0xc12),x:w(ss,0xc02),y:w(ss,0xc04),z:w(ss,0xc06)});
  b(ss,0xc13,1);dx=w(resource.segment,u(resource.offset+2));let x=w(resource.segment,u(resource.offset+4));if(b(ss,0xc12)!==0)x=u(-x);
  w(ss,0xc02,u(w(ss,0xc02)+x));w(ss,0xc04,u(w(ss,0xc04)+w(resource.segment,u(resource.offset+6))));w(ss,0xc06,u(w(ss,0xc06)+w(resource.segment,u(resource.offset+8))));
  if(dx&0x8000){dx&=0x7fff;b(ss,0xc12,b(ss,0xc12)^1);}
  resource=lookup();type=b(resource.segment,resource.offset);
 }
 const phase=type<128?'record':'special',entry=phase==='record'?0x3432:0x342f;
 return {memory,registers:{...input,ds:resource.segment,si,dx,cx},phase,entry,stackDelta:-10-20*pending.length,resourceOffset:resource.offset,resourceType:type,pending};
}

/** Complete normal/compound72/73 path; FE and unsupported operands fail atomically. */
export function executeOriginalDosResourceDraw(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,opcode:number){
 return prepareOriginalDosResourceDraw(source,ss,input,opcode,true);
}
