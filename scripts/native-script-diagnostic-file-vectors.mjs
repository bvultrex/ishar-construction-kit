// Local original data is passed to the native checker only; never write this output into the repo.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {openNativeScriptDiagnostic,stepNativeScriptDiagnostic,finishNativeScriptDiagnosticYield} from '../src/lib/ishar/native-script-diagnostic.ts';
const hash=v=>createHash('sha256').update(v).digest('hex'),bytes=new Uint8Array(readFileSync(process.argv[2]));
let state=openNativeScriptDiagnostic(bytes);if(state.module.image.length>65536)throw Error('Native diagnostic file checker requires a single source segment');
const initial={bp:state.bp,si:state.si,dx:state.dx,cx:state.cx,script:Buffer.from(state.module.image).toString('base64'),context:Buffer.from(state.memory).toString('base64'),globals:Buffer.from(state.globals.subarray(0,0x2200)).toString('base64')},steps=[];let boundary='limit';
for(let i=0;i<1000;i++){
 const opcode=state.module.image[state.si],next=stepNativeScriptDiagnostic(state);
 if(next.status==='stopped'){boundary='unsupported';break;}
 steps.push({opcode,status:next.status,si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(next.memory),globalsHash:hash(next.globals.subarray(0,0x2200))});state=next;
 if(next.status==='yield'){boundary='yield';break;}
}
if(steps.length===1000)throw Error('Native file comparison exceeds host step bound');
let continuation=null;if(process.argv.includes('--finish-yield')){
 if(state.status!=='yield')throw Error('Yield continuation comparison requires an actual yield');
 const next=finishNativeScriptDiagnosticYield(state);if(!['callback','next-context'].includes(next.status))throw Error(next.message);
 continuation={status:next.status,si:next.si,dx:next.dx,cx:next.cx,contextHash:hash(next.memory),globalsHash:hash(next.globals.subarray(0,0x2200))};
}
console.log(JSON.stringify({sourceSha256:hash(bytes),initial,steps,boundary,nextOpcode:state.module.image[state.si],continuation}));
