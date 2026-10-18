"""Actual dispatch and all twelve conditional branch handlers to RET."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-conditional-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);cpu.mem_write(0x50000,bytes([0xa5])*65536);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,(case['si']-1)&65535),(UC_X86_REG_BP,0x200),(UC_X86_REG_DX,case['dx']),(UC_X86_REG_CX,case['cx']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 source=bytearray(65536);source[(case['si']-1)&65535]=case['opcode'];source[case['si']]=case['raw']&255
 if (case['opcode']-18)%3:source[case['si']+1]=case['raw']>>8
 cpu.mem_write(0x40000,bytes(source));cpu.emu_start(0x126eb,0xfffff,count=20)
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_SI)==case['expected']['si']
 assert cpu.reg_read(UC_X86_REG_DX)==case['dx'] and cpu.reg_read(UC_X86_REG_CX)==case['cx']
 assert cpu.reg_read(UC_X86_REG_AX)==(case['expected']['ax'] if case['expected']['taken'] else case['opcode']*2)
 assert bytes(cpu.mem_read(0x40000,65536))==source
assert bytes(cpu.mem_read(0x50000,65536))==bytes([0xa5])*65536 and a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'all12 conditional handlers match through actual dispatch and RET','limits':'DF0, bounded word reads, flags not modeled'}))
