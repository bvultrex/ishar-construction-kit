"""Execute real291B result dispatcher and direct byte/word store handlers to RET."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-result-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x101),(UC_X86_REG_BP,case['bp']),(UC_X86_REG_DX,case['value']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 source=bytes([case['tag'],case['offset']&255,case['offset']>>8]);cpu.mem_write(0x40101,source);cpu.mem_write(0x50000,bytes([0xa5])*65536)
 globals=bytearray([0xa5])*0x2200;globals[0xc58:0xc5a]=bytes([0x34,0x12]);globals[0xc5c:0xc5e]=bytes([0x78,0x56]);cpu.mem_write(0x1c0b0,bytes(globals));cpu.mem_write(0x1c0b0+0xfefe,(0x26f7).to_bytes(2,'little'))
 cpu.emu_start(0x1291b,0xfffff,count=30)
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_SI)==case['expected']['si']
 assert cpu.reg_read(UC_X86_REG_DX)==case['value'] and cpu.reg_read(UC_X86_REG_DI)==case['offset'] and cpu.reg_read(UC_X86_REG_BX)==0x277c
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==case['expected']['contextHash']
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x2200))).hexdigest()==case['expected']['globalsHash'] and bytes(cpu.mem_read(0x40101,3))==source
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'result tags6/8/18/20 and globals swap match through actual291B and RET','limits':'DF0, disjoint bounded segments; strings/indexed result targets not included'}))
