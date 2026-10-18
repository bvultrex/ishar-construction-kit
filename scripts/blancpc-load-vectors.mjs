import {transformOriginalBlancpcLoadWindow} from '../src/lib/ishar/original-blancpc-load-transform.ts';
const windows=[new Uint8Array(2560),Uint8Array.from({length:2560},(_,i)=>i&255),Uint8Array.from({length:2560},(_,i)=>(i*73+19)&255)];
console.log(JSON.stringify(windows.map(source=>({input:Buffer.from(source).toString('base64'),expected:Buffer.from(transformOriginalBlancpcLoadWindow(source)).toString('base64')}))));
