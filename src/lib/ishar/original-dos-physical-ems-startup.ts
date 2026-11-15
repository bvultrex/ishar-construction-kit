import {planOriginalDosEmsInit} from './original-dos-ems-init.ts';
import {reserveOriginalDosPhysicalFramebuffer} from './original-dos-memory-layout.ts';
export interface OriginalPhysicalEmsStartupReplies{
 biosKiB:number;vectorSegment:number;queryStatus:number;pageFrame:number;allocateStatus:number;handle:number;mapStatuses:number[];directionFlag:false;
}
/** Original0853..08EA on shared memory, including0B1E and087D.
 * Driver signature is read from the supplied memory; no fabricated signature.
 * Explicit DOS/EMS register replies, no actual EMS page-content remapping.
 */
export function initializeOriginalDosPhysicalEmsStartup(source:Uint8Array,ss:number,r:OriginalPhysicalEmsStartupReplies){
 if(source.length!==0x100000||!Number.isInteger(ss)||ss<0||ss>65535||ss*16+65536>source.length||!Number.isInteger(r.biosKiB)||r.biosKiB<0||r.biosKiB>65535||!Number.isInteger(r.vectorSegment)||r.vectorSegment<0||r.vectorSegment*16+18>source.length||r.directionFlag!==false)throw Error('Invalid physical BIOS/EMS startup replies');
 const memory=source.slice(),g=ss*16,v=new DataView(memory.buffer);v.setUint16(g+0xb8a,0,true);v.setUint16(0x10b1c,0,true);
 const signature=memory.subarray(0x10b10,0x10b18).every((value,i)=>value===memory[r.vectorSegment*16+10+i]);
 const plan=planOriginalDosEmsInit(signature,r.queryStatus,r.pageFrame,r.allocateStatus,r.handle,r.mapStatuses,v.getUint16(0x10b1a,true),v.getUint16(0x10b18,true));
 v.setUint16(0x10b1a,plan.savedFrame,true);v.setUint16(0x10b18,plan.savedHandle,true);v.setUint16(0x10b1c,plan.active,true);
 if(plan.ax!==0){v.setUint16(g+0xb8a,plan.ax,true);v.setUint16(g+0xb88,0,true);}
 const upper=((r.biosKiB*64)-1)&65535,reservation=reserveOriginalDosPhysicalFramebuffer(memory,ss,upper);
 return {...reservation,events:[{interrupt:0x12},...plan.calls],ems:plan,signature,boundary:0x8eb};
}
