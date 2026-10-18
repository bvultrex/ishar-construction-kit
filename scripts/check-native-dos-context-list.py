"""Opcode156 actual prefix, stop at result-operand entry291B. No handler stubs."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-context-list-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x1291b:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x200),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 source=bytes([156])+bytes(255);cpu.mem_write(0x40100,source)
 context=bytearray(65536);slot=0
 for next_slot in case['slots']:
  at=(case['table']+slot+4)&65535;context[at:at+2]=next_slot.to_bytes(2,'little');slot=next_slot
 at=(case['table']+slot+4)&65535;context[at:at+2]=bytes(2);cpu.mem_write(0x50000,bytes(context))
 globals=bytearray([0xa5])*0x2200;globals[0xbd2:0xbd4]=case['table'].to_bytes(2,'little');cpu.mem_write(0x1c0b0,bytes(globals))
 cpu.emu_start(0x126eb,0xfffff,count=2000)
 assert done==[0x1291b] and cpu.reg_read(UC_X86_REG_SP)==0xfefe and cpu.reg_read(UC_X86_REG_SI)==0x101
 assert cpu.reg_read(UC_X86_REG_DX)==case['expected']['value'] and cpu.reg_read(UC_X86_REG_DI)==case['expected']['di'] and cpu.reg_read(UC_X86_REG_BX)==case['expected']['bx']
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x2200))).hexdigest()==case['expected']['hash']
 assert bytes(cpu.mem_read(0x50000,65536))==context and bytes(cpu.mem_read(0x40100,256))==source
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode156 context enumeration matches at result-operand boundary291B','limits':'prefix only, acyclic lists up to127 tested, no result-operand execution'}))
