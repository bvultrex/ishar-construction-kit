"""Full shared-memory087D..08EA reservation; no unrelated memory masks."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-framebuffer-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes([90])*0x28c0
 for at,value in [(0xb8a,case['existing']),(0xb88,0x1234)]:m[g+at:g+at+2]=value.to_bytes(2,'little')
 for at,value in [(0x2898,case['graphics']),(0x2892,case['performance']),(0x2896,case['mode'])]:m[g+at]=value
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 saved={UC_X86_REG_CX:0x3456,UC_X86_REG_DX:0x4567,UC_X86_REG_DI:0x5678,UC_X86_REG_SI:0x6789,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x789a}
 for reg,value in {**saved,UC_X86_REG_CS:0x1000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_AX:case['upper'],UC_X86_REG_EFLAGS:0x202}.items():cpu.reg_write(reg,value)
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,finish,None,0x108eb,0x108eb);cpu.emu_start(0x1087d,0xfffff,count=100)
 assert done==[True] and cpu.reg_read(UC_X86_REG_AX)==case['ax'] and cpu.reg_read(UC_X86_REG_BX)==case['bx'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 assert hashlib.sha256(bytes(cpu.mem_read(0,0x100000))).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Entire1MiB compared without masking; explicit incoming upper segment and preexisting buffer; earlier BIOS/EMS and following08EB calls excluded'}))
