/** Pure playsample selection from separate ALIS C reference audio.c.
 * Explicit CHAR_MAX and channel count avoid silently choosing host/film policy. */
export function selectReferenceSampleChannel(priorities:readonly number[],priorityByte:number,speedByte:number,charMax:127|255){
 if((priorities.length!==3&&priorities.length!==4)||priorities.some(p=>!Number.isInteger(p)||p< -128||p>127))throw Error('Invalid reference sample channels');
 if(![priorityByte,speedByte].every(n=>Number.isInteger(n)&&n>=0&&n<=255))throw Error('Invalid sample command byte');
 if(charMax!==127&&charMax!==255)throw Error('Explicit reference CHAR_MAX required');
 const signed=(n:number)=>n>=128?n-256:n,priority=signed(priorityByte),speed=signed(speedByte);
 let selected=priorities.findIndex(p=>p===priority),lowest:number=charMax;
 if(selected>=0)lowest=priority;
 else for(let i=0;i<priorities.length;i++)if(priorities[i]!<lowest){selected=i;lowest=priorities[i]!;}
 if((priority>=0&&lowest<0&&lowest!==-128)||priority<lowest)return null;
 if(selected<0)throw Error('Reference selected no sample channel');
 return {channel:selected,priority,frequency:(speed<1||speed>20?10:speed)*1000};
}
