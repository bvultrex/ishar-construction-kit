"""Original72/73 preparation and resource/first-child lookup."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-draw-complete-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x50000]=bytes(65536)
 if case['es']==0x5000:m[0x50000:0x60000]=bytes(65536)
 def word(s,o,value):
  at=s*16+(o&65535);m[at:at+2]=value.to_bytes(2,'little')
 m[0x60000:0x80000]=bytes(0x20000)
 word(0x1c0b,0xbf6,0x200);word(case['es'],0x800-20,0x100);word(case['es'],0x800-18,0x6000);m[case['es']*16+0x800-3]=case['flip']
 word(0x6000,0x10e,0x1000);word(0x6000,0x1100,0x100);word(0x6000,0x1208,0xf000 if case['carry'] else 0x80);word(0x6000,0x1204,0x200)
 total=0x1208+(0xf000 if case['carry'] else 0x80);root=0x60000+(0x10000 if case['carry'] else 0)+(total&65535);m[root]=case['type']
 if case['type']==255:
  m[root+1]=case['children']
  for offset,value in [(2,0x8001),(4,5),(6,65534),(8,7)]:word(root>>4,(root&15)+offset,value)
  for offset,value in [(10,1),(12,9),(14,3),(16,4)]:word(root>>4,(root&15)+offset,value)
  m[0x61404]=1
 m[0x70000:0x80000]=bytes(0x10000);word(0x1c0b,0xbea,0x7000);word(0x1c0b,0xbec,0x1000);m[g+0xbf3]=case['freeMode'];word(case['es'],0x800-22,0x100);word(case['es'],0x302,0x200)
 for i in range(8):word(0x7000,0x1000+i*38+4,0 if i==7 else 0x1000+(i+1)*38)
 if case['existing']:
  word(case['es'],0x800-24,0x800);word(0x7000,0x206,0x800);m[0x70800]=255 if case['existing']==1 else 0;word(0x7000,0x802,0x100);m[0x70801]=0x45 if case['opcode']!=72 else 0
  if case['existing']==2:
   word(0x7000,0x804,0x826);word(0x7000,0x806,0x826);word(0x7000,0x828,0x100);m[0x70827]=0x45 if case['opcode']!=72 else 0
 m[0x40100:0x40100+len(case['code'])]=bytes(case['code'])
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,case['es']),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x800),(UC_X86_REG_DX,0x1234),(UC_X86_REG_CX,0x5678),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x10000+case['entry']:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126eb,0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00+case['stackDelta'],(case,done,cpu.reg_read(UC_X86_REG_SP),cpu.reg_read(UC_X86_REG_IP))
 for key,value in case['registers'].items():assert cpu.reg_read(names[key])==value,(case,key)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50)
 assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'six script registers/SP and full physical memory except CPU stack saves; no drawing or device calls'}))

