import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadOriginalDosStartupConfiguration as load} from '../src/lib/ishar/original-dos-startup-configuration.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),settings=new Uint8Array(readFileSync(process.argv[3])),cases=[];
if(settings.length!==14)throw Error('This native fixture requires exactly14 bytes');
const digest=createHash('sha256').update(source).digest('hex'),profile=digest==='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'?'ishar1':digest==='f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'?'ishar2':null;
if(!profile)throw Error('Unsupported capture');
for(const handle of [0,5,65535])for(const count of [0,1,7,13,14])for(const failure of ['none','open','read','close']){
 const m=source.slice();m.set([82,0,86,67,83,73,80,49,74,48,77,48,75,65],0x23d70+0x386);
 const reply={handle,openError:failure==='open',readError:failure==='read',closeError:failure==='close',readBytes:settings.slice(0,count)},before=m.slice(),{memory,...result}=load(m,0x23d7,profile,reply);
 if(!m.every((v,i)=>v===before[i]))throw Error('File loader mutated input');
 if(profile==='ishar2')memory.fill(0,0x1c0b0+0xfeee,0x1c0b0+0xff00);
 cases.push({handle,count,failure,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
