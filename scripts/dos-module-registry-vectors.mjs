import {registerOriginalDosModule} from '../src/lib/ishar/original-dos-module-registry.ts';
const cases=[];
for(const ids of [[],[1,3,7],[3,3],[0,32768,65535]])for(const id of [0,3,8,65535])for(const endOffset of [0,65535])for(const upper of [0x4000,0x9000])for(const [count,limit] of [[0,60],[60,60],[32767,32767]]){
 const entries=ids.map((id,i)=>({id,offset:0,segment:0x6000+i*0x100})),incoming={id,offset:0x30,segment:0x4000};
 cases.push({entries,incoming,endOffset,upper,count,limit,expected:registerOriginalDosModule(entries,incoming,0x100,0x4000,endOffset,upper,count,limit)});
}
console.log(JSON.stringify(cases));
