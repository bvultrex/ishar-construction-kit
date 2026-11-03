"""Actual opcode148 literal ID search, first/all mode, exclusion and result store."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-context-query-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,case['bp']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 source=bytes([148,case['id']&255,case['id']>>8,case['tag'],32,0]);cpu.mem_write(0x40100,source)
 context=bytearray(65536)
 for i,node in enumerate(case['nodes']):
  at=0x100+node['slot'];context[at:at+2]=node['pointer'].to_bytes(2,'little');context[at+4:at+6]=(case['nodes'][i+1]['slot'] if i+1<len(case['nodes']) else 0).to_bytes(2,'little');at=node['pointer']-0x10;context[at:at+2]=node['id'].to_bytes(2,'little')
 cpu.mem_write(0x50000,bytes(context));globals=bytearray([0xa5])*0x2200;globals[0xbd2:0xbd4]=(0x100).to_bytes(2,'little');globals[0xc96]=case['mode'];cpu.mem_write(0x1c0b0,bytes(globals));cpu.emu_start(0x126eb,0xfffff,count=1000)
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==case['expected'][name],(case,name,cpu.reg_read(r))
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==case['expected']['contextHash']
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x2200))).hexdigest()==case['expected']['globalsHash'] and bytes(cpu.mem_read(0x40100,len(source)))==source
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode148 module-ID query and result targets match through actual dispatch and RET','limits':'DF0, disjoint bounded segments, acyclic lists, direct result tags6/8/18/20'}))
