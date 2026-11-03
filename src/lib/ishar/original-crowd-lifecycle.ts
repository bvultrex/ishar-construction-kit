/** Ishar-2 original crowd lifecycle effects, not a new occupancy system.
 * These are caller-applied MAIN byte writes; no scheduler, combat or movement. */
export interface CrowdByteWrite {address:number;width:1;value:number}
export function originalGerDepPostMoveReset():CrowdByteWrite[]{
 // GERDEP 0x13d5..0x1410: includes three further bytes, whose meaning stays neutral.
 return [0x4b80,0x4b81,0x4b82,0x4aa9,0x4aad,0x4ab5].map(address=>({address,width:1,value:0}));
}
export function originalEdpltCrowdReservation(slots:readonly number[],actorId:number):CrowdByteWrite[]{
 if(slots.length!==3||!slots.every(n=>Number.isInteger(n)&&n>=0&&n<=255)||!Number.isInteger(actorId)||actorId<50||actorId>109)throw Error('Invalid original crowd reservation');
 // EDPLT 0x290..0x30a, after its movement/collision gates have succeeded.
 if(slots.includes(actorId))return [];
 const slot=[1,0,2].find(i=>slots[i]===0);
 return slot===undefined?[]:[{address:0x4b80+slot,width:1,value:actorId}];
}
export function originalFriseCrowdDeathRelease(hp:number,slot:number,contextWord168:number):CrowdByteWrite[]{
 if(!Number.isInteger(hp)||hp< -32768||hp>32767||!Number.isInteger(slot)||slot< -128||slot>2||!Number.isInteger(contextWord168)||contextWord168< -32768||contextWord168>32767)throw Error('Invalid original crowd death input');
 // FRISE 0x578e..0x57b3. No additional slot-ownership check exists in this block.
 return hp<=0&&slot>=0&&contextWord168===0?[{address:0x4b80+slot,width:1,value:0}]:[];
}
