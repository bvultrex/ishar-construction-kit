"""Original full palette callback including upload then step, with controlled retrace."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-palette-tick-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];ports=[];reads=[]
def code(uc,address,size,_):
 if address==0x70100:done.append(address);uc.emu_stop()
def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
def inp(uc,port,size,_):assert port==0x3da and size==1;reads.append(8);return 8
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
saved=[(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x1c0b),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0x7777)]
for case in cases:
 done.clear();ports.clear();reads.clear();source=case['source'];expected=case['expected'];state=expected['state']
 for at,key in [(0x1cef3,'current'),(0x1d1f3,'shadow'),(0x1d4f3,'target')]:cpu.mem_write(at,bytes(source[key]))
 for at,key in [(0x1cd69,'mode'),(0x1cd6d,'countdown'),(0x1cd6c,'reload'),(0x1cd6e,'step'),(0x1cd68,'active'),(0x1cd19,'retraceMode')]:cpu.mem_write(at,bytes([source[key]]))
 cpu.mem_write(0x2bfac,b'\0\1\0\x70')
 for r,v in saved+[(UC_X86_REG_CS,0x1e97),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfefc),(UC_X86_REG_EFLAGS,2|(512 if source['interruptsEnabled'] else 0))]:cpu.reg_write(r,v)
 cpu.emu_start(0x1f818,0xfffff,count=26000)
 assert done==[0x70100] and ports==expected['ports']
 for at,key in [(0x1cef3,'current'),(0x1d1f3,'shadow'),(0x1d4f3,'target')]:assert bytes(cpu.mem_read(at,768))==bytes(state[key]),key
 for at,key in [(0x1cd6d,'countdown'),(0x1cd68,'active')]:assert cpu.mem_read(at,1)[0]==state[key],(source['mode'],source['countdown'],key)
 assert len(reads)==(0 if source['mode']==1 else 1)
 assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&512)==state['interruptsEnabled']
 for r,v in saved:assert cpu.reg_read(r)==v
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'full native palette callback order, buffers, countdown, active flag, I/O and IF match','limits':'controlled ready retrace, no hardware timing or caller gating'}))
