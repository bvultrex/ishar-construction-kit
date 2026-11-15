"""Execute original entry and PSP flag parser before configuration CALL."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-startup-entry-vectors.mjs'),str(path.resolve())],text=True))
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'bp':UC_X86_REG_BP,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP}
for case in cases:
 m=bytearray(original);p=0x40000;g=0x1c0b0;m[p+0x80:p+0x180]=bytes(256);m[p+0x80]=case['length'];m[p+0x81]=32;m[p+0x82:p+0x82+len(case['command'])]=bytes(case['command']);m[0x449]=case['mode']
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.reg_write(UC_X86_REG_EFLAGS,0x602)
 for key,value in case['initial'].items():cpu.reg_write(regs[key],value)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x10787,0x10787);cpu.emu_start(0x125e5,0xfffff,count=5000)
 assert done==[True]
 for key,value in case['registers'].items():assert cpu.reg_read(regs[key])==value,(key,cpu.reg_read(regs[key]),value)
 assert not(cpu.reg_read(UC_X86_REG_EFLAGS)&0x400)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x7e8:g+0x7ee]=bytes(6);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original25E5..25FB and072D..0786, original SS/SP and nine saved registers; all output registers, DF and full memory except07E8..07ED call scratch; signed command length/character comparisons, uppercase flags, duplicates,127/128 boundaries. Explicit PSP bytes/BIOS mode; no configuration call included.'}))
