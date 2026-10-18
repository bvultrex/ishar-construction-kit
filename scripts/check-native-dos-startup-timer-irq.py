"""Real original IRQ8 execution/IRET and timer wait completion, controlled delivery."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-startup-timer-irq-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0
 for at,value in [(32,case['handler']),(34,0x1000),(0x10bf8,16283),(g+0xc9f,0xbeef),(g+0xfefe,0x8ff)]:m[at:at+2]=value.to_bytes(2,'little')
 for at,value in [(0x2898,0),(0x2896,0),(0xc9a,0),(0xc97,4),(0xc98,4),(0xcd8,0),(0xcc5,0),(0xcb1,255),(0x1dfd,0),(0x1e0d,0),(0x1e1d,0)]:m[g+at]=value
 m[0x19414]=0;cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];read_index=[0];irq_index=[0];visits=[0]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_IP,0xcfe),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_DS,0x1c0b),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_AX,0),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def read(uc,port,size,_):
  assert port==0x3da and size==1;value=case['replies']['retraceReads'][irq_index[0]][read_index[0]];read_index[0]+=1
  if events and events[-1].get('kind')=='in' and events[-1].get('value')==value:events[-1]['repeat']+=1
  else:events.append({'kind':'in','port':port,'value':value,'repeat':1})
  return value
 def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
 cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT)
 def deliver(index,loop):
  events.append({'kind':'irq','vector':8,'loop':loop});irq_index[0]=index;read_index[0]=0
  regs=[UC_X86_REG_AX,UC_X86_REG_BX,UC_X86_REG_CX,UC_X86_REG_DX,UC_X86_REG_DI,UC_X86_REG_SI,UC_X86_REG_DS,UC_X86_REG_ES,UC_X86_REG_BP,UC_X86_REG_SP,UC_X86_REG_CS,UC_X86_REG_IP,UC_X86_REG_EFLAGS];saved={reg:cpu.reg_read(reg) for reg in regs};assert saved[UC_X86_REG_EFLAGS]&0x200
  sp=saved[UC_X86_REG_SP]
  for value in [saved[UC_X86_REG_EFLAGS]&65535,saved[UC_X86_REG_CS],saved[UC_X86_REG_IP]]:sp=(sp-2)&65535;cpu.mem_write(g+sp,value.to_bytes(2,'little'))
  cpu.reg_write(UC_X86_REG_SP,sp);cpu.reg_write(UC_X86_REG_EFLAGS,saved[UC_X86_REG_EFLAGS]&~0x300);cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.reg_write(UC_X86_REG_IP,case['handler']);returned=[]
  def back(uc,address,size,_):returned.append(True);uc.emu_stop()
  resume=saved[UC_X86_REG_CS]*16+saved[UC_X86_REG_IP];h=cpu.hook_add(UC_HOOK_CODE,back,None,resume,resume);cpu.emu_start(0x10000+case['handler'],0xfffff,count=1000);cpu.hook_del(h);assert returned==[True]
  for reg,value in saved.items():assert cpu.reg_read(reg)==value,(reg,cpu.reg_read(reg),value)
 deliver(0,-1)
 for index,target in [(1,case['replies']['secondAt']),(2,case['replies']['thirdAt'])]:
  stopped=[]
  def measure(uc,address,size,_):
   if visits[0]==target:stopped.append(True);uc.emu_stop()
   else:visits[0]+=1
  h=cpu.hook_add(UC_HOOK_CODE,measure,None,0x10d0c,0x10d0c);cpu.emu_start(cpu.reg_read(UC_X86_REG_CS)*16+cpu.reg_read(UC_X86_REG_IP),0xfffff,count=500000);cpu.hook_del(h);assert stopped==[True];deliver(index,target)
 done=[]
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 h=cpu.hook_add(UC_HOOK_CODE,finish,None,0x108ff,0x108ff);cpu.emu_start(0x10d0c,0xfffff,count=1000);cpu.hook_del(h)
 assert done==[True] and events==case['events'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for reg,key in [(UC_X86_REG_AX,'ax'),(UC_X86_REG_BX,'bx'),(UC_X86_REG_DX,'dx')]:assert cpu.reg_read(reg)==case['registers'][key]
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfee4:g+0xff00]=bytes(28);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Original wait/measurement plus three real handler executions/IRETs with manually delivered hardware frames, no C9A injection; controlled idle callback state/ports and delivery indices; full memory except FEE4..FEFF, all IRQ-preserved registers/flags and final AX/BX/DX/SP checked; no nested IRQ, active callback or BIOS-chain claim'}))
