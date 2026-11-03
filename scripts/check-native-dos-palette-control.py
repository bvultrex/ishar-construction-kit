"""Opcode188 through return or actual graphics/division boundaries; no call stubs."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;results=[]
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-palette-control-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original);cpu.mem_write(0x1c0b0,base64.b64decode(case['globals']));cpu.mem_write(0x40000,bytes([2,case['value']&255,case['value']>>8]))
 names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x200),(UC_X86_REG_SI,0),(UC_X86_REG_DX,0x3456),(UC_X86_REG_CX,0x789a),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x10000+case['entry']:done.append(address);uc.emu_stop()
 boundary_hook=cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x15c08,0xfffff,count=100000)
 assert done==[0x10000+case['entry']] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for name,value in case['registers'].items():assert cpu.reg_read(names[name])==value,(case['phase'],case['value'],name)
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==case['hash'],(case['phase'],case['value'],case['mode'],case['time'])
 if case['phase']=='divide-error':
  cpu.hook_del(boundary_hook)
  interrupts=[]
  def interrupt(uc,number,_):interrupts.append(number);uc.emu_stop()
  cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.emu_start(0x10000+case['entry'],0xfffff,count=1);assert interrupts==[0]
 results.append({k:v for k,v in case.items() if k!='globals'})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':results,'limits':'DF0; graphics calls and interrupt body not executed; six script registers and globals compared'}))
