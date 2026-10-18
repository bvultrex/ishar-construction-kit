import {readAlisModule,type AlisModule} from './alis-module.ts';
import {createOriginalDosScriptContext} from './original-dos-script-context.ts';
import {branchOriginalDosScript} from './original-dos-script-branch.ts';
import {returnOriginalDosScript} from './original-dos-script-return.ts';
import {writeOriginalDosScriptBlock} from './original-dos-script-block.ts';
import {readOriginalDosNumericOperand} from './original-dos-numeric-operand.ts';
import {selectOriginalDosScriptWord} from './original-dos-script-selection.ts';
import {writeOriginalDosScriptPosition} from './original-dos-script-position.ts';
import {enumerateOriginalDosContexts} from './original-dos-context-list.ts';
import {storeOriginalDosScriptResult} from './original-dos-script-result.ts';
export interface NativeScriptDiagnostic {module:AlisModule;memory:Uint8Array;globals:Uint8Array;bp:number;si:number;steps:number;status:'ready'|'yield'|'stopped';message:string}
/** Editor-only controlled context. Does not alter the playtest or source file. */
export function openNativeScriptDiagnostic(bytes:Uint8Array):NativeScriptDiagnostic{
 const module=readAlisModule(bytes),context=createOriginalDosScriptContext(new Uint8Array(65536),module.image,0,0x4000,0x100,6,0x200,0x5000,65535);
 if(context.error)throw Error(`Original-Kontextaufbau meldet Fehler ${context.error}`);
 const globals=new Uint8Array(65536);globals[0xbd3]=1; // Controlled table base0100h; no invented active-list links.
 return {module,memory:context.memory,globals,bp:context.context,si:context.entry,steps:0,status:'ready',message:'Kontrollierter Kontext erzeugt. Einzelne belegte Kontrollflussbefehle sind ausführbar.'};
}
export function stepNativeScriptDiagnostic(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='ready')return state;
 const stop=(message:string):NativeScriptDiagnostic=>({...state,status:'stopped',message});
 if(state.module.image.length>65536)return stop('Einzelschritte für Module über 64 KiB sind noch nicht angebunden. Kontextprüfung bleibt verfügbar.');
 if(state.si>=state.module.image.length)return stop('Skriptzeiger liegt außerhalb des geladenen Moduls.');
 const opcode=state.module.image[state.si],after=(state.si+1)&65535;
 let memory=state.memory,globals=state.globals,si=after,status:NativeScriptDiagnostic['status']='ready';
 if(opcode>=5&&opcode<=10){
  const length=[1,2,3][(opcode-5)%3];if(state.si+1+length>state.module.image.length)return stop('Operand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);
  const next=branchOriginalDosScript(script,memory,opcode,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode===41){
  if(state.si+5>state.module.image.length)return stop('Blockheader ist im Modul abgeschnitten.');
  const length=4+state.module.image[after+2]*2;if(after+length>state.module.image.length)return stop('Blockdaten sind im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);const next=writeOriginalDosScriptBlock(script,memory,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode===106){
  const tag=state.module.image[after],length=tag===0?2:[2,6,8].includes(tag)?3:0;
  if(!length)return stop(`Zahlenoperand-Tag ${tag} ist noch nicht angebunden. Befehl unverändert angehalten.`);
  if(after+length>state.module.image.length)return stop('Zahlenoperand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);const next=readOriginalDosNumericOperand(script,memory,after,state.bp);globals=globals.slice();globals[0xc99]=next.value&255;si=next.si;
 }else if(opcode===156){
  const tag=state.module.image[after],length=[18,20].includes(tag)?2:[6,8].includes(tag)?3:0;
  if(!length)return stop(`Ergebnisoperand-Tag ${tag} ist noch nicht angebunden. Befehl unverändert angehalten.`);
  if(state.si+1+length>state.module.image.length)return stop('Ergebnisoperand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);
  const list=enumerateOriginalDosContexts(memory,globals),next=storeOriginalDosScriptResult(script,memory,list.memory,after,state.bp,list.value);
  memory=next.memory;globals=next.globals;si=next.si;
 }else if(opcode===76){
  let cursor=state.si+1;
  for(let i=0;i<3;i++){
   if(cursor>=state.module.image.length)return stop('Positionsoperand ist im Modul abgeschnitten.');
   const tag=state.module.image[cursor],length=tag===0?2:[2,6,8].includes(tag)?3:0;
   if(!length)return stop(`Positionsoperand-Tag ${tag} ist noch nicht angebunden. Befehl unverändert angehalten.`);
   if(cursor+length>state.module.image.length)return stop('Positionsoperand ist im Modul abgeschnitten.');
   cursor+=length;
  }
  const script=new Uint8Array(65536);script.set(state.module.image);const next=writeOriginalDosScriptPosition(script,memory,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode===71){
  if(state.si+3>state.module.image.length)return stop('Auswahlwort ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);const next=selectOriginalDosScriptWord(script,memory,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode===17){const next=returnOriginalDosScript(memory,state.bp,after,1,0);memory=next.memory;si=next.si;
 }else if(opcode===66)status='yield';
 else return stop(`Opcode ${opcode} (0x${opcode.toString(16).padStart(2,'0')}) ist in dieser Diagnose noch nicht angebunden. Keine Ausführung und kein Überspringen.`);
 return {...state,memory,globals,si,status,steps:state.steps+1,message:status==='yield'?'Yield erreicht. Scheduler-Fortsetzung ist hier noch nicht angebunden.':`Opcode ${opcode} nach rekonstruierter DOS-Routine ausgeführt.`};
}
