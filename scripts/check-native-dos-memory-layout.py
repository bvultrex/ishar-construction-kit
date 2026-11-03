"""Native screen reservation/startup pointers, before subsequent init calls."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-memory-layout-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x108eb:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for offset,value,size in [(0xb8a,case['existing'],2),(0xb88,0x1234,2),(0x2898,case['graphics'],1),(0x2892,case['performance'],1),(0x2896,case['mode'],1)]:cpu.mem_write(0x1c0b0+offset,value.to_bytes(size,'little'))
 for offset in [0xb94,0xb96,0x1df9,0x1dfb,0xc24,0xc26,0xb5a,0xb5c]:cpu.mem_write(0x1c0b0+offset,b'\x55\x55')
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_AX,case['upper'])]:cpu.reg_write(r,v)
 cpu.emu_start(0x1087d,0xfffff,count=80)
 expected=case['expected'];assert done==[0x108eb]
 for offset,value in [(0xb8a,expected['screenSegment']),(0xb88,expected['bufferOffset']),(0xb94,0),(0xb96,expected['frontier']),(0x1df9,0),(0x1dfb,expected['screenSegment']),(0xc24,0),(0xc26,expected['screenSegment']),(0xb5a,0),(0xb5c,expected['screenSegment'])]:assert int.from_bytes(cpu.mem_read(0x1c0b0+offset,2),'little')==value,(case,offset)
 assert cpu.reg_read(UC_X86_REG_AX)==expected['screenSegment'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'startup screen reservation, existing-buffer branch, frontier and pointer mirrors match','limits':'slice 087D..08EA only; BIOS and earlier alternate screen allocation not executed'}))
