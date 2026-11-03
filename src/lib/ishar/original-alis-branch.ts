/** Structural old DOS relative control-flow encoding. Native 24-bit negative
 * sign extension remains unverified; decoded signed24 matches local listings. */
export interface DosAlisBranch {kind:'call'|'jump'|'zero'|'nonzero'|'notEqual'|'equal'|'resume';width:1|2|3;offset:number;next:number;target:number;displacement:number}
const groups:readonly [number,DosAlisBranch['kind']][]=[[5,'call'],[8,'jump'],[0x12,'zero'],[0x15,'nonzero'],[0x18,'notEqual'],[0x1b,'equal'],[0x30,'resume']];
export function readDosAlisBranch(image:Uint8Array,offset:number):DosAlisBranch{
 if(!Number.isInteger(offset)||offset<0||offset>=image.length)throw Error('Invalid ALIS branch offset');
 const opcode=image[offset]!,group=groups.find(([base])=>opcode>=base&&opcode<=base+2);if(!group)throw Error('Unsupported ALIS direct branch opcode');
 const width=(opcode-group[0]+1) as 1|2|3,next=offset+1+width;if(next>image.length)throw Error('Truncated ALIS branch');
 let raw=0;for(let i=0;i<width;i++)raw+=image[offset+1+i]!*2**(8*i);
 const displacement=raw>=2**(width*8-1)?raw-2**(width*8):raw,target=next+displacement;
 if(target<0||target>=image.length)throw Error('ALIS branch target outside image');
 return {kind:group[1],width,offset,next,target,displacement};
}
export function originalAlisBranchTaken(branch:DosAlisBranch,d6:number,d7:number):boolean{
 if(![d6,d7].every(n=>Number.isInteger(n)&&n>=-32768&&n<=32767))throw Error('Invalid ALIS branch registers');
 switch(branch.kind){case 'zero':return d7===0;case 'nonzero':return d7!==0;case 'notEqual':return d7!==d6;case 'equal':return d7===d6;default:return true;}
}
/** Retarget existing instruction only; does not insert code or prove boundaries. */
export function editDosAlisBranchTarget(image:Uint8Array,offset:number,target:number):Uint8Array{
 const branch=readDosAlisBranch(image,offset),delta=target-branch.next;
 if(!Number.isInteger(target)||target<0||target>=image.length||delta< -(2**(branch.width*8-1))||delta>=2**(branch.width*8-1))throw Error('ALIS branch target not representable');
 if(branch.width===3&&delta<0&&delta!==branch.displacement)throw Error('New negative 24-bit branch requires native verification');
 const copy=image.slice(),raw=delta<0?delta+2**(branch.width*8):delta;
 for(let i=0;i<branch.width;i++)copy[offset+1+i]=(Math.floor(raw/2**(8*i)))&255;
 if(readDosAlisBranch(copy,offset).target!==target)throw Error('ALIS branch write readback failed');return copy;
}

