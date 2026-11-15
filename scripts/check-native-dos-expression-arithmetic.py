"""Nine numeric operations; actual original nested calls and register effects."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;results=[]
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-expression-arithmetic-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original);cpu.mem_write(0x1c0b0,bytes(0x28c0));cpu.mem_write(0x40000,bytes(case['code']));cpu.mem_write(0x1c0b0+0xff00,b'\0\xe0')
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x200),(UC_X86_REG_SI,0),(UC_X86_REG_BX,0x277c),(UC_X86_REG_DX,0x1234),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x1e000:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x169a9,0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff02
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==case[name],(case,name,cpu.reg_read(r))
 assert bytes(cpu.mem_read(0x1c0b0,0x28c0))==bytes(0x28c0)
 results.append({k:v for k,v in case.items() if k!='code'})
overflow=[]
for tag in [90,92]:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original);cpu.mem_write(0x1c0b0,bytes(0x28c0));cpu.mem_write(0x40000,bytes([56,2,0,128,tag,2,255,255,58]));cpu.mem_write(0x1c0b0+0xff00,b'\0\xe0')
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x200),(UC_X86_REG_SI,0),(UC_X86_REG_BX,0x277c),(UC_X86_REG_DX,0x1234),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 interrupts=[]
 def interrupt(uc,number,_):interrupts.append(number);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.emu_start(0x169a9,0xfffff,count=10000);assert interrupts==[0]
 overflow.append({'tag':tag,'dividend':-32768,'divisor':-1,'interrupt':0})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':results,'overflow':overflow,'limits':'DF0; SI/DX/CX, return stack and globals; INT0 body/flags excluded'}))
