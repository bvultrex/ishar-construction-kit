"""Complete original configuration read/decode with explicit DOS replies."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('settings',type=Path);p.add_argument('--apply',action='store_true');p.add_argument('--select-video',action='store_true');a=p.parse_args();original=a.capture.read_bytes();settings=a.settings.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles and len(settings)==14 and (not a.select_video or a.apply);profile=profiles[digest];repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-startup-configuration-file-vectors.mjs'),str(a.capture.resolve()),str(a.settings.resolve())]+(['--apply'] if a.apply else [])+(['--select-video'] if a.select_video else []),cwd=repo,text=True))
for case in cases:
 m=bytearray(original);base=0x23d70;m[base+0x386:base+0x394]=bytes([82,0,86,67,83,73,80,49,74,48,77,48,75,65])
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[]
 for reg,value in [(UC_X86_REG_CS,0x23d7),(UC_X86_REG_DS,0x23d7),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_AX,0x1111),(UC_X86_REG_DX,0x2222)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8;ds=uc.reg_read(UC_X86_REG_DS);dx=uc.reg_read(UC_X86_REG_DX);bx=uc.reg_read(UC_X86_REG_BX);error=False;result=0
  if ah==0xe:events.append({'service':'select-drive','drive':dx&255});result=3
  elif ah==0x3d:events.append({'service':'open','access':ax&255,'segment':ds,'offset':dx});error=case['failure']=='open';result=2 if error else case['handle']
  elif ah==0x3f:
   events.append({'service':'read','handle':bx,'count':uc.reg_read(UC_X86_REG_CX),'segment':ds,'offset':dx});error=case['failure']=='read';result=5 if error else case['count']
   if not error:uc.mem_write(ds*16+dx,settings[:case['count']]) if case['count'] else None
  elif ah==0x3e:events.append({'service':'close','handle':bx});error=case['failure']=='close';result=6 if error else 0
  else:raise AssertionError(hex(ax))
  uc.reg_write(UC_X86_REG_AX,result);flags=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,(flags|1) if error else (flags&~1))
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);stop_handle=cpu.hook_add(UC_HOOK_CODE,finish,None,base+case['boundary'],base+case['boundary']);cpu.emu_start(base+(0xe96 if profile=='ishar1' else 0xefc),0xfffff,count=500)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and events==case['events']
 cpu.hook_del(stop_handle)
 if a.apply:
  done.clear();end=0x1a2e if profile=='ishar1' else 0x1b02;stop_handle=cpu.hook_add(UC_HOOK_CODE,finish,None,base+end,base+end);cpu.emu_start(base+(0x1933 if profile=='ishar1' else 0x1a07),0xfffff,count=150);cpu.hook_del(stop_handle);assert done==[True]
 if a.select_video:
  done.clear();cpu.reg_write(UC_X86_REG_CS,0x1000);stop_handle=cpu.hook_add(UC_HOOK_CODE,finish,None,0x10a13,0x10a13);cpu.emu_start(0x1098f,0xfffff,count=30000);cpu.hook_del(stop_handle);assert done==[True]
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
 actual=bytearray(cpu.mem_read(0,0x100000))
 if profile=='ishar2' or a.select_video:actual[0x1c0b0+0xfeee:0x1c0b0+0xff00]=bytes(18)
 assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original and a.settings.read_bytes()==settings
print(json.dumps({'profile':profile,'captureSha256':digest,'settingsSha256':hashlib.sha256(settings).hexdigest(),'application':a.apply,'videoSelection':a.select_video,'caseCount':len(cases),'cases':cases,'limits':'Complete config file routine up to final RET; DOS simulated explicitly, no files opened by guest; memory/events/SP verified, general scratch registers/flags excluded; Ishar2 nine-register drive saves masked FEEE..FEFF; device discovery and outer boot remain open'}))
