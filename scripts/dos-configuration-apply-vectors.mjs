import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyOriginalDosStartupConfiguration as apply} from '../src/lib/ishar/original-dos-configuration-apply.ts';
const source=new Uint8Array(readFileSync(process.argv[2])),cases=[];
for(let n=0;n<292;n++){
 const fields=n<256?[n,n,n,n,n]:[[0,1,2,3,4,255][Math.floor((n-256)/6)],[0,1,2,3,4,255][(n-256)%6],n%4,n%3,n%4],m=source.slice();
 for(const [i,at] of [0x3a6,0x5fc,0x574,0x48a,0x402].entries())m[0x23d70+at]=fields[i];
 const before=m.slice(),{memory,...result}=apply(m,0x23d7,0x1c0b);
 if(!m.every((v,i)=>v===before[i]))throw Error('Application mutated input');
 cases.push({fields,...result,hash:createHash('sha256').update(memory).digest('hex')});
}
console.log(JSON.stringify(cases));
