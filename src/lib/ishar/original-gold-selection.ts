import {addOriginalGold,debitOriginalGold,type OriginalGoldPair} from './original-npc-gold.ts';
/** FRISE 0x04038..0x04044 and 0x04478..0x046a4, selection arithmetic only.
 * Caller retains the transient repeat counter: entry does not reset 0x010c.
 * Mouse coordinates are original logical HUD coordinates, not browser pixels. */
export interface OriginalGoldSelection { gold:OriginalGoldPair;step:number;repeatCounter:number }
const word=(n:number)=>((n&65535)^32768)-32768;
function validate(state:OriginalGoldSelection){
 if([...state.gold,state.step,state.repeatCounter].some(n=>!Number.isInteger(n)||n< -32768||n>32767))throw Error('Invalid signed16 gold selection state');
}
export function beginOriginalGoldSelection(repeatCounter:number):OriginalGoldSelection {
 const state={gold:[0,0] as OriginalGoldPair,step:1,repeatCounter};validate(state);return state;
}
export function originalGoldSelectionInput(state:OriginalGoldSelection,balance:OriginalGoldPair,input:{button:number;x:number;y:number}):{state:OriginalGoldSelection;action:'idle'|'changed'|'exit';accepted:boolean}{
 validate(state);if([...balance].some(n=>!Number.isInteger(n)||n< -32768||n>32767)||![input.button,input.x,input.y].every(Number.isInteger))throw Error('Invalid gold selection input');
 const next={...state,gold:[...state.gold] as OriginalGoldPair};
 if(input.button!==1){
  if(input.button===2)return {state:next,action:'exit',accepted:false};
  next.step=1;next.repeatCounter=0;return {state:next,action:'idle',accepted:false};
 }
 // FRISE 0x0407f/0x0408c/0x04304: row containing amount arrows.
 if(!(input.y>82&&input.y<=98))return {state:next,action:'idle',accepted:false};
 if(input.x>231&&input.x<256)return {state:next,action:'exit',accepted:false};
 let candidate:OriginalGoldPair;
 if(input.x>183&&input.x<195){
  candidate=addOriginalGold(state.gold,[0,state.step]);
  if(!(candidate[0]<balance[0]||(candidate[0]===balance[0]&&candidate[1]<=balance[1])))return {state:next,action:'idle',accepted:false};
 }else if(input.x>220&&input.x<232){
  // Exact original behavior: failed debit leaves selection unchanged; if the
  // selection is still nonnegative it nevertheless advances the repeat counter.
  candidate=debitOriginalGold(state.gold,[0,state.step]).gold;
  if(!(candidate[0]>0||(candidate[0]===0&&candidate[1]>=0)))return {state:next,action:'idle',accepted:false};
 }else return {state:next,action:'idle',accepted:false};
 next.gold=candidate;
 if(next.repeatCounter>=25){if(next.step<100)next.step=word(next.step*10);next.repeatCounter=0;}
 next.repeatCounter=word(next.repeatCounter+1);
 return {state:next,action:'changed',accepted:true};
}
/** FRISE 0x0426e..0x042a3: select all available character gold. */
export function selectAllOriginalGold(state:OriginalGoldSelection,balance:OriginalGoldPair):OriginalGoldSelection {
 validate(state);if(balance.some(n=>!Number.isInteger(n)||n< -32768||n>32767))throw Error('Invalid signed16 gold fields');
 return {...state,gold:[...balance]};
}
