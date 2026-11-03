"""Full shared-memory0853..08EA including EMS protocol and framebuffer allocation."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-ems-startup-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;r=case['replies'];m[0x4000a:0x40012]=original[0x10b10:0x10b18]
 if case['failure']=='signature':m[0x4000a]^=255
 for at,value in [(0x10b1a,0x1111),(0x10b18,0x2222),(0x10b1c,0xffff)]:m[at:at+2]=value.to_bytes(2,'little')
 for at,value in zip([0x2898,0x2892,0x2896],case['flags']):m[g+at]=value
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_DS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8
  if number==0x12:events.append({'interrupt':number});uc.reg_write(UC_X86_REG_AX,r['biosKiB']);return
  if number==0x21:assert ax==0x3567;events.append({'interrupt':number,'ax':ax});uc.reg_write(UC_X86_REG_ES,r['vectorSegment']);uc.reg_write(UC_X86_REG_BX,0x1234);return
  assert number==0x67
  if ah==0x41:events.append({'interrupt':number,'ah':ah});status=r['queryStatus'];uc.reg_write(UC_X86_REG_BX,r['pageFrame'])
  elif ah==0x43:events.append({'interrupt':number,'ah':ah,'bx':uc.reg_read(UC_X86_REG_BX)});status=r['allocateStatus'];uc.reg_write(UC_X86_REG_DX,r['handle'])
  elif ah==0x44:events.append({'interrupt':number,'ax':ax,'bx':uc.reg_read(UC_X86_REG_BX),'dx':uc.reg_read(UC_X86_REG_DX)});status=r['mapStatuses'][ax&255]
  else:assert ah==0x45;events.append({'interrupt':number,'ah':ah,'dx':uc.reg_read(UC_X86_REG_DX)});status=255
  uc.reg_write(UC_X86_REG_AX,(status<<8)|(ax&255))
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,finish,None,0x108eb,0x108eb);cpu.emu_start(0x10853,0xfffff,count=1000)
 assert done==[True] and events==case['events'] and cpu.reg_read(UC_X86_REG_AX)==case['ax'] and cpu.reg_read(UC_X86_REG_BX)==case['bx'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfeea:g+0xff00]=bytes(22);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Contiguous0853..08EA full shared memory except stack FEEA..FEFF, events/AX/BX/SP checked; explicit register-only EMS replies, no actual expanded-memory page contents; DF0 required; following08EB services excluded'}))
