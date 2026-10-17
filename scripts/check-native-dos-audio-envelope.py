"""Original raw audio envelope arithmetic vs productive TS; stop target excluded."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-audio-envelope-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
fields=[(7,1,'base'),(0x12,1,'skipFirst'),(0xc,2,'first'),(0xe,2,'firstDivisor'),(0x10,2,'hold'),(8,2,'last'),(0xa,2,'lastDivisor'),(6,1,'value'),(0x71b,1,'operand')]
def code(uc,address,size,_):
 if address in [0x19510,0x197a6]:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for offset,size,key in fields:cpu.mem_write(0x19410+offset,case['source'][key].to_bytes(size,'little'))
 cpu.mem_write(0x3fefe,b'\0\1')
 for r,v in [(UC_X86_REG_CS,0x1941),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.emu_start(0x19732,0xfffff,count=64)
 expected=case['expected'];assert done==[0x197a6 if expected['stopCall'] else 0x19510]
 for offset,size,key in fields:assert int.from_bytes(cpu.mem_read(0x19410+offset,size),'little')==expected['state'][key],(case,key)
 assert cpu.reg_read(UC_X86_REG_SP)==(0xfeec if expected['stopCall'] else 0xff00)
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'native counters, raw control value, patched operand and stop decision match','limits':'valid nonfaulting DIV inputs; stops before 1000:8A97, field meanings provisional'}))
