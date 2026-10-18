"""Execute original098F through RET, compare selected shared memory and registers."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-video-selection-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g+0x2898]=case['graphics'];m[g+0x2896]=case['inputMode'];m[g+0xff00:g+0xff02]=(0xe000).to_bytes(2,'little')
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x2345,UC_X86_REG_CX:0x3456,UC_X86_REG_DX:0x4567,UC_X86_REG_DI:0x5678,UC_X86_REG_SI:0x6789,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x789a}
 for reg,value in {**saved,UC_X86_REG_CS:0x1000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_EFLAGS:0x602}.items():cpu.reg_write(reg,value)
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,finish,None,0x1e000,0x1e000);cpu.emu_start(0x1098f,0xfffff,count=30000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff02
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 assert not(cpu.reg_read(UC_X86_REG_EFLAGS)&0x400)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'098F only; input adapter/mode bytes explicit; general registers restored, DF cleared, stack FF02; full shared memory compared except stack FEC0..FF0F; no later initialization claimed'}))
