"""Original graphics0000/CC0/D51/E0C, explicit external services, no IRQ delivery."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--with-frame',action='store_true');p.add_argument('--viewport',action='store_true');p.add_argument('--select-video',action='store_true');a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-vga-startup-vectors.mjs'),str(a.capture.resolve())]+(['--with-frame'] if a.with_frame else [])+(['--viewport'] if a.viewport else [])+(['--select-video'] if a.select_video else []),cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);r=case['replyFields']
 if a.select_video:m[g+0x2898]=1
 def word(at,value):m[at:at+2]=value.to_bytes(2,'little')
 for at,value in [(0x1e970+0x3a,0xa511),(0x1e970+0x3c,0x2211),(0x28,0x1234),(0x2a,0x7000),(g+0xff00,0xe000),(g+0xff02,0x1000)]:word(at,value)
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[];polls=[0]
 saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x2345,UC_X86_REG_CX:0x3456,UC_X86_REG_DX:0x4567,UC_X86_REG_DI:0x5678,UC_X86_REG_SI:0x6789,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x789a}
 for reg,value in {**saved,UC_X86_REG_CS:0x1e97,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_EFLAGS:0x202}.items():cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX)
  if number==0x10:
   assert ax==0x13;events.append({'kind':'interrupt','number':16,'ax':19});uc.mem_write(0x449,b'\x13');uc.mem_write(0x463,case['crtPort'].to_bytes(2,'little'));return
  assert number==0x21
  if ax==0x350a:events.append({'kind':'interrupt','number':33,'ax':ax});uc.reg_write(UC_X86_REG_BX,r['vectorOffset']);uc.reg_write(UC_X86_REG_ES,r['vectorSegment']);return
  assert ax==0x250a;ds=uc.reg_read(UC_X86_REG_DS);dx=uc.reg_read(UC_X86_REG_DX);events.append({'kind':'interrupt','number':33,'ax':ax,'ds':ds,'dx':dx});uc.mem_write(0x28,dx.to_bytes(2,'little')+ds.to_bytes(2,'little'))
 def read(uc,port,size,_):
  assert size==1;value={case['crtPort']+1:r['crtData'],0x21:r['picMask'],0x3c2:r['miscRead'],0x3da:r['retraceRead']}[port];event={'kind':'in','port':port,'width':1,'value':value,'repeat':1}
  if events and events[-1].get('kind')=='in' and all(events[-1].get(k)==event[k] for k in ['port','width','value']):events[-1]['repeat']+=1
  else:events.append(event)
  return value
 def write(uc,port,size,value,_):events.append({'kind':'out','port':port,'width':size,'value':value})
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 def timer_poll(uc,address,size,_):polls[0]+=1
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_CODE,finish,None,0x1e000,0x1e000);cpu.hook_add(UC_HOOK_CODE,timer_poll,None,0x1e970+0xdc9,0x1e970+0xdc9)
 if a.select_video:
  selected=[]
  def selected_end(uc,address,size,_):selected.append(True);uc.emu_stop()
  handle=cpu.hook_add(UC_HOOK_CODE,selected_end,None,0x10a13,0x10a13);cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.emu_start(0x1098f,0xfffff,count=30000);cpu.hook_del(handle);assert selected==[True];cpu.reg_write(UC_X86_REG_CS,0x1e97)
 if a.with_frame:
  boundary=[]
  def reserve_end(uc,address,size,_):boundary.append(True);uc.emu_stop()
  handle=cpu.hook_add(UC_HOOK_CODE,reserve_end,None,0x108eb,0x108eb);cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.reg_write(UC_X86_REG_AX,0x9fff);cpu.emu_start(0x1087d,0xfffff,count=100);cpu.hook_del(handle);assert boundary==[True]
  saved[UC_X86_REG_AX]=case['reservation']['ax'];saved[UC_X86_REG_BX]=case['reservation']['bx'];assert cpu.reg_read(UC_X86_REG_AX)==saved[UC_X86_REG_AX] and cpu.reg_read(UC_X86_REG_BX)==saved[UC_X86_REG_BX];cpu.reg_write(UC_X86_REG_CS,0x1e97)
 if a.viewport:
  cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.mem_write(g+0xff00,(0xe000).to_bytes(2,'little'));cpu.reg_write(UC_X86_REG_SP,0xff00)
 cpu.emu_start(0x11eba if a.viewport else 0x1e970,0xfffff,count=6000000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==(0xff02 if a.viewport else 0xff04) and polls[0]==case['timerPolls'],(done,polls)
 assert events==case['events'],(events,case['events'])
 for reg,value in saved.items():assert cpu.reg_read(reg)==value,reg
 assert not(cpu.reg_read(UC_X86_REG_EFLAGS)&0x200)
 if a.with_frame:
  boundary=[]
  def frame_end(uc,address,size,_):boundary.append(True);uc.emu_stop()
  handle=cpu.hook_add(UC_HOOK_CODE,frame_end,None,0x1264c,0x1264c);cpu.emu_start(0x12649,0xfffff,count=1000);cpu.hook_del(handle);assert boundary==[True] and case['frame']['phase']=='return' and cpu.reg_read(UC_X86_REG_SP)==(0xff02 if a.viewport else 0xff04)
  for reg,value in saved.items():assert cpu.reg_read(reg)==value
 actual=bytearray(cpu.mem_read(0,0x100000));mask=0xfebe if a.viewport else 0xfec0;actual[g+mask:g+0xff10]=bytes(0xff10-mask);assert hashlib.sha256(actual).hexdigest()==case['hash']
 case['interruptFlagAfterReturn']=bool(cpu.reg_read(UC_X86_REG_EFLAGS)&0x200)
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'viewportCaller':a.viewport,'stackMaskStart':hex(0xfebe if a.viewport else 0xfec0),'caseCount':len(cases),'cases':cases,'limits':'No IRQ0A delivered; explicit controlled BIOS memory writes, DOS vector service and port replies; all general registers/SP and full memory except CPU stack saves; not a real BIOS or display'}))
