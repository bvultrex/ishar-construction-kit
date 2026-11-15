"""Original mouse initialization with explicit INT33 reset/no-callback delivery."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-mouse-startup-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g+0xca3]=case['skip'];m[g+0x2896]=case['mode']
 for at,value in [(0xc9d,case['oldFlags']),(0xcaa,0xbeef),(0xcac,0xf00d)]:m[g+at:g+at+2]=value.to_bytes(2,'little')
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SP,0xff00)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  assert number==0x33;ax=uc.reg_read(UC_X86_REG_AX);event={'interrupt':number,'ax':ax}
  if ax==0:uc.reg_write(UC_X86_REG_AX,case['resetAX'])
  else:
   assert ax in [4,7,8,12,15];event.update(cx=uc.reg_read(UC_X86_REG_CX),dx=uc.reg_read(UC_X86_REG_DX))
   if ax==12:event['es']=uc.reg_read(UC_X86_REG_ES)
  events.append(event)
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,finish,None,0x108fc,0x108fc);cpu.emu_start(0x108f9,0xfffff,count=200)
 assert done==[True] and events==case['events'] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_DS)==0x4000 and cpu.reg_read(UC_X86_REG_ES)==(0x1000 if case['callbackRegistered'] else 0x5000)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfefe:g+0xff00]=bytes(2);assert hashlib.sha256(actual).hexdigest()==case['hash'],(case['skip'],case['mode'],case['resetAX'])
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Complete08F9 call to08FC; explicit reset/no driver side effects or callbacks; full memory except FEFE..FEFF return address, events/DS/ES/SP verified; other scratch registers/flags excluded'}))
