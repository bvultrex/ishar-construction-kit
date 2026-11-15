import {planOriginalDosTimerReturn} from './original-dos-timer-return.ts';
import {selectOriginalDosTimerRecord} from './original-dos-timer-selection.ts';
/** D98..E46 with inactive callbacks/records and actual IRET branch only.
 * audioCallbackByte is controlled CS:9414 data, not inferred from globals.
 * No real-time delivery, BIOS chain, device or graphics callback is invented.
 */
export function stepOriginalDosIdleTimerIrq(globals:Uint8Array,audioCallbackByte:number){
 if(globals.length!==65536||audioCallbackByte!==0)throw Error('Native idle IRQ requires inactive audio callback');
 if(globals[0x2898]!==0&&globals[0xcb8]!==0)throw Error('Native palette callback is outside idle IRQ contract');
 if(globals[0x2896]!==0&&globals[0xcb1]<128)throw Error('Native cursor callback is outside idle IRQ contract');
 if([0x1dfd,0x1e0d,0x1e1d].some(at=>globals[at]>0&&globals[at]<128))throw Error('Active timer records are outside idle IRQ contract');
 const tail=planOriginalDosTimerReturn(globals[0xc97],globals[0xc98],globals[0xcd8],globals[0xcc5]);
 if(tail.exit!=='iret')throw Error('Saved BIOS handler chain is outside idle IRQ contract');
 const memory=globals.slice();memory[0xc9a]=Math.min(255,memory[0xc9a]+1);memory[0xc97]=tail.counter;
 memory[0xcd7]=selectOriginalDosTimerRecord([memory[0x1dfe],memory[0x1e0e],memory[0x1e1e]]);
 return {memory,ports:[{port:0x20,value:0x60}],exit:'iret' as const};
}
