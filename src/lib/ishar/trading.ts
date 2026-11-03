import type { AuthoredNpc } from './types.ts';

export interface TradeState {
  gold:number;
  remaining:Record<string,number>;
  purchased:{id:string;definitionId:string;ownerId:string}[];
}
export function stockKey(npcId:string,index:number) { return JSON.stringify([npcId,index]); }
/** Pure transaction: reject invalid stock, insufficient funds and full bags
 * before changing any balance or generating a new inventory instance. */
export function buyFromNpc(state:TradeState,npc:AuthoredNpc,index:number,ownerId:string,bagCount:number,createId:()=>string) {
  const stock=npc.stock?.[index];
  const key=stockKey(npc.id,index);
  const remaining=state.remaining[key]??stock?.quantity??0;
  if(!stock || !Number.isSafeInteger(stock.price) || stock.price<0 || !Number.isSafeInteger(remaining) || remaining<=0) return {ok:false as const,message:'Diese Ware ist nicht verfügbar.'};
  if(!ownerId || bagCount>=9) return {ok:false as const,message:'Kein freier Inventarplatz.'};
  if(state.gold<stock.price) return {ok:false as const,message:'Nicht genügend Gold.'};
  const purchase={id:`purchase:${createId()}`,definitionId:stock.itemId,ownerId};
  return {ok:true as const,purchase,state:{gold:state.gold-stock.price,remaining:{...state.remaining,[key]:remaining-1},purchased:[...state.purchased,purchase]}};
}
