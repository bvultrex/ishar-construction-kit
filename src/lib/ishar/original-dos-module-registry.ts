/** Native 1000:8182..8205/8218/821E. Device notifications are excluded.
 * Entries are existing far pointers paired with the ID word they point to.
 * This host API supports a non-wrapping, already sorted pointer table.
 */
export interface OriginalDosModulePointer {offset:number;segment:number;id:number}
export function registerOriginalDosModule(entries:readonly OriginalDosModulePointer[],incoming:OriginalDosModulePointer,tableOffset:number,endSegment:number,endOffset:number,upper:number,count:number,limit:number){
 const words=[tableOffset,endSegment,endOffset,upper,count,limit,...[...entries,incoming].flatMap(p=>[p.offset,p.segment,p.id])];
 if(!words.every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Native registry values must be words');
 if(tableOffset+4*(entries.length+1)>65535||entries.some((v,i)=>i>0&&entries[i-1].id>v.id))throw Error('Registry requires a non-wrapping sorted table');
 const lower=(endSegment+(endOffset>>>4)+1)&65535;
 if(lower>upper)return {lower,error:11 as number|null,entries:entries.map(v=>({...v})),nextPointer:tableOffset+entries.length*4,count,insertion:null as number|null};
 const insertion=entries.findIndex(v=>v.id>=incoming.id),at=insertion<0?entries.length:insertion;
 const result=entries.map(v=>({...v}));result.splice(at,0,{...incoming});
 const nextCount=(count+1)&65535,signed=(v:number)=>v>=32768?v-65536:v;
 return {lower,error:signed(nextCount)>signed(limit)?4:null,entries:result,nextPointer:tableOffset+result.length*4,count:nextCount,insertion:at};
}
