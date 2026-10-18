"""Original complete VGA device discovery, explicit BIOS/DOS/port replies."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1',0xe3e,0xe61),'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2',0xea4,0xec7)}
assert digest in profiles;profile,entry,end=profiles[digest];repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-configuration-detection-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original);events=[];done=[];adlib_reads=[0];r=case['replies'];stack=[]
 for reg,value in [(UC_X86_REG_CS,0x23d7),(UC_X86_REG_DS,0x23d7),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX)
  if number==0x21:assert ax>>8==0x38;events.append({'kind':'interrupt','number':number,'ah':0x38,'al':0,'dx':uc.reg_read(UC_X86_REG_DX)});value=(ax&0xff00)|r['countryAL']
  elif number==0x33:assert ax==0;events.append({'kind':'interrupt','number':number,'ax':ax});value=r['mouseAX']
  else:assert number==0x10 and ax==0x1a00;events.append({'kind':'interrupt','number':number,'ax':ax});value=(ax&0xff00)|r['videoAL']
  uc.reg_write(UC_X86_REG_AX,value)
 def read(uc,port,size,_):
  assert size==1
  if port==0x388:value=r['adlibBefore'] if adlib_reads[0]==0 else r['adlibAfter'];adlib_reads[0]+=1
  elif port==0x61:value=r['speakerRead']
  elif port==0x201:value=r['joystickRead']
  else:assert port in [0x21a,0x22a,0x23a,0x24a,0x25a,0x26a];value=r['soundBlasterRead']
  event={'kind':'in','port':port,'value':value,'repeat':1}
  if events and events[-1].get('kind')=='in' and events[-1].get('port')==port and events[-1].get('value')==value:events[-1]['repeat']+=1
  else:events.append(event)
  return value
 def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 def memory_write(uc,access,address,size,value,_):
  if 0x1c0b0+0xfe00<=address<0x1c0b0+0xff00:stack.append(address)
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_MEM_WRITE,memory_write);cpu.hook_add(UC_HOOK_CODE,finish,None,0x23d70+end,0x23d70+end);cpu.emu_start(0x23d70+entry,0xfffff,count=30000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and events==case['events'],(done,events,case['events'])
 assert cpu.reg_read(UC_X86_REG_EFLAGS)&0x200 and min(stack)>=0x1c0b0+0xfec0
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff00]=bytes(64);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profile,'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Entire discovery routine on VGA branch and joystick early-return branch; explicit services/constant port replies, no hardware/IRQs; memory outside stack FEC0..FEFF, I/O and SP/IF checked; general scratch registers excluded'}))
