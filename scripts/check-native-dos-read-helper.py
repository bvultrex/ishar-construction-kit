"""Original DOS read helper in isolated Unicorn, with explicit mocked DOS replies.
No filesystem services are exposed to emulated code. Requires unicorn==2.1.4.
"""
import argparse,hashlib,json
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
results=[]
for returned,error in [(0,False),(1,False),(2099,False),(2100,False),(2500,False),(5,True)]:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.reg_write(UC_X86_REG_SS,0x3000);cpu.reg_write(UC_X86_REG_SP,0xff00)
 cpu.reg_write(UC_X86_REG_DS,0x2000);cpu.reg_write(UC_X86_REG_DX,0x100);cpu.reg_write(UC_X86_REG_CX,2500);cpu.reg_write(UC_X86_REG_EFLAGS,2)
 cpu.mem_write(0x30bbe,(5).to_bytes(2,'little'));cpu.mem_write(0x20100,bytes([0xa5])*2500)
 calls=[];ends=[]
 def interrupt(uc,n,_):
  assert n==0x21 and uc.reg_read(UC_X86_REG_AX)>>8==0x3f
  assert uc.reg_read(UC_X86_REG_BX)==5 and uc.reg_read(UC_X86_REG_CX)==2500
  calls.append(n)
  if not error:uc.mem_write(0x20100,bytes([0x37])*returned)
  uc.reg_write(UC_X86_REG_AX,returned);uc.reg_write(UC_X86_REG_EFLAGS,(uc.reg_read(UC_X86_REG_EFLAGS)&~1)|(1 if error else 0))
 def code(uc,address,size,_):
  if address in [0x12138,0x18468]:ends.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code)
 cpu.emu_start(0x1212d,0x18469,count=32)
 assert calls==[0x21] and ends==[0x18468 if error else 0x12138]
 assert cpu.reg_read(UC_X86_REG_AX)==(13 if error else returned)
 assert bytes(cpu.mem_read(0x20100,2500))==(bytes([0xa5])*2500 if error else bytes([0x37])*returned+bytes([0xa5])*(2500-returned))
 results.append({'dosAX':returned,'dosCarry':error,'path':'error-13' if error else 'return-success','tailPreserved':True})
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':results,'limits':'mocked DOS responses; no disk access or original environment claim'}))
