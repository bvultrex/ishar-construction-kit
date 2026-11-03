/** FRISE 0x01fa5..0x02035, with explicit scheduler phases. Engine state and
 * hit-test output are supplied, not inferred from SAV or sprite rectangles. */
export interface OriginalTargetSelection {phase:'release'|'input'|'after-yield'|'done';partySlot:number;entity:number;material:number}
export interface TargetSelectionInput {button:number;x:number;y:number;key:number;hitEntity:number;hitMaterial:number}
export type TargetSelectionWrite={address:number;width:1|2;value:number};
const byte=(n:number)=>((n&255)^128)-128;
export function beginOriginalTargetSelection(previousEntity:number):{state:OriginalTargetSelection;writes:TargetSelectionWrite[]}{
 if(!Number.isInteger(previousEntity)||previousEntity< -32768||previousEntity>32767)throw Error('Previous FRISE entity required');
 return {state:{phase:'release',partySlot:-1,entity:previousEntity,material:0},writes:[{address:0x49d3,width:1,value:1},{address:0x4a00,width:2,value:-2}]};
}
export function originalTargetSelectionStep(state:OriginalTargetSelection,input:TargetSelectionInput):{state:OriginalTargetSelection;writes:TargetSelectionWrite[]}{
 if(!['release','input','after-yield','done'].includes(state.phase)||![state.partySlot,state.entity,state.material,input.button,input.x,input.y,input.key,input.hitEntity,input.hitMaterial].every(n=>Number.isInteger(n)&&n>=-32768&&n<=32767))throw Error('Invalid original selection state/input');
 const next={...state},writes:TargetSelectionWrite[]=[];
 const done=()=>{next.phase='done';writes.push({address:0x49d3,width:1,value:0});return {state:next,writes};};
 if(state.phase==='done')return {state:next,writes};
 if(state.phase==='release'){if(input.button===0&&input.key===0)next.phase='input';return {state:next,writes};}
 if(state.phase==='after-yield'){
  if(input.hitEntity!==-1){next.entity=input.hitEntity;next.material=input.hitMaterial;}
  return done();
 }
 if(input.button===1&&input.y<71){next.partySlot=byte(Math.trunc(input.x/64));return done();}
 if(input.button===2)return done();
 if(input.button===1&&input.hitEntity!==-2)next.phase='after-yield';
 return {state:next,writes};
}
/** SOURIS 0x00781..0x007ac: only called when MAIN 0x49d3 == 1.
 * Missing hit writes -1 while leaving the previous material unchanged. */
export function originalMouseSelectionWrites(hit:{entityId:number;material:number}|null):TargetSelectionWrite[]{
 if(hit&&(!Number.isInteger(hit.entityId)||hit.entityId<0||hit.entityId>32767||!Number.isInteger(hit.material)||hit.material<0||hit.material>65535))throw Error('Invalid original form hit');
 return hit?[{address:0x4a02,width:2,value:hit.material},{address:0x4a00,width:2,value:hit.entityId}]:[{address:0x4a00,width:2,value:-1}];
}
