"""Original scheduler preparation through first scan/main dispatch or skip."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-schedule-vectors.mjs')],cwd=repo,text=True));phases={}
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x200),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x3333)]:cpu.reg_write(r,v)
 cpu.mem_write(0x50000,bytes([0xa5])*65536);cpu.mem_write(0x40000,bytes(65536));cpu.mem_write(0x4010a,case['scan'].to_bytes(2,'little'))
 for at,v in [(-36,case['flag']),(-4,case['active']),(-1,case['delay'])]:cpu.mem_write(0x50200+at,bytes([v]))
 for at,v in [(-20,0x100),(-18,0x4000),(-8,0x1234),(-6,0x4000)]:cpu.mem_write(0x50200+at,v.to_bytes(2,'little'))
 cpu.mem_write(0x1c0b0+0xbfa,bytes([0x5a])*8)
 def code(uc,address,size,_):
  if address in [0x12632,0x126eb]:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x1264f,0xfffff,count=100)
 expected=case['expected'];phase=expected['phase'];phases[phase]=phases.get(phase,0)+1
 assert done==[0x12632 if phase=='skip' else 0x126eb]
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['memorySha256']
 for at,v in expected['globals'].items():
  at=int(at);size=1 if at in [0xc96,0xc19] else 2
  assert int.from_bytes(cpu.mem_read(0x1c0b0+at,size),'little')==v
 if phase=='skip':assert bytes(cpu.mem_read(0x1c0b0+0xbfa,8))==bytes([0x5a])*8
 assert cpu.reg_read(UC_X86_REG_DS)==expected['ds'] and cpu.reg_read(UC_X86_REG_SI)==expected['si']
 assert cpu.reg_read(UC_X86_REG_SP)==(0xff00 if phase=='skip' else 0xfefe) and cpu.reg_read(UC_X86_REG_BP)==0x200
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'phases':phases,'result':'scan precedence, active flag, countdown, snapshots and first dispatch pointer match','limits':'controlled contexts; opcode/callback bodies and next-context selection excluded'}))
