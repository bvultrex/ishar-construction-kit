import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decodeOriginalDosStartupConfiguration as decode} from '../src/lib/ishar/original-dos-startup-configuration.ts';
import {writeStartupSettings} from '../src/lib/ishar/startup-settings.ts';
const settings=process.argv[3]?new Uint8Array(readFileSync(process.argv[3])):null;
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[],base=0x23d70;
const digest=createHash('sha256').update(source).digest('hex');
const profile=digest==='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'?'ishar1':digest==='f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'?'ishar2':null;
if(!profile)throw Error('Unsupported capture');
for(let n=0;n<(settings?267:263);n++){
 const memory=source.slice(),data=[82,0,86,n&255,83,n&255,80,n&255,74,n&255,77,n&255,75,n&255];
 if(n>=256&&n<263)data[(n-256)*2]=0;
 const resourceCase=n>=263,videoValue=resourceCase?[67,69,86,72][n-263]:null;
 if(resourceCase)data.splice(0,14,...writeStartupSettings(settings,{V:videoValue}).slice(0,14));
 memory.set(data,base+0x386);
 for(const at of [0x3a6,0x5fc,0x66a,0x48a,0x402,0x574])memory[base+at]=255;
 const before=memory.slice(),result=decode(memory,0x23d7,profile);
 if(!memory.every((v,i)=>v===before[i]))throw Error('Configuration mutated input');
 const {memory:output,...state}=result;
 cases.push({n,resourceCase,videoValue,...state,hash:createHash('sha256').update(output).digest('hex')});
}
console.log(JSON.stringify(cases));
