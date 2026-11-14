import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {importCont,cellWalkable,canStep} from '../src/lib/ishar/cont-grid.ts';
import {FACING_CODE} from '../src/lib/ishar/grid-view.ts';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readOriginalMerchants} from '../src/lib/ishar/original-merchants.ts';
import {readOriginalCarrier,receiveOriginalPurchase,isOriginalSave,ORIGINAL_COMMERCE_OFFSETS as offsets} from '../src/lib/ishar/original-commerce.ts';
import {originalShopEntry} from '../src/lib/ishar/original-shop-entry.ts';
import {deriveIshar2SaveLayout,readIshar2SavedMain} from '../src/lib/ishar/ishar2-save-layout.ts';
assert.ok(process.env.ISHAR2_DIR&&process.env.ISHAR_MERCHANT_LISTING,'ISHAR2_DIR and ISHAR_MERCHANT_LISTING required');
const root=resolve(process.env.ISHAR2_DIR),outputRoot=resolve(process.env.ISHAR_PRIVATE_OUTPUT??'../analysis-output');
const sourceFilter=process.argv.find(arg=>arg.startsWith('--source-save='))?.slice('--source-save='.length);
assert.ok(sourceFilter===undefined||/^[^\\/]+\.sav$/i.test(sourceFilter),'--source-save requires a SAV basename');
const saves=readdirSync(root).filter(n=>/\.sav$/i.test(n)&&(!sourceFilter||n.toLowerCase()===sourceFilter.toLowerCase())).sort();
assert.ok(saves.length,'No matching source SAV');
const inside=(base,path)=>{const r=relative(base,path);return !r||(!r.startsWith('..')&&!isAbsolute(r));};
assert.ok(!inside(root,outputRoot)&&!inside(resolve('.'),outputRoot),'Private output must be outside repository/originals');
const hash=data=>createHash('sha256').update(data).digest('hex');
const rawMerchant=new Uint8Array(readFileSync(join(root,'MARCHAND.IO'))),image=readAlisModule(rawMerchant).image;
const listing=readFileSync(process.env.ISHAR_MERCHANT_LISTING,'utf8');let prefixes=0;
for(const line of listing.split(/\r?\n/)){const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s+/i);if(!m)continue;const pc=parseInt(m[1],16),bytes=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(image.subarray(pc,pc+bytes.length)),bytes,'MARCHAND listing prefix mismatch');prefixes++;}
assert.ok(prefixes>100);const merchants=readOriginalMerchants(listing);
const layout=await deriveIshar2SaveLayout(new Uint8Array(readFileSync(join(root,'IO.IO'))));
let found;
for(const map of [1,2,3]){
 const cont=new Uint8Array(readFileSync(join(root,`CONT${map}.FIC`))),parsed=importCont(cont,`CONT${map}.FIC`,hash(cont));assert.ok(parsed.ok);
 for(let row=1;row<parsed.grid.rows-1&&!found;row++)for(let col=1;col<parsed.grid.cols-1&&!found;col++){
  if(!cellWalkable(parsed.grid,row,col))continue;
  for(const facing of ['east','south','west','north']){
   const event=canStep(parsed.grid,row,col,facing,()=>false,true);if(event.kind!=='event'||event.message!==17)continue;
   const entry=originalShopEntry(event.value,1);if(entry?.kind!=='merchant')continue;
   const merchant=merchants.find(m=>m.selector===entry.selector);if(!merchant)continue;
   for(const name of saves){
    const original=new Uint8Array(readFileSync(join(root,name)));if(!isOriginalSave(original)||new DataView(original.buffer).getUint16(90,false)===3)continue;
    for(let carrier=0;carrier<5&&!found;carrier++){
     const person=readOriginalCarrier(original,carrier);if(!person.present)continue;
     for(let stock=0;stock<merchant.slots.length&&!found;stock++){
      const [objectCode,a,b,quantity]=merchant.slots[stock].fields;if(objectCode>=0||objectCode< -89)continue;
      const purchase={objectCode,price:[a,b],quantity};const received=receiveOriginalPurchase(original,purchase,carrier);if(!received.ok)continue;
      found={map,row,col,facing,event,selector:entry.selector,source:name,original,carrier,stock,purchase,contSha256:hash(cont)};
     }
    }
   }
   if(found)break;
  }
 }
 if(found)break;
}
assert.ok(found,'No reachable original merchant/affordable stock/recipient case');
const {original}=found,source=original.slice(),view=new DataView(source.buffer);
for(const [at,value] of [[2,found.row],[4,found.col],[6,FACING_CODE[found.facing]],[8,found.map]])view.setUint16(at,value,false);
const inputPatches=[];original.forEach((value,offset)=>{if(value!==source[offset])inputPatches.push({offset,before:value,after:source[offset]});});
const result=receiveOriginalPurchase(source,found.purchase,found.carrier);assert.ok(result.ok);
const changedOffsets=[],allowed=new Set([...Array.from({length:4},(_,i)=>i<2?offsets.goldThousands+found.carrier*2+i:offsets.goldRemainder+found.carrier*2+i-2),offsets.inventory+found.carrier*30+result.slot*2,offsets.inventory+found.carrier*30+result.slot*2+1,...Array.from({length:20},(_,i)=>offsets.stacks+found.carrier*20+i)]);
source.forEach((value,offset)=>{if(value!==result.bytes[offset]){assert.ok(allowed.has(offset),`Unexpected shop write ${offset}`);changedOffsets.push(offset);}});
const dir=mkdtempSync(join(outputRoot,'shop-roundtrip-'));writeFileSync(join(dir,'INPUT.SAV'),source,{flag:'wx'});writeFileSync(join(dir,'EXPECTED.SAV'),result.bytes,{flag:'wx'});
const reloaded=new Uint8Array(readFileSync(join(dir,'EXPECTED.SAV')));assert.deepEqual(reloaded,result.bytes);
assert.equal(readOriginalCarrier(reloaded,found.carrier).slots[result.slot],found.purchase.objectCode);
const main=readIshar2SavedMain(reloaded,layout),address=0x2d8e+found.carrier*30+result.slot*2;
assert.equal((main.get(address)<<8)|main.get(address+1),found.purchase.objectCode&65535);
assert.deepEqual(new Uint8Array(readFileSync(join(root,found.source))),original);
const {original:omit,...metadata}=found;
writeFileSync(join(dir,'report.json'),JSON.stringify({...metadata,originalSha256:hash(original),inputSha256:hash(source),merchantSha256:hash(rawMerchant),listingPrefixes:prefixes,inputPatches,changedOffsets,slot:result.slot,accepted:result.accepted,discarded:result.discarded,exportSha256:hash(reloaded),limits:'Original merchant event cell and stock. Camera-only patched SAVE; host purchase and IO-layout readback; browser and original EXE execution still separate.'},null,2));
console.log(`Original merchant event/stock -> recipient -> disk/IO-layout readback passed. Private artifacts: ${dir}`);
