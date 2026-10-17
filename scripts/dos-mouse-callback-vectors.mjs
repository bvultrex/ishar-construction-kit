import {latchOriginalDosMouseCallback,readOriginalDosInputSnapshot} from '../src/lib/ishar/original-dos-input-snapshot.ts';
const cases=[];
for(const bx of [0,1,2,3,65535])for(const cx of [0,1,319,639,65535])for(const dx of [0,199,65535])for(const mode of [0,1,2])for(const blocked of [0,1]){
 const latched=latchOriginalDosMouseCallback(bx,cx,dx);
 cases.push({bx,cx,dx,mode,blocked,latched,expected:readOriginalDosInputSnapshot(blocked,mode,latched.rawX,latched.rawY,latched.rawState)});
}
console.log(JSON.stringify(cases));
