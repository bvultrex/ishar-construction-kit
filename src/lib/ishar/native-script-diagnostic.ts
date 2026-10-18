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
import {evaluateOriginalDosScriptExpression} from './original-dos-script-expression.ts';
import {branchOriginalDosScriptConditional} from './original-dos-script-conditional.ts';
import {findOriginalDosContextsByModule} from './original-dos-context-query.ts';
import {activateOriginalDosScriptContext} from './original-dos-context-active.ts';
import {resumeOriginalDosScript} from './original-dos-script-resume.ts';
import {selectOriginalDosNextContext} from './original-dos-next-context.ts';
import {runOriginalDosIdleFrame} from './original-dos-frame-idle.ts';
import {stepOriginalDosIdleTimerIrq} from './original-dos-idle-timer-irq.ts';
import {prepareOriginalDosSchedulerBoundary} from './original-dos-scheduler-boundary.ts';
import {writeOriginalDosOpcode186} from './original-dos-script-opcode186.ts';
export interface NativeScriptDiagnostic {module:AlisModule;memory:Uint8Array;globals:Uint8Array;bp:number;si:number;dx:number;cx:number;steps:number;timerIrqs:number;status:'ready'|'yield'|'callback'|'next-context'|'context'|'frame'|'frame-wait'|'frame-return'|'stopped';message:string}
/** Editor-only controlled context. Does not alter the playtest or source file. */
export function openNativeScriptDiagnostic(bytes:Uint8Array):NativeScriptDiagnostic{
 const module=readAlisModule(bytes),context=createOriginalDosScriptContext(new Uint8Array(65536),module.image,0,0x4000,0x100,6,0x200,0x5000,65535);
 if(context.error)throw Error(`Original-Kontextaufbau meldet Fehler ${context.error}`);
 const globals=new Uint8Array(65536);globals[0xbd3]=1; // Controlled table base0100h; no invented active-list links.
 return {module,memory:context.memory,globals,bp:context.context,si:context.entry,dx:0,cx:0,steps:0,timerIrqs:0,status:'ready',message:'Kontrollierter Kontext erzeugt. Einzelne belegte Kontrollflussbefehle sind ausführbar.'};
}
/** Complete26B2 only to the next native boundary. No automatic callback/scheduler body.
 * Object memory is not loaded in this diagnostic, so nonempty object chains stop.
 */
export function finishNativeScriptDiagnosticYield(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='yield')return state;
 const stop=(message:string):NativeScriptDiagnostic=>({...state,status:'stopped',message});
 if(state.module.image.length>65536)return stop('Yield-Abschluss für Mehrsegmentmodule ist noch nicht angebunden.');
 const word=(buf:Uint8Array,at:number)=>buf[at&65535]|(buf[(at+1)&65535]<<8),base=word(state.memory,state.bp-20),module=new Uint8Array(65536);module.set(state.module.image);
 if(base+8>state.module.image.length)return stop('Callbackheader liegt außerhalb des geladenen Moduls.');
 if(word(module,base+6)===0&&word(state.memory,state.bp-24)!==0)return stop('Objektkette vorhanden; ihr Originalsegment ist in dieser Diagnose noch nicht geladen. Yield-Abschluss unverändert angehalten.');
 const snapshot=[0,2,4].map(at=>word(state.globals,0xbfa+at)),objectSegment=word(state.globals,0xbea);
 const next=resumeOriginalDosScript(state.memory,module,new Uint8Array(65536),state.bp,state.si,snapshot,objectSegment),globals=state.globals.slice();
 for(const [address,value] of Object.entries(next.globals)){const at=Number(address);globals[at]=value&255;if(at!==0xc19)globals[at+1]=value>>>8;}
 return {...state,memory:next.memory,globals,si:next.si,status:next.phase==='callback'?'callback':'next-context',message:next.phase==='callback'?'Skriptzeiger gespeichert. Rückkehr-Callback erreicht; dessen Ausführung ist hier noch nicht angebunden.':'Skriptzeiger gespeichert und Countdown neu geladen. Nächste Originalgrenze: Kontextauswahl 0x2632; diese wird hier noch nicht ausgeführt.'};
}
/** Native2632 selection only, ending before264F preparation or2649 frame CALL. */
export function selectNextNativeScriptDiagnosticContext(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='next-context')return state;
 const word=(at:number)=>state.globals[at]|(state.globals[at+1]<<8);
 const next=selectOriginalDosNextContext(state.memory,word(0xbd2),word(0xb02),state.bp),globals=state.globals.slice();
 globals[0xb02]=next.slot&255;globals[0xb03]=next.slot>>>8;
 return {...state,globals,bp:next.bp,si:next.si,status:next.phase,message:next.phase==='frame'?'Kein weiterer Kontext verknüpft. Originalgrenze vor Frame-Service (0x2649); der Frame wird hier noch nicht ausgeführt.':'Nächster Kontext ausgewählt. Originalgrenze vor Scan-/Main-Vorbereitung (0x264F); noch keine Skriptausführung.'};
}
/** Idle frame only. Keyboard CS:318 is explicitly controlled0; no input polling device. */
export function runNativeScriptDiagnosticFrame(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='frame'&&state.status!=='frame-wait')return state;
 try{
  const next=runOriginalDosIdleFrame(state.globals,0);
  return {...state,globals:next.memory,status:next.phase==='wait'?'frame-wait':'frame-return',message:next.phase==='wait'?'Frame wartet auf den Timerzähler. Kein Zeitfortschritt simuliert. Ein kontrollierter inaktiver Timer-IRQ kann separat geprüft werden.':'Leerer Frame-Service beendet. Originalgrenze vor 0x264C; Kontextvorbereitung wird noch nicht ausgeführt.'};
 }catch(e){return {...state,status:'stopped',message:`Frame unverändert angehalten: ${String(e)}`};}
}
/** One explicitly requested timer event, inactive callback path; no wall-clock claim. */
export function tickNativeScriptDiagnosticFrame(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='frame-wait')return state;
 try{const next=stepOriginalDosIdleTimerIrq(state.globals,0);return {...state,globals:next.memory,timerIrqs:state.timerIrqs+1,message:'Ein kontrollierter Timer-IRQ mit inaktiven Callbacks geprüft. Frame-Service erneut prüfen; keine automatische Fortsetzung.'};}
 catch(e){return {...state,status:'stopped',message:`Timer-IRQ unverändert angehalten: ${String(e)}`};}
}
/** Explicit264C/264F continuation. The diagnostic has only module4000 loaded.
 * Stop before foreign segment reads or scan bodies; preserve the incoming state
 * on unsupported addresses. A raw null root is passed through unchanged.
 */
export function prepareNativeScriptDiagnosticContext(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='context'&&state.status!=='frame-return')return state;
 const stop=(message:string):NativeScriptDiagnostic=>({...state,status:'stopped',message});
 const word=(buf:Uint8Array,at:number)=>buf[at&65535]|(buf[(at+1)&65535]<<8);
 const slot=word(state.globals,0xb02),at=(slot+state.si)&65535;
 if(state.status==='frame-return'&&at===65535)return stop('Wurzelpointer überschreitet die unterstützte Segmentgrenze.');
 const bp=state.status==='frame-return'?word(state.memory,at):state.bp;
 if(state.module.image.length>65536)return stop('Kontextvorbereitung für Mehrsegmentmodule ist noch nicht angebunden.');
 const flag=state.memory[(bp-36)&65535];
 if((flag&128)!==0&&(flag&2)===0){
  if(word(state.memory,bp-18)!==0x4000)return stop('Scanheader liegt in einem nicht geladenen Modulsegment.');
  if(word(state.memory,bp-20)+12>state.module.image.length)return stop('Scanheader liegt außerhalb des geladenen Moduls.');
 }
 const module=new Uint8Array(65536);module.set(state.module.image);
 try{
  const next=prepareOriginalDosSchedulerBoundary(state.memory,module,state.globals,{bp:state.bp,si:state.si,bx:slot,ds:0x4000},state.status);
  if(next.phase==='scan')return stop('Scan-Callback erreicht; seine Ausführung und Rückkehr sind noch nicht angebunden.');
  if(next.ds!==0x4000)return stop('Fortsetzung benötigt ein nicht geladenes Modulsegment.');
  if(next.phase==='main'&&next.si>=state.module.image.length)return stop('Fortsetzung liegt außerhalb des geladenen Moduls.');
  return {...state,memory:next.context,globals:next.globals,bp:next.bp,si:next.si,status:next.phase==='skip'?'next-context':'ready',message:next.phase==='skip'?'Kontextvorbereitung beendet: Kontext übersprungen; nächste Grenze 0x2632.':'Hauptskript vorbereitet; nächster Einzelschritt am gespeicherten Skriptzeiger.'};
 }catch(e){return stop(`Kontextvorbereitung unverändert angehalten: ${String(e)}`);}
}
export function stepNativeScriptDiagnostic(state:NativeScriptDiagnostic):NativeScriptDiagnostic{
 if(state.status!=='ready')return state;
 const stop=(message:string):NativeScriptDiagnostic=>({...state,status:'stopped',message});
 if(state.module.image.length>65536)return stop('Einzelschritte für Module über 64 KiB sind noch nicht angebunden. Kontextprüfung bleibt verfügbar.');
 if(state.si>=state.module.image.length)return stop('Skriptzeiger liegt außerhalb des geladenen Moduls.');
 const opcode=state.module.image[state.si],after=(state.si+1)&65535;
 let memory=state.memory,globals=state.globals,si=after,dx=state.dx,cx=state.cx,status:NativeScriptDiagnostic['status']='ready';
 if(opcode>=5&&opcode<=10){
  const length=[1,2,3][(opcode-5)%3];if(state.si+1+length>state.module.image.length)return stop('Operand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);
  const next=branchOriginalDosScript(script,memory,opcode,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode>=18&&opcode<=29){
  const length=(opcode-18)%3+1;if(state.si+1+length>state.module.image.length)return stop('Bedingter Sprungoperand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);si=branchOriginalDosScriptConditional(script,opcode,after,dx,cx).si;
 }else if(opcode===41){
  if(state.si+5>state.module.image.length)return stop('Blockheader ist im Modul abgeschnitten.');
  const length=4+state.module.image[after+2]*2;if(after+length>state.module.image.length)return stop('Blockdaten sind im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);const next=writeOriginalDosScriptBlock(script,memory,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode===186){
  let cursor=after;
  for(let i=0;i<5;i++){
   const tag=state.module.image[cursor],length=tag===0?2:[2,6,8].includes(tag)?3:0;
   if(!length)return stop(`Opcode186: Zahlenoperand-Tag ${tag} ist noch nicht angebunden.`);
   if(cursor+length>state.module.image.length)return stop('Opcode186: Zahlenoperand ist im Modul abgeschnitten.');
   cursor+=length;
  }
  const script=new Uint8Array(65536);script.set(state.module.image);
  try{const next=writeOriginalDosOpcode186(script,memory,globals,after,state.bp,dx);globals=next.memory;si=next.si;dx=next.dx;cx=next.cx;}
  catch(e){return stop(`Opcode186 unverändert angehalten: ${String(e)}`);}
 }else if(opcode===106){
  const tag=state.module.image[after],length=tag===0?2:[2,6,8].includes(tag)?3:0;
  if(!length)return stop(`Zahlenoperand-Tag ${tag} ist noch nicht angebunden. Befehl unverändert angehalten.`);
  if(after+length>state.module.image.length)return stop('Zahlenoperand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);const next=readOriginalDosNumericOperand(script,memory,after,state.bp);globals=globals.slice();globals[0xc99]=next.value&255;si=next.si;cx=dx;dx=next.value;
 }else if(opcode===62){
  const tag=state.module.image[after],length=tag===0?2:[2,6,8].includes(tag)?3:0;
  if(!length)return stop(`Aktivierungsoperand-Tag ${tag} ist noch nicht angebunden. Befehl unverändert angehalten.`);
  if(state.si+1+length>state.module.image.length)return stop('Aktivierungsoperand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);const next=activateOriginalDosScriptContext(script,memory,globals,after,state.bp);memory=next.memory;si=next.si;cx=dx;dx=next.dx;
 }else if(opcode===31){
  const script=new Uint8Array(65536);script.set(state.module.image);
  try{const next=evaluateOriginalDosScriptExpression(script,memory,after,state.bp,dx,state.module.image.length);si=next.si;dx=next.dx;cx=next.cx;}
  catch(e){return stop(`Ausdruck unverändert angehalten: ${String(e)}`);}
 }else if(opcode===156||opcode===148){
  const resultAt=state.si+(opcode===148?3:1);
  if(resultAt>=state.module.image.length)return stop('Such-/Ergebnisoperand ist im Modul abgeschnitten.');
  const tag=state.module.image[resultAt],length=[18,20].includes(tag)?2:[6,8].includes(tag)?3:0;
  if(!length)return stop(`Ergebnisoperand-Tag ${tag} ist noch nicht angebunden. Befehl unverändert angehalten.`);
  if(resultAt+length>state.module.image.length)return stop('Ergebnisoperand ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);
  const list=opcode===148?findOriginalDosContextsByModule(memory,globals,state.bp,script[after]|(script[after+1]<<8)):enumerateOriginalDosContexts(memory,globals),next=storeOriginalDosScriptResult(script,memory,list.memory,resultAt,state.bp,list.value);
  if('cx' in list)cx=list.cx;
  memory=next.memory;globals=next.globals;si=next.si;dx=list.value;
 }else if(opcode===76){
  let cursor=state.si+1;
  for(let i=0;i<3;i++){
   if(cursor>=state.module.image.length)return stop('Positionsoperand ist im Modul abgeschnitten.');
   const tag=state.module.image[cursor],length=tag===0?2:[2,6,8].includes(tag)?3:0;
   if(!length)return stop(`Positionsoperand-Tag ${tag} ist noch nicht angebunden. Befehl unverändert angehalten.`);
   if(cursor+length>state.module.image.length)return stop('Positionsoperand ist im Modul abgeschnitten.');
   cursor+=length;
  }
  const script=new Uint8Array(65536);script.set(state.module.image);const next=writeOriginalDosScriptPosition(script,memory,after,state.bp);memory=next.memory;si=next.si;cx=next.values[1];dx=next.values[2];
 }else if(opcode===71){
  if(state.si+3>state.module.image.length)return stop('Auswahlwort ist im Modul abgeschnitten.');
  const script=new Uint8Array(65536);script.set(state.module.image);const next=selectOriginalDosScriptWord(script,memory,after,state.bp);memory=next.memory;si=next.si;
 }else if(opcode===17){const next=returnOriginalDosScript(memory,state.bp,after,1,0);memory=next.memory;si=next.si;
 }else if(opcode===66)status='yield';
 else return stop(`Opcode ${opcode} (0x${opcode.toString(16).padStart(2,'0')}) ist in dieser Diagnose noch nicht angebunden. Keine Ausführung und kein Überspringen.`);
 return {...state,memory,globals,si,dx,cx,status,steps:state.steps+1,message:status==='yield'?'Yield erreicht. Scheduler-Fortsetzung ist hier noch nicht angebunden.':`Opcode ${opcode} nach rekonstruierter DOS-Routine ausgeführt.`};
}
