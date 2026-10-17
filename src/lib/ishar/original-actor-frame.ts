import {evaluateOriginalAlisInteger} from './original-alis-expression.ts';
import {originalEaffPerspective} from './original-eaff-perspective.ts';
import {chooseOriginalEaffSpawn} from './original-eaff-spawn.ts';
import {readRequiredAlisArrays} from './original-alis-arrays.ts';
import {stepOriginalDosLoop} from './original-alis-loop.ts';
import {actorViewCandidate,readActorSave,type ActorSave} from './save-actors.ts';

export interface ActorListingBundle { loader:string; dispatch:string; main:string; scripts:Record<string,string> }
export interface ActorFrame { actorId:number; module:string; index:number; x:number; y:number; z:number; mirror:boolean;form?:number }
export const ORIGINAL_ACTOR_MODULES=['GOLEM1.IO','WIZARD1.IO','AVEUGLE5.IO'];
interface Instruction { address:string; op:string; args:string }
function instructions(listing:string):Instruction[] {
  return listing.split(/\r?\n/).flatMap(line=>{
    const match=line.match(/^\s*([\da-f]{5})\s+[\da-f]+\s+(\w+)\s*(.*)$/);
    return match?[{address:match[1]!,op:match[2]!,args:match[3]!}]:[];
  });
}
/** IO.IO's sequential loader maps saved values to MAIN memory. No offset guesses. */
export function savedMainMemory(loader:string,bytes:Uint8Array) {
  const memory=new Map<number,number>();let offset=0;
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  for(const instruction of instructions(loader)) {
    const address=parseInt(instruction.address,16);if(address<0xdf4||address>0x113b)continue;
    if(instruction.op==='cfreadv') {
      const target=instruction.args.match(/->smain([bw])\(0x([\da-f]+)\)/);
      if(offset+2>bytes.length)throw Error('Truncated save');
      if(target){const at=parseInt(target[2]!,16),value=view.getUint16(offset,false);memory.set(at,target[1]==='b'?value&255:value>>8);if(target[1]==='w')memory.set(at+1,value&255);}
      offset+=2;
    }else if(instruction.op==='cfreadb') {
      const target=instruction.args.match(/main:0x([\da-f]+), 0x([\da-f]+)/);if(!target)throw Error('Unknown loader target');
      const at=parseInt(target[1]!,16),size=parseInt(target[2]!,16);
      if(offset+size>bytes.length)throw Error('Truncated save');
      for(let i=0;i<size;i++)memory.set(at+i,bytes[offset+i]!);offset+=size;
    }
  }
  if(offset!==8359)throw Error('Unsupported loader layout');
  return memory;
}
const signedByte=(value:number)=>(value&255)>=128?(value&255)-256:value&255;
const signedWord=(value:number)=>(value&65535)>=32768?(value&65535)-65536:value&65535;

export interface ActorAnimationOptions {
  /** Supply the original engine's random source; never silently invent one. */
  random?: (bound:number)=>number;
  /** Explicitly verified oscan handler entry. No guessed interrupt vector. */
  scanEntry?: string;
  /** Caller must authorize/handle each gameplay write; absent means fail closed. */
  mainWrite?: (address:number,value:number,word:boolean)=>void;
}
/** Resumable, bounded ALIS execution. Each next() advances to one scheduler yield.
 * The caller owns timing. MAIN and saves remain read-only; unsupported operations
 * fail closed. Local variables, branches, mirror and displayed resource persist. */
export function* actorAnimationSteps(listing:string,main:Map<number,number>,initial:Record<number,number>,options:ActorAnimationOptions={}) {
  const code=instructions(listing),labels=new Map(code.map((line,i)=>[line.address,i]));
  const local=new Map<number,number>(),stack:number[]=[],calls:number[]=[];
  const putLocal=(at:number,value:number,word:boolean)=>{local.set(at,word?(value>>8)&255:value&255);if(word)local.set(at+1,value&255);};
  for(const [at,value] of Object.entries(initial))putLocal(+at,value,true);
  function read(memory:Map<number,number>,at:number,word:boolean,require:boolean) {
    if(require&&!memory.has(at))throw Error(`Unsaved MAIN ${at.toString(16)}`);
    return word?signedWord(((memory.get(at)??0)<<8)|(memory.get(at+1)??0)):signedByte(memory.get(at)??0);
  }
  function expression(text:string):number {
    return evaluateOriginalAlisInteger(text,{
      scan,random:options.random,
      read:(space,at,word)=>read(space==='main'?main:local,at,word,space==='main'),
      // This visual subset currently uses one-dimensional MAIN arrays only.
      table:(_space,at,index,_stack,word)=>read(main,at+index*(word?2:1),word,true),
    },stack);
  }
  let pc=labels.get('00018')??-1,condition=0,mirror=false,scan=0,form=-1;
  let resume:number|undefined,interrupted:number|undefined;
  const draws:{index:number;x:number;y:number;z:number;mirror:boolean}[]=[];
  for(let budget=0;budget<512;budget++) {
    const instruction=code[pc++];if(!instruction)throw Error('Missing instruction');const {op,args}=instruction;
    const jump=()=>{const label=args.match(/L_([\da-f]+)/)?.[1],target=label?labels.get(label):undefined;if(target===undefined)throw Error('Missing branch');return target;};
    if(/^cstart\d+$/.test(op)){resume=jump();continue;}
    if(/^cjmp\d+$/.test(op)){pc=jump();continue;}
    if(/^cjsr\d+$/.test(op)){
      const target=jump(),end=code.findIndex((line,i)=>i>=target&&line.op==='cret');
      // Color-only routines depend on transient machine/palette state absent from
      // saves. Keep the imported palette; never skip gameplay or draw branches.
      const paletteOnly=end>=target&&code.slice(target,end).some(line=>line.op==='cpalette')&&code.slice(target,end).every(line=>/^(?:ceval|cbz\d+|cjmp\d+|cpalette)$/.test(line.op));
      if(paletteOnly)continue;
      calls.push(pc);pc=target;continue;
    }
    if(op==='cret'){
      if(calls.length){pc=calls.pop()!;continue;}
      if(resume!==undefined){pc=resume;resume=undefined;interrupted=undefined;continue;}
      if(interrupted!==undefined){pc=interrupted;interrupted=undefined;continue;}
      return draws;
    }
    if(/^cb(?:n)?z\d+$/.test(op)){if(op.startsWith('cbnz')?condition!==0:condition===0)pc=jump();continue;}
    if(/^cloop(?:8|16|24)$/.test(op)){
      const target=args.match(/, \+>a(loc|dir)([bw])\(0x([\da-f]+)\)$/);if(!target)throw Error('Unsupported actor loop counter');
      const address=parseInt(target[3]!,16),word=target[2]==='w';
      if(target[1]==='loc'&&address>=32768)throw Error('Actor loop needs unavailable negative context');
      const result=stepOriginalDosLoop({counterBytes:word?2:1,next:pc,target:jump()},read(local,address,word,false));
      putLocal(address,result.value,word);condition=-1;pc=result.next;continue;
    }
    if(op==='ceval'){condition=expression(args);continue;}
    if(op==='cstore'||op==='cadd'||op==='csub') {
      // slocb(0xfffe) links entity ownership; cfindtyp/clinking have no first-frame pixel effect.
      if(args.endsWith('->slocb(0xfffe)'))continue;
      const mainTarget=args.match(/->smain([bw])\(0x([\da-f]+)\)$/);
      if(mainTarget){
        if(op!=='cstore'||!options.mainWrite)throw Error(`Unauthorized MAIN write ${args}`);
        const at=parseInt(mainTarget[2]!,16),word=mainTarget[1]==='w',value=expression(args.slice(0,args.lastIndexOf(',')));
        options.mainWrite(at,value,word);continue;
      }
      const target=args.match(/(?:->s|\+>a)dir([bw])\(0x([\da-f]+)\)$/);if(!target)throw Error(`Unsupported store ${args}`);
      const split=args.lastIndexOf(','),value=expression(args.slice(0,split)),at=parseInt(target[2]!,16),word=target[1]==='w';
      putLocal(at,op==='cstore'?value:read(local,at,word,false)+(op==='cadd'?value:-value),word);continue;
    }
    if(op==='cswitch1'||op==='cswitch2') {
      const split=args.indexOf(', {');condition=expression(args.slice(0,split));
      const selected=[...args.slice(split).matchAll(/(-?\d+):L_([\da-f]+)/g)].find(m=>+m[1]===condition);
      if(selected){const target=labels.get(selected[2]!);if(target===undefined)throw Error('Missing case');pc=target;}continue;
    }
    if(op==='cforme'){form=expression(args);continue;}
    if(op==='cdelforme'){form=-1;continue;}
    if(op==='cxinvon'){mirror=true;continue;}if(op==='cxinvoff'){mirror=false;continue;}
    if(op==='cput'){draws.length=0;draws.push({index:expression(args),x:read(local,0,true,false),z:read(local,2,true,false),y:read(local,4,true,false),mirror});continue;}
    if(op==='cstop'||op==='csleep'){
      // cput selects the displayed resource; later local position changes move it
      // without requiring another cput. Snapshots must not alias running state.
      // cstart sets the next scheduler resume point and does not jump immediately.
      if(resume!==undefined){pc=resume;resume=undefined;interrupted=undefined;calls.length=0;}
      else if(interrupted!==undefined){pc=interrupted;interrupted=undefined;calls.length=0;}
      const message:number|undefined=yield draws.map(draw=>({...draw,x:read(local,0,true,false),z:read(local,2,true,false),y:read(local,4,true,false),mirror,...(form>=0?{form}:{})}));
      if(message!==undefined){
        const handler=options.scanEntry===undefined?undefined:labels.get(options.scanEntry);
        if(handler===undefined)throw Error('Verified scan handler required');
        if(!Number.isInteger(message)||message<0||message>65535)throw Error('Invalid actor message');
        scan=message;interrupted=pc;pc=handler;calls.length=0;
      }
      budget=-1;continue;
    }
    if(['cinteron','cscanon','cinteroff','cscanoff','cfindtyp','clinking','cpalette'].includes(op))continue;
    throw Error(`Unsupported opcode ${op}`);
  }
  throw Error('Actor instruction budget exceeded');
}

/** Compatibility entry point: no timer, random call or later event is executed. */
export function firstActorFrame(listing:string,main:Map<number,number>,initial:Record<number,number>) {
  return actorAnimationSteps(listing,main,initial).next().value??[];
}

/** DOS ALIS ornd recurrence (engine/rules.md). The transient seed is not in SAV. */
export function originalActorRandom(seed:number) {
  let state=seed&65535;
  return (bound:number)=>{
    if(!Number.isInteger(bound)||bound<=0||bound>32767)throw Error('Invalid random bound');
    state=(Math.imul(state,0x7ab7)-0x77f)&65535;
    return Math.floor(bound*state/65536);
  };
}

export function createOriginalActorAnimation(bundle:ActorListingBundle,bytes:Uint8Array,view:Omit<ActorSave,'actors'>,seed:number) {
  const unsupported:number[]=[];
  const sessions:{actorId:number;module:string;steps:ReturnType<typeof actorAnimationSteps>;frame:ActorFrame[];stopped:boolean}[]=[];
  const random=originalActorRandom(seed);
  const snapshot=()=>({frames:sessions.flatMap(session=>session.frame).sort((a,b)=>b.z-a.z),unsupported:[...unsupported]});
  const advance=()=>{
    for(const session of sessions){
      if(session.stopped)continue;
      try{
        const next=session.steps.next();
        if(next.done){session.stopped=true;session.frame=[];continue;}
        session.frame=next.value.map(draw=>({...draw,module:session.module,actorId:session.actorId}));
      }catch{session.stopped=true;unsupported.push(session.actorId);}
    }
    return snapshot();
  };
  const saved=readActorSave(bytes);if(!saved)return {snapshot,advance};
  const memory=savedMainMemory(bundle.loader,bytes);
  // The no-occlusion path is verified for CONT1 only. Other maps require EAFF's height/occlusion gates.
  if(view.map!==1)return {snapshot,advance};
  let arrays:ReturnType<typeof readRequiredAlisArrays>;
  try{arrays=readRequiredAlisArrays(bundle.main,[0x3d2e,0x43ba,0x2d5c,0x2d8e,0x4b80]);}
  catch{unsupported.push(...saved.actors.filter(actor=>actor.hp>0).map(actor=>actor.id));return {snapshot,advance};}
  // MAIN 0x011e5/0x036c0: stationary view, no movement in progress.
  memory.set(0x2ab7,0);
  memory.set(0x2ab4,view.row);memory.set(0x2ab5,view.col);memory.set(0x2ab6,view.facing);memory.set(0x2d18,view.map);memory.set(0x4ef2,view.scene);
  for(const actor of saved.actors){
    const relative=actorViewCandidate({...view,actors:saved.actors},actor);if(!relative)continue;
    if(relative.distance===0){unsupported.push(actor.id);continue;}
    const position=originalEaffPerspective(bundle.dispatch,{map:view.map,distance:relative.distance,lateral:relative.lateral});
    const choice=chooseOriginalEaffSpawn(bundle.dispatch,actor.id,0,memory,arrays,{distance:relative.distance,lateral:relative.lateral,random});
    // Apply only to this private MAIN copy, in original actor scan order.
    for(const write of choice.mainWrites)memory.set(write.address,write.value);
    if(choice.moduleId===null)continue;
    const script=Object.entries(bundle.scripts).find(([,text])=>parseInt(text.match(/id=0x([\da-f]+)/)?.[1]??'-1',16)===choice.moduleId);
    if(!script){unsupported.push(actor.id);continue;}
    const x=position.baseX+Math.trunc(choice.lateral*10/position.divisor);
    const steps=actorAnimationSteps(script[1],memory,{0:x,2:position.depth-1,4:position.height,0x0c:35*256+actor.id},{random});
    sessions.push({actorId:actor.id,module:script[0],steps,frame:[],stopped:false});
  }
  advance();
  return {snapshot,advance};
}

export function originalActorFrames(bundle:ActorListingBundle,bytes:Uint8Array,view:Omit<ActorSave,'actors'>) {
  return createOriginalActorAnimation(bundle,bytes,view,0).snapshot();
}
