/** Original264C/264F..26AF and3C76 using instruction-order physical accesses.
 * Segment windows may alias; word straddles/A20 remain outside this contract.
 */
export function prepareOriginalDosSharedScheduler(source:Uint8Array,ss:number,es:number,input:{bp:number;si:number;bx:number;ds:number},reload:boolean){
 if(source.length!==0x100000||![ss,es,...Object.values(input)].every(x=>Number.isInteger(x)&&x>=0&&x<=65535))throw Error('Invalid physical scheduler state');
 const memory=source.slice(),u=(x:number)=>x&65535;
 const address=(s:number,o:number,wide=false)=>{o=u(o);const at=s*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('Scheduler access outside bounded real-mode window');return at;};
 const b=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const w=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 let {bp,si,bx,ds}=input;if(reload)bp=w(es,bx+si);
 b(ss,0xc96,0);b(ss,0xc19,0);const flag=b(es,bp-36);
 const snapshot=()=>{for(let at=0;at<8;at+=2)w(ss,0xbfa+at,w(es,bp+at));};
 if((flag&128)!==0&&(flag&2)===0){si=w(es,bp-20);ds=w(es,bp-18);bx=w(ds,si+10);
  if(bx!==0){si=u(bx+si+10);w(ss,0xc56,w(es,bp-10));snapshot();return result('scan');}
 }
 const active=b(es,bp-4);if(active===0)return result('skip');if(active&128)b(es,bp-4,1);
 b(es,bp-1,b(es,bp-1)-1);if(b(es,bp-1)!==0)return result('skip');
 snapshot();si=w(es,bp-8);ds=w(es,bp-6);b(ss,0xc19,b(ss,0xc19)+1);return result('main');
 function result(phase:'scan'|'skip'|'main'){return {memory,bp,si,bx,ds,es,phase,entry:phase==='skip'?0x2632:0x26eb,stackDelta:phase==='skip'?0:-2};}
}
