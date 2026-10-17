/** Native mouse callback 1000:1249..1258: stores BX/CX/DX, ignores AX's event mask. */
export function latchOriginalDosMouseCallback(bx: number, cx: number, dx: number) {
  if (![bx,cx,dx].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)) throw new Error('Native mouse callback registers must be words');
  return {rawX:cx,rawY:dx,rawState:bx};
}

/** Native 1000:1259..129D. Raw state only; no host mouse integration. */
export function readOriginalDosInputSnapshot(blockedByte: number, modeByte: number, rawX: number, rawY: number, rawState: number) {
  if (![blockedByte,modeByte].every(v=>Number.isInteger(v)&&v>=0&&v<=255) || ![rawX,rawY,rawState].every(v=>Number.isInteger(v)&&v>=0&&v<=65535)) throw new Error('Invalid native input snapshot fields');
  if (blockedByte!==0) return {ax:65535,bx:65535,cx:0};
  let ax=modeByte===1?rawX:rawX>>>1;
  let bx=rawY;
  if (modeByte===0) {ax=(ax+1)&65535;bx=(bx+1)&65535;}
  return {ax,bx,cx:rawState};
}
