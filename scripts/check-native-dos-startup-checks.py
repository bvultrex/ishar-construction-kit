"""Original final startup checks including wrapped memory comparison boundaries."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-startup-checks-vectors.mjs'),str(path.resolve())],text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0
 for at,value in [(0xc9f,case['measurement']),(0xb92,0x8000),(0xb96,(0x8000+case['available'])&65535)]:m[g+at:g+at+2]=value.to_bytes(2,'little')
 m[g+0x2898]=case['graphics'];m[g+0xc69]=case['adapter']
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_AX,0x1234),(UC_X86_REG_BX,0xabcd),(UC_X86_REG_DX,0x5678),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX);dx=uc.reg_read(UC_X86_REG_DX)
  if number==0x10:assert ax==0x200 and dx==0;events.append({'kind':'cursor','dx':dx})
  else:assert number==0x21 and ax>>8==2;events.append({'kind':'character','value':dx&255})
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,stop,None,0x10000+case['boundary'],0x10000+case['boundary']);cpu.emu_start(0x10902,0xfffff,count=1000)
 assert done==[True] and events==case['events']
 for reg,key in [(UC_X86_REG_AX,'ax'),(UC_X86_REG_BX,'bx'),(UC_X86_REG_DX,'dx')]:assert cpu.reg_read(reg)==case['registers'][key]
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00+case['stackDelta']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfef8:g+0xff00]=bytes(8);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original0902..0952 through RET boundary or low-memory handler entry; full physical memory except FEF8..FEFF, AX/BX/DX/SP and BIOS/DOS text events. Timer150/151, adapter15/16, memory67C0/67C1 and6F80/6F81 and 16-bit wrap boundaries. Handler0A6F body and BIOS/DOS internals excluded.'}))
