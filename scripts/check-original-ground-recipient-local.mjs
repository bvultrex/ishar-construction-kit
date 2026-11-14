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
for(const [address,offset] of [[0x2d5c,996],[0x2e9e,1276],[0x2d8e,1036]])assert.equal(layout.fields.find(f=>f.memoryAddress===address).fileOffset,offset);
let cases=0;
for(let carrier=0;carrier<5;carrier++)for(const hp of [-32768,-1,0,1,32767])for(const characterClass of [0,1,254,255]){
 const bytes=new Uint8Array(8359),view=new DataView(bytes.buffer);view.setUint16(0,2,false);view.setInt16(996+carrier*2,hp,false);bytes.fill(255,1276,1281);bytes[1276+carrier]=characterClass;
 const allowed=evaluateOriginalAlisInteger(line[2],{scan:0,read:(space,at,word)=>{assert.equal(space,'local');assert.equal(at,0x13);assert.equal(word,false);return carrier;},table:(space,at,index)=>{assert.equal(space,'main');assert.equal(index,carrier);if(at===0x2d5c)return hp;assert.equal(at,0x2e9e);return characterClass>=128?characterClass-256:characterClass;}})!==0;
 const before=bytes.slice(),received=receiveOriginalGround(bytes,9,carrier);assert.equal(received!==null,allowed);assert.deepEqual(bytes,before);
 if(received){assert.equal(new DataView(received.buffer).getInt16(1036+carrier*30,false),9);for(let at=0;at<bytes.length;at++)if(![1036+carrier*30,1037+carrier*30].includes(at))assert.equal(received[at],bytes[at]);}
 cases++;
}
console.log(`${cases} portrait recipient cases agree with hash-bound FRISE007C9 expression and binary IO mapping. Full encoded predicate and listing expression checked; no native EXE execution claim.`);

