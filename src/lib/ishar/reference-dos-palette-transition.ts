import {describeAlisPalettes} from './alis-assets.ts';
/** Separate ALIS-C reference model (image.c topalette/topalet), not a proven
 * original DOS fade. RGBA slots hold reference channel bytes, not CSS colors. */
export function referenceDosPaletteTarget(image:Uint8Array,index:number,previous:Uint8Array):Uint8Array{
 if(previous.length!==1024)throw Error('Expected 256 RGBA palette slots');
 const resource=describeAlisPalettes(image).find(p=>p.entryIndex===index);if(!resource)throw Error('Missing original palette resource');
 const target=previous.slice();resource.colors.forEach((rgb,i)=>{
  const at=(resource.firstColor+i)*4;
  for(let channel=0;channel<3;channel++)target[at+channel]=resource.encoding==='dos-packed16'?rgb[channel]!<<5:rgb[channel]!;
  if(resource.encoding==='dos-packed16')target[at+3]=0;
 });return target;
}
export class ReferenceDosPaletteTransition {
 private current:Uint8Array;private target:Uint8Array;private delta=new Float32Array(1024);private remaining=0;
 constructor(initial:Uint8Array){if(initial.length!==1024)throw Error('Expected 256 RGBA palette slots');this.current=initial.slice();this.target=initial.slice();}
 start(target:Uint8Array,duration:number){
  if(target.length!==1024||!Number.isInteger(duration)||duration<0||duration>255)throw Error('Unsupported reference palette transition');
  this.target=target.slice();this.remaining=duration;
  if(duration===0){this.current.set(this.target);return;}
  for(let i=0;i<1024;i++)this.delta[i]=Math.fround((this.current[i]!-this.target[i]!)/duration);
 }
 /** One eligible reference interrupt step, not an assumed browser frame/ms. */
 tick():{palette:Uint8Array;remaining:number}{
  if(this.remaining===1)this.current.set(this.target);
  else if(this.remaining>1)for(let i=0;i<1024;i++)if(this.current[i]!==this.target[i])this.current[i]=Math.trunc(Math.fround(this.target[i]!+Math.fround(this.delta[i]!*this.remaining)))&255;
  if(this.remaining>0)this.remaining--;return this.snapshot();
 }
 snapshot():{palette:Uint8Array;remaining:number}{return {palette:this.current.slice(),remaining:this.remaining};}
}
