/** CS:224E..2299, up to the device call 8BBD. Field names remain offsets.
 * Preserves unknown bytes and the native 16-bit wrap/sign tests.
 */
export function stepOriginalDosTimerRecord(source: Uint8Array) {
  if (source.length !== 16) throw new Error('Native timer record must contain 16 bytes');
  const bytes = Uint8Array.from(source);
  const view = new DataView(bytes.buffer);
  const word = (offset: number) => view.getUint16(offset, true);
  const put = (offset: number, value: number) => view.setUint16(offset, value, true);
  if (bytes[2] >= 128) return {bytes, deviceCall: false, stopped: false};
  const stop = () => {
    put(6, 0); put(10, 0); bytes[1] = 128; bytes[2] = 0; bytes[0] = 0;
    return {bytes, deviceCall: true, stopped: true};
  };
  put(4, (word(4) - 1) & 65535);
  if (word(4) === 0) return stop();
  const first = (word(6) + word(8)) & 65535;
  if (first >= 32768) return stop();
  // CMP 7FFF/JLE after JS: all remaining values already satisfy this bound.
  put(6, first);
  const second = (word(10) + word(12)) & 65535;
  if (second >= 32768) return stop();
  put(10, second);
  return {bytes, deviceCall: true, stopped: false};
}
