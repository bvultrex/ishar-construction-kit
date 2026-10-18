/** Native 8F49..9008, stopped before first OUT. Caller supplies original 106-byte
 * engine stub and table byte. No original code bytes are bundled or executed. */
export function prepareOriginalDosTimerInstall(template:Uint8Array,segment:number,offset:number,length:number,tableByte:number,cachedWord:number){
 if(template.length!==106)throw Error('Native timer template must be 106 bytes');
 if(![segment,offset,length,cachedWord].every(n=>Number.isInteger(n)&&n>=0&&n<=65535)||!Number.isInteger(tableByte)||tableByte<0||tableByte>255)throw Error('Invalid native timer installation state');
 if(offset+128>65535)throw Error('Wrapped native timer buffer is not supported');
 const bytes=Uint8Array.from(template),v=new DataView(bytes.buffer),word=(at:number,value:number)=>v.setUint16(at,value&65535,true);
 const signedLength=length>=32768?length-65536:length,effectiveLength=signedLength>0?length:0x7d00;
 bytes[3]=tableByte;word(0x60,effectiveLength);word(0x66,cachedWord);
 word(0x17,offset+2);word(0x40,offset+3);word(0x50,offset+12);word(0x1d,offset+12);
 word(0x49,offset+0x60);word(0x57,offset+0x60);word(0x26,offset+0x64);
 word(0x2b,offset+0x66);word(0x34,offset+0x66);word(0x36,cachedWord);
 word(0x0c,offset+0x80);word(0x52,offset+0x80);
 return {bytes,vector:{offset,segment},samplePointer:offset+128,effectiveLength,cachedWord,active:1};
}

/** Original 9009..9059 including configuration helper 0F1E, not a wall-clock measurement. */
export function completeOriginalDosTimerInstall(stub:Uint8Array,codeSegment:number,systemType:number,settingWord:number,port61:number){
 if(stub.length!==106||![codeSegment,systemType,settingWord].every(n=>Number.isInteger(n)&&n>=0&&n<=65535)||!Number.isInteger(port61)||port61<0||port61>255)throw Error('Invalid native timer completion state');
 const derived=systemType===2||systemType===7?settingWord:Math.trunc(((settingWord*2)&65535)/3);
 const signed=derived>=32768?derived-65536:derived,divisor=signed>100?0x37:0x42;
 const bytes=Uint8Array.from(stub),v=new DataView(bytes.buffer);v.setUint16(0x5c,0x905e,true);v.setUint16(0x5e,codeSegment,true);v.setUint16(0x64,divisor,true);
 return {bytes,derived,divisor,interruptsEnabled:true,ports:[{port:0x43,value:0xb2},{port:0x42,value:0},{port:0x42,value:0},{port:0x61,value:(port61&0xfc)|3},{port:0x43,value:0x36},{port:0x40,value:divisor},{port:0x40,value:0},{port:0x43,value:0x90}]};
}
