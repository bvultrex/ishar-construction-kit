"""Actual VGA0EC9 one-pass palette convergence, including signed byte wrap."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-palette-fade-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
for case in cases:
 m=bytearray(original);m[g+0xcbe]=case['step']
 for n in range(768):m[g+0xe43+n]=n&255;m[g+0x1443+n]=((255-(n&255) if case['reverse'] else n)+case['offset'])&255
 m[g+0xff00:g+0xff04]=bytes([0,0xe0,0,0x10]);cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x5678,UC_X86_REG_CX:0x9abc,UC_X86_REG_DX:0xdef0,UC_X86_REG_DI:0x1133,UC_X86_REG_SI:0x2244,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x6677}
 for reg,value in {**saved,UC_X86_REG_CS:0x1e97,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_EFLAGS:0x602}.items():cpu.reg_write(reg,value)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x1e000,0x1e000);cpu.emu_start(0x1e970+0xec9,0xfffff,count=20000);assert done==[True]
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 assert cpu.reg_read(UC_X86_REG_SP)==0xff04 and not(cpu.reg_read(UC_X86_REG_EFLAGS)&0x400)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfee0:g+0xff04]=bytes(36);assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Native VGA1E97:0EC9..0F29 single768-byte pass; all byte values with signed boundary/reverse/wrapping target patterns, step0/1/2/63/127/128/255, CB8; whole1MiB except FEE0..FF03 CPU stack, nine saved registers/SP/DF and source immutability. No IRQ, DAC upload or complete timed fade claim.'}))
