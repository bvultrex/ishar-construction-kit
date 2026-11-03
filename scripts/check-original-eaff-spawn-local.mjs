import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chooseOriginalEaffSpawn} from '../src/lib/ishar/original-eaff-spawn.ts';
import {readAlisModule} from '../src/lib/ishar/alis-module.ts';
import {readAlisArrayDeclaration} from '../src/lib/ishar/original-alis-arrays.ts';
const root=process.env.ISHAR2_DIR,dir=process.env.ISHAR_ACTOR_LISTINGS;if(!root||!dir)throw Error('ISHAR2_DIR and ISHAR_ACTOR_LISTINGS required');
const listing=readFileSync(`${dir}/EAFF.IO.asm`,'utf8'),bytes=readFileSync(`${root}/EAFF.IO`),image=readAlisModule(bytes).image;
assert.equal(createHash('sha256').update(bytes).digest('hex'),'6ab9102e2566617a9e7511ae1503f3302db1e81ea006081f3bb76d08835957ab');
let count=0;for(const line of listing.split(/\r?\n/)){const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s/);if(!m)continue;const at=parseInt(m[1],16);if(at<0x61d||at>=0x986)continue;const prefix=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(image.subarray(at,at+prefix.length)),prefix);count++;}
const mainImage=readAlisModule(readFileSync(`${root}/MAIN.IO`)).image;
const arrays=new Map([readAlisArrayDeclaration(mainImage,0x9b),{address:0x3d2e,elementBytes:1,strides:[]},{address:0x43ba,elementBytes:1,strides:[]},{address:0x2d5c,elementBytes:2,strides:[]}].map(d=>[d.address,d]));
assert.deepEqual(arrays.get(0x2d8e),{address:0x2d8e,elementBytes:2,strides:[30]});
const memory=new Map(),putWord=(at,n)=>{memory.set(at,(n>>8)&255);memory.set(at+1,n&255);};
for(let i=0;i<5;i++){putWord(0x2d5c+i*2,0);putWord(0x2d8e+i*30+28,0);}
const choose=(id,type,lateral=17)=>{memory.set(0x3d2e+id,type);return chooseOriginalEaffSpawn(listing,id,lateral,memory,arrays);};
assert.deepEqual([50,51,52].map(id=>choose(id,9).moduleId),[35,136,139]);
assert.equal(choose(49,9).moduleId,null);assert.equal(choose(49,9).lateral,17);
const expected=new Map([[9,37],[10,37],[11,44],[12,38],[19,40],[20,40],[21,40],[22,40],[23,43],[24,88],[25,100],[26,120],[27,101],[28,110],[29,119],[30,115],[31,43],[32,36],[33,89],[34,90],[35,97],[36,98],[37,98],[38,99],[39,70],[40,102],[41,113],[42,117],[43,118],[44,119],[45,122],[46,123],[47,121],[48,131],[49,128],[50,129],[51,127],[52,133],[53,135],[54,125],[55,124],[56,134],[57,126],[58,132],[59,130],[60,137],[61,141],[62,140],[63,142],[64,147],[65,143],[66,143]]);
for(let type=0;type<128;type++)assert.equal(choose(53,type).moduleId,expected.get(type)??null,`type ${type}`);
assert.equal(choose(53,12).lateral,20);assert.equal(choose(53,21).lateral,-70);assert.equal(choose(53,22).lateral,80);assert.equal(choose(53,31).lateral,17);assert.equal(choose(53,9).lateral,0);
assert.deepEqual(choose(53,28).mainWrites,[{address:0x51cb,value:0}]);
assert.deepEqual(choose(53,43).mainWrites,[{address:0x43ba+53,value:0},{address:0x43ba+53,value:254}]);
putWord(0x2d5c+8,1);putWord(0x2d8e+4*30+28,-30);
assert.deepEqual(choose(53,43).mainWrites,[{address:0x43ba+53,value:0}]);
putWord(0x2d5c+8,0);assert.equal(choose(53,43).mainWrites.at(-1).value,254,'dead character does not satisfy inventory gate');
const before=new Map(memory);choose(53,43);assert.deepEqual(memory,before,'trace does not mutate MAIN');
assert.throws(()=>chooseOriginalEaffSpawn(listing,53,17,new Map(),arrays),/Missing/);
console.log(`${count} hash-bound EAFF instruction prefixes matched. All 128 type bytes, three special actors, lateral overrides, sound flag write and type-43 inventory gate tested; no native execution proof.`);
const declarations=[0x87,0x9b,0x171,0x1ac].map(at=>readAlisArrayDeclaration(mainImage,at));
for(const declaration of declarations)assert.deepEqual(arrays.get(declaration.address),declaration,'test declarations must match original MAIN');
const {DosAlisEntities}=await import('../src/lib/ishar/original-alis-entities.ts');
const {initializeOriginalEaffActor}=await import('../src/lib/ishar/original-eaff-placement.ts');
const golem=readAlisModule(readFileSync(`${root}/GOLEM1.IO`)),table=new DosAlisEntities(5,{id:0,vramBytes:46});
const choice=choose(53,9),handle=table.spawn(0,{id:golem.header.id,vramBytes:golem.header.vramBytes});assert.equal(choice.moduleId,golem.header.id);
initializeOriginalEaffActor(table,handle,{actorId:53,baseX:128,depth:93,height:-42,lateral:choice.lateral,divisor:10});
assert.equal(table.readByte(handle,13),53);assert.equal(table.readByte(handle,12),35);assert.equal(table.readWord(handle,0),128);
console.log('Original MAIN declarations verified; EAFF choice -> real GOLEM1 module -> entity initialization composed.');
arrays.set(0x4b80,readAlisArrayDeclaration(mainImage,0x23b));
assert.deepEqual(arrays.get(0x4b80),{address:0x4b80,elementBytes:1,strides:[]});
const configure=(map,slots)=>{memory.set(0x2d18,map);slots.forEach((id,i)=>memory.set(0x4b80+i,id));};
let randomCalls=0;const random=bound=>{assert.equal(bound,20);randomCalls++;return 7;};
const crowd=(id,distance=1,lateral=0)=>{memory.set(0x3d2e+id,31);return chooseOriginalEaffSpawn(listing,id,0,memory,arrays,{distance,lateral,random});};
configure(1,[0,0,0]);let r=crowd(53);assert.deepEqual(r.mainWrites,[{address:0x4b81,value:53}]);assert.equal(r.lateral,0);assert.equal(randomCalls,0);
for(const w of r.mainWrites)memory.set(w.address,w.value);
r=crowd(54);assert.deepEqual(r.mainWrites,[{address:0x4b80,value:54}]);assert.equal(r.lateral,-83);assert.equal(randomCalls,1);
for(const w of r.mainWrites)memory.set(w.address,w.value);
r=crowd(55);assert.deepEqual(r.mainWrites,[{address:0x4b82,value:55}]);assert.equal(r.lateral,83);assert.equal(randomCalls,2);
for(const w of r.mainWrites)memory.set(w.address,w.value);
r=crowd(56);assert.deepEqual(r.mainWrites,[]);assert.equal(r.lateral,0);assert.equal(randomCalls,2,'full crowd does not consume randomness');
r=crowd(54);assert.equal(r.lateral,-83);assert.deepEqual(r.mainWrites,[]);assert.equal(randomCalls,3,'existing left slot consumes original RNG');
configure(2,[0,0,0]);assert.equal(crowd(53,0).mainWrites[0].address,0x4b81,'non-1 map uses distance zero for crowd');
const deterministic=(id,bound)=>{let x=BigInt(id);x=BigInt.asUintN(16,(x<<10n)|(x>>6n));x=BigInt.asUintN(16,x*0x7ab7n-0x77fn);return Number(BigInt(bound)*x>>16n);};
for(const map of [1,2,4])for(let id=50;id<110;id++){
 configure(map,[0,0,0]);const out=crowd(id,2,1); // avoid the frontal crowd branch
 // Special actor slots override lateral after the deterministic expression.
 const expected=id<53?0:map===4?-50+2*deterministic(id,50):-80+4*deterministic(id,40);
 assert.equal(out.lateral,expected);assert.deepEqual(out.mainWrites,[]);
}
configure(1,[54,53,55]);memory.set(0x3d2e+54,9);const callsBefore=randomCalls;
const override=chooseOriginalEaffSpawn(listing,54,0,memory,arrays,{distance:1,lateral:0,random});assert.equal(override.lateral,0);assert.equal(randomCalls,callsBefore+1,'later override must not erase RNG consumption');
configure(1,[53,54,55]);assert.throws(()=>chooseOriginalEaffSpawn(listing,53,0,memory,arrays,{distance:1,lateral:0}),/random source/);
let crowdPrefixes=0;for(const line of listing.split(/\r?\n/)){const m=line.match(/^\s*([\da-f]{5})\s+([\da-f]+)\s/);if(!m)continue;const at=parseInt(m[1],16);if(at<0x4c8||at>=0x61d)continue;const prefix=Buffer.from(m[2],'hex');assert.deepEqual(Buffer.from(image.subarray(at,at+prefix.length)),prefix);crowdPrefixes++;}
console.log(`EAFF crowd: centre/left/right allocation, existing/full slots, explicit RNG consumption, deterministic distribution for 180 actor/map combinations and ${crowdPrefixes} original instruction prefixes checked.`);
