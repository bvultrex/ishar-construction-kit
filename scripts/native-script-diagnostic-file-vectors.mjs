// Local original data is passed to the native checker only; never write this output into the repo.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prepareNativeScriptDiagnosticContext} from '../src/lib/ishar/native-script-diagnostic.ts';
import {openNativeScriptDiagnostic,stepNativeScriptDiagnostic,finishNativeScriptDiagnosticYield,selectNextNativeScriptDiagnosticContext,runNativeScriptDiagnosticFrame,tickNativeScriptDiagnosticFrame} from '../src/lib/ishar/native-script-diagnostic.ts';
const hash=v=>createHash('sha256').update(v).digest('hex'),bytes=new Uint8Array(readFileSync(process.argv[2]));
let state=openNativeScriptDiagnostic(bytes);if(state.module.image.length>65536)throw Error('Native diagnostic file checker requires a single source segment');
const initial={bp:state.bp,si:state.si,dx:state.dx,cx:state.cx,script:Buffer.from(state.module.image).toString('base64'),context:Buffer.from(state.memory).toString('base64'),globals:Buffer.from(state.globals.subarray(0,0x28c0)).toString('base64')},steps=[];let boundary='limit';
for(let i=0;i<1000;i++){
 const opcode=state.module.image[state.si],next=stepNativeScriptDiagnostic(state);
 if(next.status==='stopped'){boundary='unsupported';break;}
 steps.push({opcode,status:next.status,si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(next.memory),globalsHash:hash(next.globals.subarray(0,0x28c0))});state=next;
 if(next.status==='yield'){boundary='yield';break;}
}
if(steps.length===1000)throw Error('Native file comparison exceeds host step bound');
let continuation=null,selection=null,frameCycle=null,preparation=null,resumedSteps=[],resumedBoundary=null;if(process.argv.includes('--finish-yield')){
 if(state.status!=='yield')throw Error('Yield continuation comparison requires an actual yield');
 const next=finishNativeScriptDiagnosticYield(state);if(!['callback','next-context'].includes(next.status))throw Error(next.message);
 continuation={status:next.status,si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(next.memory),globalsHash:hash(next.globals.subarray(0,0x28c0))};
 if(process.argv.includes('--select-next')){
  if(next.status!=='next-context')throw Error('Next selection requires a completed no-callback yield');
  const selected=selectNextNativeScriptDiagnosticContext(next);selection={status:selected.status,bp:selected.bp,si:selected.si,dx:selected.dx,cx:selected.cx,contextHash:hash(selected.memory),globalsHash:hash(selected.globals.subarray(0,0x28c0))};
  if(process.argv.includes('--frame-cycle')){
   if(selected.status!=='frame')throw Error('Frame comparison requires actual frame boundary');
   const pack=s=>({status:s.status,globalsHash:hash(s.globals.subarray(0,0x28c0))});let frame=runNativeScriptDiagnosticFrame(selected);frameCycle={attempt:pack(frame),irq:null,returned:null};
   if(frame.status==='frame-wait'){const tick=tickNativeScriptDiagnosticFrame(frame);if(tick.status!=='frame-wait')throw Error(tick.message);frameCycle.irq=pack(tick);frame=runNativeScriptDiagnosticFrame(tick);}
   if(frame.status!=='frame-return')throw Error('Controlled comparison requires at most one timer IRQ');frameCycle.returned=pack(frame);
   if(process.argv.includes('--prepare-context')){
    if(process.argv.includes('--resume-main')){
     // Explicit TEST fixture: link the existing context as root after the frame.
     // This is not original initialization and is never done in the runtime API.
     frame={...frame,memory:frame.memory.slice()};frame.memory[frame.si]=frame.bp&255;frame.memory[frame.si+1]=frame.bp>>>8;
    }
    const prepared=prepareNativeScriptDiagnosticContext(frame);if(!['ready','next-context'].includes(prepared.status))throw Error(prepared.message);
    preparation={status:prepared.status,bp:prepared.bp,si:prepared.si,contextHash:hash(prepared.memory),globalsHash:hash(prepared.globals.subarray(0,0x28c0))};
    if(process.argv.includes('--resume-main')){
     if(prepared.status!=='ready')throw Error('Controlled root fixture did not prepare a main dispatch');
     let resumed=prepared;resumedBoundary='limit';
     for(let i=0;i<1000;i++){
      const opcode=resumed.module.image[resumed.si],next=stepNativeScriptDiagnostic(resumed);
      if(next.status==='stopped'){resumedBoundary='unsupported';break;}
      resumedSteps.push({opcode,status:next.status,si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(next.memory),globalsHash:hash(next.globals.subarray(0,0x28c0))});resumed=next;
      if(next.status==='yield'){resumedBoundary='yield';break;}
     }
     if(resumedBoundary==='limit')throw Error('Resumed main exceeds controlled step bound');
    }
   }
  }
 }
}
console.log(JSON.stringify({sourceSha256:hash(bytes),initial,steps,boundary,nextOpcode:state.module.image[state.si],continuation,selection,frameCycle,preparation,resumedSteps,resumedBoundary}));
