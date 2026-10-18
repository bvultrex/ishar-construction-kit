"""Contiguous original outer configuration entry, no skipped internal calls."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('settings',type=Path);p.add_argument('--caller-select',action='store_true');a=p.parse_args();original=a.capture.read_bytes();settings=a.settings.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1',0x1afa,0xe3e,0xe96,0x18cc,0x1b4b),'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2',0x1bce,0xea4,0xefc,0x19a0,0x1c22)}
assert digest in profiles and len(settings)==14;profile,entry,detect,load,prompt,final=profiles[digest];repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-configuration-entry-vectors.mjs'),str(a.capture.resolve()),str(a.settings.resolve())]+(['--caller-select'] if a.caller_select else []),cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original);events=[];done=[];stage=[''];times=[0];keys=[0];adlib_reads=[0];base=0x23d70
 for reg,value in [(UC_X86_REG_CS,0x23d7),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def event(value):events.append({'stage':stage[0],'event':value})
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8;dx=uc.reg_read(UC_X86_REG_DX);ds=uc.reg_read(UC_X86_REG_DS);cx=uc.reg_read(UC_X86_REG_CX);bx=uc.reg_read(UC_X86_REG_BX);error=False;value=ax
  if number==0x33:assert stage[0]=='devices' and ax==0;event({'kind':'interrupt','number':number,'ax':ax});value=case['mouseAX']
  elif number==0x10:
   if ax==0x1a00:event({'kind':'interrupt','number':number,'ax':ax});value=(ax&0xff00)|0x1a
   elif ah==0:event({'kind':'mode','value':ax&255})
   elif ah==1:event({'kind':'shape','cx':cx})
   elif ah==2:event({'kind':'cursor','dx':dx})
   elif ah==3:event({'kind':'read-cursor'});uc.reg_write(UC_X86_REG_DX,0xb14)
   else:assert ah==9;event({'kind':'text','value':ax&255,'attribute':bx&255,'count':cx})
  else:
   assert number==0x21
   if ah==0x38:event({'kind':'interrupt','number':number,'ah':ah,'al':ax&255,'dx':dx});value=(ax&0xff00)|case['countryAL']
   elif ah==0x19:event({'service':'current-drive'});value=2
   elif ah==0x47:event({'service':'current-directory','drive':dx&255,'segment':ds,'offset':uc.reg_read(UC_X86_REG_SI)});uc.mem_write(ds*16+uc.reg_read(UC_X86_REG_SI),b'TEST\0');value=0
   elif ah==0xe:event({'service':'select-drive','drive':dx&255});value=3
   elif ah==0x3b:event({'service':'change-directory','segment':ds,'offset':dx});error=dx==0xba8 and case['mouseAX']==0;value=0
   elif ah==0x3c:event({'service':'create','segment':ds,'offset':dx,'attributes':cx});value=5
   elif ah==0x41:event({'service':'delete','segment':ds,'offset':dx});value=0
   elif ah==0x3d:event({'service':'open','access':ax&255,'segment':ds,'offset':dx});error=case['failure']=='open';value=2 if error else 5
   elif ah==0x3f:
    event({'service':'read','handle':bx,'count':cx,'segment':ds,'offset':dx});error=case['failure']=='read';value=5 if error else 14
    if not error:uc.mem_write(ds*16+dx,settings)
   elif ah==0x3e:event({'service':'close','handle':bx});error=stage[0]=='file' and case['failure']=='close';value=6 if error else 0
   elif ah==0x2c:
    second=([0,0] if case['configure'] else [0,4])[times[0]];times[0]+=1;event({'kind':'time','second':second});uc.reg_write(UC_X86_REG_DX,second<<8)
   else:assert ah==6 and case['configure'];keys[0]+=1;event({'kind':'key','value':83});value=(ax&0xff00)|83
  uc.reg_write(UC_X86_REG_AX,value);f=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,(f|1) if error else (f&~1))
 def read(uc,port,size,_):
  assert size==1 and port in [0x388,0x201,0x21a,0x22a,0x23a,0x24a,0x25a,0x26a];value=0;item={'kind':'in','port':port,'value':value,'repeat':1}
  if events and events[-1]['stage']==stage[0] and events[-1]['event'].get('kind')=='in' and events[-1]['event'].get('port')==port:events[-1]['event']['repeat']+=1
  else:event(item)
  return value
 def write(uc,port,size,value,_):assert size==1;event({'kind':'out','port':port,'value':value})
 def boundary(uc,address,size,_):
  offset=address-base
  if address==case['boundarySegment']*16+case['boundary']:done.append(True);uc.emu_stop();return
  stage[0]={0x1c33:'drives',detect:'devices',load:'file',prompt:'prompt',final:'final'}[offset]
 for address in set([base+v for v in [0x1c33,detect,load,prompt,final]]+[case['boundarySegment']*16+case['boundary']]):cpu.hook_add(UC_HOOK_CODE,boundary,None,address,address)
 if a.caller_select:cpu.reg_write(UC_X86_REG_CS,0x1000)
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.emu_start(0x10787 if a.caller_select else base+entry,0xfffff,count=100000)
 expected=[{'stage':s['stage'],'event':e} for s in case['stages'] for e in s['events']]
 assert done==[True] and events==expected,(done,events,expected)
 assert cpu.reg_read(UC_X86_REG_SP)==((0xfefa if a.caller_select else 0xfefe) if case['reason']=='menu' else 0xff00)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff00]=bytes(64);assert hashlib.sha256(actual).hexdigest()==case['hash']
 case['traceSha256']=hashlib.sha256(json.dumps(case.pop('stages'),separators=(',',':')).encode()).hexdigest()
assert a.capture.read_bytes()==original and a.settings.read_bytes()==settings
print(json.dumps({'profile':profile,'captureSha256':digest,'settingsSha256':hashlib.sha256(settings).hexdigest(),'callerSelect':a.caller_select,'caseCount':len(cases),'cases':cases,'limits':'Contiguous original outer entry to final RETF or menu entry; no component jumps/stubs; explicit DOS/BIOS/port replies, no real device/filesystem; memory except CPU stack FEC0..FEFF and SP/events checked; menu body, non-VGA and joystick-axis branches excluded; original text only as trace hashes'}))
