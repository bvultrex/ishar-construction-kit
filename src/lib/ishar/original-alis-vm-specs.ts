import {readAlisModule} from './alis-module.ts';
/** MAIN's 16 uncompressed DOS VM-spec bytes. Counts/VRAM meaning follows the
 * ALIS reference loader; unknown word remains neutral, never edited here. */
export function readDosAlisVmSpecs(bytes:Uint8Array){
 const module=readAlisModule(bytes);if(!module.isMain||module.envelopeBytes!==22)throw Error('DOS MAIN VM-spec header required');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const specs={moduleSlots:view.getUint16(6,true),entitySlots:view.getUint16(8,true),unknown:view.getUint32(10,true),maxVramBytes:view.getUint32(14,true),rawAllocationUnits:view.getUint32(18,true)};
 if(!specs.moduleSlots||!specs.entitySlots||specs.entitySlots>5462)throw Error('Unsupported DOS VM table dimensions');return specs;
}
