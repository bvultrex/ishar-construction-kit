"""Contiguous original outer configuration entry, no skipped internal calls."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('settings',type=Path);p.add_argument('--caller-select',action='store_true');p.add_argument('--early-services',action='store_true');p.add_argument('--blancpc',type=Path);p.add_argument('--ems',action='store_true');p.add_argument('--audio',action='store_true');p.add_argument('--keyboard',action='store_true');p.add_argument('--graphics',action='store_true');p.add_argument('--mouse',action='store_true');p.add_argument('--timer-prefix',action='store_true');a=p.parse_args();a.mouse=a.mouse or a.timer_prefix;a.graphics=a.graphics or a.mouse;a.keyboard=a.keyboard or a.graphics;a.audio=a.audio or a.keyboard;a.ems=a.ems or a.audio;assert not a.ems or a.blancpc, '--ems requires --blancpc';a.early_services=a.early_services or bool(a.blancpc);a.caller_select=a.caller_select or a.early_services;original=a.capture.read_bytes();settings=a.settings.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1',0x1afa,0xe3e,0xe96,0x18cc,0x1b4b),'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2',0x1bce,0xea4,0xefc,0x19a0,0x1c22)}
assert digest in profiles and len(settings)==14;profile,entry,detect,load,prompt,final=profiles[digest];repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-configuration-entry-vectors.mjs'),str(a.capture.resolve()),str(a.settings.resolve())]+(['--caller-select'] if a.caller_select else [])+(['--early-services'] if a.early_services else [])+(['--blancpc',str(a.blancpc.resolve())] if a.blancpc else [])+(['--ems'] if a.ems else [])+(['--audio'] if a.audio else [])+(['--keyboard'] if a.keyboard else [])+(['--graphics'] if a.graphics else [])+(['--mouse'] if a.mouse else [])+(['--timer-prefix'] if a.timer_prefix else []),cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original)
 if a.ems:
  signature=bytearray(original[0x10b10:0x10b18]);signature[0]^=255 if case['mouseAX']==0 else 0;cpu.mem_write(0x4000a,bytes(signature))
 events=[];done=[];stage=[''];times=[0];keys=[0];adlib_reads=[0];timer_retrace=[0];timer_pit=[0];base=0x23d70
 for reg,value in [(UC_X86_REG_CS,0x23d7),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def event(value):events.append({'stage':stage[0],'event':value})
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8;dx=uc.reg_read(UC_X86_REG_DX);ds=uc.reg_read(UC_X86_REG_DS);cx=uc.reg_read(UC_X86_REG_CX);bx=uc.reg_read(UC_X86_REG_BX);error=False;value=ax
  if number==0x33 and stage[0]=='mouse':
   item={'interrupt':number,'ax':ax}
   if ax==0:value=case['mouseAX']
   else:
    assert ax in [4,7,8,12,15];item.update(cx=cx,dx=dx)
    if ax==12:item['es']=uc.reg_read(UC_X86_REG_ES)
   event(item)
  elif number==0x33:assert stage[0]=='devices' and ax==0;event({'kind':'interrupt','number':number,'ax':ax});value=case['mouseAX']
  elif number==0x12:event({'interrupt':number});value=640
  elif number==0x67:
   if ah==0x41:event({'interrupt':number,'ah':ah});uc.reg_write(UC_X86_REG_BX,0xe000)
   elif ah==0x43:event({'interrupt':number,'ah':ah,'bx':bx});uc.reg_write(UC_X86_REG_DX,0x1234)
   else:assert ah==0x44;event({'interrupt':number,'ax':ax,'bx':bx,'dx':dx})
   value=ax&255
  elif number==0x13:assert ax in [0,1];event({'service':'disk-reset','al':ax});uc.mem_write(0x475,bytes([ax]));value=0
  elif number==0x10:
   if stage[0]=='graphics':assert ax==19;event({'kind':'interrupt','number':number,'ax':ax});uc.mem_write(0x449,b'\x13');uc.mem_write(0x463,b'\xd4\x03')
   elif ax==0x1a00:event({'kind':'interrupt','number':number,'ax':ax});value=(ax&0xff00)|0x1a
   elif ah==0:event({'kind':'mode','value':ax&255})
   elif ah==1:event({'kind':'shape','cx':cx})
   elif ah==2:event({'kind':'cursor','dx':dx})
   elif ah==3:event({'kind':'read-cursor'});uc.reg_write(UC_X86_REG_DX,0xb14)
   else:assert ah==9;event({'kind':'text','value':ax&255,'attribute':bx&255,'count':cx})
  else:
   assert number==0x21
   if ah==0x38:event({'kind':'interrupt','number':number,'ah':ah,'al':ax&255,'dx':dx});value=(ax&0xff00)|case['countryAL']
   elif ah==0x35 and stage[0]=='graphics':assert ax==0x350a;event({'kind':'interrupt','number':number,'ax':ax});uc.reg_write(UC_X86_REG_BX,0x1234);uc.reg_write(UC_X86_REG_ES,0x7000)
   elif ah==0x25 and stage[0]=='graphics':assert ax==0x250a;event({'kind':'interrupt','number':number,'ax':ax,'ds':ds,'dx':dx});uc.mem_write(0x28,dx.to_bytes(2,'little')+ds.to_bytes(2,'little'))
   elif ah==0x35 and stage[0]=='ems':assert ax==0x3567;event({'interrupt':number,'ax':ax});uc.reg_write(UC_X86_REG_BX,0x1234);uc.reg_write(UC_X86_REG_ES,0x4000);value=0
   elif ah==0x35:
    vector=ax&255;event({'service':'get-vector','number':vector});uc.reg_write(UC_X86_REG_BX,0x1234 if vector else 0x2345);uc.reg_write(UC_X86_REG_ES,0x7000 if vector else 0x7100);value=0
   elif ah==0x25:
    vector=ax&255;event({'service':'set-vector','number':vector,'segment':ds,'offset':dx});uc.mem_write(vector*4,dx.to_bytes(2,'little')+ds.to_bytes(2,'little'));value=0
   elif ah==0x19:event({'service':'current-drive'});value=2
   elif ah==0x47:event({'service':'current-directory','drive':dx&255,'segment':ds,'offset':uc.reg_read(UC_X86_REG_SI)});uc.mem_write(ds*16+uc.reg_read(UC_X86_REG_SI),b'TEST\0');value=0
   elif ah==0xe:event({'service':'select-drive','drive':dx&255});value=3
   elif ah==0x3b:event({'service':'change-directory','segment':ds,'offset':dx});error=dx in [0xba8,0x1d65] and case['mouseAX']==0;value=0
   elif ah==0x3c:event({'service':'create','segment':ds,'offset':dx,'attributes':cx});value=42 if stage[0]=='engine-services' else 5
   elif ah==0x41:event({'service':'delete','segment':ds,'offset':dx});value=0
   elif ah==0x3d:event({'service':'open','access':ax&255,'segment':ds,'offset':dx});error=stage[0]=='file' and case['failure']=='open';value=2 if error else 5
   elif ah==0x3f:
    event({'service':'read','handle':bx,'count':cx,'segment':ds,'offset':dx});error=stage[0]=='file' and case['failure']=='read';data=a.blancpc.read_bytes() if stage[0]=='blancpc' else settings;value=5 if error else len(data)
    if not error:uc.mem_write(ds*16+dx,data)
   elif ah==0x3e:event({'service':'close','handle':bx});error=stage[0]=='file' and case['failure']=='close';value=6 if error else 0
   elif ah==0x2c:
    second=([0,0] if case['configure'] else [0,4])[times[0]];times[0]+=1;event({'kind':'time','second':second});uc.reg_write(UC_X86_REG_DX,second<<8)
   else:assert ah==6 and case['configure'];keys[0]+=1;event({'kind':'key','value':83});value=(ax&0xff00)|83
  uc.reg_write(UC_X86_REG_AX,value);f=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,(f|1) if error else (f&~1))
 def read(uc,port,size,_):
  assert size==1
  if stage[0]=='timer':
   if port==0x3da:value=[0,8,0,8][timer_retrace[0]];timer_retrace[0]+=1
   else:assert port==0x40;value=[0,128][timer_pit[0]];timer_pit[0]+=1
   item={'kind':'in','port':port,'value':value,'repeat':1}
  elif stage[0]=='graphics':value={0x3d5:255,0x21:255,0x3c2:128,0x3da:8}[port];item={'kind':'in','port':port,'width':1,'value':value,'repeat':1}
  else:assert port in [0x388,0x201,0x21a,0x22a,0x23a,0x24a,0x25a,0x26a];value=0;item={'kind':'in','port':port,'value':value,'repeat':1}
  if events and events[-1]['stage']==stage[0] and events[-1]['event'].get('kind')=='in' and events[-1]['event'].get('port')==port and events[-1]['event'].get('value')==value:events[-1]['event']['repeat']+=1
  else:event(item)
  return value
 def write(uc,port,size,value,_):
  if stage[0]=='graphics':event({'kind':'out','port':port,'width':size,'value':value})
  else:assert size==1;event({'kind':'out','port':port,'value':value})
 def boundary(uc,address,size,_):
  offset=address-base
  if address==case['boundarySegment']*16+case['boundary']:done.append(True);uc.emu_stop();return
  stage[0]='timer' if address==0x108fc else 'mouse' if address==0x108f9 else 'graphics' if address==0x108f6 else 'keyboard' if address==0x108f0 else 'audio' if address==0x108eb else 'ems' if address==0x10853 else 'blancpc' if address==0x10833 else 'engine-services' if address==0x1078f else {0x1c33:'drives',detect:'devices',load:'file',prompt:'prompt',final:'final'}[offset]
 for address in set([base+v for v in [0x1c33,detect,load,prompt,final]]+[case['boundarySegment']*16+case['boundary']]+([0x1078f] if a.early_services else [])+([0x10833] if a.blancpc else [])+([0x10853] if a.ems else [])+([0x108eb] if a.audio else [])+([0x108f0] if a.keyboard else [])+([0x108f6] if a.graphics else [])+([0x108f9] if a.mouse else [])+([0x108fc] if a.timer_prefix else [])):cpu.hook_add(UC_HOOK_CODE,boundary,None,address,address)
 if a.caller_select:cpu.reg_write(UC_X86_REG_CS,0x1000)
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.emu_start(0x10787 if a.caller_select else base+entry,0xfffff,count=6000000 if a.graphics else 100000)
 expected=[{'stage':s['stage'],'event':e} for s in case['stages'] for e in s['events']]
 assert done==[True] and events==expected,(done,len(events),len(expected),next((i for i,(x,y) in enumerate(zip(events,expected)) if x!=y),None))
 assert cpu.reg_read(UC_X86_REG_SP)==((0xfefa if a.caller_select else 0xfefe) if case['reason']=='menu' else 0xfefe if case['reason']=='wait-timer' else 0xff00)
 actual=bytearray(cpu.mem_read(0,0x100000));mask=0xfebc if a.graphics and case['reason']!='menu' else 0xfec0;actual[0x1c0b0+mask:0x1c0b0+0xff00]=bytes(0xff00-mask);assert hashlib.sha256(actual).hexdigest()==case['hash']
 if a.graphics and case['reason']=='return':assert not(cpu.reg_read(UC_X86_REG_EFLAGS)&0x200)
 if case['reason']=='wait-timer':assert cpu.reg_read(UC_X86_REG_EFLAGS)&0x200
 case['traceSha256']=hashlib.sha256(json.dumps(case.pop('stages'),separators=(',',':')).encode()).hexdigest()
assert a.capture.read_bytes()==original and a.settings.read_bytes()==settings
print(json.dumps({'profile':profile,'captureSha256':digest,'settingsSha256':hashlib.sha256(settings).hexdigest(),'stackMask':'FEBC..FEFF after graphics; FEC0..FEFF on menu paths','timerPrefix':a.timer_prefix,'mouse':a.mouse,'graphics':a.graphics,'keyboard':a.keyboard,'audio':a.audio,'ems':a.ems,'blancpcSha256':hashlib.sha256(a.blancpc.read_bytes()).hexdigest() if a.blancpc else None,'earlyServices':a.early_services,'callerSelect':a.caller_select,'caseCount':len(cases),'cases':cases,'limits':'Contiguous outer entry, or engine0787 through0832 with --early-services or0852 with --blancpc or08EA with --ems or08EF with --audio,08F5 with --keyboard,08F8 with --graphics,08FB with --mouse or0CFE wait with --timer-prefix (explicit absent SB/no delivered IRQs/callbacks), stopping at original menu entry on menu paths; no component jumps/stubs; explicit DOS/BIOS/port replies, no real device/filesystem; memory except documented CPU stack mask and SP/events checked; menu body, non-VGA and joystick-axis branches excluded; original text only as trace hashes'}))
