/** Native 1000:8268..8370/8377. Raw context offsets, not invented field semantics.
 * Distinct module/destination segments; all destination offsets wrap as words.
 */
export function createOriginalDosScriptContext(destination:Uint8Array,header:Uint8Array,moduleOffset:number,moduleSegment:number,tableOffset:number,slot:number,poolOffset:number,poolSegment:number,limitSegment:number){
 if(destination.length!==65536||header.length<24||![moduleOffset,moduleSegment,tableOffset,slot,poolOffset,poolSegment,limitSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native context buffers/words');
 const h=new DataView(header.buffer,header.byteOffset,header.byteLength),u=(v:number)=>v&65535,w=(at:number)=>h.getUint16(at,true);
 const memory=destination.slice(),byte=(at:number,v:number)=>{memory[u(at)]=v&255;},word=(at:number,v:number)=>{byte(at,v);byte(at+1,v>>>8);};
 const base=u(poolOffset+w(0x12)),context=u(base+w(0x16)+0x34),length=w(0x14),end=u(context+length),candidate=u(poolSegment+(end>>>4)+1);
 const globals:Record<number,number>={0xb0c:base,0xb0e:context,0xbd8:end};word(tableOffset+slot,context);
 if(candidate>=limitSegment)return {memory,globals,error:12 as number|null,context,entry:moduleOffset,candidate};
 // Native loop executes once even for length0, then wraps through all words.
 if(length&1)throw Error('Odd native variable length would not terminate');
 let remaining=length;do{word(context+remaining-2,0);remaining=u(remaining-2);}while(remaining!==0);
 const relative=u(base-context),entry=u(moduleOffset+2+w(2));
 for(const [at,value] of [[-10,relative],[-28,relative],[-30,relative],[-8,entry],[-6,moduleSegment],[-16,w(0)],[-20,0],[-18,moduleSegment],[-26,65535],[-14,slot],[-24,0],[-12,0],[-34,0],[-32,0],[-50,0],[-52,0]])word(context+at,value);
 for(const [at,value] of [[-46,header[5]],[-2,1],[-1,1],[-4,255],[-36,2],[-3,0],[-37,0],[-38,255],[-42,0],[-40,0],[-44,0],[-45,0],[-47,0],[-48,0]])byte(context+at,value);
 return {memory,globals,error:null,context,entry,candidate};
}
