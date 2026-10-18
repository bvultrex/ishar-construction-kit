"""Original Ishar2 startup drive probe; all filesystem operations simulated."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest=='f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-configuration-drives-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original);events=[];done=[];attempt=[0];chdir_error=[False]
 saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x2345,UC_X86_REG_CX:0x3456,UC_X86_REG_DX:0x4567,UC_X86_REG_DI:0x5678,UC_X86_REG_SI:0x6789,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x789a}
 for reg,value in {**saved,UC_X86_REG_CS:0x23d7,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00}.items():cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  assert number==0x21;ah=uc.reg_read(UC_X86_REG_AX)>>8;dx=uc.reg_read(UC_X86_REG_DX);ds=uc.reg_read(UC_X86_REG_DS);error=False;value=0
  if ah==0x19:events.append({'service':'current-drive'});value=case['currentDrive']
  elif ah==0x47:events.append({'service':'current-directory','drive':dx&255,'segment':ds,'offset':uc.reg_read(UC_X86_REG_SI)});uc.mem_write(ds*16+uc.reg_read(UC_X86_REG_SI),b'TEST\0')
  elif ah==0xe:events.append({'service':'select-drive','drive':dx&255});value=case['driveCount']
  elif ah==0x3b:
   events.append({'service':'change-directory','segment':ds,'offset':dx})
   if dx==0xba8:error=case['scenario']=='chdir-fail' or case['scenario']=='second' and attempt[0]==0;attempt[0]+=1
  elif ah==0x3c:events.append({'service':'create','segment':ds,'offset':dx,'attributes':uc.reg_read(UC_X86_REG_CX)});error=case['scenario']=='create-fail';value=5
  elif ah==0x3e:events.append({'service':'close','handle':uc.reg_read(UC_X86_REG_BX)})
  elif ah==0x41:events.append({'service':'delete','segment':ds,'offset':dx})
  else:raise AssertionError(hex(ah))
  uc.reg_write(UC_X86_REG_AX,value);f=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,(f|1) if error else (f&~1))
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,finish,None,0x23d70+0x1d06,0x23d70+0x1d06);cpu.emu_start(0x23d70+0x1c33,0xfffff,count=1000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and events==case['events']
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfeee:0x1c0b0+0xff00]=bytes(18);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':'ishar2','captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Entire1C33..1D06 to RET boundary; controlled DOS replies, no real create/delete/change-directory; full memory outside saved registers FEEE..FEFF, general registers and SP checked; external drive state/flags excluded'}))
