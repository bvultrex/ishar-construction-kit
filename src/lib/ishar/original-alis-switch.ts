/** Old DOS ALIS switch tables, per opcodes.c cswitch1/cswitch2.
 * Caller supplies operandEnd (count byte): this reader does not decode operands.
 * Offsets address the decompressed module image, whose base is even-aligned. */
export interface DosAlisSwitch {kind:'sparse'|'dense';opcodeOffset:number;operandEnd:number;tableEnd:number;cases:{value:number;target:number}[]}
export function readDosAlisSwitch(image:Uint8Array,opcodeOffset:number,operandEnd:number):DosAlisSwitch{
 if(!Number.isInteger(opcodeOffset)||!Number.isInteger(operandEnd)||opcodeOffset<0||operandEnd<=opcodeOffset||operandEnd>=image.length)throw Error('Invalid DOS switch offsets');
 const opcode=image[opcodeOffset];if(opcode!==0x2e&&opcode!==0x2f)throw Error('Expected DOS switch opcode');
 const count=image[operandEnd]!+1,aligned=(operandEnd+2)&~1,view=new DataView(image.buffer,image.byteOffset,image.byteLength),cases:DosAlisSwitch['cases']=[];
 const tableEnd=aligned+(opcode===0x2e?count*4:2+count*2);
 if(tableEnd>image.length)throw Error('Truncated DOS switch table');
 const bias=opcode===0x2f?view.getInt16(aligned,true):0;
 let previous=-32769;
 for(let i=0;i<count;i++){
  const entry=aligned+(opcode===0x2e?i*4:2+i*2),value=opcode===0x2e?view.getInt16(entry,true):(((i-bias)&65535)^32768)-32768;
  if(opcode===0x2e&&value<=previous)throw Error('Unsupported unsorted/duplicate DOS sparse cases');previous=value;
  const displacementAt=entry+(opcode===0x2e?2:0),target=displacementAt+2+view.getUint16(displacementAt,true);
  if(target>=image.length)throw Error('DOS switch target outside image');cases.push({value,target});
 }
 return {kind:opcode===0x2e?'sparse':'dense',opcodeOffset,operandEnd,tableEnd,cases};
}
export function selectDosAlisSwitch(table:DosAlisSwitch,value:number):number{
 if(!Number.isInteger(value)||value< -32768||value>32767)throw Error('Invalid DOS switch input');
 return table.cases.find(entry=>entry.value===value)?.target??table.tableEnd;
}
/** Equal-size retargeting only. Caller must verify the target instruction's
 * meaning/boundary; this structural writer cannot prove gameplay compatibility. */
export function editDosAlisSwitchTarget(image:Uint8Array,opcodeOffset:number,operandEnd:number,value:number,target:number):Uint8Array{
 const table=readDosAlisSwitch(image,opcodeOffset,operandEnd),index=table.cases.findIndex(entry=>entry.value===value);
 if(index<0)throw Error('Unknown DOS switch case');
 if(!Number.isInteger(target)||target<0||target>=image.length)throw Error('Invalid DOS switch target');
 const aligned=(operandEnd+2)&~1,at=aligned+(table.kind==='sparse'?index*4+2:2+index*2),displacement=target-at-2;
 if(displacement<0||displacement>65535)throw Error('DOS switch target cannot be encoded as unsigned relative word');
 const copy=image.slice();new DataView(copy.buffer).setUint16(at,displacement,true);
 const readback=readDosAlisSwitch(copy,opcodeOffset,operandEnd);if(readback.cases[index]!.target!==target)throw Error('DOS switch write readback failed');return copy;
}
