"""Differential native buffer transform. unicorn==2.1.4; no host I/O/DOS calls."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
vectors=json.loads(subprocess.check_output([args.node,str(repo/'scripts/blancpc-load-vectors.mjs')],cwd=repo,text=True))
for case in vectors:
 source=base64.b64decode(case['input']);expected=base64.b64decode(case['expected'])
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 src=0x20100;dst=src+2560
 cpu.mem_write(src,source);cpu.mem_write(dst,bytes([0xa5])*2560)
 for register,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x2000),(UC_X86_REG_ES,0x20a0),(UC_X86_REG_SI,0x100),(UC_X86_REG_DI,0x100),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(register,value)
 finished=[]
 def code(uc,address,size,_):
  if address==0x10723:finished.append(address);uc.emu_stop()
 def interrupt(uc,number,_):raise AssertionError('Unexpected interrupt')
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INTR,interrupt)
 cpu.emu_start(0x10709,0x10724,count=100000)
 assert finished==[0x10723]
 assert bytes(cpu.mem_read(dst,2560))==expected
 assert bytes(cpu.mem_read(src,2560))==source
 assert cpu.reg_read(UC_X86_REG_SI)==0xb00 and cpu.reg_read(UC_X86_REG_DI)==0xb00
 assert cpu.reg_read(UC_X86_REG_CX)==0
 assert cpu.mem_read(dst+2560,1)==image[dst+2560:dst+2561]
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(vectors),'comparedOutputBytes':2560*len(vectors),'result':'original x86 and TypeScript buffers match, source and end pointers verified','limits':'controlled DF=0 and nonwrapping offsets; no file loading or interrupt installation'}))
