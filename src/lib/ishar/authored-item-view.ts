import type {AuthoredGame,AuthoredItem,AuthoredLocation,Direction} from './types';
import {canTravel,doorBetween} from './dungeon.ts';
import {doorLeafKind} from './dungeon-scenes.ts';

/** Replace the starter's invented rune, preserving references and placement IDs. */
export function originalStarterItem(item:AuthoredItem):AuthoredItem {
  if((item.definitionId??item.id)!=='crypt-rune')return item;
  return {...item,name:'Originalobjekt 9',description:'Ishar 2 · Objekt 9 (OBJET.IO 0x003ad).',originalObjectCode:9};
}
/** Verified ground resource families, separate from inventory-only resources. */
export function originalItemResource(item:AuthoredItem,depth:number) {
  if(!Number.isInteger(depth)||depth<0||depth>2)return undefined;
  if(item.originalObjectCode===9)return 115+depth;
  if(item.originalObjectCode===10)return 90+depth;
  if(/schl[uü]ssel|\bkey\b/i.test(item.name+' '+item.description))return 69+depth;
  return undefined;
}
/** Authored placements follow their connected cells. Closed wooden doors terminate sight; grates permit sight.
 * This is the builder placement adapter, not AFFOBJ's original map-table reader. */
export function authoredItemsInSight(game:AuthoredGame,location:AuthoredLocation,facing:Direction,openDoors:string[],collected:string[]) {
  const result:{id:string;depth:number}[]=[];
  let cell:AuthoredLocation|undefined=location;
  for(let depth=0;depth<3&&cell;depth++) {
    result.push(...cell.itemIds.filter(id=>!collected.includes(id)).map(id=>({id,depth})));
    const next=canTravel(game.locations,cell,facing);
    if(!next)break;
    const door=doorBetween(game.doors,cell,next);
    if(door&&!openDoors.includes(door.id)&&doorLeafKind(door.originalIndex,cell.tilesetId??game.levels?.find(level=>level.id===cell!.levelId)?.tilesetId)!=='grate')break;
    cell=next;
  }
  return result.reverse();
}
