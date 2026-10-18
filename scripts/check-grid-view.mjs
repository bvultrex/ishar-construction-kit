// r7: original-faithful IsharGrid view (DJ1/DJ2 script reimplementation). Synthetic bytes only.
import assert from 'node:assert/strict';
import { bytesToBase64 } from '../src/lib/ishar/cont-grid.ts';
import { DEPTH_TABLE, FACING_CODE, gridView, gridViewSprites, sceneTypeAt, spawnSprites, DJCAT_SPLIT, DJTRAP_SCENE_TYPES, VIEW_FRAME, VIEW_ORIGIN, scriptAt, scriptForSceneType, ELEMENT_FACES } from '../src/lib/ishar/grid-view.ts';

const rows=10, cols=6, a=new Uint8Array(rows*cols).fill(0xff), b=new Uint8Array(rows*cols);
const set=(r,c,v,bv=0)=>{a[r*cols+c]=v&0xff;b[r*cols+c]=bv&0xff;};
set(1,2,36);            // dead end: E+W walls + north wall
set(2,2,12); set(3,2,12);
set(4,2,76,61);         // N-S corridor + north thin edge with door #1
for(let r=5;r<=8;r++) set(r,2,12);
const grid={game:'ishar2',rows,cols,mapNumber:5,layerA:bytesToBase64(a),layerB:bytesToBase64(b)};
const has=(list,q)=>list.some((s)=>Object.entries(q).every(([k,v])=>s[k]===v));

assert.deepEqual(DEPTH_TABLE.map((t)=>t.z),[99,198,297,396,495,594,693],'z=(d+1)*99 (DJ1 0x0223f)');
assert.deepEqual(DEPTH_TABLE.slice(0,5).map((t)=>t.y),[-42,-25,-12,-7,-4]);
assert.deepEqual(FACING_CODE,{east:1,south:2,west:3,north:4});
assert.deepEqual(ELEMENT_FACES[16],[{side:'east',kind:'A'}],'dispatcher interleaving 14..21');

// facing north from (8,2): corridor walls; element 12 = west A / east B
let v=gridViewSprites(grid,8,2,'north','DJ1');
assert.ok(has(v,{module:'DJ1.IO',index:51,mirror:false,d:0,lat:0,routine:'side'}),'east wall (B) on the right, #51+0');
assert.ok(has(v,{module:'DJ1.IO',index:47,mirror:true,d:0,lat:0,routine:'side'}),'west wall (A) on the left, mirrored #47');
assert.ok(has(v,{index:59+4-0,d:4,routine:'front'})===false,'d=4 rows draw no front (dd<4 guard)');
// thin edge with door at depth 4 from (8,2)? (4,2) is d=4 -> no frame; from (6,2) it is d=2 -> plain front #61
v=gridViewSprites(grid,6,2,'north','DJ1');
assert.ok(has(v,{index:61,d:2,routine:'front',element:1}),'thin edge seen from afar = front wall (0x021a7 d>0)');
// standing on the door cell: frame #108 + closed PCAVE leaf at z+3
v=gridViewSprites(grid,4,2,'north','DJ1');
const frame=v.find((s)=>s.routine==='frame'), leaf=v.find((s)=>s.module==='PCAVE.IO');
assert.equal(frame.index,108); assert.equal(frame.z,100);
assert.equal(leaf.z,102,'door leaf z+3'); assert.equal(leaf.door,1);
assert.equal(leaf.index,40,'own-edge door (0x09=1, d=0): PCAVE #40 (pcave_doors.json 0x00193)');
assert.equal(gridViewSprites(grid,4,2,'north','DJ2').find((s)=>s.module==='PCAVE.IO').index,46,'DJ2 own edge: #46');
assert.ok(v.findIndex((s)=>s===frame)>v.findIndex((s)=>s===leaf),'far-to-near: frame (z+1) drawn after the leaf (z+3)');
assert.ok(!gridViewSprites(grid,4,2,'north','DJ1',()=>true).some((s)=>s.module==='PCAVE.IO'),'open door: no leaf from the frame routine');
// from the far side the north edge of (4,2) is behind the cell -> drawn one row nearer
v=gridViewSprites(grid,3,2,'south','DJ1');
assert.ok(has(v,{routine:'frame',index:108,d:0,element:1}),'edge behind the cell -> d-1 (0x00c2c)');
// dead end ahead from (5,2): (1,2) at d=4 -> nothing; from (4,2) d=3 -> front #62
v=gridViewSprites(grid,4,2,'north','DJ1');
assert.ok(has(v,{r:1,c:2,index:62,routine:'front'}),'dead-end wall #59+3');
// sort far -> near
for(let i=1;i<v.length;i++) assert.ok(v[i-1].z>=v[i].z);
// lateral placement
v=gridViewSprites(grid,8,2,'east','DJ1');
assert.ok(v.every((s)=>s.d<0 || s.x===s.lat*DEPTH_TABLE[s.d].step || s.routine.endsWith('side')));
// DJ2 resources
v=gridViewSprites(grid,4,2,'north','DJ2');
assert.ok(has(v,{module:'DJ2.IO',index:117,routine:'frame'})); assert.ok(has(v,{module:'DJ2.IO',index:47+3,routine:'front'}));
assert.ok(has(v,{module:'DJ2.IO',index:39,mirror:false,routine:'side'}),'DJ2 east wall B #39');
// full walls draw nothing by themselves
assert.equal(gridViewSprites({...grid,layerA:bytesToBase64(new Uint8Array(rows*cols).fill(0xff))},4,2,'north','DJ1').filter((s)=>s.routine!=='background').length,0);
// background: FDJ1/FDJ2 #3 farthest (z 1500), mirrored on alternate redraws; DJCAT FDJCAT #4 + #5
v=gridViewSprites(grid,8,2,'north','DJ1');
assert.deepEqual([v[0].module,v[0].index,v[0].z,v[0].mirror],['FDJ1.IO',3,1500,false]);
assert.equal(gridViewSprites(grid,8,2,'north','DJ1',undefined,undefined,{backgroundMirror:true})[0].mirror,true);
assert.deepEqual(gridViewSprites(grid,8,2,'north','DJCAT').filter((s)=>s.routine==='background').map((s)=>s.module+'#'+s.index),['FDJCAT.IO#4'],'dry catacombs: no water floor');
assert.deepEqual(gridViewSprites(grid,8,2,'north','DJCAT',undefined,undefined,{djcatAlt:true}).filter((s)=>s.routine==='background').map((s)=>s.module+'#'+s.index),['FDJCAT.IO#4','FDJCAT.IO#5'],'0x4fce=1: water floor #5');
// runtime facts (render-runtime.md)
assert.deepEqual([VIEW_FRAME.originX,VIEW_FRAME.originY,VIEW_FRAME.clipY0,VIEW_FRAME.clipY1],[127,78,13,125]);
assert.equal(VIEW_ORIGIN.y,VIEW_FRAME.originY-VIEW_FRAME.clipY0,'window-local origin');

// PCAVE door leaves (pcave_doors.json, known)
const sp=(b,mode,z=102)=>spawnSprites({entity:'PCAVE',x:0,y:-42,z,r:0,c:0,b,mode},()=>false,()=>false).map((s)=>s.index);
assert.deepEqual(sp(2,0),[8]); assert.deepEqual(sp(3,0,300),[14]); assert.deepEqual(sp(8,0),[41]); assert.deepEqual(sp(29,0,201),[42,50]); assert.deepEqual(sp(30,0),[8,55]);
assert.deepEqual(sp(-121,0,201),[25]); assert.deepEqual(sp(-74,0),[28]); assert.deepEqual(sp(-90,0),[],'unlisted negative: nothing');
assert.deepEqual(sp(2,0,498),[],'d>=4: nothing');
assert.deepEqual(spawnSprites({entity:'PCAVE',x:0,y:0,z:102,r:0,c:0,b:2,mode:0},()=>true,()=>false),[],'open door: nothing');
const lifted=spawnSprites({entity:'PCAVE',x:0,y:-42,z:102,r:0,c:0,b:2,mode:0},()=>true,()=>false,{doorLift:()=>40});
assert.equal(lifted[0].y,-2,'leaf rises while opening (+4 px/frame)');
// switch spawn (niche front at d=0): #37/#38 DJ1, #47/#48 DJ2 at z-5
assert.deepEqual(spawnSprites({entity:'PCAVE',x:0,y:0,z:99,r:0,c:0,sw:3,swKind:0},()=>false,()=>true).map((s)=>[s.index,s.z]),[[37,94]]);

// DJTRAP: spawned only in the listed scene types; crusher #4 at d=3, wall traps #11/#17 at d=1
const tb=b.slice(); tb[5*cols+2]=(-9)&0xff; const tg={...grid,layerB:bytesToBase64(tb)};
assert.ok(!gridView(tg,8,2,'north','DJ1').spawns.some((s)=>s.entity==='DJTRAP'),'no scene type: no DJTRAP');
assert.ok(DJTRAP_SCENE_TYPES.includes(31));
let tv=gridView(tg,8,2,'north','DJ1',undefined,undefined,{sceneType:31});
assert.deepEqual(tv.spawns.filter((s)=>s.entity==='DJTRAP').map((s)=>[s.trap,s.z]),[[1,396]]);
assert.ok(tv.sprites.some((s)=>s.module==='DJTRAP.IO'&&s.index===4));
tb[5*cols+2]=(-61)&0xff; tv=gridView({...grid,layerB:bytesToBase64(tb)},6,2,'north','DJ1',undefined,undefined,{sceneType:31});
assert.deepEqual(tv.spawns.filter((s)=>s.entity==='DJTRAP').map((s)=>s.trap),[4],'-61 facing north (4) -> mode 4');
assert.ok(tv.sprites.some((s)=>s.module==='DJTRAP.IO'&&s.index===17));

// DJ1 element 78/79 (known 0x01583/0x0163d)
const a3=a.slice(); a3[6*cols+2]=78; const b3=b.slice(); b3[6*cols+2]=12; const g3={...grid,layerA:bytesToBase64(a3),layerB:bytesToBase64(b3)};
assert.ok(has(gridViewSprites(g3,6,2,'west','DJ1'),{index:117,routine:'lever',z:84}),'78 facing west: lever #117 at z-15');
assert.ok(has(gridViewSprites(g3,6,2,'west','DJ1',undefined,()=>true),{index:114,routine:'lever'}),'switched: #114');

// DJCAT (known DJCAT 0x004a9/0x00760): split table and pre-composed corridor sprites
assert.deepEqual(DJCAT_SPLIT[-5],[10,-12]); assert.deepEqual(DJCAT_SPLIT[45],[13,5]);
const a4=new Uint8Array(rows*cols).fill(0xff); for(let r=1;r<=8;r++) a4[r*cols+2]=12; a4[1*cols+2]=36;
const g4={...grid,layerA:bytesToBase64(a4),layerB:bytesToBase64(new Uint8Array(rows*cols))};
v=gridViewSprites(g4,8,2,'north','DJCAT');
assert.ok(v.filter((s)=>s.module==='DJCAT.IO').every((s)=>s.lat===0),'DJCAT draws only the centre column');
assert.ok(has(v,{module:'DJCAT.IO',index:31,mirror:true,d:1})&&has(v,{module:'DJCAT.IO',index:34,mirror:false,d:1}),'element 12 facing north (0x0105c): mirrored #31+d-1, #34+d-1');
assert.ok(!v.some((s)=>s.module==='DJCAT.IO'&&s.d>3),'DJCAT: depth 0..3 only');
assert.ok(has(gridViewSprites(g4,8,2,'east','DJCAT'),{module:'DJCAT.IO',index:37,d:0}),'facing the wall at d=0: #37 (even code)');
assert.ok(has(gridViewSprites(g4,8,2,'east','DJCAT',undefined,undefined,{djcatAlt:true}),{module:'DJCAT.IO',index:96,d:0}),'alt set (0x4fce): #96');

// scene type -> script (MAIN 0x01c96) and region choice
assert.equal(scriptForSceneType(31),'DJ1'); assert.equal(scriptForSceneType(35),'DJ2'); assert.equal(scriptForSceneType(36),'DJCAT'); assert.equal(scriptForSceneType(5),undefined);
const b2=b.slice(); b2[8*cols+2]=(-75)&0xff; // trigger: |B|-40 = 35 -> DJ2
const g2={...grid,layerB:bytesToBase64(b2)};
assert.equal(sceneTypeAt(g2,8,2),35); assert.equal(sceneTypeAt(g2,2,2),35,'nearest reachable trigger');
assert.equal(scriptAt(g2,2,2),'DJ2'); assert.equal(scriptAt(g2,2,2,31),'DJ1','walked state wins');
assert.equal(scriptAt({...g2,sceneRegions:[{r0:0,r1:9,c0:0,c1:5,scene:'DJ1'}]},2,2),'DJ1','explicit region override');
assert.equal(scriptAt(grid,2,2),'DJ1','no trigger -> DJ1 default');
// VGA DAC display of 8-bit palette bytes (K5T004 DOSBox reference, pixel-exact)
{ const { vgaDac } = await import('../src/lib/ishar/alis-assets.ts');
  assert.deepEqual([7,11,67,135,203,255].map(vgaDac),[4,8,65,134,203,255]); }
// savegame header (synthetic bytes in the K5T004 layout)
{ const { parseSaveHeader } = await import('../src/lib/ishar/cont-grid.ts');
  const h=parseSaveHeader(new Uint8Array([0,2,0,38,0,25,0,4,0,5,0,0,0,0,0,0,0,0,0,36]));
  assert.deepEqual([h.row,h.col,h.facing,h.map,h.sceneType],[38,25,'north',5,36]);
  assert.equal(scriptAt({...grid,rows:90,cols:60},2,2,h.sceneType),'DJCAT','scene type from the save selects DJCAT'); }
console.log('Grid view (DJ1/DJ2/DJCAT script order, depth table, edge/door/PCAVE, DJTRAP, 78/79, scene types) passed');
