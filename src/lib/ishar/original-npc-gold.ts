/** FRISE.IO 0x06865..0x0693d: original signed16 two-word currency arithmetic.
 * Values are [thousands,remainder]. Noncanonical/overflow behavior is preserved. */
export type OriginalGoldPair=readonly [number,number];
const word=(n:number)=>((n&65535)^32768)-32768;
function check(values:readonly number[]){if(values.some(n=>!Number.isInteger(n)||n< -32768||n>32767))throw Error('Expected signed16 gold fields');}
export function addOriginalGold(balance:OriginalGoldPair,amount:OriginalGoldPair):[number,number]{
 check([...balance,...amount]);let remainder=word(balance[1]+amount[1]),thousands=word(balance[0]+amount[0]);
 if(remainder>999){thousands=word(thousands+Math.trunc(remainder/1000));remainder=word(remainder%1000);}
 return [thousands,remainder];
}
export function debitOriginalGold(balance:OriginalGoldPair,amount:OriginalGoldPair):{gold:[number,number];insufficient:boolean}{
 check([...balance,...amount]);let [thousands,remainder]=balance;
 if(thousands>amount[0]||(thousands===amount[0]&&remainder>=amount[1])){
  remainder=word(remainder-amount[1]);thousands=word(thousands-amount[0]);
  if(remainder<0){thousands=word(thousands+Math.trunc(remainder/1000));remainder=word(1000-Math.abs(remainder%1000));if(remainder===1000)remainder=0;else thousands=word(thousands-1);}
  return {gold:[thousands,remainder],insufficient:false};
 }
 return {gold:[thousands,remainder],insufficient:true};
}
/** FRISE 0x046ac..0x04756: selected gold to actor, then acknowledgement 1.
 * Caller supplies already resolved visual entity's actor byte (0x0d).
 * Original does NOT branch on debit failure inside this subroutine; do not
 * silently replace that with an invented transaction guard. Trace only. */
export function originalNpcGoldTransfer(main:ReadonlyMap<number,number>,carrier:number,actor:number,amount:OriginalGoldPair){
 if(!Number.isInteger(carrier)||carrier<0||carrier>4||!Number.isInteger(actor)||actor<50||actor>=110)throw Error('Invalid original carrier/actor');
 check(amount);
 const operations:{address:number;width:1|2;value:number}[]=[];
 if(!(amount[0]>0||amount[1]>0))return {operations,insufficient:false};
 const read=(at:number)=>{const hi=main.get(at),lo=main.get(at+1);if(hi===undefined||lo===undefined||![hi,lo].every(n=>Number.isInteger(n)&&n>=0&&n<256))throw Error(`Missing/invalid MAIN ${at.toString(16)}`);return word((hi<<8)|lo);};
 const debit=debitOriginalGold([read(0x2d68+carrier*2),read(0x2d80+carrier*2)],amount);
 operations.push({address:0x2d80+carrier*2,width:2,value:debit.gold[1]},{address:0x2d68+carrier*2,width:2,value:debit.gold[0]});
 const credit=addOriginalGold([read(0x378a+actor*2),read(0x3868+actor*2)],amount);
 operations.push({address:0x378a+actor*2,width:2,value:credit[0]},{address:0x3868+actor*2,width:2,value:credit[1]},{address:0x442a+actor,width:1,value:1});
 return {operations,insufficient:debit.insufficient};
}
