/** Native CS:222A..224D, both identified DOS captures.
 * Selects a record by its signed byte at +1. Meaning of the selected index's
 * downstream consumer is not yet proven; this is not a new playback scheduler.
 */
export function selectOriginalDosTimerRecord(values: readonly number[]): number {
  if (values.length !== 3 || !values.every(v => Number.isInteger(v) && v >= 0 && v <= 255)) {
    throw new Error('Native timer selection requires three unsigned bytes');
  }
  const signed = (v: number) => v < 128 ? v : v - 256;
  let selected = 0;
  for (let index = 1; index < 3; index++) {
    if (signed(values[index]) > signed(values[selected])) selected = index;
  }
  return selected;
}
