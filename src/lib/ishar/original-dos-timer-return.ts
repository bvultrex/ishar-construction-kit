/** CS:0E15..0E46, after CALL 670D has returned. */
export function planOriginalDosTimerReturn(counter: number, reload: number, inhibit: number, mode: number) {
  if (![counter,reload,inhibit,mode].every(v=>Number.isInteger(v)&&v>=0&&v<=255)) throw new Error('Native timer return inputs must be bytes');
  let next=(counter-1)&255;
  if (next!==0) return {counter:next,exit:'iret' as const};
  next=reload;
  return {counter:next,exit:inhibit===0&&mode<2?'saved-handler' as const:'iret' as const};
}
