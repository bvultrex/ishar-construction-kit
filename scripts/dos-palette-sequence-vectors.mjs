import {stepOriginalDosPaletteTick} from '../src/lib/ishar/original-dos-palette-tick.ts';
import {createHash} from 'node:crypto';
const hash=v=>createHash('sha256').update(v).digest('hex'),cases=[];
for(const enabled of [0,1])for(const mode of [0,1])for(const reload of [0,2])for(const rising of [false,true]){
 const initial={current:new Uint8Array(768).fill(rising?20:30),shadow:new Uint8Array(768).fill(0),target:new Uint8Array(768).fill(rising?30:20),mode,countdown:0,reload,step:4,active:1,retraceMode:1,interruptsEnabled:true};
 let state=initial,settled=0;const frames=[];
 for(let n=0;n<40;n++){
  const called=enabled!==0&&state.active!==0;
  const result=called?stepOriginalDosPaletteTick(state,true):{state,ports:[]};state=result.state;
  frames.push({current:hash(state.current),shadow:hash(state.shadow),target:hash(state.target),active:state.active,countdown:state.countdown,ports:[{port:32,value:96},...result.ports],reads:called&&mode!==1?1:0});
  if(state.active===0&&++settled===3)break;
  if((!enabled||mode===1)&&n===4)break;
 }
 if(enabled&&mode!==1&&state.active!==0)throw Error('Fade did not settle within budget');
 cases.push({enabled,rising,mode,reload,frames});
}
console.log(JSON.stringify(cases));
