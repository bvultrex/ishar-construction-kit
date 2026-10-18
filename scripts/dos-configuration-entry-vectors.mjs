import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runOriginalDosConfigurationEntry as run} from '../src/lib/ishar/original-dos-configuration-entry.ts';
import {selectOriginalDosVideoModule as select} from '../src/lib/ishar/original-dos-video-selection.ts';
import {prepareOriginalDosStartupServices as prepare} from '../src/lib/ishar/original-dos-startup-services.ts';
import {initializeOriginalDosBlancpc as loadBlancpc} from '../src/lib/ishar/original-dos-blancpc-load.ts';
import {initializeOriginalDosPhysicalEmsStartup as initializeEms} from '../src/lib/ishar/original-dos-physical-ems-startup.ts';
import {initializeOriginalDosAudioStartup as initializeAudio} from '../src/lib/ishar/original-dos-audio-startup.ts';
import {initializeOriginalDosKeyboardStartup as initializeKeyboard} from '../src/lib/ishar/original-dos-keyboard-startup.ts';
import {initializeOriginalDosVgaViewport as initializeGraphics} from '../src/lib/ishar/original-dos-vga-startup.ts';
import {initializeOriginalDosMouseStartup as initializeMouse} from '../src/lib/ishar/original-dos-mouse-startup.ts';
import {prepareOriginalDosTimerStartup as prepareTimer} from '../src/lib/ishar/original-dos-timer-startup.ts';
import {completeOriginalDosTimerStartup as completeTimer} from '../src/lib/ishar/original-dos-startup-timer-irq.ts';
const timerComplete=process.argv.includes('--timer-complete'),timerPrefix=timerComplete||process.argv.includes('--timer-prefix'),mouse=timerPrefix||process.argv.includes('--mouse'),graphics=mouse||process.argv.includes('--graphics'),keyboard=graphics||process.argv.includes('--keyboard');
const audio=keyboard||process.argv.includes('--audio'),ems=audio||process.argv.includes('--ems');
const blancpcIndex=process.argv.indexOf('--blancpc'),blancpc=blancpcIndex>=0?new Uint8Array(readFileSync(process.argv[blancpcIndex+1])):null;
const earlyServices=!!blancpc||process.argv.includes('--early-services'),callerSelect=earlyServices||process.argv.includes('--caller-select');
const source=new Uint8Array(readFileSync(process.argv[2])),settings=new Uint8Array(readFileSync(process.argv[3])),cases=[];
const digest=createHash('sha256').update(source).digest('hex'),profile=digest==='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'?'ishar1':digest==='f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'?'ishar2':null;if(!profile)throw Error('Unsupported capture');
for(const countryAL of [0x21,0x31])for(const mouseAX of [0,65535])for(const failure of ['none','open','read','close'])for(const configure of [false,true]){
 const devices={countryAL,mouseAX,videoAL:0x1a,adlibBefore:0,adlibAfter:0,speakerRead:255,soundBlasterRead:0,joystickRead:0},drives={currentDrive:2,driveCount:3,currentDirectory:Uint8Array.of(84,69,83,84,0),handle:5,attempts:[{chdirError:mouseAX===0,createError:false}]},file={handle:5,openError:failure==='open',readError:failure==='read',closeError:failure==='close',readBytes:settings},prompt={seconds:configure?[0,0]:[0,4],keys:configure?[83]:[],cursorDX:0xb14};
 const initial=source.slice();if(ems){if(!blancpc)throw Error('--ems requires --blancpc');initial.set(source.slice(0x10b10,0x10b18),0x4000a);if(mouseAX===0)initial[0x4000a]^=255;}
 const before=initial.slice(),entryResult=run(initial,0x23d7,0x1c0b,profile,{devices,drives,file,prompt});
 let memory=entryResult.memory;const {memory:ignored,...result}=entryResult;
 if(callerSelect&&result.reason==='return'){memory=select(memory,0x1c0b).memory;result.boundary=0x78f;
 if(earlyServices){const services=prepare(memory,0x1c0b,{...drives,handle:42,vector24:{offset:0x1234,segment:0x7000},vector0:{offset:0x2345,segment:0x7100},diskResetWrites:[[{address:0x475,data:Uint8Array.of(0)}],[{address:0x475,data:Uint8Array.of(1)}]]});memory=services.memory;result.stages.push({stage:'engine-services',events:services.events});result.boundary=0x833;
 if(blancpc){const loaded=loadBlancpc(memory,0x1c0b,{opens:[{ax:5,carry:false}],read:{ax:blancpc.length,carry:false,data:blancpc},close:{ax:0,carry:false}});if(loaded.error!==null)throw Error('Unexpected BLANCPC error');memory=loaded.memory;result.stages.push({stage:'blancpc',events:loaded.events});result.boundary=0x853;
 if(ems){const initialized=initializeEms(memory,0x1c0b,{biosKiB:640,vectorSegment:0x4000,queryStatus:0,pageFrame:0xe000,allocateStatus:0,handle:0x1234,mapStatuses:[0,0,0,0],directionFlag:false});memory=initialized.memory;result.stages.push({stage:'ems',events:initialized.events});result.boundary=0x8eb;
 if(audio){const initializedAudio=initializeAudio(memory,0x1c0b,{vectorOffset:0x1234,vectorSegment:0x7000,soundBlasterRead:0});if(initializedAudio.phase!=='return')throw Error('Audio driver boundary requires separate native fixture');memory=initializedAudio.memory;result.stages.push({stage:'audio',events:initializedAudio.events});result.boundary=0x8f0;
 if(keyboard){const initializedKeyboard=initializeKeyboard(memory,0x1c0b,{vectorOffset:0x1234,vectorSegment:0x7000,directionFlag:false},true);memory=initializedKeyboard.memory;result.stages.push({stage:'keyboard',events:initializedKeyboard.events});result.boundary=0x8f6;
 if(graphics){const initializedGraphics=initializeGraphics(memory,0x1c0b,0x1e97,{biosWrites:[{address:0x449,data:Uint8Array.of(19)},{address:0x463,data:Uint8Array.of(0xd4,3)}],vectorOffset:0x1234,vectorSegment:0x7000,crtData:255,picMask:255,miscRead:128,retraceRead:8,irq0A:'none'});memory=initializedGraphics.memory;result.stages.push({stage:'graphics',events:initializedGraphics.events});result.boundary=0x8f9;
 if(mouse){const initializedMouse=initializeMouse(memory,0x1c0b,mouseAX);memory=initializedMouse.memory;result.stages.push({stage:'mouse',events:initializedMouse.events});result.boundary=0x8fc;
 if(timerPrefix){const preparedTimer=prepareTimer(memory,0x1c0b,{vectorOffset:0x1234,vectorSegment:0x7000,retraceReads:[0,8,0,8],pitCounterWord:0x8000,noInterrupts:true});if(preparedTimer.phase!=='wait')throw Error('Unexpected timer calibration fault');memory=preparedTimer.memory;result.stages.push({stage:'timer',events:preparedTimer.events});result.reason='wait-timer';result.boundary=0xcfe;
 if(timerComplete){const completed=completeTimer(memory,0x1c0b,{secondAt:0,thirdAt:countryAL===0x21?79:40000,retraceReads:[[0,8],[8],[0,0,8]]});memory=completed.memory;result.stages.push({stage:'timer-irq',events:completed.events});result.reason='return';result.boundary=0x8ff;result.timerMeasurement=completed.registers;}
 }
 }
 }
 }
 }
 }
 }
 }
 }
 if(!initial.every((v,i)=>v===before[i]))throw Error('Entry mutated source');
 memory.fill(0,0x1c0b0+(graphics&&result.reason!=='menu'?0xfebc:0xfec0),0x1c0b0+0xff00);cases.push({timerComplete,timerPrefix,mouse,graphics,keyboard,audio,ems,earlyServices,callerSelect,boundarySegment:callerSelect&&result.reason!=='menu'?0x1000:0x23d7,countryAL,mouseAX,failure,configure,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
