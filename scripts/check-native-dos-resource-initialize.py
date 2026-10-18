"""Actual MAIN initializer77BC including813C/785F; shared physical memory."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-initialize-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);done=[];counts=[0,0]
def code(uc,address,size,_):
 if address==0x1814b:counts[0]+=1
 if address==0x178cd:counts[1]+=1
 if address==0x177f6:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 memory=bytearray(source);ss=0x1c0b;es=0x5000;memory[ss*16:ss*16+0x28c0]=bytes([0x5a])*0x28c0;memory[es*16:es*16+65536]=bytes([0xa5])*65536;memory[case['ds']*16:case['ds']*16+65536]=bytes([0xcc])*65536
 for at,value in [(0xbd2,case['table']),(0xbda,case['count']),(0xbe0,case['base']),(0xbe2,case['ds']),(0xbe6,case['frontier'])]:memory[ss*16+at:ss*16+at+2]=value.to_bytes(2,'little')
 cpu.mem_write(0,bytes(memory));done.clear();counts[:]=[0,0]
 saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x2345,UC_X86_REG_CX:0x3456,UC_X86_REG_DX:0x4567,UC_X86_REG_SI:0x5678,UC_X86_REG_DI:0x6789,UC_X86_REG_BP:0x789a,UC_X86_REG_DS:0x7000,UC_X86_REG_ES:es}
 for r,value in saved.items():cpu.reg_write(r,value)
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,ss),(UC_X86_REG_SP,0x8000),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 cpu.emu_start(0x177bc,0xfffff,count=1000000);assert done==[0x177f6] and cpu.reg_read(UC_X86_REG_SP)==0x8000,case
 for r,value in saved.items():assert cpu.reg_read(r)==value,(case,r)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[ss*16+0x7fc0:ss*16+0x8010]=bytes(0x50)
 assert hashlib.sha256(actual).hexdigest()==case['expected']['hash'],case
 assert counts==[case['expected']['tableRecords'],case['expected']['links']],case
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'MAIN reset, signed context-table loop, object links and physical memory effects match','limits':'controlled segments; CPU stack residue masked, stack depth/all9 saved registers checked; no A20 or straddling words'}))
