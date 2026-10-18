import {stepOriginalDosPaletteFade} from './original-dos-palette-control.ts';
/** Original VGA0EA8..0EC8,0BDB..0C3B and optional far0EC9 pass.
 * IRQ caller supplies DS/SS1C0B and DF0; no timing/device reply is inferred.
 */
export function stepOriginalDosVgaPaletteIrq(source:Uint8Array,r:{ax:number;interruptFlag:boolean;retraceReads:readonly number[]}){
 if(source.length!==0x100000||!Number.isInteger(r.ax)||r.ax<0||r.ax>65535||typeof r.interruptFlag!=='boolean'||!r.retraceReads.every(x=>Number.isInteger(x)&&x>=0&&x<=255))throw Error('Invalid VGA palette IRQ state');
 let memory=source.slice(),ax=r.ax,interruptFlag=r.interruptFlag,retraceReplies=0,changed=0;const g=0x1c0b0,events:Array<{kind:string;port:number;value:number}>=[];
 if(memory[g+0xcb9]===1)return {memory,ax,interruptFlag,events,retraceReplies,changed,fade:false};
 if(memory[g+0xc69]===1){for(;;){if(retraceReplies===r.retraceReads.length)throw Error('Palette upload requires another retrace reply');const value=r.retraceReads[retraceReplies++];events.push({kind:'in',port:0x3da,value});if(value&8)break;}}
 ax=0x1c0b;
 for(let index=0;index<256;index++){
  const from=g+0xe43+index*3,to=g+0x1143+index*3;
  if(memory[from]===memory[to]&&memory[from+1]===memory[to+1]&&memory[from+2]===memory[to+2])continue;
  changed++;events.push({kind:'out',port:0x3c8,value:index});
  const red=memory[from],green=memory[from+1];events.push({kind:'out',port:0x3c9,value:red});memory[to]=red;memory[to+1]=green;events.push({kind:'out',port:0x3c9,value:green});
  const blue=memory[from+2];memory[to+2]=blue;events.push({kind:'out',port:0x3c9,value:blue});ax=(green<<8)|blue;interruptFlag=true;
 }
 memory[g+0xcbd]=(memory[g+0xcbd]-1)&255;let fade=false;
 if(memory[g+0xcbd]&128){memory[g+0xcbd]=memory[g+0xcbc];ax=(ax&0xff00)|memory[g+0xcbc];memory[g+0xcb8]=0;memory=stepOriginalDosPaletteFade(memory).memory;fade=true;}
 return {memory,ax,interruptFlag,events,retraceReplies,changed,fade};
}
