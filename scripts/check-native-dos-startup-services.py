"""Original078F..0832 including complete runtime drive probe215D."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-startup-services-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);m[0xffffe]=case['systemId'];cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[];attempt=[0]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x23d7),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8;dx=uc.reg_read(UC_X86_REG_DX);ds=uc.reg_read(UC_X86_REG_DS);error=False;value=0
  if number==0x13:assert ax in [0,1];events.append({'service':'disk-reset','al':ax});uc.mem_write(0x475,bytes([ax]))
  else:
   assert number==0x21
   if ah==0x35:
    vector=ax&255;assert vector in [0,0x24];events.append({'service':'get-vector','number':vector});uc.reg_write(UC_X86_REG_BX,0x1234 if vector else 0x2345);uc.reg_write(UC_X86_REG_ES,0x7000 if vector else 0x7100)
   elif ah==0x25:vector=ax&255;events.append({'service':'set-vector','number':vector,'segment':ds,'offset':dx});uc.mem_write(vector*4,dx.to_bytes(2,'little')+ds.to_bytes(2,'little'))
   elif ah==0x19:events.append({'service':'current-drive'});value=case['currentDrive']
   elif ah==0x47:events.append({'service':'current-directory','drive':dx&255,'segment':ds,'offset':uc.reg_read(UC_X86_REG_SI)});uc.mem_write(ds*16+uc.reg_read(UC_X86_REG_SI),b'TEST\0')
   elif ah==0xe:events.append({'service':'select-drive','drive':dx&255});value=case['driveCount']
   elif ah==0x3b:
    events.append({'service':'change-directory','segment':ds,'offset':dx})
    if dx==0x1d65:error=case['scenario']=='chdir-fail' or case['scenario']=='second' and attempt[0]==0;attempt[0]+=1
   elif ah==0x3c:events.append({'service':'create','segment':ds,'offset':dx,'attributes':uc.reg_read(UC_X86_REG_CX)});error=case['scenario']=='create-fail';value=42
   elif ah==0x3e:events.append({'service':'close','handle':uc.reg_read(UC_X86_REG_BX)})
   elif ah==0x41:events.append({'service':'delete','segment':ds,'offset':dx})
   else:raise AssertionError(hex(ax))
  uc.reg_write(UC_X86_REG_AX,value);f=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,(f|1) if error else (f&~1))
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,finish,None,0x10833,0x10833);cpu.emu_start(0x1078f,0xfffff,count=1000)
 assert done==[True] and events==case['events'] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_DS)==case['ds'] and cpu.reg_read(UC_X86_REG_EFLAGS)&0x200
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfeec:0x1c0b0+0xff00]=bytes(20);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Contiguous078F..0832 including215D; explicit vector/DOS/BIOS replies and BIOS memory writes; all guest file operations simulated; full memory except CPU stack FEEC..FEFF, events and DS/SP/IF checked; other scratch registers excluded;0833 and later startup not covered'}))
