"""Original normal type20 transparent byte blit482/2DD through far return430A."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-byte-blit-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x60000:0x72000]=bytes(0x12000);m[0x90000:0xa0000]=bytes([90])*65536
 def word(s,o,value):
  at=s*16+o;m[at:at+2]=value.to_bytes(2,'little')
 m[0x71022]=case['mirrored'];m[0x60000]=case['type'];m[0x60006]=case['base'];m[0x1e970+0x30]=case['base'];word(0x6000,2,7);word(0x6000,4,3);word(0x7000,0x100c,2);word(0x7000,0x100e,1)
 for n in range(32):m[0x60000+(6 if case['type']==0 else 8)+n]=case['pattern'][n%8]
 width=min(case['requestedWidth'],8-case['left'])
 for at,value in [(0x1dd5,case['pitch']),(0x1dbf,case['offset']),(0x1dc1,0x9000),(0xc2c,2+case['left']),(0xc2e,1+case['top']),(0xc30,2+case['left']+width-1),(0xc32,4),(0xff00,0xb),(0xff02,0x430a),(0xff04,0x1000)]:word(0x1c0b,at,value)

 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for name,r in names.items():cpu.reg_write(r,{'ds':0x6000,'es':0x7000,'si':0,'bp':0x200,'dx':0x1234,'cx':0x5678}[name])
 for r,value in [(UC_X86_REG_CS,0x1e97),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DI,0x1000),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[];writes=[0]
 def hook(uc,address,size,_):
  if address==0x1430a:done.append(True);uc.emu_stop()
 def count_pixels(uc,access,address,size,value,_):
  if 0x90000<=address<0xa0000:writes[0]+=size
 cpu.hook_add(UC_HOOK_MEM_WRITE,count_pixels)
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x1e970+(0x4bf if case['mirrored'] else 0x482),0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff06 and writes[0]==case['pixelWrites']
 for name,r in names.items():assert cpu.reg_read(r)==case['registers'][name],(case,name)
 assert cpu.reg_read(UC_X86_REG_BX)==case['bx'] and cpu.reg_read(UC_X86_REG_DI)==case['di']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'caseMetadataSha256':hashlib.sha256(json.dumps(cases,sort_keys=True).encode()).hexdigest(),'limits':'Six script registers, BX/DI, SP and full memory except CPU stack saves; type20 zero transparency/zero runs, left/top clipping, source/destination stride and wrapped offsets; normal0482 and mirrored04BF; display device excluded'}))
