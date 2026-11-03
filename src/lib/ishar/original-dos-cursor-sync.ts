/** One observed attempt of 1183, or release 11A5. A retry models the real
 * polling loop boundary, not successful acquisition or a host blocking wait.
 */
export function stepOriginalDosCursorSync(operation: 'acquire'|'release', mode: number, guard: number, interruptsEnabled: boolean) {
  if (!['acquire','release'].includes(operation)||![mode,guard].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||typeof interruptsEnabled!=='boolean')throw new Error('Invalid native cursor synchronization state');
  const ports:{port:number;value:number}[]=[];
  if(mode===0){ports.push({port:0x21,value:operation==='acquire'?254:0});return {guard,interruptsEnabled:true,ports,exit:'returned' as const};}
  if(operation==='release')return {guard:255,interruptsEnabled,ports,exit:'returned' as const};
  return guard===255?{guard:0,interruptsEnabled,ports,exit:'returned' as const}:{guard,interruptsEnabled,ports,exit:'retry' as const};
}
