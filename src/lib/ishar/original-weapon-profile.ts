import {readAlisModule} from './alis-module.ts';

export interface OriginalWeaponProfile {readonly types:readonly number[]}
export const originalWeaponCode=(code:number)=>Number.isInteger(code)&&code>=-116&&code<=-90;

/** PARAM00f58 initializes MAIN T4a08, 27 records of four byte fields.
 * Accept only the complete measured instruction shape; no guessed fallback.
 * This extracts local data, and does not identify another game's profile.
 */
export function readOriginalWeaponProfile(raw:Uint8Array):OriginalWeaponProfile {
  const image=readAlisModule(raw).image;let pc=0xf58;
  const expect=(bytes:number[])=>{
    if(bytes.some((value,i)=>image[pc+i]!==value))throw Error(`Unsupported PARAM weapon initializer at ${pc.toString(16)}`);
    pc+=bytes.length;
  };
  expect([30,0,0,20,14]);const types:number[]=[];
  for(let row=0;row<27;row++){
    for(let field=0;field<4;field++){
      const value=image[pc+2];
      if(value===undefined)throw Error('Truncated PARAM weapon initializer');
      expect([30,0,value,56,20,14,64,0,field,58,38,8,74]);
      if(field===2)types.push(value>127?value-256:value);
    }
    if(row<26)expect([32,0,1,20,14]);
  }
  return Object.freeze({types:Object.freeze(types)});
}

/** FRISE02e36: type modulo ten equals two reserves the opposite hand. */
export function originalWeaponTwoHanded(profile:OriginalWeaponProfile,code:number):boolean|null {
  if(!originalWeaponCode(code)||profile.types.length!==27)return null;
  const type=profile.types[code+116];
  return type!==undefined&&Number.isInteger(type)?type%10===2:null;
}
