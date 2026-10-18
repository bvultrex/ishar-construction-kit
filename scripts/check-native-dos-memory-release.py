"""Native frontier release helper including 16-bit segment arithmetic."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-memory-release-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 at=((case['handle']-1)&65535)*16;cpu.mem_write(at,case['headerWord'].to_bytes(2,'little'));cpu.mem_write(0x1cc46,case['frontier'].to_bytes(2,'little'));cpu.mem_write(0x3fefe,b'\0\1')
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_SI,0x7777),(UC_X86_REG_DX,case['handle']),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe)]:cpu.reg_write(r,v)
 def code(uc,address,size,_):
  if address==0x10100:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x10a50,0xfffff,count=32)
 assert done==[0x10100] and int.from_bytes(cpu.mem_read(0x1cc46,2),'little')==case['expected']['frontier']
 assert cpu.reg_read(UC_X86_REG_DX)==case['expected']['dx']
 assert cpu.reg_read(UC_X86_REG_DS)==0x5000 and cpu.reg_read(UC_X86_REG_ES)==0x6000 and cpu.reg_read(UC_X86_REG_SI)==0x7777 and cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'frontier comparison, conditional release, wrap and register effects match','limits':'controlled block header, no allocation invariant or whole allocator verified'}))
