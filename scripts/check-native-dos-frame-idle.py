"""Entire idle-render frame service with actual ordinary-key helper; no stubs."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-frame-idle-vectors.mjs')],cwd=repo,text=True));phases={}
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];polls=[0]
 registers=[(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_AX,0x1234),(UC_X86_REG_BX,0x2345),(UC_X86_REG_CX,0x3456),(UC_X86_REG_DX,0x4567),(UC_X86_REG_DI,0x5678),(UC_X86_REG_SI,0x6789),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x789a)]
 for r,v in registers:cpu.reg_write(r,v)
 cpu.mem_write(0x1c0b0,bytes([0xa5])*65536);cpu.mem_write(0x2bfb0,b'\0\xf0');cpu.mem_write(0x10318,bytes([case['key']]))
 for at,v in [(0xc4a,case['dirty']),(0x2898,0),(0xc99,case['target']),(0xc9a,case['counter']),(0xc37,case['mode']),(0xcb0,case['objects'])]:cpu.mem_write(0x1c0b0+at,bytes([v]))
 cpu.mem_write(0x1c0b0+0xc16,b'\0\0')
 def code(uc,address,size,_):
  if address==0x13d64:
   polls[0]+=1
   if polls[0]==2:done.append('wait');uc.emu_stop()
  elif address==0x1f000:done.append('return');uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x13d3c,0xfffff,count=200)
 phase=case['expected']['phase'];phases[phase]=phases.get(phase,0)+1;assert done==[phase]
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x3000))).hexdigest()==case['expected']['globalsSha256']
 assert cpu.reg_read(UC_X86_REG_SP)==(0xfeee if phase=='wait' else 0xff02)
 if phase=='return':
  for r,v in registers:
   if r!=UC_X86_REG_SP:assert cpu.reg_read(r)==v
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'phases':phases,'result':'real timer wait or whole idle frame through input helper and RET matches globals and saved registers','limits':'no IRQ injected during wait; ordinary key only; graphics/render/object paths excluded'}))
