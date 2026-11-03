"""Complete original startup BLANCPC load, preserved unread memory and errors."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('blancpc',type=Path);a=p.parse_args();original=a.capture.read_bytes();file=a.blancpc.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-blancpc-load-vectors.mjs'),str(a.capture.resolve()),str(a.blancpc.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g+0x28a2:g+0x28a4]=case['resource'].to_bytes(2,'little');m[g+0x289b]=case['fallback'];m[g+0x289c]=2;m[g+0x289d]=3
 for i in range(0x1500):m[case['resource']*16+i]=(i*13+17)&255
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[];opens=[0]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_DS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8;dx=uc.reg_read(UC_X86_REG_DX);ds=uc.reg_read(UC_X86_REG_DS);error=False;value=0
  if ah==0xe:events.append({'service':'select-drive','drive':dx&255});value=4
  elif ah==0x3d:
   events.append({'service':'open','access':ax&255,'segment':ds,'offset':dx});error=case['scenario']=='open-fail' or case['scenario']=='retry' and opens[0]==0;value=2 if error else 5;opens[0]+=1
  elif ah==0x3f:
   events.append({'service':'read','handle':uc.reg_read(UC_X86_REG_BX),'count':uc.reg_read(UC_X86_REG_CX),'segment':ds,'offset':dx});error=case['scenario']=='read-fail';data=file[:100] if case['scenario']=='short' else file;value=5 if error else len(data)
   if not error:uc.mem_write(ds*16+dx,data)
  else:assert ah==0x3e;events.append({'service':'close','handle':uc.reg_read(UC_X86_REG_BX)});error=case['scenario']=='close-fail';value=6 if error else 0
  uc.reg_write(UC_X86_REG_AX,value);f=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,(f|1) if error else (f&~1))
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,finish,None,0x10000+case['boundary'],0x10000+case['boundary']);cpu.emu_start(0x10833,0xfffff,count=30000)
 assert done==[True] and events==case['events'] and opens[0]==case['opens']
 if case['error'] is None:assert cpu.reg_read(UC_X86_REG_SP)==0xff00
 else:assert cpu.reg_read(UC_X86_REG_AX)==case['error']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff00]=bytes(64);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original and a.blancpc.read_bytes()==file
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'fileSha256':hashlib.sha256(file).hexdigest(),'fileBytes':len(file),'caseCount':len(cases),'cases':cases,'limits':'Original0833..0852 including06B2/helpers; full memory except CPU stack FEC0..FEFF; explicit DOS replies, no file writes; successful SP and error AX checked; no BIOS/EMS or later startup claimed'}))
