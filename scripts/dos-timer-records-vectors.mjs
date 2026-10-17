import {stepOriginalDosTimerRecords} from '../src/lib/ishar/original-dos-timer-records.ts';
const cases=[];
for(const mode of [0,1,4])for(const suppressByte of [0,1,255])for(const selected of [0,1,2])for(const active of [0,1,127,128,255])for(const stop of [false,true])for(const port of [0,3]){
 const records=Array.from({length:3},(_,i)=>{
  const r=new Uint8Array(16),v=new DataView(r.buffer);r[0]=i===selected?active:1;r[1]=i===selected?127:128;r[2]=3;
  for(const [at,value] of [[4,stop?1:5],[6,300],[8,1],[10,200],[12,2]])v.setUint16(at,value,true);return r;
 });
 let reads=0;const result=stepOriginalDosTimerRecords(records,mode,suppressByte,port,0,()=>{reads++;return 7;});
 cases.push({mode,suppressByte,port,source:records.map(r=>[...r]),expected:{...result,records:result.records.map(r=>[...r])},reads});
}
console.log(JSON.stringify(cases));
