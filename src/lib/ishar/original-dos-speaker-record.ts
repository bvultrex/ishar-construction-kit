/** Native 8BBD..8CA8 for device modes 1/4 only. Returns emulated I/O,
 * never accesses host hardware. Other device modes remain unimplemented.
 */
export function applyOriginalDosSpeakerRecord(record: Uint8Array, mode: number, port61: number, cachedWord: number, readPort41: () => number) {
  if (record.length !== 16 || ![1,4].includes(mode)) throw new Error('Expected 16-byte native record and device mode 1 or 4');
  if (!Number.isInteger(port61) || port61 < 0 || port61 > 255 || !Number.isInteger(cachedWord) || cachedWord < 0 || cachedWord > 65535) throw new Error('Invalid native speaker state');
  const view = new DataView(record.buffer, record.byteOffset, 16);
  const ports: {port:number;value:number}[]=[];
  const out=(port:number,value:number)=>{ports.push({port,value});if(port===0x61)port61=value;};
  if (record[7] === 0) out(0x61,port61 & 0xfd);
  else if (!(port61 & 2)) out(0x61,port61 | 2);
  out(0x43,0xb6);
  const divisor=(view.getUint16(10,true)+100)&65535;
  if (divisor!==cachedWord) {out(0x42,divisor&255);out(0x42,divisor>>>8);}
  if (record[2] === 0) out(0x61,port61 & 0xfe);
  else if (!(port61&1)) {
    out(0x61,port61|1);
    if (record[2]&2) {
      const first=readPort41(),second=readPort41();
      if (![first,second].every(v=>Number.isInteger(v)&&v>=0&&v<=255)) throw new Error('Port41 must return bytes');
      let count=(first&7)+1,value=(view.getUint16(10,true)>>>4)+1;
      do {value=(value<<1)&65535;if(value&32768)break;} while(--count!==0);
      out(0x42,value&255);out(0x42,value>>>8);
    }
  }
  return {ports,port61};
}
