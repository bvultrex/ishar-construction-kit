import {stepOriginalDosPaletteTick} from '../src/lib/ishar/original-dos-palette-tick.ts';
const cases=[];
for(const countdown of [0,1,127,128,129,255])for(const reload of [0,2,255])for(const mode of [0,1,2])for(const pattern of [0,1])for(const interruptsEnabled of [false,true]){
 const source={current:new Uint8Array(768).fill(20),shadow:new Uint8Array(768).fill(pattern?19:20),target:new Uint8Array(768).fill(pattern?30:20),mode,countdown,reload,step:4,active:7,retraceMode:1,interruptsEnabled};
 const result=stepOriginalDosPaletteTick(source,true),serialize=s=>({...s,current:[...s.current],shadow:[...s.shadow],target:[...s.target]});
 cases.push({source:serialize(source),expected:{...result,state:serialize(result.state)}});
}
console.log(JSON.stringify(cases));
