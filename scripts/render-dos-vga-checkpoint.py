"""Private diagnostic PNG from verified320x200 VGA indices and DAC shadow.
This renders inspected original data, not a captured hardware video signal.
"""
import argparse,hashlib,json,struct,zlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('checkpoint',type=Path);p.add_argument('output',type=Path);a=p.parse_args();repo=Path(__file__).resolve().parent.parent
memory=a.checkpoint.read_bytes();meta=json.loads(a.checkpoint.with_suffix('.json').read_text());assert len(memory)==0x100000 and hashlib.sha256(memory).hexdigest()==meta['memorySha256'];assert meta['profile'] in ['ishar1','ishar2']
assert a.output.suffix.lower()=='.png' and not a.output.resolve().is_relative_to(repo.resolve()),'Original-data preview must stay outside repository'
palette=memory[0x1c0b0+0x1143:0x1c0b0+0x1443];assert len(palette)==768 and max(palette)<=63,'Preview requires the verified six-bit VGA DAC-shadow path'
pixels=memory[0xa0000:0xa0000+64000];raw=bytearray()
for y in range(200):
 raw.append(0)
 for index in pixels[y*320:(y+1)*320]:
  for component in palette[index*3:index*3+3]:raw.append((component*255+31)//63)
def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',320,200,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw))+chunk(b'IEND',b'')
with a.output.open('xb') as f:f.write(png)
assert a.checkpoint.read_bytes()==memory
print(json.dumps({'output':str(a.output.resolve()),'checkpointSha256':meta['memorySha256'],'vgaSha256':hashlib.sha256(pixels).hexdigest(),'dacShadowSha256':hashlib.sha256(palette).hexdigest(),'pngSha256':hashlib.sha256(png).hexdigest(),'limits':'Private diagnostic from original-memory indices/DAC shadow; six-bit channels linearly expanded to8-bit, no emulated hardware video/timing claim.'}))
