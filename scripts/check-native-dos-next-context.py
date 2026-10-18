"""Actual linked-slot selection; stop before frame service or selected context."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-next-context-vectors.mjs')],cwd=repo,text=True));phases={}
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address in [0x12649,0x1264f]:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x7777)]:cpu.reg_write(r,v)
 cpu.mem_write(0x50000,bytes([0xa5])*65536)
 def word(at,v):cpu.mem_write(at,v.to_bytes(2,'little'))
 word(0x50000+((case['tableOffset']+case['currentSlot']+4)&65535),case['nextSlot']);word(0x50000+((case['tableOffset']+case['nextSlot'])&65535),case['bp'])
 before=bytes(cpu.mem_read(0x50000,65536));word(0x1c0b0+0xb02,case['currentSlot']);word(0x1c0b0+0xbd2,case['tableOffset'])
 cpu.emu_start(0x12632,0xfffff,count=16);expected=case['expected'];phase=expected['phase'];phases[phase]=phases.get(phase,0)+1
 assert done==[0x12649 if phase=='frame' else 0x1264f]
 assert int.from_bytes(cpu.mem_read(0x1c0b0+0xb02,2),'little')==expected['slot']==cpu.reg_read(UC_X86_REG_BX)
 assert cpu.reg_read(UC_X86_REG_BP)==expected['bp'] and cpu.reg_read(UC_X86_REG_SI)==expected['si'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 assert bytes(cpu.mem_read(0x50000,65536))==before
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'phases':phases,'result':'raw linked slot, null/non-null context pointer and frame boundary match','limits':'frame service excluded; no validation of selected context or complete scheduling-cycle claim'}))
