"""Original audio-startup outer paths and explicit hardware-driver boundaries."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-audio-startup-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);m[0x1e940]=case['mode'];m[0x1cd4d:0x1cd4f]=case['oldFlags'].to_bytes(2,'little')
 for i in range(64):m[0x1c0b0+0x1dfd+i]=(i*7+13)&255
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[]
 saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x2345,UC_X86_REG_CX:0x3456,UC_X86_REG_DX:0x4567,UC_X86_REG_DI:0x5678,UC_X86_REG_SI:0x6789,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x789a}
 for reg,value in {**saved,UC_X86_REG_CS:0x1000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00}.items():cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX)
  if ax==0x350f:events.append({'service':'get-vector','number':15});uc.reg_write(UC_X86_REG_BX,0x1234);uc.reg_write(UC_X86_REG_ES,0x7000)
  else:assert ax==0x250f;ds=uc.reg_read(UC_X86_REG_DS);dx=uc.reg_read(UC_X86_REG_DX);events.append({'service':'set-vector','number':15,'segment':ds,'offset':dx});uc.mem_write(0x3c,dx.to_bytes(2,'little')+ds.to_bytes(2,'little'))
 def read(uc,port,size,_):
  assert size==1 and port in [0x21a,0x22a,0x23a,0x24a,0x25a,0x26a];value=case['soundBlasterRead']
  if events and events[-1].get('kind')=='in' and events[-1].get('port')==port:events[-1]['repeat']+=1
  else:events.append({'kind':'in','port':port,'value':value,'repeat':1})
  return value
 def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 stop=case['boundary']['segment']*16+case['boundary']['offset'];cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_CODE,finish,None,stop,stop);cpu.emu_start(0x108eb,0xfffff,count=30000)
 assert done==[True] and events==case['events']
 if case['phase']=='return':
  assert cpu.reg_read(UC_X86_REG_SP)==0xff00
  for reg,value in saved.items():assert cpu.reg_read(reg)==value
 case['stackAtBoundary']=cpu.reg_read(UC_X86_REG_SP)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff00]=bytes(64);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Original08EB through return or real AdLib/SB IRQ entry; full memory except stack FEC0..FEFF, events and completed general registers/SP verified; driver bodies at boundaries not claimed, no actual hardware or IRQ delivery'}))
