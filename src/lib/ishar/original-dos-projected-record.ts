import type {OriginalDosPhysicalScriptRegisters} from './original-dos-physical-script.ts';
function access(source:Uint8Array,ss:number,ds:number,di:number){
 if(source.length!==0x100000||![ss,ds,di].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid projected record inputs');
 const memory=source.slice(),u=(v:number)=>v&65535,s=(v:number)=>v&32768?v-65536:v;
 const address=(segment:number,o:number,wide=false)=>{o=u(o);const at=segment*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Projected record access outside bounded real-mode window');return at;};
 const b=(segment:number,o:number,value?:number)=>{const at=address(segment,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(segment:number,o:number,value?:number)=>{const at=address(segment,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 const bounds=()=>{
  if(s(w(ds,u(di+16)))<0)return;
  let offset=w(ds,u(di+8));const segment=w(ds,u(di+10));let high=w(segment,u(offset+2)),sum=offset+w(segment,offset);if(sum>65535)high=u(high+1);offset=u(sum);
  const extra=u(((high&255)<<8|(high>>>8))<<4),imageSegment=u(segment+extra+(offset>>>4)),imageOffset=offset&15;
  let value=w(ds,u(di+12));if(s(value)<=s(w(ss,0xc2c)))w(ss,0xc2c,value);value=u(value+w(imageSegment,u(imageOffset+2)));if(s(value)>=s(w(ss,0xc30)))w(ss,0xc30,value);
  value=w(ds,u(di+14));if(s(value)<=s(w(ss,0xc2e)))w(ss,0xc2e,value);value=u(value+w(imageSegment,u(imageOffset+4)));if(s(value)>=s(w(ss,0xc32)))w(ss,0xc32,value);
 };
 return {memory,u,s,b,w,bounds};
}
/**4197 merges the original signed dirty rectangle, without touching pixels. */
export function mergeOriginalDosRecordBounds(source:Uint8Array,ss:number,ds:number,di:number){const a=access(source,ss,ds,di);a.bounds();return {memory:a.memory};}

/**40DC..4114 including4197/4278. Input is after36E1 has returned.
 * Removes the record from its old +6 chain and reinserts by original signed
 * depth/priority/group ordering. Six script registers stay unchanged; DI=BX.
 */
export function finishOriginalDosProjectedRecord(source:Uint8Array,ss:number,input:OriginalDosPhysicalScriptRegisters,bx:number,di:number){
 if(![bx,...Object.values(input)].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid projected record registers');
 const {memory,u,s,b,w,bounds}=access(source,ss,input.ds,di),ds=input.ds;
 w(ds,u(bx+6),w(ds,u(di+6)));
 for(const [from,to] of [[0xc5e,8],[0xc60,10],[0xc62,12],[0xc64,14],[0xc66,16]])w(ds,u(di+to),w(ss,from));b(ds,u(di+34),b(ss,0xc68));bounds();
 const depth=w(ds,u(di+16)),priority=b(ds,u(di+32)),group=b(ds,u(di+1)),s8=(v:number)=>v&128?v-256:v;
 let previous=input.cx,next=0;const seen=new Set<number>();
 while(true){
  next=w(ds,u(previous+6));if(next===0)break;if(seen.has(next))throw Error('Projected record insertion cycle');seen.add(next);
  if(b(ds,next)>=128){previous=next;continue;}
  const otherDepth=w(ds,u(next+16)),otherPriority=b(ds,u(next+32)),otherGroup=b(ds,u(next+1));
  if(s(depth)<s(otherDepth)||depth===otherDepth&&(s8(priority)<s8(otherPriority)||priority===otherPriority&&(s8(group)<s8(otherGroup)||group===otherGroup&&b(ds,di)!==255))){previous=next;continue;}
  break;
 }
 w(ds,u(di+6),next);w(ds,u(previous+6),di);b(ds,di,0);
 return {memory,registers:{...input},di:bx,bx};
}

/**4115..412C: merge old bounds, unlink from +6, return to BEC free chain. */
export function retireOriginalDosProjectedRecord(source:Uint8Array,ss:number,ds:number,bx:number,di:number){
 if(!Number.isInteger(bx)||bx<0||bx>65535)throw Error('Invalid record predecessor');
 const {memory,u,w,bounds}=access(source,ss,ds,di);bounds();w(ds,u(bx+6),w(ds,u(di+6)));w(ds,u(di+4),w(ss,0xbec));w(ss,0xbec,di);return {memory,di:bx};
}
