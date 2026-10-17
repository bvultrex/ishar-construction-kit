"""All byte-pair combinations for six steps against real palette instructions."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-palette-step-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x70100:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
saved=[(UC_X86_REG_AX,0x1111),(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0x7777)]
for case in cases:
 done.clear();target=base64.b64decode(case['target']);cpu.mem_write(0x1cef3,base64.b64decode(case['current']));cpu.mem_write(0x1d4f3,target);cpu.mem_write(0x1cd6e,bytes([case['step']]));cpu.mem_write(0x3fefc,b'\0\1\0\x70')
 for r,v in saved+[(UC_X86_REG_CS,0x1e97),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefc),(UC_X86_REG_EFLAGS,0x402)]:cpu.reg_write(r,v)
 cpu.emu_start(0x1f839,0xfffff,count=20000)
 assert done==[0x70100]
 assert hashlib.sha256(bytes(cpu.mem_read(0x1cef3,768))).hexdigest()==case['sha256']
 assert cpu.mem_read(0x1cd68,1)[0]==case['active'] and bytes(cpu.mem_read(0x1d4f3,768))==target
 for r,v in saved:assert cpu.reg_read(r)==v
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00 and not cpu.reg_read(UC_X86_REG_EFLAGS)&0x400
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'bytePairsPerStep':65536,'steps':[0,1,4,63,128,255],'result':'native palette bytes, active flag, target preservation and registers match','limits':'arithmetic step only; palette upload and outer countdown excluded'}))
