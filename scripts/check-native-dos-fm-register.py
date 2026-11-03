"""Original FM write and complete nonzero-device stop branch, mocked status reads."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
vectors=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-fm-register-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];io=[]
def code(uc,address,size,_):
 if address in [0x19510,0x70100]:done.append(address);uc.emu_stop()
def out(uc,port,size,value,_):assert size==1;io.append({'kind':'write','port':port,'value':value})
def inp(uc,port,size,_):assert size==1 and port==0x388;io.append({'kind':'read','port':port});return len(io)&255
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
saved=[(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0x7777)]
def run(offset,ax,far):
 done.clear();io.clear();cpu.mem_write(0x3fefc if far else 0x3fefe,b'\0\1\0\x70' if far else b'\0\1')
 for r,v in saved+[(UC_X86_REG_AX,ax),(UC_X86_REG_CS,0x1941),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefc if far else 0xfefe)]:cpu.reg_write(r,v)
 cpu.emu_start(0x19410+offset,0xfffff,count=12000)
 assert done==[0x70100 if far else 0x19510] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for r,v in saved+[(UC_X86_REG_AX,ax)]:assert cpu.reg_read(r)==v
for case in vectors['writes']:
 cpu.mem_write(0x1b71a,bytes(i^170 for i in range(256)))
 run(0x240a,(case['register']<<8)|case['value'],False)
 assert io==case['expected']['io'] and bytes(cpu.mem_read(0x1b71a,256))==bytes(case['expected']['shadow'])
for case in vectors['stops']:
 cpu.mem_write(0x1b71a,bytes([case['fill']])*256);cpu.mem_write(0x19414,b'\x55\x01')
 run(0x19d,0xabcd,True)
 assert io==case['expected']['io'] and bytes(cpu.mem_read(0x1b71a,256))==bytes(case['expected']['shadow'])
 assert cpu.mem_read(0x19414,1)==b'\0' and cpu.mem_read(0x19415,1)==b'\1'
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'writes':len(vectors['writes']),'stopCases':len(vectors['stops']),'result':'native FM I/O read/write order, shadow, stop flag and registers match','limits':'status values synthetic, no OPL synthesis or hardware timing; zero-device stop branch excluded'}))
