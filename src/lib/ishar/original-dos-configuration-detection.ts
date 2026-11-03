export interface OriginalConfigurationDetectionReplies{
 countryAL:number;mouseAX:number;videoAL:number;adlibBefore:number;adlibAfter:number;speakerRead:number;soundBlasterRead:number;joystickRead:number;
}
/** Ishar1 E3E..E61 / Ishar2 EA4..EC7, VGA-capable branch.
 * Explicit constant port replies; joystick axis probing is not yet supported.
 * No IRQ/hardware or BIOS memory changes are inferred.
 */
export function detectOriginalDosConfigurationDevices(source:Uint8Array,segment:number,replies:OriginalConfigurationDetectionReplies){
 if(source.length!==0x100000||!Number.isInteger(segment)||segment<0||segment>65535||segment*16+0xb94>source.length||!Number.isInteger(replies.mouseAX)||replies.mouseAX<0||replies.mouseAX>65535||![replies.countryAL,replies.videoAL,replies.adlibBefore,replies.adlibAfter,replies.speakerRead,replies.soundBlasterRead,replies.joystickRead].every(v=>Number.isInteger(v)&&v>=0&&v<=255))throw Error('Invalid configuration detection inputs');
 if(replies.videoAL!==0x1a||(replies.joystickRead&0xf0)===0xf0)throw Error('Configuration detection boundary: non-VGA or joystick-axis branch');
 const memory=source.slice(),base=segment*16,view=new DataView(memory.buffer),set=(at:number,v:number)=>{memory[base+at]=v;},events:Array<Record<string,number|string>>=[];
 const input=(port:number,value:number,repeat=1)=>events.push({kind:'in',port,value,repeat});
 const output=(port:number,value:number)=>events.push({kind:'out',port,value});
 events.push({kind:'interrupt',number:0x21,ah:0x38,al:0,dx:2});
 const country=replies.countryAL,language=country===0x21?0:country===0x31?2:1;
 view.setUint16(base+0xb92,language,true);set(0x574,language);
 events.push({kind:'interrupt',number:0x33,ax:0});if(replies.mouseAX!==0){set(0x523,1);set(0x48a,1);}
 events.push({kind:'interrupt',number:0x10,ax:0x1a00});set(0x3ef,2);set(0x3a6,2);set(0x657,0);
 const adlib=(register:number,value:number)=>{output(0x388,register);output(0x389,value);};
 adlib(4,0x60);adlib(4,0x80);input(0x388,replies.adlibBefore);adlib(2,255);adlib(4,0x21);input(0x388,replies.adlibAfter);adlib(4,0x60);adlib(4,0x80);
 if((replies.adlibBefore&0xe0)===0&&(replies.adlibAfter&0xe0)===0xc0){input(0x61,replies.speakerRead);output(0x61,replies.speakerRead&0xfe);set(0x657,1);set(0x5fc,1);}
 for(let port=0x216;port<=0x266;port+=16){output(port,1);output(port,0);input(port+4,replies.soundBlasterRead,replies.soundBlasterRead===0xaa?1:100);if(replies.soundBlasterRead===0xaa){set(0x657,2);set(0x5fc,2);break;}}
 input(0x201,replies.joystickRead,201);
 return {memory,events,interruptsEnabled:true};
}
