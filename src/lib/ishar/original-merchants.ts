/** Reads literal stock assignments from a local ALIS disassembly, never guessed stock. */
export interface MerchantSlot { fields: number[]; addresses: (string|null)[] }
export interface OriginalMerchant { selector:number; entry:string; slots:MerchantSlot[] }
/** OBJET 0x0009b: inventory/held negative codes select literal cput resources. */
export function readOriginalItemResources(listing:string):Record<number,number> {
  const dispatch=listing.split(/\r?\n/).find(line=>line.includes('0009b')&&line.includes('cswitch2'));
  if(!dispatch)throw new Error('OBJET: Dispatch 0x0009b fehlt.');
  const result:Record<number,number>={};
  for(const [,code,label] of dispatch.matchAll(/(-\d+):L_([0-9a-f]+)/g)) {
    const start=listing.indexOf(`L_${label}:`);
    const literal=listing.slice(start).split(/\r?\n/)[1]?.match(/\bcput\s+oimm[bw]\((\d+)\)/);
    if(literal)result[Number(code)]=Number(literal[1]);
  }
  return result;
}
export function readOriginalMerchants(listing:string):OriginalMerchant[] {
  const dispatch=listing.split(/\r?\n/).find(line=>line.includes('cswitch2') && line.includes('00884'));
  if(!dispatch) throw new Error('MARCHAND: erwartete Dispatch-Tabelle 0x00884 fehlt.');
  const targets=[...dispatch.matchAll(/(\d+):L_([0-9a-f]+)/g)];
  if(targets.length!==17) throw new Error('MARCHAND: unbekannte Skriptversion.');
  return targets.map(([,selector,entry])=>{
    const start=listing.indexOf(`L_${entry}:`);
    if(start<0) throw new Error(`Routine ${entry} fehlt.`);
    const body=listing.slice(start).split(/\r?\n/);
    const slots=Array.from({length:6},()=>({fields:[0,0,0,1],addresses:Array<string|null>(4).fill(null)}));
    for(const line of body.slice(1)) {
      if(/\bcjmp24\b.*L_0129c/.test(line) || /^L_/.test(line)) break;
      const match=line.match(/^\s*([0-9a-f]+)\s+\S+\s+cstore\s+oimm[bw]\((-?\d+)\), ->seval\(oimmb\((\d+)\) opushacc oimmb\((\d+)\),sdirti\(0x28\)\)/);
      if(!match) continue;
      const [,address,value,slot,field]=match;
      if(+slot!>=6 || +field!>=4) throw new Error('Ungültiger Warenplatz.');
      slots[+slot!]!.fields[+field!]=+value!;
      slots[+slot!]!.addresses[+field!]=`0x${address}`;
    }
    return {selector:+selector!,entry:`0x${entry}`,slots};
  });
}
/** MARCHAND 0x00603: character money is stored in thousands and remainder. */
export function subtractOriginalPrice(balance:[number,number],price:[number,number]):[number,number]|null {
  if([...balance,...price].some(v=>!Number.isInteger(v)||v<0) || balance[1]>=1000 || price[1]>=1000) throw new Error('Ungültige Goldfelder.');
  const remaining=balance[0]*1000+balance[1]-price[0]*1000-price[1];
  return remaining<0?null:[Math.floor(remaining/1000),remaining%1000];
}
