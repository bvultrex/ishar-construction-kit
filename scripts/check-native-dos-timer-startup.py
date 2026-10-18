"""Original timer startup through real IRQ wait or DIV0; no IRQ is delivered."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-timer-startup-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);m[0x1c0b0+0x2894:0x1c0b0+0x2896]=case['systemType'].to_bytes(2,'little');cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[];polls=[0];retrace=[0];pit=[0];r=case['replies']
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  if number==0:assert case['phase']=='divide-error';events.append({'interrupt':0});done.append(True);uc.emu_stop();return
  assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX)
  if ax==0x3508:events.append({'service':'get-vector','number':8});uc.reg_write(UC_X86_REG_BX,0x1234);uc.reg_write(UC_X86_REG_ES,0x7000)
  else:assert ax==0x2508;ds=uc.reg_read(UC_X86_REG_DS);dx=uc.reg_read(UC_X86_REG_DX);events.append({'service':'set-vector','number':8,'segment':ds,'offset':dx});uc.mem_write(32,dx.to_bytes(2,'little')+ds.to_bytes(2,'little'))
 def read(uc,port,size,_):
  assert size==1
  if port==0x3da:value=r['retraceReads'][retrace[0]];retrace[0]+=1
  else:assert port==0x40;value=(r['pitCounterWord']>>(pit[0]*8))&255;pit[0]+=1
  if events and events[-1].get('kind')=='in' and events[-1].get('port')==port and events[-1].get('value')==value:events[-1]['repeat']+=1
  else:events.append({'kind':'in','port':port,'value':value,'repeat':1})
  return value
 def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 def poll(uc,address,size,_):polls[0]+=1
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_CODE,poll,None,0x10c28,0x10c28)
 if case['phase']=='wait':cpu.hook_add(UC_HOOK_CODE,finish,None,0x10cfe,0x10cfe)
 cpu.emu_start(0x108fc,0xfffff,count=500000)
 assert done==[True] and events==case['events'] and polls[0]==65000 and retrace[0]==case['retraceReplies'] and cpu.reg_read(UC_X86_REG_SP)==0xff00+case['stackDelta']
 if case['phase']=='wait':assert cpu.reg_read(UC_X86_REG_AX)==0 and cpu.reg_read(UC_X86_REG_EFLAGS)&0x200
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfefc:0x1c0b0+0xff00]=bytes(4);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Original08FC to first IRQ wait0CFE or real DIV0; explicit finite port replies and no delivered IRQ, memory except FEFC..FEFF, events/SP/poll count/reply consumption checked; wait completion and interrupt handling remain open'}))
