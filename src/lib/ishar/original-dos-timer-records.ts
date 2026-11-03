import {selectOriginalDosTimerRecord} from './original-dos-timer-selection.ts';
import {stepOriginalDosTimerRecord} from './original-dos-timer-record.ts';
import {applyOriginalDosSpeakerRecord} from './original-dos-speaker-record.ts';

/** Native timer slice 0DD6..0E12 with 8BBD gates. Other timer work excluded. */
export function stepOriginalDosTimerRecords(records: readonly Uint8Array[], mode: number, suppressByte: number, port61: number, cachedWord: number, readPort41: () => number) {
  if (records.length !== 3 || records.some(r => r.length !== 16)) throw new Error('Expected three native timer records');
  if (![0,1,4].includes(mode)) throw new Error('Unreconstructed native device mode');
  if (!Number.isInteger(suppressByte) || suppressByte < 0 || suppressByte > 255) throw new Error('Invalid native output suppression byte');
  const selected = selectOriginalDosTimerRecord(records.map(r => r[1]));
  const output = records.map(r => Uint8Array.from(r));
  const ports: {port:number;value:number}[] = [];
  for (let index=0;index<3;index++) {
    // The caller uses signed-positive byte +0, independently of selection.
    if (output[index][0] === 0 || output[index][0] >= 128) continue;
    const result=stepOriginalDosTimerRecord(output[index]);
    output[index]=result.bytes;
    if (result.deviceCall && mode !== 0 && suppressByte === 0 && index === selected) {
      const device=applyOriginalDosSpeakerRecord(result.bytes,mode,port61,cachedWord,readPort41);
      ports.push(...device.ports);port61=device.port61;
    }
  }
  return {records:output,selected,ports,port61};
}
