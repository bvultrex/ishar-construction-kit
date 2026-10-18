"""Bounded native lock attempt or release; never spin indefinitely or touch host ports."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-cursor-sync-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];ports=[];visits=[0]
def code(uc,address,size,_):
 if address==0x1118b:
  visits[0]+=1
  if visits[0]==2:done.append('retry');uc.emu_stop()
 if address==0x10100:done.append('returned');uc.emu_stop()
def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
for case in cases:
 done.clear();ports.clear();visits[0]=0
 for at,value,size in [(0x1e946,case['mode'],1),(0x1cd62,case['guard'],1),(0x2c0ae,0x100,2)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfffe),(UC_X86_REG_AX,0x1234),(UC_X86_REG_EFLAGS,2|(512 if case['interruptsEnabled'] else 0))]:cpu.reg_write(r,v)
 cpu.emu_start(0x11183 if case['operation']=='acquire' else 0x111a5,0xfffff,count=32)
 expected=case['expected'];assert done==[expected['exit']] and ports==expected['ports'],case
 assert cpu.mem_read(0x1cd62,1)[0]==expected['guard']
 assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&512)==expected['interruptsEnabled']
 assert cpu.reg_read(UC_X86_REG_AX)==0x1234 and cpu.reg_read(UC_X86_REG_SP)==(0xfffe if done==['retry'] else 0)
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'native retry/return, guard, PIC output, IF, AX and stack match','limits':'one loop attempt, no concurrent IRQ injection or host interrupt controller'}))
