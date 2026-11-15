import {stepOriginalBlancpcInterrupt,type BlancpcInterruptState} from './original-blancpc-interrupt.ts';
export interface DosTimerTickState extends BlancpcInterruptState {restartPointer:number;timerStep:number;timerCountdown:number;timerReload:number}
/** Installed native engine stub, not the unchanged BLANCPC file stub.
 * Shared sample/rotate core; additional unsigned timer subtraction/chain. */
export function stepOriginalDosTimerTick(state:DosTimerTickState,readCodeByte:(offset:number)=>number){
 if(![state.restartPointer,state.timerStep,state.timerCountdown,state.timerReload].every(n=>Number.isInteger(n)&&n>=0&&n<=65535))throw Error('Invalid installed timer tick words');
 const core=stepOriginalBlancpcInterrupt(state,readCodeByte),next={...state,...core.state};
 if(core.path==='end'||core.path==='repeat')next.samplePointer=state.restartPointer;
 if(core.exit==='far-jump')return {state:next,ports:core.ports,exit:'sample-end' as const};
 const borrow=state.timerCountdown<state.timerStep;
 next.timerCountdown=borrow?state.timerReload:(state.timerCountdown-state.timerStep)&65535;
 return {state:next,ports:core.ports,exit:borrow?'timer-chain' as const:'iret' as const};
}
