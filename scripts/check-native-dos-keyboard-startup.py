"""Original keyboard table/vector init, with optional following BE0 check."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-keyboard-startup-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);m[0x1c0b0+0x2893]=case['selection'];cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x602 if case['directionFlag'] else 0x202)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX)
  if ax==0x3509:events.append({'service':'get-vector','number':9});uc.reg_write(UC_X86_REG_BX,0x1234);uc.reg_write(UC_X86_REG_ES,0x7000)
  else:assert ax==0x2509;ds=uc.reg_read(UC_X86_REG_DS);dx=uc.reg_read(UC_X86_REG_DX);events.append({'service':'set-vector','number':9,'segment':ds,'offset':dx});uc.mem_write(36,dx.to_bytes(2,'little')+ds.to_bytes(2,'little'))
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,finish,None,0x10000+case['boundary'],0x10000+case['boundary']);cpu.emu_start(0x108f0,0xfffff,count=1000)
 assert done==[True] and events==case['events'] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_DS)==0x4000 and cpu.reg_read(UC_X86_REG_ES)==0x5000 and bool(cpu.reg_read(UC_X86_REG_EFLAGS)&0x400)==case['directionFlag']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfefa:0x1c0b0+0xff00]=bytes(6);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'08F0 through08F2/08F5, full memory except six CPU save bytes FEFA..FEFF; explicit DOS vector replies, events/DS/ES/SP/DF checked; no keyboard IRQ execution or other scratch register claim; table bytes not exported'}))
