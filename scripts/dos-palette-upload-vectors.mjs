import {planOriginalDosPaletteUpload} from '../src/lib/ishar/original-dos-palette-upload.ts';
const cases=[];
for(const mode of [0,1,2])for(const interruptsEnabled of [false,true])for(let pattern=0;pattern<6;pattern++)for(const delay of [0,2]){
 const current=Uint8Array.from({length:768},(_,i)=>(i*17)&255),shadow=Uint8Array.from(current);
 for(let i=0;i<768;i++)if(pattern===1||pattern===2&&i===0||pattern===3&&i===382||pattern===4&&i===767||pattern===5&&i%19===0)shadow[i]^=255;
 const result=planOriginalDosPaletteUpload(current,shadow,mode,true,interruptsEnabled);
 cases.push({mode,interruptsEnabled,delay,current:[...current],shadow:[...shadow],expected:{...result,shadow:[...result.shadow]}});
}
console.log(JSON.stringify(cases));
