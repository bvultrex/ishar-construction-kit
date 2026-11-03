"""Original graphics1E97:0008 through clipped format dispatch."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-sprite-blit-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x60000:0x72000]=bytes(0x12000)
 def word(s,o,value):
  at=s*16+o;m[at:at+2]=value.to_bytes(2,'little')
 word(0x7000,0x1008,0x100);word(0x7000,0x100a,0x6000);word(0x7000,0x100c,65528 if case['position']=='partial' else 100 if case['position']=='outside' else 10);word(0x7000,0x100e,65532 if case['position']=='partial' else 20);m[0x71022]=case['mirror']
 word(0x6000,0x100,0x100);word(0x6000,0x102,case['high']);segment=0x6000+((case['high']>>4)|((case['high']&15)<<12))+0x20;m[segment*16]=case['type'];word(segment,2,16);word(segment,4,8);word(0x1c0b,0xc44,39);word(0x1c0b,0xc46,39)
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for name,r in names.items():cpu.reg_write(r,{'ds':0x7000,'es':0x5000,'si':0x100,'bp':0x200,'dx':0x1234,'cx':0x5678}[name])
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DI,0x1000),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x1e970+case['entry']:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x14305,0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00-6
 for name,r in names.items():assert cpu.reg_read(r)==case['registers'][name],(case,name)
 if 'bx' in case:assert cpu.reg_read(UC_X86_REG_BX)==case['bx']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Six script registers, BX/DI, SP and full memory except CPU stack saves; no pixels'}))
