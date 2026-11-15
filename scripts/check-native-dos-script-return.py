"""Actual opcode17 dispatch through script return or native yield RET."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-return-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];phases={}
def code(uc,address,size,_):
 if address in [0x126f7,0x1f000]:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x200),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.mem_write(0x50000,bytes([0xa5])*65536);cpu.mem_write(0x40100,b'\x11');cpu.mem_write(0x2bfb0,b'\0\xf0')
 for at,v in [(0x501f6,case['stack']),(0x501f4,case['stack'] if case['same'] else 123),(0x50000+((0x200+case['stack'])&65535),0x1234),(0x1c0b0+0xc56,case['boundary'])]:cpu.mem_write(at,v.to_bytes(2,'little'))
 cpu.mem_write(0x1c0b0+0xc19,bytes([case['mode']]))
 cpu.emu_start(0x126eb,0xfffff,count=40);expected=case['expected'];phase=expected['phase'];phases[phase]=phases.get(phase,0)+1
 assert done==[0x1f000 if phase=='yield' else 0x126f7]
 assert cpu.reg_read(UC_X86_REG_SP)==(0xff02 if phase=='yield' else 0xff00) and cpu.reg_read(UC_X86_REG_SI)==expected['si']
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['memorySha256']
 assert cpu.reg_read(UC_X86_REG_BP)==0x200 and cpu.reg_read(UC_X86_REG_DS)==0x4000 and cpu.reg_read(UC_X86_REG_ES)==0x5000
 assert bytes(cpu.mem_read(0x1c0b0+0xc19,1))==bytes([case['mode']]) and int.from_bytes(cpu.mem_read(0x1c0b0+0xc56,2),'little')==case['boundary']
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'phases':phases,'result':'script-stack pop, marker clearing and actual two-level native yield match','limits':'controlled caller return; scheduler continuation and specialized return27BD excluded'}))
