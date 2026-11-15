"""Opcode41 shared-memory alias checks against the two original captures."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=[]
for count in [0,1,2,255]:
 for offset in [0x105,0x107,0x300]:
  for alias in [False,True]:
   m=bytearray(original);m[0x40000:0x60000]=bytes(0x20000);m[0x40100]=41;m[0x40101:0x40103]=offset.to_bytes(2,'little');m[0x40103]=count;m[0x40104]=0x79
   for n in range(count*2):m[0x40105+n]=(n*37+11)&255
   m[0x1c0b0+0xff00:0x1c0b0+0xff02]=b'\0\xe0'
   es=0x4000 if alias else 0x5000;bp=0x400 if count==255 else 0
   request={'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'ds':0x4000,'es':es,'si':0x100,'bp':bp,'single':True}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-block-prefix-vector.mjs')],input=json.dumps(request),cwd=repo,text=True))['steps'][0]
   cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m))
   saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x5678,UC_X86_REG_CX:0x9abc,UC_X86_REG_DX:0xdef0,UC_X86_REG_DI:0x2468,UC_X86_REG_BP:bp,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:es}
   for r,value in saved.items():cpu.reg_write(r,value)
   for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_SI,0x101),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
   done=[]
   def code(uc,address,size,_):
    if address==0x1e000:done.append(True);uc.emu_stop()
   cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x15713,0xfffff,count=10000)
   assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff02 and cpu.reg_read(UC_X86_REG_SI)==expected['si']
   for r,value in saved.items():assert cpu.reg_read(r)==value
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],(count,offset,alias)
   cases.append({'count':count,'offset':offset,'bp':bp,'alias':alias,'hash':expected['hash']})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':cases,'limits':'DF0; flags and stack save bytes excluded'}))
