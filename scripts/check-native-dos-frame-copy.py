"""Actual graphics0028 far entry including copy, rectangle helper and RETF."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-frame-copy-vectors.mjs')],cwd=repo,text=True));source=bytes((i*13+7)&255 for i in range(65536))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 saved=[(UC_X86_REG_AX,0x1111),(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x7000),(UC_X86_REG_BP,0x8888)]
 for r,v in saved+[(UC_X86_REG_CS,0x1e97),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
 cpu.mem_write(0x60000,source);cpu.mem_write(0x70000,bytes([0xa5])*65536);cpu.mem_write(0x2bfb0,b'\0\xf0\0\x10')
 for at,v in [(0xb84,case['sourceOffset']),(0xb86,0x6000),(0xb88,case['destinationOffset']),(0xb8a,0x7000),(0xcaa,0x2780),(0xcac,0x5000),(0x1dd5,case['stride'])]:cpu.mem_write(0x1c0b0+at,v.to_bytes(2,'little'))
 for at,v in [(0x2780,case['rectangleOffset']),(0x2782,case['width']),(0x2784,case['rows'])]:cpu.mem_write(0x1c0b0+at,v.to_bytes(2,'little'))
 if case['payload']:cpu.mem_write(0x52786,bytes(case['payload']))
 def code(uc,address,size,_):
  if address==0x1f000:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x1e998,0xfffff,count=10000)
 assert done==[0x1f000] and cpu.reg_read(UC_X86_REG_SP)==0xff04
 assert hashlib.sha256(bytes(cpu.mem_read(0x70000,65536))).hexdigest()==case['expected']
 assert bytes(cpu.mem_read(0x60000,65536))==source
 if case['payload']:assert bytes(cpu.mem_read(0x52786,len(case['payload'])))==bytes(case['payload'])
 for r,v in saved:assert cpu.reg_read(r)==v
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'actual 8000-byte copy, opaque saved rectangle and RETF match complete destination segment','limits':'captured code only, DF0, disjoint non-wrapping buffers; not a complete presentation/renderer claim'}))
