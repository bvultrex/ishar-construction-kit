import {selectReferenceSampleChannel} from './reference-sample-channel.ts';

/** sound()/playsample preparation on an already imported resource. Caller must
 * resolve local/main module identity; this does not guess reference base addresses. */
export function prepareReferenceSamplePlay(resource:Uint8Array,command:{priority:number;volume:number;loops:number;speed:number},priorities:readonly number[],charMax:127|255){
 if(![command.priority,command.volume,command.speed].every(n=>Number.isInteger(n)&&n>=0&&n<=255)||!Number.isInteger(command.loops)||command.loops<0||command.loops>65535)throw Error('Invalid sample play command');
 if(resource.length<1)throw Error('Missing sample type');
 if(resource[0]!==1&&resource[0]!==2)return {kind:'ignored-type' as const,type:resource[0]!};
 if(resource.length<16)throw Error('Truncated imported sample header');
 const view=new DataView(resource.buffer,resource.byteOffset,resource.byteLength),length=view.getUint32(2,true)-16;
 if(length<0||16+length>resource.length)throw Error('Imported sample length outside buffer');
 const speed=command.speed===0?resource[1]!:command.speed;
 const selection=selectReferenceSampleChannel(priorities,command.priority,speed,charMax);
 if(selection===null)return {kind:'rejected-priority' as const};
 return {kind:'play' as const,...selection,volume:command.volume,loops:command.loops&255,played:0,length,samples:resource.slice(16,16+length)};
}
