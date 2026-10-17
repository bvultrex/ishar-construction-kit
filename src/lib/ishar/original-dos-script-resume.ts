import {applyOriginalDosContextDelta} from './original-dos-context-delta.ts';
/** Native main-script continuation26B2..26E8. Stops at return callback dispatch
 * or next-context2632. Disjoint context/module/object segments are required.
 */
export function resumeOriginalDosScript(context:Uint8Array,module:Uint8Array,objects:Uint8Array,bp:number,si:number,snapshot:readonly number[],objectSegment:number){
 if([context,module,objects].some(v=>v.length!==65536)||![bp,si,objectSegment].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw Error('Invalid native resume inputs');
 const memory=context.slice(),u=(v:number)=>v&65535,w=(at:number)=>memory[u(bp+at)]|(memory[u(bp+at+1)]<<8),write=(at:number,v:number)=>{memory[u(bp+at)]=v&255;memory[u(bp+at+1)]=(v>>>8)&255;};
 write(-8,si);const base=w(-20),segment=w(-18),offset=module[u(base+6)]|(module[u(base+7)]<<8);
 if(offset!==0)return {memory,objects:objects.slice(),globals:{0xc19:0,0xc56:w(-10)} as Record<number,number>,phase:'callback' as const,ds:segment,si:u(base+6+offset)};
 const result=applyOriginalDosContextDelta(objects,[w(0),w(2),w(4)],snapshot,w(-24));
 memory[u(bp-1)]=memory[u(bp-2)];
 return {memory,objects:result.memory,globals:{} as Record<number,number>,phase:'next' as const,ds:result.loadedObjectSegment?objectSegment:segment,si:base};
}
