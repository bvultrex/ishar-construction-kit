/** Old DOS ALIS integer operand registers, per opernames.c and alis.c gparam.
 * opile exchanges D6/D7 before taking the saved operand; it is not a value pop.
 * Unsupported operators fail closed. Resource/string/engine operands are absent. */
export interface AlisIntegerContext {
 read:(space:'local'|'main',address:number,word:boolean)=>number;
 table:(space:'main',address:number,index:number,stack:number[],word:boolean)=>number;
 scan:number;random?: (bound:number)=>number;
}
const signed=(n:number)=>((n&65535)^32768)-32768;
export interface AlisIntegerRegisters {d6:number;d7:number}
export function evaluateOriginalAlisInteger(text:string,context:AlisIntegerContext,stack:number[]=[],registers?:AlisIntegerRegisters):number {
 if(registers&&![registers.d6,registers.d7].every(n=>Number.isInteger(n)&&n>=-32768&&n<=32767))throw Error('Invalid ALIS integer registers');
 let cursor=0,d6=registers?.d6??0,d7=registers?.d7??0;
 const binary=new Set(['oadd','osub','omul','odiv','omod','oegal','odiff','oinf','osup','oinfeg','osupeg','oand','oor','oxor']);
 function walk(nested=false):void {
  while(cursor<text.length){
   const ch=text[cursor]!;if(/\s/.test(ch)){cursor++;continue;}
   if(ch===')'){if(!nested)throw Error('Unbalanced expression');cursor++;return;}
   if(ch==='('){cursor++;walk(true);continue;}
   const token=text.slice(cursor).match(/^(o\w+)/);if(!token)throw Error(`Unknown expression ${text.slice(cursor)}`);
   const name=token[1]!;cursor+=name.length;
   let arg:number|undefined;
   if(binary.has(name))d6=d7;
   if(text[cursor]==='('){cursor++;const literal=text.slice(cursor).match(/^(-?(?:0x[\da-f]+|\d+))\)/);
    if(literal){arg=Number(literal[1]);cursor+=literal[0].length;if(binary.has(name))d7=signed(arg);}
    else{walk(true);arg=d7;}
   }
   if(name==='oimmb'||name==='oimmw'){if(arg===undefined)throw Error('Missing immediate');d7=signed(arg);continue;}
   if(name==='oscan'){d7=signed(context.scan);continue;}
   if(name==='opushacc'){stack.push(d7);continue;}
   if(name==='opile'){if(!stack.length)throw Error('Empty expression stack');d7=d6;d6=signed(stack.pop()!);continue;}
   if(name==='oabs'){d7=signed(Math.abs(d7));continue;}if(name==='oneg'){d7=signed(-d7);continue;}
   if(name==='oprnd'){
    if(!stack.length)throw Error('Empty deterministic random stack');
    const seed=stack.pop()!;if(!Number.isInteger(seed)||seed< -32768||seed>32767)throw Error('Invalid deterministic random seed');
    const bits=seed&65535,rotated=((bits<<10)|(bits>>>6))&65535;
    const mixed=(rotated*0x7ab7-0x77f)&65535;
    d7=signed(Math.floor((d7&65535)*mixed/65536));continue;
   }
   if(name==='ornd'){
    if(!context.random)throw Error('Original random source required');
    const bound=d7,value=context.random(bound);
    if(!Number.isInteger(bound)||bound<0||!Number.isInteger(value)||value<0||(bound===0?value!==0:value>=bound))throw Error('Invalid original random result');
    d7=signed(value);continue;
   }
   if(['odirb','odirw','olocb','olocw','omainb','omainw','omaintc','omainti'].includes(name)){
    if(arg===undefined)throw Error('Missing memory operand');
    d7=signed(name.startsWith('omaint')?context.table('main',arg,d7,stack,name==='omainti'):context.read(name.startsWith('omain')?'main':'local',arg,name.endsWith('w')));continue;
   }
   if(!binary.has(name)||arg===undefined)throw Error(`Unsupported ${name}`);
   switch(name){
    case 'oadd':d7=signed(d6+d7);break;case 'osub':d6=d7=signed(d6-d7);break;case 'omul':d7=signed(d6*d7);break;
    case 'odiv':if(!d7)throw Error('Zero divisor');d6=d7=signed(Math.trunc(d6/d7));break;
    case 'omod':if(!d7)throw Error('Zero divisor');d6=d7=signed(d6%d7);break;
    case 'oegal':d7=d6===d7?-1:0;break;case 'odiff':d7=d6!==d7?-1:0;break;
    case 'oinf':d7=d6<d7?-1:0;break;case 'osup':d7=d6>d7?-1:0;break;
    case 'oinfeg':d7=d6<=d7?-1:0;break;case 'osupeg':d7=d6>=d7?-1:0;break;
    case 'oand':d7=signed(d6&d7);break;case 'oor':d7=signed(d6|d7);break;case 'oxor':d7=signed(d6^d7);break;
   }
  }
  if(nested)throw Error('Unbalanced expression');
 }
 walk();if(registers){registers.d6=d6;registers.d7=d7;}return d7;
}
