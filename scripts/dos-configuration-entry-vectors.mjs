import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runOriginalDosConfigurationEntry as run} from '../src/lib/ishar/original-dos-configuration-entry.ts';
import {selectOriginalDosVideoModule as select} from '../src/lib/ishar/original-dos-video-selection.ts';
import {prepareOriginalDosStartupServices as prepare} from '../src/lib/ishar/original-dos-startup-services.ts';
const earlyServices=process.argv.includes('--early-services'),callerSelect=earlyServices||process.argv.includes('--caller-select');
const source=new Uint8Array(readFileSync(process.argv[2])),settings=new Uint8Array(readFileSync(process.argv[3])),cases=[];
const digest=createHash('sha256').update(source).digest('hex'),profile=digest==='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'?'ishar1':digest==='f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'?'ishar2':null;if(!profile)throw Error('Unsupported capture');
for(const countryAL of [0x21,0x31])for(const mouseAX of [0,65535])for(const failure of ['none','open','read','close'])for(const configure of [false,true]){
 const devices={countryAL,mouseAX,videoAL:0x1a,adlibBefore:0,adlibAfter:0,speakerRead:255,soundBlasterRead:0,joystickRead:0},drives={currentDrive:2,driveCount:3,currentDirectory:Uint8Array.of(84,69,83,84,0),handle:5,attempts:[{chdirError:mouseAX===0,createError:false}]},file={handle:5,openError:failure==='open',readError:failure==='read',closeError:failure==='close',readBytes:settings},prompt={seconds:configure?[0,0]:[0,4],keys:configure?[83]:[],cursorDX:0xb14};
 const before=source.slice(),entryResult=run(source,0x23d7,0x1c0b,profile,{devices,drives,file,prompt});
 let memory=entryResult.memory;const {memory:ignored,...result}=entryResult;
 if(callerSelect&&result.reason==='return'){memory=select(memory,0x1c0b).memory;result.boundary=0x78f;
 if(earlyServices){const services=prepare(memory,0x1c0b,{...drives,handle:42,vector24:{offset:0x1234,segment:0x7000},vector0:{offset:0x2345,segment:0x7100},diskResetWrites:[[{address:0x475,data:Uint8Array.of(0)}],[{address:0x475,data:Uint8Array.of(1)}]]});memory=services.memory;result.stages.push({stage:'engine-services',events:services.events});result.boundary=0x833;}
 }
 if(!source.every((v,i)=>v===before[i]))throw Error('Entry mutated source');
 memory.fill(0,0x1c0b0+0xfec0,0x1c0b0+0xff00);cases.push({earlyServices,callerSelect,boundarySegment:callerSelect&&result.reason==='return'?0x1000:0x23d7,countryAL,mouseAX,failure,configure,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
