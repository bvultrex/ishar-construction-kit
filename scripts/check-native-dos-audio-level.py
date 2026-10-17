"""Native level setter/getter, including operand coupling and register preservation."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
vectors=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-audio-level-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x70100:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
fields=[(7,1,'base'),(0x12,1,'skipFirst'),(0xc,2,'first'),(0xe,2,'firstDivisor'),(0x10,2,'hold'),(8,2,'last'),(0xa,2,'lastDivisor'),(6,1,'value'),(0x71b,1,'operand')]
def run(offset,ax):
 done.clear();cpu.mem_write(0x3fefc,b'\0\1\0\x70')
 for r,v in [(UC_X86_REG_CS,0x1941),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefc),(UC_X86_REG_AX,ax)]:cpu.reg_write(r,v)
 cpu.emu_start(0x19410+offset,0xfffff,count=24)
 assert done==[0x70100] and cpu.reg_read(UC_X86_REG_SP)==0xff00
for case in vectors['cases']:
 for offset,size,key in fields:cpu.mem_write(0x19410+offset,case['source'][key].to_bytes(size,'little'))
 run(0x1d1,0xab00|case['value']);assert cpu.reg_read(UC_X86_REG_AX)==0xab00|case['value']
 for offset,size,key in fields:assert int.from_bytes(cpu.mem_read(0x19410+offset,size),'little')==case['state'][key]
 run(0x1e2,0xcd55);assert cpu.reg_read(UC_X86_REG_AX)==0xcd00|case['read']
for case in vectors['reads']:
 cpu.mem_write(0x19416,bytes([case['value']]))
 run(0x1e2,0xcd55);assert cpu.reg_read(UC_X86_REG_AX)==0xcd00|case['read']
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'setterCases':len(vectors['cases']),'extraGetterCases':len(vectors['reads']),'result':'native half-scale setter, doubled getter, operand and unrelated fields match','limits':'raw audio control level; acoustic gain and downstream hardware not established'}))
