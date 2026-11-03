/** Native graphics 1E97:0EC9..0F29. Raw 768 channel bytes, not RGBA/CSS.
 * Separate from the ALIS-C reference's floating-point transition model.
 */
export function stepOriginalDosPalette(current: Uint8Array, target: Uint8Array, step: number) {
  if(current.length!==768||target.length!==768||!Number.isInteger(step)||step<0||step>255)throw new Error('Expected two native 768-byte palettes and byte step');
  const bytes=Uint8Array.from(current),signed=(v:number)=>v<128?v:v-256;
  let active=0;
  for(let i=0;i<768;i++){
    if(target[i]===current[i])continue;
    active=1;
    if(signed(target[i])>signed(current[i])){
      const value=(current[i]+step)&255;bytes[i]=signed(value)<signed(target[i])?value:target[i];
    }else{
      const value=(current[i]-step)&255;bytes[i]=signed(value)>signed(target[i])?value:target[i];
    }
  }
  return {bytes,active};
}
