import type {DosAlisEntities} from './original-alis-entities.ts';
import {evaluateOriginalAlisInteger} from './original-alis-expression.ts';
export interface EaffActorPlacement {baseX:number;depth:number;height:number;lateral:number;divisor:number;actorId:number}
/** Ishar 2 EAFF 0x99a..0x9e8, after successful clive. Inputs are EAFF locals,
 * not map coordinates. No spawn selection, scheduler or cdelsound side effects. */
export function initializeOriginalEaffActor(entities:DosAlisEntities,handle:number,input:EaffActorPlacement):boolean{
 if(!Number.isInteger(handle)||handle< -1||handle>32767)throw Error('Invalid EAFF entity handle');
 if(handle===-1)return false; // original branch skips all stores after failed clive
 const locals=new Map([[0x10,input.baseX],[0x0e,input.depth],[0x12,input.height],[0x1a,input.lateral],[0x1e,input.divisor],[0x16,input.actorId]]);
 for(const [offset,value] of locals)if(!Number.isInteger(value)||value< -32768||value>32767||(offset===0x16&&(value< -128||value>127)))throw Error('Invalid EAFF placement local');
 const context={read:(_space:'local'|'main',address:number)=>{const v=locals.get(address);if(v===undefined)throw Error('Unknown EAFF local');return v;},table:()=>{throw Error('Unexpected EAFF table');},scan:0};
 const x=evaluateOriginalAlisInteger('(odirw(0x10) opushacc odirw(0x1a) omul(oimmb(10)) odiv(odirw(0x1e)) oadd(opile))',context);
 const depth=evaluateOriginalAlisInteger('(odirw(0x0e) osub(oimmb(1)))',context);
 // Validate all target offsets before mutation; malformed entities must not be half initialized.
 for(const offset of [0,2,4])entities.readWord(handle,offset);
 for(const offset of [9,12,13])entities.readByte(handle,offset);
 entities.writeWord(handle,0,x);entities.writeWord(handle,2,depth);entities.writeWord(handle,4,input.height);
 entities.writeByte(handle,13,input.actorId);entities.writeByte(handle,12,35);entities.writeByte(handle,9,38);
 return true;
}
