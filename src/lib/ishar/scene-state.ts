/** GERDEP 0x01702..0x0183f: Irvan changes scene by position and previous scene,
 * unlike the layer-B triggers on maps 2/3/5/6/7. One transition per step. */
export function irvanSceneAfterStep(r:number,c:number,current:number):number {
  switch(current){
    case 1: return r<11 && c<30 && c>25 ? 2 : c>44 ? 3 : r>20 && c>30 ? 4 : 1;
    case 2: return r>10 ? 1 : 2;
    case 3: return c<45 ? 1 : 3;
    case 4: return r<21 ? 1 : r>40 ? 5 : 4;
    case 5: return r<41 ? 4 : r>78 && c>38 ? 9 : 5;
    case 6: return r>23 ? 7 : 6;
    case 7: return r<24 ? 6 : 7;
    case 9: return r<78 || c<38 ? 5 : 9;
    default: return current;
  }
}
/** Approximation for direct CONT-only starts without original scene state.
 * A save's scene (including isolated regions 6/7) must take precedence. */
export function inferIrvanScene(r:number,c:number):number {
  let scene=1;
  for(let i=0;i<8;i++){const next=irvanSceneAfterStep(r,c,scene);if(next===scene) break;scene=next;}
  return scene;
}
