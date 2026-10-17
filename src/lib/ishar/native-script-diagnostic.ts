import {readAlisModule,type AlisModule} from './alis-module.ts';
import {createOriginalDosScriptContext} from './original-dos-script-context.ts';
import {branchOriginalDosScript} from './original-dos-script-branch.ts';
import {returnOriginalDosScript} from './original-dos-script-return.ts';
export interface NativeScriptDiagnostic {module:AlisModule;memory:Uint8Array;bp:number;si:number;steps:number;status:'ready'|'yield'|'stopped';message:string}
/** Editor-only controlled context. Does not alter the playtest or source file. */
export function openNativeScriptDiagnostic(bytes:Uint8Array):NativeScriptDiagnostic{
 const module=readAlisModule(bytes),context=createOriginalDosScriptContext(new Uint8Array(65536),module.image,0,0x4000,0x100,6,0x200,0x5000,65535);
 if(context.error)throw Error(`Original-Kontextaufbau meldet Fehler ${context.error}`);
 return {module,memory:context.memory,bp:context.context,si:context.entry,steps:0,status:'ready',message:'Kontrollierter Kontext erzeugt. Einzelne belegte Kontrollflussbefehle sind ausführbar.'};
}
export function stepNativeScriptDiagnostic(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='ready')return state;
 const stop=(message:string):NativeScriptDiagnostic=>({...state,status:'stopped',message});
 if(state.module.image.length>65536)return stop('Einzelschritte für Module über 64 KiB sind noch nicht angebunden. Kontextprüfung bleibt verfügbar.');
 if(state.si>=state.module.image.length)return stop('Skriptzeiger liegt außerhalb des geladenen Moduls.');
 const opcode=state.module.image[state.si],after=(state.si+1)&65535;
 let memory=state.memory,si=after,status:NativeScriptDiagnostic['status']='ready';
 if(opcode>=5&&opcode<=10){
  const length=[1,2,3][(opcode-5)%3];if(state.si+1+length>state.module.image.length)return stop('Operand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);
  const next=branchOriginalDosScript(script,memory,opcode,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode===17){const next=returnOriginalDosScript(memory,state.bp,after,1,0);memory=next.memory;si=next.si;
 }else if(opcode===66)status='yield';
 else return stop(`Opcode ${opcode} (0x${opcode.toString(16).padStart(2,'0')}) ist in dieser Diagnose noch nicht angebunden. Keine Ausführung und kein Überspringen.`);
 return {...state,memory,si,status,steps:state.steps+1,message:status==='yield'?'Yield erreicht. Scheduler-Fortsetzung ist hier noch nicht angebunden.':`Opcode ${opcode} nach rekonstruierter DOS-Routine ausgeführt.`};
}
