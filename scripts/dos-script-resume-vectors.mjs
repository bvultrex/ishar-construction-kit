import {createHash} from 'node:crypto';
import {resumeOriginalDosScript,finishOriginalDosScriptCallback} from '../src/lib/ishar/original-dos-script-resume.ts';
import {branchOriginalDosScript} from '../src/lib/ishar/original-dos-script-branch.ts';
const hash=b=>createHash('sha256').update(b).digest('hex'),cases=[];
for(const changed of [false,true])for(const callback of [0,16])for(const count of [0,2])for(const reload of [0,1,255]){
 const context=new Uint8Array(65536).fill(0xa5),module=new Uint8Array(65536),objects=new Uint8Array(65536).fill(0xa5),v=new DataView(context.buffer),o=new DataView(objects.buffer);
 for(const [at,value] of [[-20,0x100],[-18,0x4000],[-10,16],[-24,count?0x100:0],[0,changed?65535:0],[2,0],[4,0]])v.setUint16(0x200+at,value,true);
 context[0x1fe]=reload;context[0x1ff]=17;new DataView(module.buffer).setUint16(0x106,callback,true);
 for(let i=0;i<count;i++){const at=0x100+i*0x100;objects[at]=0;o.setUint16(at+4,i+1<count?at+0x100:0,true);for(let a=0;a<3;a++)o.setUint16(at+0x16+a*2,1,true);}
 let result=resumeOriginalDosScript(context,module,objects,0x200,0x1234,[0,0,0],0x6000);
 if(process.argv[2]==='--complete-callback'&&result.phase==='callback'){
  module.set([5,0,66],result.si); // relative call, then direct native yield
  const called=branchOriginalDosScript(module,result.memory,5,result.si+1,0x200);
  const finished=finishOriginalDosScriptCallback(called.memory,result.objects,0x200,result.globals[0xc56],[0,0,0],result.ds,called.si+1,0x6000);
  result={...finished,globals:result.globals};
 }
 const {memory,objects:out,...expected}=result;
 cases.push({changed,callback,count,reload,expected:{...expected,contextSha256:hash(memory),objectsSha256:hash(out)}});
}
console.log(JSON.stringify(cases));
