/** Normalized top-first view of native CS:8949/89E0 pending records. No scheduler. */
export interface DosPendingAudio {priority:number;speed:number;repeatWord:number;segment:number;offset:number}
function check(entry:DosPendingAudio){
 if(![entry.priority,entry.speed].every(n=>Number.isInteger(n)&&n>=0&&n<=255)||![entry.repeatWord,entry.segment,entry.offset].every(n=>Number.isInteger(n)&&n>=0&&n<=65535))throw Error('Invalid native pending audio record');
}
function queueCheck(queue:readonly DosPendingAudio[]){if(queue.length>6)throw Error('Native pending audio capacity exceeded');queue.forEach(check);}
export function pushOriginalDosAudioPending(queue:readonly DosPendingAudio[],activeFlag:number,current:DosPendingAudio,incoming:DosPendingAudio){
 queueCheck(queue);check(current);check(incoming);if(!Number.isInteger(activeFlag)||activeFlag<0||activeFlag>255)throw Error('Invalid native audio active flag');
 const saved=activeFlag===1&&current.priority>=128&&current.priority!==incoming.priority&&queue.length<6;
 return {queue:(saved?[current,...queue]:queue).map(e=>({...e})),current:{...incoming},activeFlag:1,saved};
}
export function popOriginalDosAudioPending(queue:readonly DosPendingAudio[]){
 queueCheck(queue);return {queue:queue.slice(1).map(e=>({...e})),current:queue[0]?{...queue[0]}:null,activeFlag:queue.length?1:0};
}
