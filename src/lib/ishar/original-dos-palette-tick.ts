import {planOriginalDosPaletteUpload} from './original-dos-palette-upload.ts';
import {stepOriginalDosPalette} from './original-dos-palette-step.ts';
export interface OriginalDosPaletteTickState {
 current:Uint8Array;shadow:Uint8Array;target:Uint8Array;
 mode:number;countdown:number;reload:number;step:number;active:number;
 retraceMode:number;interruptsEnabled:boolean;
}
/** Native 1E97:0EA8..0EC8 and its real helpers. Caller gates are external. */
export function stepOriginalDosPaletteTick(source:OriginalDosPaletteTickState,retraceReady:boolean){
 if(![source.mode,source.countdown,source.reload,source.step,source.active,source.retraceMode].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||[source.current,source.shadow,source.target].some(v=>v.length!==768))throw new Error('Invalid native palette tick state');
 const state={...source,current:Uint8Array.from(source.current),shadow:Uint8Array.from(source.shadow),target:Uint8Array.from(source.target)};
 if(state.mode===1)return {state,ports:[] as {port:number;value:number}[],exit:'returned' as const};
 const uploaded=planOriginalDosPaletteUpload(state.current,state.shadow,state.retraceMode,retraceReady,state.interruptsEnabled);
 state.shadow=uploaded.shadow;state.interruptsEnabled=uploaded.interruptsEnabled;
 if(uploaded.exit==='wait-retrace')return {state,ports:uploaded.ports,exit:uploaded.exit};
 state.countdown=(state.countdown-1)&255;
 if(state.countdown>=128){
  state.countdown=state.reload;
  const next=stepOriginalDosPalette(state.current,state.target,state.step);state.current=next.bytes;state.active=next.active;
 }
 return {state,ports:uploaded.ports,exit:'returned' as const};
}
