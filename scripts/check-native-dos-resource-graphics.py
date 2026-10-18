"""Normal185E graphics conversion: controlled synthetic resources, native memory oracle.
Original instructions are read only from a hash-identified local capture.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles
repo=Path(__file__).resolve().parent.parent;results=[]
def word(memory,at,value):memory[at:at+2]=(value&65535).to_bytes(2,'little')
for width in [0,3,7,15]:
 for module_offset in [0,0xfff0]:
  memory=bytearray(original);memory[0x1c0b0:0x1c0b0+0x28c0]=bytes(0x28c0)
  module=0x50000+module_offset;resource=0x61000;table=0x61100;palette=0x61200
  memory[module:module+24]=bytes(24);memory[0x61000:0x72000]=bytes(0x11000)
  memory[module+14:module+18]=(resource-module).to_bytes(4,'little')
  memory[resource:resource+4]=(table-resource).to_bytes(4,'little')
  memory[resource+18:resource+22]=(palette-resource).to_bytes(4,'little')
  types=[0,2,1,1,0x10,0x12,0x12,0x14,0x16,0x7f]
  word(memory,resource+4,len(types))
  for n in range(16):word(memory,palette+32+n*2,0xf0f0|((n*7)&0xf0f))
  for n in range(256):memory[palette+96+n]=(n*13+7)&255
  for n,kind in enumerate(types):
   asset=0x64000+n*4096;memory[table+n*4:table+n*4+4]=(asset-(table+n*4)).to_bytes(4,'little')
   memory[asset]=kind;memory[asset+1]=7 if n==2 else 193
   word(memory,asset+2,width);word(memory,asset+4,0x74 if n==6 else n%3)
   for index in range(1024):memory[asset+8+index]=(index*31+n*11)&255
  request={'memory':base64.b64encode(memory).decode(),'ss':0x1c0b,'cs':0x1000,'ds':0x5000,'dx':module_offset}
  expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-graphics-vector.mjs')],input=json.dumps(request),cwd=repo,text=True))
  cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(memory))
  registers={UC_X86_REG_CS:0x1000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_DS:0x5000,UC_X86_REG_DX:module_offset,UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x5678,UC_X86_REG_CX:0x9abc,UC_X86_REG_SI:0xdef0,UC_X86_REG_DI:0x2468,UC_X86_REG_ES:0x3000,UC_X86_REG_BP:0x1357}
  for reg,value in registers.items():cpu.reg_write(reg,value)
  done=[]
  def hook(uc,address,size,_):
   if address==0x11b9d:done.append(True);uc.emu_stop()
  cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x1185e,0xfffff,count=5000000)
  assert done==[True]
  for reg,value in registers.items():assert cpu.reg_read(reg)==value,(width,module_offset,reg)
  actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
  assert hashlib.sha256(actual).hexdigest()==expected['hash'],(width,module_offset)
  assert expected['assets']==len(types)
  results.append({'width':width,'moduleOffset':module_offset,**expected})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':results,'result':'normal graphics conversion matches native memory and preserved registers','limits':'synthetic data; stack save bytes masked; flags and alternate1B9E not compared'}))
