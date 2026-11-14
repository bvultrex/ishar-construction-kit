import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {deriveIshar2SaveLayout} from '../src/lib/ishar/ishar2-save-layout.ts';
import {evaluateOriginalAlisInteger} from '../src/lib/ishar/original-alis-expression.ts';
import {dosAlisIntegerOperandEnd} from '../src/lib/ishar/original-alis-operand-layout.ts';
import {receiveOriginalGround} from '../src/lib/ishar/original-ground-runtime.ts';
const root=process.env.ISHAR2_DIR,listings=process.env.ISHAR_ACTOR_LISTINGS;assert.ok(root&&listings,'ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
const raw=new Uint8Array(readFileSync(join(root,'FRISE.IO')));
assert.equal(createHash('sha256').update(raw).digest('hex'),'27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64');
const image=readAlisModule(raw).image,text=readFileSync(join(listings,'FRISE.IO.asm'),'utf8');
const line=text.split(/\r?\n/).map(l=>l.match(/^\s*007c9\s+([\da-f]+)\s+ceval\s+(.+)$/)).find(Boolean);assert.ok(line);
const prefix=Buffer.from(line[1],'hex');assert.deepEqual(Buffer.from(image.subarray(0x7c9,0x7c9+prefix.length)),prefix);
// Encode the stated predicate independently instead of trusting truncated listing bytes.
const tags={localByte:0x12,mainWordTable:0x28,mainByteTable:0x26,immediate:0,greater:0x54,notEqual:0x4c,push:0x40,pile:0x36,and:0x42};
const emit=(name,value)=>value===undefined?[tags[name]]:['mainWordTable','mainByteTable'].includes(name)?[tags[name],value&255,value>>>8]:[tags[name],value&255];
const predicate=new Uint8Array([0x38,...emit('localByte',0x13),...emit('mainWordTable',0x2d5c),...emit('greater'),...emit('immediate',0),...emit('push'),...emit('localByte',0x13),...emit('mainByteTable',0x2e9e),...emit('notEqual'),...emit('immediate',-1),...emit('and'),...emit('pile'),0x3a]);
const end=dosAlisIntegerOperandEnd(image,0x7ca);assert.equal(image[0x7c9],31);assert.deepEqual(image.subarray(0x7ca,end),predicate,'Full original recipient predicate differs from encoded contract');
const layout=await deriveIshar2SaveLayout(new Uint8Array(readFileSync(join(root,'IO.IO'))));
for(const [address,offset] of [[0x2d5c,996],[0x2e9e,1276],[0x2d8e,1036],[0x2d68,1006],[0x2d80,1026],[0x4c94,14],[0x4c96,16]])assert.equal(layout.fields.find(f=>f.memoryAddress===address).fileOffset,offset);
let cases=0;
for(let carrier=0;carrier<5;carrier++)for(const hp of [-32768,-1,0,1,32767])for(const characterClass of [0,1,254,255]){
 const bytes=new Uint8Array(8359),view=new DataView(bytes.buffer);view.setUint16(0,2,false);view.setInt16(996+carrier*2,hp,false);bytes.fill(255,1276,1281);bytes[1276+carrier]=characterClass;
 const allowed=evaluateOriginalAlisInteger(line[2],{scan:0,read:(space,at,word)=>{assert.equal(space,'local');assert.equal(at,0x13);assert.equal(word,false);return carrier;},table:(space,at,index)=>{assert.equal(space,'main');assert.equal(index,carrier);if(at===0x2d5c)return hp;assert.equal(at,0x2e9e);return characterClass>=128?characterClass-256:characterClass;}})!==0;
 const before=bytes.slice(),received=receiveOriginalGround(bytes,9,carrier);assert.equal(received!==null,allowed);assert.deepEqual(bytes,before);
 if(received){assert.equal(new DataView(received.buffer).getInt16(1036+carrier*30,false),9);for(let at=0;at<bytes.length;at++)if(![1036+carrier*30,1037+carrier*30].includes(at))assert.equal(received[at],bytes[at]);}
 cases++;
}
console.log(`${cases} portrait recipient cases agree with hash-bound FRISE007C9 expression and binary IO mapping. Full encoded predicate and listing expression checked; no native EXE execution claim.`);

// Independently execute the listing's arithmetic statements in local-word state.
const statements=new Map();
for(const [pc,op,args] of [
 [0x6865,'cadd','olocw(0x0114), +>alocw(0x0112)'],
 [0x686c,'cadd','olocw(0x0118), +>alocw(0x0116)'],
 [0x6873,'ceval','(olocw(0x0112) osup(oimmw(999)))'],
 [0x6881,'cadd','(olocw(0x0112) odiv(oimmw(1000))), +>alocw(0x0116)'],
 [0x688e,'cstore','(olocw(0x0112) omod(oimmw(1000))), ->slocw(0x0112)'],
]){
 const row=text.split(/\r?\n/).map(l=>l.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s+(\w+)\s+(.+?)\s*$/)).find(m=>m&&parseInt(m[1],16)===pc);
 assert.ok(row);assert.equal(row[3],op);assert.equal(row[4],args);
 assert.deepEqual(Buffer.from(image.subarray(pc,pc+row[2].length/2)),Buffer.from(row[2],'hex'));
 statements.set(pc,args.split(/, (?:\+>|->)/)[0]);
}
let goldCases=0;
for(let carrier=0;carrier<5;carrier++)for(const units of [0,999,32767,-32768])for(const pendingUnits of [0,1,999,2500,-1])for(const pendingThousands of [0,1,32767]){
 const bytes=new Uint8Array(8359),w=new DataView(bytes.buffer);w.setUint16(0,2);w.setInt16(996+carrier*2,1);bytes.fill(255,1276,1281);bytes[1276+carrier]=0;
 for(let slot=0;slot<9;slot++)w.setInt16(1036+carrier*30+slot*2,-1); // full backpack must not reject gold
 w.setInt16(1006+carrier*2,32767);w.setInt16(1026+carrier*2,units);w.setInt16(14,pendingThousands);w.setInt16(16,pendingUnits);
 const local=new Map([[0x112,units],[0x114,pendingUnits],[0x116,32767],[0x118,pendingThousands]]);
 const evalAt=pc=>evaluateOriginalAlisInteger(statements.get(pc),{scan:0,read:(space,at,word)=>{assert.equal(space,'local');assert.equal(word,true);assert.ok(local.has(at));return local.get(at);}});
 const set=(at,value)=>local.set(at,(value<<16)>>16);
 set(0x112,local.get(0x112)+evalAt(0x6865));set(0x116,local.get(0x116)+evalAt(0x686c));
 if(evalAt(0x6873)){set(0x116,local.get(0x116)+evalAt(0x6881));set(0x112,evalAt(0x688e));}
 const before=bytes.slice(),result=receiveOriginalGround(bytes,10,carrier),r=new DataView(result.buffer);
 assert.equal(r.getInt16(1026+carrier*2),local.get(0x112));assert.equal(r.getInt16(1006+carrier*2),local.get(0x116));
 assert.equal(r.getInt16(14),0);assert.equal(r.getInt16(16),0);assert.deepEqual(bytes,before);
 const allowed=new Set([14,15,16,17,1006+carrier*2,1007+carrier*2,1026+carrier*2,1027+carrier*2]);
 for(let at=0;at<bytes.length;at++)if(!allowed.has(at))assert.equal(result[at],bytes[at]);
 goldCases++;
}
console.log(`${goldCases} gold receipts match FRISE signed-word arithmetic expressions, including carry, overflow and full backpacks. Listing/binary profile check, not native execution.`);

