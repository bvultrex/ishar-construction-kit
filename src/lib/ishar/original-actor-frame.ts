import {actorScriptCandidates,readOriginalActorDispatch} from './original-actor-dispatch.ts';
import {actorViewCandidate,readActorSave,type ActorSave} from './save-actors.ts';

export interface ActorListingBundle { loader:string; dispatch:string; scripts:Record<string,string> }
export interface ActorFrame { actorId:number; module:string; index:number; x:number; y:number; z:number; mirror:boolean }
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
    let cursor=0,acc=0;
    const walk=(nested=false):number=>{
      while(cursor<text.length){
        const ch=text[cursor]!;if(/\s/.test(ch)){cursor++;continue;}
        if(ch===')'){if(!nested)throw Error('Unbalanced expression');cursor++;return acc;}
        if(ch==='('){cursor++;walk(true);continue;}
        const token=text.slice(cursor).match(/^(o\w+)/);if(!token)throw Error(`Unknown expression ${text.slice(cursor)}`);
        const name=token[1]!;cursor+=name.length;
        let arg:number|undefined;
        if(text[cursor]==='('){cursor++;const literal=text.slice(cursor).match(/^(-?(?:0x[\da-f]+|\d+))\)/);
          if(literal){arg=Number(literal[1]);cursor+=literal[0].length;}else{const previous=acc;arg=walk(true);acc=previous;}}
        if(['oimmb','oimmw'].includes(name)){acc=arg!;continue;}
        if(name==='ornd'){
          if(!options.random)throw Error('Original random source required');
          const bound=acc,value=options.random(bound);
          if(!Number.isInteger(bound)||bound<=0||!Number.isInteger(value)||value<0||value>=bound)throw Error('Invalid original random result');
          acc=value;continue;
        }
        if(name==='opushacc'){stack.push(acc);continue;}if(name==='opile'){if(!stack.length)throw Error('Empty expression stack');acc=stack.pop()!;continue;}
        if(name==='oabs'){acc=Math.abs(acc);continue;}if(name==='oneg'){acc=-acc;continue;}
        if(name==='odirb'||name==='odirw'){acc=read(local,arg!,name==='odirw',false);continue;}
        if(name==='omainb'||name==='omainw'){acc=read(main,arg!,name==='omainw',true);continue;}
        if(name==='omaintc'||name==='omainti'){acc=read(main,arg!+acc*(name==='omainti'?2:1),name==='omainti',true);continue;}
        const rhs=arg;if(rhs===undefined)throw Error(`Unsupported ${name}`);
        switch(name){case 'oadd':acc+=rhs;break;case 'osub':acc-=rhs;break;case 'omul':acc*=rhs;break;case 'odiv':if(!rhs)throw Error('Zero divisor');acc=Math.trunc(acc/rhs);break;
          case 'oegal':acc=+(acc===rhs);break;case 'odiff':acc=+(acc!==rhs);break;case 'oinf':acc=+(acc<rhs);break;case 'osup':acc=+(acc>rhs);break;case 'oinfeg':acc=+(acc<=rhs);break;case 'osupeg':acc=+(acc>=rhs);break;
          case 'oand':acc=acc&rhs;break;case 'oor':acc=acc|rhs;break;default:throw Error(`Unsupported ${name}`);}
      }
      if(nested)throw Error('Unbalanced expression');return acc;
    };
    return walk();
  }
  let pc=labels.get('00018')??-1,condition=0,mirror=false;
  const draws:{index:number;x:number;y:number;z:number;mirror:boolean}[]=[];
  for(let budget=0;budget<512;budget++) {
    const instruction=code[pc++];if(!instruction)throw Error('Missing instruction');const {op,args}=instruction;
    const jump=()=>{const label=args.match(/L_([\da-f]+)/)?.[1],target=label?labels.get(label):undefined;if(target===undefined)throw Error('Missing branch');return target;};
    if(/^cjmp\d+$/.test(op)){pc=jump();continue;}
    if(/^cjsr\d+$/.test(op)){
      const target=jump(),end=code.findIndex((line,i)=>i>=target&&line.op==='cret');
      // Color-only routines depend on transient machine/palette state absent from
      // saves. Keep the imported palette; never skip gameplay or draw branches.
      const paletteOnly=end>=target&&code.slice(target,end).some(line=>line.op==='cpalette')&&code.slice(target,end).every(line=>/^(?:ceval|cbz\d+|cjmp\d+|cpalette)$/.test(line.op));
      if(paletteOnly)continue;
      calls.push(pc);pc=target;continue;
    }
    if(op==='cret'){if(!calls.length)return draws;pc=calls.pop()!;continue;}
    if(/^cb(?:n)?z\d+$/.test(op)){if(op.startsWith('cbnz')?condition!==0:condition===0)pc=jump();continue;}
    if(op==='ceval'){condition=expression(args);continue;}
    if(op==='cstore'||op==='cadd'||op==='csub') {
      // slocb(0xfffe) links entity ownership; cfindtyp/clinking have no first-frame pixel effect.
      if(args.endsWith('->slocb(0xfffe)'))continue;
      const target=args.match(/(?:->s|\+>a)dir([bw])\(0x([\da-f]+)\)$/);if(!target)throw Error(`Unsupported store ${args}`);
      const split=args.lastIndexOf(','),value=expression(args.slice(0,split)),at=parseInt(target[2]!,16),word=target[1]==='w';
      putLocal(at,op==='cstore'?value:read(local,at,word,false)+(op==='cadd'?value:-value),word);continue;
    }
    if(op==='cswitch1'||op==='cswitch2') {
      const split=args.indexOf(', {');condition=expression(args.slice(0,split));
      const selected=[...args.slice(split).matchAll(/(-?\d+):L_([\da-f]+)/g)].find(m=>+m[1]===condition);
      if(selected){const target=labels.get(selected[2]!);if(target===undefined)throw Error('Missing case');pc=target;}continue;
    }
    if(op==='cxinvon'){mirror=true;continue;}if(op==='cxinvoff'){mirror=false;continue;}
    if(op==='cput'){draws.length=0;draws.push({index:expression(args),x:read(local,0,true,false),z:read(local,2,true,false),y:read(local,4,true,false),mirror});continue;}
    if(op==='cstop'||op==='csleep'){
      // cput selects the displayed resource; later local position changes move it
      // without requiring another cput. Snapshots must not alias running state.
      yield draws.map(draw=>({...draw,x:read(local,0,true,false),z:read(local,2,true,false),y:read(local,4,true,false),mirror}));
      budget=-1;continue;
    }
    if(['cinteron','cscanon','cinteroff','cscanoff','cfindtyp','clinking','cpalette','cforme'].includes(op))continue;
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
  const memory=savedMainMemory(bundle.loader,bytes),dispatch=readOriginalActorDispatch(bundle.dispatch);
  // The no-occlusion path is verified for CONT1 only. Other maps require EAFF's height/occlusion gates.
  if(view.map!==1)return {snapshot,advance};
  // MAIN 0x011e5/0x036c0: stationary view, no movement in progress.
  memory.set(0x2ab7,0);
  memory.set(0x2ab4,view.row);memory.set(0x2ab5,view.col);memory.set(0x2ab6,view.facing);memory.set(0x2d18,view.map);memory.set(0x4ef2,view.scene);
  const positions=[{x:192,y:-42,scale:10},{x:92,y:-25,scale:21},{x:60,y:-12,scale:32},{x:44,y:-7,scale:44},{x:34,y:-4,scale:56}];
  for(const actor of saved.actors){
    const relative=actorViewCandidate({...view,actors:saved.actors},actor);if(!relative)continue;
    const binding=actorScriptCandidates(dispatch,actor),position=positions[relative.distance-1];
    if(!binding||binding.conditional||binding.scriptIds.length!==1||!position){unsupported.push(actor.id);continue;}
    const script=Object.entries(bundle.scripts).find(([,text])=>parseInt(text.match(/id=0x([\da-f]+)/)?.[1]??'-1',16)===binding.scriptIds[0]);
    if(!script){unsupported.push(actor.id);continue;}
    // EAFF explicitly sets offset to zero for these branches; unported/random crowd offsets stay disabled.
    const entry=bundle.dispatch.slice(bundle.dispatch.indexOf(`L_${binding.entry.slice(2)}:`));
    const offset=entry.match(/^\s*[\da-f]+\s+[\da-f]+\s+cstore\s+oimmb\((-?\d+)\), ->sdirw\(0x1a\)/m);
    if(!offset || entry.indexOf(offset[0])>entry.indexOf('clive')){unsupported.push(actor.id);continue;}
    const x=relative.lateral*position.x+Math.trunc(+offset[1]!*10/position.scale);
    const steps=actorAnimationSteps(script[1],memory,{0:x,2:relative.distance*99-6,4:position.y,0x0c:35*256+actor.id},{random});
    sessions.push({actorId:actor.id,module:script[0],steps,frame:[],stopped:false});
  }
  advance();
  return {snapshot,advance};
}

export function originalActorFrames(bundle:ActorListingBundle,bytes:Uint8Array,view:Omit<ActorSave,'actors'>) {
  return createOriginalActorAnimation(bundle,bytes,view,0).snapshot();
}
