"""Original cursor background restore into controlled RAM, no display hardware."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-cursor-restore-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 cpu.mem_write(0x60000,bytes((i*13+7)&255 for i in range(65536)))
 header=b''.join(case[k].to_bytes(2,'little') for k in ['offset','width','rows'])
 payload=bytes((i*17+99)&255 for i in range(case['width']*case['rows']))
 cpu.mem_write(0x1e830,header)
 cpu.mem_write(case['segment']*16+0x2786,payload)
 for at,value,size in [(0x1cc34,0x1234,2),(0x1cc36,0x6000,2),(0x1cd5a,0x2780,2),(0x1cd5c,case['segment'],2),(0x1de85,case['stride'],2),(0x3fefe,0x100,2)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 saved=[(UC_X86_REG_AX,0x1111),(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x7000),(UC_X86_REG_BP,0x8888)]
 for r,v in saved+[(UC_X86_REG_CS,0x1e97),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 def code(uc,address,size,_):
  if address==0x1ea70:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x1f9cd,0xfffff,count=2048)
 assert done==[0x1ea70]
 assert hashlib.sha256(bytes(cpu.mem_read(0x60000,65536))).hexdigest()==case['sha256'],case
 for r,v in saved:assert cpu.reg_read(r)==v
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'full destination buffer and nine restored registers match','limits':'DF=0, positive row count, nonwrapping RAM; cursor drawing excluded'}))
