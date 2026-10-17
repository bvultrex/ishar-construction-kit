import {saveOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-save.ts';
import {stepOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-tick.ts';
import {drawOriginalDosCursor} from '../src/lib/ishar/original-dos-cursor-draw.ts';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hash=v=>createHash('sha256').update(v).digest('hex'),cases=[];
for(const format of [0,16,1])for(const guard of [0,1,127,254,255])for(const mode of [0,1])for(const hidden of [0,127,128,255]){
 const sprite=new Uint8Array(264);sprite[0]=format;sprite[6]=250;const header=format===0?6:8;
 for(let i=header;i<264;i++)sprite[i]=((i-header)*17)&255;
 let screen=Uint8Array.from({length:65536},(_,i)=>(i*13+7)&255),x=10,y=10;
 const backup=new Uint8Array(262).fill(165);backup.set(saveOriginalDosCursor(screen,x,y,320,0));screen=drawOriginalDosCursor(screen,sprite,x,y,320,0);
 const frames=[];
 let state={screen,backup,x,y,mode,hidden,guard};
 for(const [nextX,nextY] of [[10,10],[11,11],[305,185],[319,199],[10,10]]){
  const previous=state,before=[hash(state.screen),hash(state.backup),hash(sprite)];
  state=stepOriginalDosCursor(state,sprite,{blocked:0,rawX:nextX,rawY:nextY,rawState:0}).state;
  assert.deepEqual([hash(previous.screen),hash(previous.backup),hash(sprite)],before);
  frames.push({nextX,nextY,x:state.x,y:state.y,screen:hash(state.screen),backup:hash(state.backup)});
 }
 cases.push({sprite:[...sprite],mode,hidden,guard,frames});
}
console.log(JSON.stringify(cases));
