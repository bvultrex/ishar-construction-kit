/** Native 1000:3C97..3CEA. Three raw context-word deltas update linked records.
 * List cycles are rejected by the host; original has no cycle guard here.
 */
export function applyOriginalDosContextDelta(objects:Uint8Array,current:readonly number[],snapshot:readonly number[],head:number){
 if(objects.length!==65536||current.length!==3||snapshot.length!==3||![head,...current,...snapshot].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native delta inputs');
 const memory=objects.slice(),u=(v:number)=>v&65535,delta=current.map((v,i)=>u(v-snapshot[i]));
 const word=(at:number)=>memory[u(at)]|(memory[u(at+1)]<<8),write=(at:number,v:number)=>{memory[u(at)]=v&255;memory[u(at+1)]=(v>>>8)&255;};
 if(delta.every(v=>v===0))return {memory,delta,visited:0,loadedObjectSegment:false,di:null as number|null};
 let di=head,visited=0;const seen=new Set<number>();
 while(di!==0){
  if(seen.has(di))throw Error('Native object chain cycle would not terminate');seen.add(di);visited++;
  if(memory[di]===0)memory[di]=2;
  for(let axis=0;axis<3;axis++)write(di+0x16+axis*2,u(word(di+0x16+axis*2)+delta[axis]));
  di=word(di+4);
 }
 return {memory,delta,visited,loadedObjectSegment:true,di};
}
