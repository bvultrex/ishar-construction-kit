/** Graphics 1E97:0BDB..0C3B. Raw DAC bytes and I/O orders, no host hardware. */
export function planOriginalDosPaletteUpload(current: Uint8Array, shadow: Uint8Array, retraceMode: number, retraceReady: boolean, interruptsEnabled: boolean) {
  if(current.length!==768||shadow.length!==768||!Number.isInteger(retraceMode)||retraceMode<0||retraceMode>255||typeof retraceReady!=='boolean'||typeof interruptsEnabled!=='boolean')throw new Error('Invalid native palette upload state');
  const bytes=Uint8Array.from(shadow),ports:{port:number;value:number}[]=[];
  if(retraceMode===1&&!retraceReady)return {shadow:bytes,ports,interruptsEnabled,exit:'wait-retrace' as const};
  for(let index=0;index<256;index++){
    const at=index*3;
    if(current[at]===shadow[at]&&current[at+1]===shadow[at+1]&&current[at+2]===shadow[at+2])continue;
    ports.push({port:0x3c8,value:index});
    for(let channel=0;channel<3;channel++){const value=current[at+channel];ports.push({port:0x3c9,value});bytes[at+channel]=value;}
    interruptsEnabled=true; // Native CLI before writes, STI after each changed color.
  }
  return {shadow:bytes,ports,interruptsEnabled,exit:'returned' as const};
}
