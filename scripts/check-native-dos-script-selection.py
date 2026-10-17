"""Actual opcode71 dispatch and handler compared with bounded host reconstruction."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-selection-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,(case['si']-1)&65535),(UC_X86_REG_BP,case['bp']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 source=bytearray(65536);source[(case['si']-1)&65535]=71;source[case['si']:case['si']+2]=case['value'].to_bytes(2,'little');cpu.mem_write(0x40000,bytes(source))
 context=bytearray([0xa5])*65536;at=(case['bp']-0x16)&65535;context[at:at+2]=case['previous'].to_bytes(2,'little');cpu.mem_write(0x50000,bytes(context))
 cpu.emu_start(0x126eb,0xfffff,count=20)
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_SI)==case['expected']['si']
 assert cpu.reg_read(UC_X86_REG_AX)==case['value'] and hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==case['expected']['hash']
 assert bytes(cpu.mem_read(0x40000,65536))==source
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode71 literal context word matches through actual dispatch and RET','limits':'DF0, disjoint bounded segments; raw field meaning not inferred'}))
