"""Compare Ghidra decoded instruction bounds/hashes with capture and Capstone.
Decompiler C is checked for successful generation only, NOT semantic equivalence.
"""
import argparse,csv,hashlib,json
from pathlib import Path
from capstone import Cs,CS_ARCH_X86,CS_MODE_16
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('output',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
ranges={'ishar_opcode71_literal_context_word':(0x2ef3,0x2efe),'ishar_opcode20_jump_if_zero_padded_word':(0x289c,0x28a8)};rows=list(csv.DictReader((a.output/'instruction-boundaries.csv').open()));decoder=Cs(CS_ARCH_X86,CS_MODE_16);results=[]
for name,(start,end) in ranges.items():
 selected=[r for r in rows if r['function']==name];instructions=list(decoder.disasm(source[0x10000+start:0x10000+end+1],start));assert len(selected)==len(instructions)>0
 for row,instruction in zip(selected,instructions):
  segment,offset=[int(v,16) for v in row['address'].split(':')];assert segment==0x1000 and offset==instruction.address and int(row['length'])==instruction.size
  raw=source[segment*16+offset:segment*16+offset+instruction.size];assert hashlib.sha256(raw).hexdigest()==row['sha256']
 c_file=a.output/(name+'.c.txt');assert c_file.is_file() and name in c_file.read_text()
 results.append({'function':name,'segment':0x1000,'start':start,'end':end,'instructions':len(instructions),'instructionBoundariesAndBytesMatch':True,'decompilerProducedOutput':True,'decompilerSemanticsVerified':False})
assert a.capture.read_bytes()==source and len(rows)==sum(r['instructions'] for r in results)
print(json.dumps({'captureSha256':digest,'language':'x86:LE:16:Real Mode','compiler':'default','functions':results,'limits':'two bounded handlers, no whole-program analysis; C output lacks explicit register/segment contract and is not a reconstruction proof'},indent=2))
