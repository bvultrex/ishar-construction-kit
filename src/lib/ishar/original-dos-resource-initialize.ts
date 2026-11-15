/** MAIN77BC..77F5, including813C context table and785F object pool setup.
 * One shared physical memory preserves real-mode segment aliases. A20 wrapping
 * and segment-straddling words remain outside this bounded host contract.
 */
export function initializeOriginalDosResourceRuntime(source:Uint8Array,ss:number,es:number){
 if(source.length!==0x100000||![ss,es].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Expected1MiB physical memory and word segments');
 const memory=source.slice(),u=(n:number)=>n&65535;
 const address=(segment:number,offset:number,wide=false)=>{offset=u(offset);const at=segment*16+offset;if((wide&&offset===65535)||at+(wide?2:1)>memory.length)throw Error('Initialization access outside bounded real-mode window');return at;};
 const byte=(segment:number,offset:number,value:number)=>{memory[address(segment,offset)]=value&255;};
 const word=(segment:number,offset:number,value?:number)=>{const at=address(segment,offset,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=value>>>8;return value&65535;}return memory[at]|(memory[at+1]<<8);};
 for(const at of [0xbce,0xc16,0xc10])word(ss,at,0);
 for(const at of [0xc37,0xc99,0xcb0])byte(ss,at,0);
 byte(ss,0xcb1,255);word(ss,0xba0,65535);
 const table=word(ss,0xbd2);let bx=0,cx=1,tableRecords=0;
 do{
  if(tableRecords>=65536)throw Error('Context table initialization exceeds host step bound');
  bx=u(bx+6);cx=u(cx+1);const si=u(bx+table);
  word(es,si-2,bx);word(es,si-6,0);word(es,si-4,0);tableRecords++;
 }while((cx>=32768?cx-65536:cx)<(word(ss,0xbda)>=32768?word(ss,0xbda)-65536:word(ss,0xbda)));
 word(es,table+4,0);word(ss,0xbdc,1);word(ss,0xbde,6);
 let si=word(ss,0xbe0);const ds=word(ss,0xbe2);word(ss,0xbe8,si);word(ss,0xbea,ds);
 si=u(si+2);word(ss,0xbee,si);word(ds,si+12,0);word(ds,si+14,0);word(ds,si+22,0x13f);word(ds,si+24,0xc7);
 si=u(si+38);byte(ds,si+1,0);word(ss,0x1da9,si);
 si=u(si+38);word(ss,0xcae,si);word(ds,si+12,0);word(ds,si+14,0);byte(ds,si,0xfe);byte(ss,0xcb0,0);
 si=u(si+38);word(ss,0xbec,si);let di=si,links=0;
 while(true){
  if(links>65536)throw Error('Object initialization exceeds host step bound');
  si=u(si+38);if(si>0xffd9)break;
  word(ds,di+4,si);di=si;links++;bx=u((di>>>4)+ds);
  if(bx>=word(ss,0xbe6))break;
 }
 di=u(di-38);word(ds,di+4,0);
 return {memory,tableRecords,links};
}
