export interface OriginalDosOpenRegisters {ax:number;bx:number;cx:number;dx:number;ds:number}
export interface OriginalDosOpenResponse {ax:number;carry:boolean;dx?:number}
export type OriginalDosOpenRequest=OriginalDosOpenRegisters&{operation:'find-first'|'create'|'open'|'seek';drive:number|null};
/** Full1F97..2060 +2064 +20EA control flow for identified captures.
 * Explicit DOS response boundary: CX/BX/DS preserved; seek may return DX.
 * No actual filesystem writes, DTA implementation, or error-handler execution.
 */
export function openOriginalDosFile(globals:Uint8Array,input:OriginalDosOpenRegisters,dos:(request:OriginalDosOpenRequest)=>OriginalDosOpenResponse){
 if(globals.length!==65536||!Object.values(input).every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected globals and word registers');
 const memory=globals.slice(),r={...input},events:Array<OriginalDosOpenRequest|{operation:'select-drive';drive:number}>=[];let drive:number|null=null;
 const put=(at:number,value:number)=>{memory[at]=value&255;memory[at+1]=value>>>8;};
 const select=(value:number)=>{drive=value;events.push({operation:'select-drive',drive:value});};
 const invoke=(operation:OriginalDosOpenRequest['operation'],ax:number)=>{
  const request={...r,ax,operation,drive},response=dos({...request});
  if(!Number.isInteger(response.ax)||response.ax<0||response.ax>65535||typeof response.carry!=='boolean'||(response.dx!==undefined&&(!Number.isInteger(response.dx)||response.dx<0||response.dx>65535)))throw Error('Invalid explicit DOS response');
  events.push(request);r.ax=response.ax;if(operation==='seek'&&response.dx!==undefined)r.dx=response.dx;return response.carry;
 };
 const find=()=>{
  r.cx=0;let carry=invoke('find-first',0x4e00|(r.ax&255));
  if(carry&&memory[0x289b]===1){select(memory[0x289d]);carry=invoke('find-first',0x4e00|(r.ax&255));if(carry)select(memory[0x289c]);}
  return carry;
 };
 const finish=(error:number|null)=>({memory,registers:{...r},events,drive,error,phase:error===null?'return' as const:'error' as const,stackDelta:error===8?-2:error===null?2:0});
 const create=()=>{
  r.ax=0;if(memory[0x289b]===1)select(memory[0x289d]);r.cx=0;
  const carry=invoke('create',0x3c00);put(0xbbe,r.ax);if(carry){r.ax=8;return finish(8);}return finish(null);
 };
 if((r.ax&0x200)!==0&&find())return create();
 if((r.ax&0x400)!==0&&!find())return create();
 if(memory[0x289b]===1)select(memory[0x289c]);
 const open=()=>{
  put(0x28a4,r.dx);put(0x28a6,r.ds);const saved=r.ax,carry=invoke('open',0x3d02);put(0xbbe,r.ax);r.ax=saved;return carry;
 };
 if(open()){
  if(memory[0x289b]!==1){r.ax=1;return finish(1);}
  select(memory[0x289d]);if(open()){select(memory[0x289c]);r.ax=1;return finish(1);}
 }
 if((r.ax&0x800)!==0){const saved=r.ax,carry=invoke('seek',0x4202);r.ax=saved;if(carry){r.ax=1;return finish(1);}}
 return finish(null);
}
