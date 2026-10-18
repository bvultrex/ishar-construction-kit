"""Original normal-object first FF batch through pixel call boundary."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-object-batch-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x50000]=bytes(65536)
 if case['es']==0x5000:m[0x50000:0x60000]=bytes(65536)
 def word(s,o,value):
  at=s*16+(o&65535);m[at:at+2]=value.to_bytes(2,'little')
 m[0x60000:0x61000]=bytes(0x1000);m[0x70000:0x80000]=bytes(0x10000)
 for at,value in [(0xbf6,0x200),(0xbea,0x7000),(0xb18,0x200),(0xbec,0x2000)]:word(0x1c0b,at,value)
 m[case['es']*16+0x300]=128 if case['dirty'] else 0;m[case['es']*16+0x31d]=255;m[case['es']*16+0x324]=1;word(case['es'],0x302,0x200);word(0x7000,0x206,0x1000)
 word(0x6000,0x100,0x100);m[0x60200]=1;word(0x6000,0x202,4);word(0x6000,0x204,6)
 statuses=[255]+case['tail']
 for i,status in enumerate(statuses):
  at=0x1000+i*0x100;m[0x70000+at]=status;word(0x7000,at+2,0x100);word(0x7000,at+6,at+0x100 if i+1<len(statuses) else 0)
  for offset,value in [(8,0x100),(10,0x6000),(12,10),(14,10),(16,1),(18,0x100),(20,0x6000),(22,100+i),(24,20),(26,5),(30,case['otherGroup'] if i else 65535 if case['negative'] else 0)]:word(0x7000,at+offset,value)
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,case['es']),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x200),(UC_X86_REG_DX,0x1234),(UC_X86_REG_CX,0x200),(UC_X86_REG_BX,0x300),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x10000+case['entry']:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x13de4,0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00+case['stackDelta']
 for key,value in case['registers'].items():assert cpu.reg_read(names[key])==value,(case,key)
 assert cpu.reg_read(UC_X86_REG_BX)==case['bx'] and cpu.reg_read(UC_X86_REG_DI)==case['di']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50)
 assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'six script registers/SP and full physical memory except CPU stack saves; no drawing or device calls'}))
