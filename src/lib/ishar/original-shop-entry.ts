/** MAIN 0x02e14, 0x03169 and 0x0326a; GERDEP supplies layer B via message 17. */
export function originalShopEntry(value:number,dayPhase=1) {
  const scan=Math.abs(value);
  if(scan>16&&scan<40)return dayPhase===3
    ? {kind:'closed' as const}
    : {kind:'merchant' as const,selector:scan-17};
  if(scan>0&&scan<16)return {kind:'tavern' as const,selector:scan-1};
  return null;
}
