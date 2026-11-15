"""Native snapshot helper vs productive TS. No OS or host input calls."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-input-snapshot-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x10100:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for at,value,size in [(0x1cd53,case['blocked'],1),(0x1e946,case['mode'],1),(0x111bd,case['x'],2),(0x111bf,case['y'],2),(0x111c1,case['state'],2),(0x3fefe,0x100,2)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x5000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe)]:cpu.reg_write(r,v)
 cpu.emu_start(0x11259,0xfffff,count=40)
 assert done==[0x10100]
 for key,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX)]:assert cpu.reg_read(r)==case['expected'][key],case
 assert cpu.reg_read(UC_X86_REG_DS)==0x5000 and cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'snapshot registers, signed-independent shift, wrapping offsets, DS and return stack match','limits':'raw captured input fields only; producer and cursor callbacks not yet reconstructed'}))
