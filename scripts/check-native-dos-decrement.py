"""Native43/44/45 through2943: typed zero flags and source/global alias ordering."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;results=[]
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-decrement-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
def word(m,at,value):m[at:at+2]=value.to_bytes(2,'little')
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x50000]=bytes(65536)
 if not case['alias']:m[0x50000:0x60000]=bytes(65536)
 word(m,case['es']*16+case['bp']+case['offset'],case['value']);word(m,g+0xc58,0x802);word(m,g+0xc5c,0xa02);m[0x40100:0x40100+len(case['code'])]=bytes(case['code'])
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,case['es']),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,case['bp']),(UC_X86_REG_DX,0x1234),(UC_X86_REG_CX,0x5678),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x126f7:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126eb,0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for key,value in case['registers'].items():assert cpu.reg_read(names[key])==value,(case['opcode'],case['tag'],case['value'],case['alias'],key)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50)
 assert hashlib.sha256(actual).hexdigest()==case['hash'],(case['opcode'],case['tag'],case['value'],case['alias'],'memory')
 results.append({k:v for k,v in case.items() if k!='code'})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':results,'limits':'direct add-result forms only; six script registers, SP and full memory except stack saves; other flags/scratch excluded'}))
