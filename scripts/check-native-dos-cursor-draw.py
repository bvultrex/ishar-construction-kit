"""Native cursor format branches and transparent writes vs productive model."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-cursor-draw-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 cpu.mem_write(0x60000,bytes((i*13+7)&255 for i in range(65536)));cpu.mem_write(0x50200,bytes(case['sprite']))
 for at,value in [(0x1cc34,0),(0x1cc36,0x6000),(0x1cd64,0x200),(0x1cd66,0x5000),(0x1de85,320),(0x1cd56,case['x']),(0x1cd58,case['y']),(0x3fefe,0x100)]:cpu.mem_write(at,value.to_bytes(2,'little'))
 for r,v in [(UC_X86_REG_CS,0x1e97),(UC_X86_REG_DS,0x1c0b),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 def code(uc,address,size,_):
  if address==0x1ea70:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x1f8b8,0xfffff,count=8192)
 assert done==[0x1ea70]
 assert hashlib.sha256(bytes(cpu.mem_read(0x60000,65536))).hexdigest()==case['sha256'],case
 assert cpu.reg_read(UC_X86_REG_DS)==0x1c0b and cpu.reg_read(UC_X86_REG_SP)==0xff00
 assert bytes(cpu.mem_read(0x50200,264))==bytes(case['sprite'])
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'all three cursor format paths, transparency, palette wrap and clipping match','limits':'synthetic sprites, valid coordinates, stride320, DF=0; complete cursor movement not yet composed'}))
