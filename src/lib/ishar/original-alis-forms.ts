import {readAlisImageHeader} from './alis-module.ts';
export type AlisTriple=[number,number,number];
export type DosAlisForm={index:number;offset:number;kind:'box';coordinateBytes:1|2;material:number;origin:AlisTriple;extent:AlisTriple}|{index:number;offset:number;kind:'compound';children:number[]};
/** Old DOS ALIS resource root +6/+10, relative16 table offsets. The form
 * coordinates are signed origin + signed extent, not two absolute corners. */
export function readDosAlisForms(image:Uint8Array):DosAlisForm[]{
 const root=readAlisImageHeader(image).resourceOffset;if(!root)return [];
 const view=new DataView(image.buffer,image.byteOffset,image.byteLength);
 const range=(at:number,size:number)=>{if(!Number.isSafeInteger(at)||at<0||at+size>image.length)throw Error('ALIS form outside image');};
 range(root,12);const count=view.getUint16(root+10,true),table=root+view.getUint32(root+6,true);if(!count)return [];
 range(table,count*2);const forms:DosAlisForm[]=[];
 for(let index=0;index<count;index++){
  const offset=table+view.getUint16(table+index*2,true);range(offset,2);const type=view.getInt8(offset);
  if(type<0){
   const childrenCount=image[offset+1]!;range(offset+2,childrenCount*2);
   const children=Array.from({length:childrenCount},(_,i)=>view.getInt16(offset+2+i*2,true));
   if(children.some(child=>child>=count))throw Error('ALIS compound form reference outside table');
   forms.push({index,offset,kind:'compound',children});
  }else{
   if(type!==0&&type!==1)throw Error(`Unsupported ALIS form kind ${type}`);
   const coordinateBytes=type===0?1:2;range(offset,4+6*coordinateBytes);
   const coordinates=Array.from({length:6},(_,i)=>coordinateBytes===1?view.getInt8(offset+4+i):view.getInt16(offset+4+i*2,true));
   forms.push({index,offset,kind:'box',coordinateBytes,material:view.getUint16(offset+2,true),origin:coordinates.slice(0,3) as AlisTriple,extent:coordinates.slice(3) as AlisTriple});
  }
 }
 return forms;
}
/** In-place-size edit on a copy. Header bytes, other forms and references stay. */
export function editDosAlisBox(image:Uint8Array,index:number,edit:{material:number;origin:AlisTriple;extent:AlisTriple}):Uint8Array{
 const form=readDosAlisForms(image)[index];if(!form||form.kind!=='box')throw Error('Expected ALIS box form');
 const values=[...edit.origin,...edit.extent],limit=form.coordinateBytes===1?128:32768;
 if(edit.origin.length!==3||edit.extent.length!==3||values.some(n=>!Number.isInteger(n)||n< -limit||n>=limit)||!Number.isInteger(edit.material)||edit.material<0||edit.material>65535)throw Error('ALIS form values outside encoding range');
 const result=image.slice(),view=new DataView(result.buffer);view.setUint16(form.offset+2,edit.material,true);
 values.forEach((value,i)=>{if(form.coordinateBytes===1)view.setInt8(form.offset+4+i,value);else view.setInt16(form.offset+4+i*2,value,true);});return result;
}
export interface AlisFormEntity {id:number;contextWord6:number;position:AlisTriple;mirror:boolean;form:number;forms:readonly DosAlisForm[]}
const word=(n:number)=>((n&65535)^32768)-32768;
function boxes(entity:AlisFormEntity,query=false){
 if(!Number.isInteger(entity.id)||entity.id<0||!Number.isInteger(entity.contextWord6)||entity.contextWord6<0||entity.contextWord6>65535||!Number.isInteger(entity.form)||entity.form< -32768||entity.form>32767||entity.position.length!==3||entity.position.some(v=>!Number.isInteger(v)||v< -32768||v>32767))throw Error('Invalid/missing ALIS entity state');
 const result:{material:number;min:AlisTriple;max:AlisTriple}[]=[],active=new Set<number>();let visits=0;
 function visit(index:number){
  if(index<0)return;if(++visits>4096||active.has(index))throw Error('ALIS compound form cycle/budget');
  const form=entity.forms[index];if(!form)throw Error('Missing ALIS form reference');
  if(form.kind==='compound'){if(query&&form.children.length>=128)return;active.add(index);for(const child of form.children)visit(child);active.delete(index);return;}
  const min:AlisTriple=[0,0,0],max:AlisTriple=[0,0,0];
  for(let axis=0;axis<3;axis++){
   const sign=axis===0&&entity.mirror?-1:1,start=word(word(form.origin[axis]!*sign)+entity.position[axis]!),end=word(start+word(form.extent[axis]!*sign));
   min[axis]=Math.min(start,end);max[axis]=Math.max(start,end);
  }
  result.push({material:form.material,min,max});
 }
 visit(entity.form);return result;
}
/** clipform first-hit mode only: supplied entity order matters; no distance sort.
 * Target material is returned whole, not mask & material (cmatent semantics). */
export function originalAlisFormHits(query:AlisFormEntity,entities:readonly AlisFormEntity[],mask:number):{entityId:number;material:number}[]{
 if(!Number.isInteger(mask)||mask<0||mask>65535)throw Error('Invalid ALIS material mask');
 const queryBoxes=boxes(query,true),hits:{entityId:number;material:number}[]=[];
 for(const entity of entities){
  if(entity.id===query.id||entity.contextWord6!==query.contextWord6||entity.form<0)continue;
  const targetBoxes=boxes(entity);let material:number|undefined;
  for(const q of queryBoxes){for(const t of targetBoxes)if((t.material&mask)!==0&&q.min.every((value,i)=>value<=t.max[i]!&&t.min[i]!<=q.max[i]!)){material=t.material;break;}if(material!==undefined)break;}
  if(material!==undefined){hits.push({entityId:entity.id,material});break;}
 }
 return hits;
}
