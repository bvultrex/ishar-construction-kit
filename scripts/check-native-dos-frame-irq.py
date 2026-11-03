"""Persistent frame wait -> actual timer IRQ -> IRET -> frame continuation.
Controlled interrupt delivery only; no host device access or handler stubs.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-frame-irq-vectors.mjs')],cwd=repo,text=True));irq_count=0
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);cpu.mem_write(0x1c0b0,base64.b64decode(case['initial']));cpu.mem_write(0x19414,b'\0');cpu.mem_write(0x10318,b'\0');cpu.mem_write(0x2bfb0,b'\0\xf0')
 saved=[(UC_X86_REG_AX,0x1234),(UC_X86_REG_BX,0x2345),(UC_X86_REG_CX,0x3456),(UC_X86_REG_DX,0x4567),(UC_X86_REG_DI,0x5678),(UC_X86_REG_SI,0x6789),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x789a)]
 for r,v in saved+[(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
 mode=['frame'];polls=[0];done=[];ports=[]
 def code(uc,address,size,_):
  if address==0x13d64:
   polls[0]+=1
   if mode[0]=='irq' or polls[0]==2:done.append('irq-return' if mode[0]=='irq' else 'wait');uc.emu_stop()
  elif address==0x1f000:done.append('return');uc.emu_stop()
 def out(uc,port,size,value,_):assert size==1;ports.append((port,value))
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
 for index,frame in enumerate(case['frames']):
  if index:
   irq_count+=1;mode[0]='irq';done.clear();polls[0]=0;ports.clear()
   before={r:cpu.reg_read(r) for r,v in saved};sp=cpu.reg_read(UC_X86_REG_SP);flags=cpu.reg_read(UC_X86_REG_EFLAGS)&65535
   cpu.mem_write(0x1c0b0+sp-6,b'\x64\x3d\0\x10'+flags.to_bytes(2,'little'))
   cpu.reg_write(UC_X86_REG_SP,sp-6);cpu.reg_write(UC_X86_REG_EFLAGS,flags&~0x300)
   cpu.emu_start(0x10d98,0xfffff,count=1000)
   assert done==['irq-return'] and ports==[(0x20,0x60)] and cpu.reg_read(UC_X86_REG_SP)==sp
   for r,v in before.items():assert cpu.reg_read(r)==v
   assert cpu.reg_read(UC_X86_REG_EFLAGS)&65535==flags
   assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x3000))).hexdigest()==frame['irqGlobals']
  mode[0]='frame';done.clear();polls[0]=0
  cpu.emu_start(0x13d3c if index==0 else 0x13d64,0xfffff,count=300)
  assert done==[frame['phase']]
  assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x3000))).hexdigest()==frame['globals']
 assert cpu.reg_read(UC_X86_REG_SP)==0xff02
 for r,v in saved:assert cpu.reg_read(r)==v
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'sequences':len(cases),'actualTimerIRQs':irq_count,'result':'persistent frame waits released by real timer and IRET; all modeled globals, registers and interrupt flags match','limits':'controlled IRQ delivery, idle frame, inactive audio/palette/cursor callbacks, no external BIOS chain or graphics work'}))
