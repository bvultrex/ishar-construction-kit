import type {DosAlisEntities} from './original-alis-entities.ts';
import {originalAlisFormHits,type DosAlisForm,type AlisFormEntity} from './original-alis-forms.ts';
/** Uses linked entity order, not painter-sorted actor frames. All active forms
 * must be present; a missing module fails instead of silently selecting behind it. */
export function originalEntityFormHit(entities:DosAlisEntities,queryHandle:number,queryForm:number,forms:ReadonlyMap<number,readonly DosAlisForm[]>,mask:number){
 const signed=(v:number)=>v>=32768?v-65536:v;
 const convert=(handle:number,formOverride?:number):AlisFormEntity=>{
  const entity=entities.snapshot(handle),active=formOverride??entity.form,resources=forms.get(entity.moduleId);
  if(!resources&&active>=0)throw Error(`Missing form module ${entity.moduleId}`);
  return {id:handle,contextWord6:entities.readWord(handle,6),position:[signed(entities.readWord(handle,0)),signed(entities.readWord(handle,2)),signed(entities.readWord(handle,4))],mirror:entity.mirror,form:active,forms:resources??[]};
 };
 const query=convert(queryHandle,queryForm),targets=entities.ordered().map(entity=>convert(entity.handle));
 return originalAlisFormHits(query,targets,mask)[0]??null;
}
