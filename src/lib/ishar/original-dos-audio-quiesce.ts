/** 8ADB..8B6C: audio quiesce before DOS access, NOT a drive dialog.
 * Native no-device/internal sample-timer branches. External driver2209 and
 * active Sound Blaster92E0 remain explicit boundaries.
 */
export function quiesceOriginalDosAudio(source:Uint8Array,segment:number,port61?:()=>number){
 if(source.length!==0x100000||!Number.isInteger(segment)||segment<0||segment*16+65536>source.length)throw Error('Invalid audio-quiesce memory');
 const memory=source.slice(),g=segment*16,events:Array<{kind:string;port:number;value:number}>=[];
 const w=(o:number)=>memory[g+o]|memory[g+o+1]<<8;
 const put=(o:number,v:number)=>{memory[g+o]=v&255;memory[g+o+1]=v>>>8;};
 const mode=memory[g+0xe940];if(mode===0)return {memory,events};
 put(0x8909,0);put(0x890b,0x893d);memory[g+0x8947]=0;
 if(memory[g+0xe93e]!==1)throw Error('Original external audio driver1941:2209 is not reconstructed');
 if(mode===2){
  if(memory[g+0x86c1]===0&&memory[g+0xceba]!==0)throw Error('Original active Sound Blaster stop92E0 is not connected');
  return {memory,events};
 }
 if(memory[g+0x86c3]===0)return {memory,events};
 if(!port61)throw Error('Active sample stop requires explicit port61 reply');
 const value=port61();if(!Number.isInteger(value)||value<0||value>255)throw Error('Invalid port61 reply');
 events.push({kind:'out',port:0x43,value:0x36},{kind:'out',port:0x40,value:w(0x86de)&255},{kind:'out',port:0x40,value:w(0x86de)>>>8},{kind:'in',port:0x61,value},{kind:'out',port:0x61,value:value&252});
 memory[0x20]=memory[g+0x86da];memory[0x21]=memory[g+0x86db];memory[0x22]=memory[g+0x86dc];memory[0x23]=memory[g+0x86dd];
 memory[g+0xceba]=0;memory[g+0x8947]=0;memory[g+0xcebb]=128;memory[g+0x86c3]=0;
 return {memory,events};
}
