/** Native 1000:0B1E..0BBB. EMS protocol planning with explicit driver replies. */
export function planOriginalDosEmsInit(signatureMatches:boolean,queryStatus:number,pageFrame:number,allocateStatus:number,handle:number,mapStatuses:readonly number[],oldFrame:number,oldHandle:number){
 if(typeof signatureMatches!=='boolean'||![queryStatus,allocateStatus,...mapStatuses].every(v=>Number.isInteger(v)&&v>=0&&v<=255)||mapStatuses.length!==4||![pageFrame,handle,oldFrame,oldHandle].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Invalid native EMS replies');
 const calls:{interrupt:number;ax?:number;ah?:number;bx?:number;dx?:number}[]=[{interrupt:0x21,ax:0x3567}];
 let savedFrame=oldFrame,savedHandle=oldHandle;
 const result=(active:number,ax:number)=>({calls,active,ax,savedFrame,savedHandle});
 if(!signatureMatches)return result(0,0);
 calls.push({interrupt:0x67,ah:0x41});if(queryStatus!==0)return result(0,0);
 savedFrame=pageFrame;
 calls.push({interrupt:0x67,ah:0x43,bx:4});if(allocateStatus!==0)return result(0,0);
 savedHandle=handle;
 for(let page=0;page<4;page++){
  calls.push({interrupt:0x67,ax:0x4400+page,bx:page,dx:handle});
  if(mapStatuses[page]!==0){calls.push({interrupt:0x67,ah:0x45,dx:handle});return result(0,0);}
 }
 return result(1,pageFrame);
}
/** Native 1000:0BBC..0BDF. Does not clear the active word or handle and
 * does not inspect the driver's release status, even on repeated calls.
 */
export function planOriginalDosEmsRelease(active:number,handle:number){
 if(![active,handle].every(v=>Number.isInteger(v)&&v>=0&&v<=65535))throw new Error('Invalid native EMS release state');
 return {active,handle,calls:active===0?[]:[{interrupt:0x67,ah:0x45,dx:handle}]};
}
