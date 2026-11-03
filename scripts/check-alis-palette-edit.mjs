import assert from 'node:assert/strict';
import {describeAlisPalettes,editAlisPalette,extractAlisIndexedImages,vgaDac} from '../src/lib/ishar/alis-assets.ts';
import {packSilmA1} from '../src/lib/ishar/silm-write.ts';
import {readAlisModule,writeAlisModule} from '../src/lib/ishar/alis-module.ts';
function fixture(old=false){
 const image=new Uint8Array(160),v=new DataView(image.buffer);v.setUint16(0,4,true);v.setUint16(2,22,true);v.setUint32(14,32,true);image[24]=0x44;
 v.setUint32(32,8,true);v.setUint16(36,1,true);v.setUint32(40,24,true);
 image[64]=0xfe;image[65]=old?0:1;
 if(old)for(let color=0;color<16;color++){image[66+color*2]=0xf8|(color&7);image[67+color*2]=0x88|((color&7)<<4)|(color&7);}
 else{image[66]=17;image[67]=0xa5;image.set([4,5,6,250,251,252],68);}
 return image;
}
for(const old of [false,true]){
 const image=fixture(old),before=image.slice(),palette=describeAlisPalettes(image)[0];assert.ok(palette);
 const color=palette.firstColor,max=palette.maxChannel,rgb=[max,0,1];
 const edited=editAlisPalette(image,0,color,rgb),next=describeAlisPalettes(edited)[0];assert.deepEqual(next.colors[0],rgb);
 const allowed=old?[66,67]:[68,69,70];
 for(let i=0;i<image.length;i++)if(!allowed.includes(i))assert.equal(edited[i],image[i],`untargeted byte ${i}`);
 if(old){assert.equal(edited[66]&0xf8,image[66]&0xf8);assert.equal(edited[67]&0x88,image[67]&0x88);}
 const decoded=extractAlisIndexedImages(edited,'synthetic.IO',true).palettes[0];
 assert.deepEqual([...decoded.palette.slice(color*3,color*3+3)],rgb.map(value=>old?value<<5:vgaDac(value)));
 const module=readAlisModule(packSilmA1(image));assert.deepEqual(readAlisModule(writeAlisModule(module,edited)).image,edited);
 assert.deepEqual(editAlisPalette(image,0,color,palette.colors[0]),image,'no-op preserves unused bits');
 assert.deepEqual(image,before,'source image remains immutable');
 assert.throws(()=>editAlisPalette(image,1,color,rgb),/Palette/);
 assert.throws(()=>editAlisPalette(image,0,256,rgb),/Farbindex/);
 assert.throws(()=>editAlisPalette(image,0,color,[max+1,0,0]),/RGB/);
 assert.throws(()=>editAlisPalette(image,0,color,[0.5,0,0]),/RGB/);
}
const malformed=fixture();malformed[66]=255;
assert.equal(describeAlisPalettes(malformed).length,0,'partial palette exceeding 256 colors rejected');
assert.equal(describeAlisPalettes(new Uint8Array(10)).length,0,'truncated input has no editable resource');
console.log('DOS palette edits: both encodings, partial ranges, unknown bytes/bits, immutability, A1 export/readback and invalid-input checks passed.');
