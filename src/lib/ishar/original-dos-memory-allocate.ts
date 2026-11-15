/** Native 1000:0A14..0A4F, 16-bit request and segment frontier/floor.
 * Raw arithmetic includes original wrap; not a safe general host allocator.
 */
export function allocateOriginalDosMemory(size:number,frontier:number,floor:number){
 if(![size,frontier,floor].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Native allocator inputs must be words');
 const paragraphs=(((size+16)&65535)>>>4)+1,candidate=(frontier-paragraphs)&65535;
 if(candidate<floor)return {success:false,frontier,handle:0,headerSegment:null,headerWord:null};
 return {success:true,frontier:candidate,handle:(candidate+1)&65535,headerSegment:candidate,headerWord:paragraphs};
}
