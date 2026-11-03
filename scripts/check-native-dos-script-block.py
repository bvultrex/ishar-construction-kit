"""Opcode41 through original dispatch/handler/RET, all byte counts."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-block-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,case['bp']),(UC_X86_REG_DI,0x3456),(UC_X86_REG_CX,0x4567),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.mem_write(0x50000,bytes([0xa5])*65536)
 operands=bytes([41,case['offset']&255,case['offset']>>8,case['count'],0x87])+bytes((i*13+case['count'])&255 for i in range(case['count']*2));cpu.mem_write(0x40100,operands)
 cpu.emu_start(0x126eb,0xfffff,count=1800)
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_SI)==case['expected']['si']
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==case['expected']['memorySha256'], (case['count'],case['offset'],case['bp'])
 assert cpu.reg_read(UC_X86_REG_AX)==82 and cpu.reg_read(UC_X86_REG_DI)==0x3456 and cpu.reg_read(UC_X86_REG_CX)==0x4567
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode41 full context writes, all counts, destination wraps, saved AX/CX/DI and RET match','limits':'DF0, disjoint segments and non-wrapping operands; raw block semantics, not full VM'}))
