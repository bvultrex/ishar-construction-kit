import {unpackSilm,PACKER_NEW} from './silm-pack.ts';
/** DOS ALIS container: outer six-byte envelope, optional 16 VM-spec bytes,
 * then packed/raw image. No Atari/Amiga inference is performed here.
 * Image offsets follow local alis-reference/src/script.c:script_init/load. */
export interface AlisModuleHeader {
 id:number;codeLocation:number;entry:number;returnEntry:number|null;
 scanEntry:number|null;resourceOffset:number;vramBytes:number;
}
export interface AlisModule {
 encoding:'dos-a1'|'dos-raw';isMain:boolean;envelopeBytes:number;
 original:Uint8Array;image:Uint8Array;header:AlisModuleHeader;
}
const LIMIT=16*1024*1024;
export function readAlisImageHeader(image:Uint8Array):AlisModuleHeader {
 if(image.length<24)throw Error('ALIS image header truncated (24 bytes required)');
 const view=new DataView(image.buffer,image.byteOffset,image.byteLength);
 const codeLocation=view.getUint16(2,true),entry=codeLocation+2;
 const returnOffset=view.getUint32(6,true),scanOffset=view.getUint32(10,true),resourceOffset=view.getUint32(14,true);
 const returnEntry=returnOffset?6+returnOffset:null,scanEntry=scanOffset?10+scanOffset:null;
 for(const [label,address] of [['entry',entry],['return',returnEntry],['scan',scanEntry]])
  if(address!==null&&(Number(address)<24||Number(address)>=image.length))throw Error(`ALIS ${label} address outside image`);
 if(resourceOffset!==0&&(resourceOffset<24||resourceOffset>=image.length))throw Error('ALIS resource pointer outside image');
 return {id:view.getUint16(0,true),codeLocation,entry,returnEntry,scanEntry,resourceOffset,vramBytes:view.getUint16(20,true)};
}
export function readAlisModule(bytes:Uint8Array):AlisModule {
 if(bytes.length<6)throw Error('ALIS envelope truncated');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),size=view.getUint32(0,true)&0xffffff,flag=bytes[3];
 const isMain=view.getUint16(4,true)===0,envelopeBytes=isMain?22:6;
 if(size<=envelopeBytes||size>LIMIT||bytes.length<envelopeBytes)throw Error('ALIS envelope size/VM specs invalid');
 let image:Uint8Array,encoding:AlisModule['encoding'];
 if(flag===PACKER_NEW){
  const unpacked=unpackSilm(bytes);if(!unpacked?.data)throw Error(unpacked?.note??'ALIS A1 decoding failed');
  image=unpacked.data;encoding='dos-a1';
 }else if(flag===0||flag===1){
  if(size!==bytes.length)throw Error('Raw ALIS declared/file size mismatch');
  image=bytes.slice(envelopeBytes);encoding='dos-raw';
 }else throw Error(`Unsupported DOS ALIS pack flag ${flag?.toString(16)}`);
 if(image.length!==size-envelopeBytes)throw Error('ALIS decoded image size mismatch');
 return {encoding,isMain,envelopeBytes,original:bytes.slice(),image,header:readAlisImageHeader(image)};
}
/** No-op writes preserve the entire original envelope/compressed stream.
 * Editing raw modules is length-preserving. Packed edits fail closed until a
 * verified A1 writer exists; no silent conversion to a different pack mode. */
export function writeAlisModule(module:AlisModule,image:Uint8Array=module.image):Uint8Array {
 const baseline=readAlisModule(module.original);
 if(image.length!==baseline.image.length)throw Error('ALIS image resizing is not supported');
 readAlisImageHeader(image);
 if(image.every((value,index)=>value===baseline.image[index]))return baseline.original.slice();
 if(baseline.encoding!=='dos-raw')throw Error('Packed ALIS edits require a verified A1 writer');
 const result=baseline.original.slice();result.set(image,baseline.envelopeBytes);return result;
}
