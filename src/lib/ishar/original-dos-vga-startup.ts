export interface OriginalDosVgaReplies {
 biosWrites:Array<{address:number;data:Uint8Array}>;
 vectorOffset:number;vectorSegment:number;crtData:number;picMask:number;miscRead:number;retraceRead:number;
 irq0A:'none';
}
/** Engine 1EBA..1F0A with the VGA graphics module selected.
 * Graphics000C calls RET at01A7 in this module; other video modules are excluded.
 */
export function initializeOriginalDosVgaViewport(source:Uint8Array,ss:number,graphicsSegment:number,replies:OriginalDosVgaReplies){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+0x1dd7>source.length)throw Error('Invalid VGA viewport memory');
 const staged=source.slice(),view=new DataView(staged.buffer),base=ss*16;
 for(const [offset,value] of [[0x1dcd,0],[0x1dcf,0],[0x1dd1,319],[0x1dd3,199],[0x1dd5,80]])view.setUint16(base+offset,value,true);
 const result=initializeOriginalDosVgaStartup(staged,ss,graphicsSegment,replies),output=new DataView(result.memory.buffer);
 for(const [offset,value] of [[0xc1a,0],[0xc1c,0],[0xc1e,319],[0xc20,199],[0xc22,80]])output.setUint16(base+offset,value,true);
 return result;
}
/** Graphics0000 ->0CC0 including0D51/0E0C, no delivered IRQ0A case.
 * BIOS memory patches and port/DOS replies are mandatory external inputs.
 * IN repetitions are recorded compactly; no real BIOS/device is invoked.
 */
export function initializeOriginalDosVgaStartup(source:Uint8Array,ss:number,graphicsSegment:number,replies:OriginalDosVgaReplies){
 if(source.length!==0x100000||![ss,graphicsSegment,replies.vectorOffset,replies.vectorSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)||![replies.crtData,replies.picMask,replies.miscRead,replies.retraceRead].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||replies.irq0A!=='none')throw Error('Invalid/unsupported VGA startup replies');
 const memory=source.slice(),u=(v:number)=>v&65535,events:Array<Record<string,number|string>>=[];
 const address=(segment:number,o:number,wide=false)=>{o=u(o);const at=segment*16+o;if(wide&&o===65535||at+(wide?2:1)>memory.length)throw Error('VGA startup access outside bounded real-mode window');return at;};
 const byte=(s:number,o:number,value?:number)=>{const at=address(s,o);if(value!==undefined)memory[at]=value&255;return memory[at];};
 const word=(s:number,o:number,value?:number)=>{const at=address(s,o,true);if(value!==undefined){memory[at]=value&255;memory[at+1]=(value>>>8)&255;}return memory[at]|memory[at+1]<<8;};
 events.push({kind:'interrupt',number:16,ax:0x13});
 for(const patch of replies.biosWrites){if(!Number.isInteger(patch.address)||patch.address<0||patch.address+patch.data.length>memory.length)throw Error('BIOS patch outside bounded memory');memory.set(patch.data,patch.address);}
 word(ss,0xb86,0xa000);word(ss,0xb84,0);const crt=word(0x40,0x63);word(graphicsSegment,0x38,crt);
 const out=(port:number,width:number,value:number)=>events.push({kind:'out',port,width,value});
 const read=(port:number,value:number,repeat=1)=>events.push({kind:'in',port,width:1,value,repeat});
 out(crt,1,byte(graphicsSegment,0x3c));read(u(crt+1),replies.crtData);byte(graphicsSegment,0x3d,replies.crtData);
 events.push({kind:'interrupt',number:33,ax:0x350a});word(graphicsSegment,0x32,replies.vectorOffset);word(graphicsSegment,0x34,replies.vectorSegment);
 const setVector=(segment:number,offset:number)=>{events.push({kind:'interrupt',number:33,ax:0x250a,ds:segment,dx:offset});word(0,0x28,offset);word(0,0x2a,segment);};
 setVector(graphicsSegment,0xe3d);read(0x21,replies.picMask);out(0x21,1,replies.picMask&0xfb);
 let command=word(graphicsSegment,0x3c)&0xcfff;out(crt,2,command);read(0x3c2,replies.miscRead);byte(graphicsSegment,0x3e,replies.miscRead&128);
 command=word(graphicsSegment,0x3c)&0xcfff;out(crt,2,command);out(crt,2,command|0x1000);word(graphicsSegment,0x36,0);
 // No IRQ0A is supplied: original CMP/LOOP probe exhausts10*65000 polls.
 byte(ss,0xc69,0);out(crt,2,word(graphicsSegment,0x3a));setVector(word(graphicsSegment,0x34),word(graphicsSegment,0x32));
 const retrace=(replies.retraceRead&8)!==0;read(0x3da,replies.retraceRead,retrace?1:650000);if(retrace)byte(ss,0xc69,1);
 word(ss,0x1dd5,320);word(ss,0xb86,0xa000);word(ss,0xb84,0);
 return {memory,events,timerPolls:650000,retracePolls:retrace?1:650000,retraceDetected:retrace,interruptsEnabled:false,pitch:320,visible:{segment:0xa000,offset:0}};
}
