"""Execute actual opcode62 numeric read, signed guard and context activation byte."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-context-active-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x600),(UC_X86_REG_DX,0x3456),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 source=bytes([62,case['tag'],case['raw']&255,case['raw']>>8]);cpu.mem_write(0x40100,source)
 context=bytearray([0xa5])*65536;at=(case['table']+case['expected']['dx'])&65535;raw=case['pointer'].to_bytes(2,'little');context[at]=raw[0];context[(at+1)&65535]=raw[1];context[0x620:0x622]=case['value'].to_bytes(2,'little');cpu.mem_write(0x50000,bytes(context))
 globals=bytearray([0xa5])*0x2200;globals[0xbd2:0xbd4]=case['table'].to_bytes(2,'little');cpu.mem_write(0x1c0b0,bytes(globals));cpu.emu_start(0x126eb,0xfffff,count=50)
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 assert cpu.reg_read(UC_X86_REG_SI)==case['expected']['si'] and cpu.reg_read(UC_X86_REG_DX)==case['expected']['dx'] and cpu.reg_read(UC_X86_REG_CX)==0x3456
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==case['expected']['contextHash']
 assert bytes(cpu.mem_read(0x1c0b0,0x2200))==globals and bytes(cpu.mem_read(0x40100,len(source)))==source
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode62 signed slot guard and context active byte match through actual dispatch and RET','limits':'DF0 disjoint bounded segments, numeric tags0/2/6/8 only, no scheduler continuation'}))
