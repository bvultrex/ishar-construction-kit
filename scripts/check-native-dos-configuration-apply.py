"""Compare complete original configuration-to-engine transfer before RET."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1',0x1933,0x1a2e),'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2',0x1a07,0x1b02)}
assert digest in profiles;profile,entry,end=profiles[digest];repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-configuration-apply-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);base=0x23d70
 for at,value in zip([0x3a6,0x5fc,0x574,0x48a,0x402],case['fields']):m[base+at]=value
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 saved={UC_X86_REG_BX:0x2345,UC_X86_REG_CX:0x3456,UC_X86_REG_DX:0x4567,UC_X86_REG_DI:0x5678,UC_X86_REG_SI:0x6789,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x789a}
 for reg,value in {**saved,UC_X86_REG_AX:0xffff,UC_X86_REG_CS:0x23d7,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00}.items():cpu.reg_write(reg,value)
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,finish,None,base+end,base+end);cpu.emu_start(base+entry,0xfffff,count=150)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_AX)==case['ax']
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 assert hashlib.sha256(cpu.mem_read(0,0x100000)).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profile,'captureSha256':digest,'entry':entry,'end':end,'caseCount':len(cases),'cases':cases,'limits':'Complete transfer entry to final RET boundary; full1MiB exact without masks, AX and preserved general registers/SP verified; flags/device discovery excluded'}))
