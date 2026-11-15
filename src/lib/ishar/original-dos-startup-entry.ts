/** Original25E5..25FB and072D..0786 before the configuration far call.
 * PSP command bytes and BIOS video mode come from the supplied shared image.
 * Original SS1C0B/SP0800 and saved register frame are retained.
 */
export function enterOriginalDosStartup(source:Uint8Array,registers:{bx:number;cx:number;dx:number;di:number;si:number;ds:number;es:number;bp:number}){
 if(source.length!==0x100000||!Object.values(registers).every(x=>Number.isInteger(x)&&x>=0&&x<=65535)||registers.ds*16+0x180>source.length)throw Error('Invalid original startup entry state');
 const memory=source.slice(),v=new DataView(memory.buffer),g=0x1c0b0;
 let sp=0x800;for(const value of [0x1c0b,registers.bx,registers.cx,registers.dx,registers.di,registers.si,registers.ds,registers.es,registers.bp]){sp-=2;v.setUint16(g+sp,value,true);}v.setUint16(g+0xb6a,sp,true);v.setUint16(g+sp-2,0x25ff,true); // CALL072D return address.
 let bx=registers.bx,cx=registers.cx,ax=0x1c0b;const p=registers.ds*16,length=memory[p+0x80];
 // JL uses signed8-bit length. Bytes>=80h therefore bypass parsing.
 if(length>=2&&length<128){bx=0x82;cx=(cx&0xff00)|length;
  for(;;){cx=(cx&0xff00)|((cx-1)&255);if((cx&255)===0)break;
   let al=memory[p+bx];bx=(bx+1)&65535;
   // CMP AL,60h / JL is signed:80h..FFh do not uppercase.
   if(al>=0x60&&al<128)al=(al-32)&255;
   ax=(ax&0xff00)|al;
   const flag=al===0x53?0xca2:al===0x4d?0xca3:al===0x41?0xca4:al===0x4a?0xca1:null;
   if(flag!==null)memory[g+flag]=1;
  }
 }
 ax=memory[0x449];memory[g+0x289a]=ax;
 return {memory,registers:{...registers,ax,bx,cx,ss:0x1c0b,sp:sp-2},directionFlag:false,boundary:0x787};
}

/** Original RET0953 to25FF, then far8DBE/8DE3 record reset, before CALL7641.
 * Caller stack mechanics are checked in the contiguous native harness.
 */
export function finishOriginalDosStartupCaller(source:Uint8Array){
 if(source.length!==0x100000)throw Error('Invalid startup caller memory');
 const memory=source.slice(),g=0x1c0b0,v=new DataView(memory.buffer);
 // Far CALL25FF leaves its CS word at07EC after RETF; entry saves start07EE.
 v.setUint16(g+0x7ec,0x1000,true);
 for(const at of [0x1dfd,0x1e0d,0x1e1d,0x1e2d]){memory[g+at]=0;memory[g+at+2]=0;memory[g+at+1]=128;v.setUint16(g+at+6,0,true);memory[g+at+10]=0;}
 return {memory,boundary:0x2604,di:0x1e2d};
}
