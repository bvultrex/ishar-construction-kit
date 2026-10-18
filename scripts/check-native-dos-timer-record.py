"""Original record updates vs productive TS, stopping before device execution."""
import argparse, hashlib, json, subprocess
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_CODE
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([a.node,str(repo/'scripts/dos-timer-record-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address in [0x12279,0x12294,0x12299]:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear();cpu.mem_write(0x51dfd,bytes(case['source']))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x5000),(UC_X86_REG_DI,0x1dfd),(UC_X86_REG_BX,2),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xff00)]:cpu.reg_write(r,v)
 cpu.emu_start(0x1224e,0x1229a,count=48)
 assert len(done)==1 and (done[0]!=0x12299)==case['deviceCall'],case
 assert bytes(cpu.mem_read(0x51dfd,16))==bytes(case['bytes']),case
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_DI)==0x1dfd and cpu.reg_read(UC_X86_REG_BX)==2
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'all record bytes and device-call decision match','limit':'stops before 8BBD or RET; device effects excluded'}))
