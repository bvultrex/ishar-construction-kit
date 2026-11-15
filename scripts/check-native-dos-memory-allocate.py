"""Native allocation followed by real release in the same emulated RAM."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-memory-allocate-vectors.mjs')],cwd=repo,text=True));successes=0
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 cpu.mem_write(0x1cc46,case['frontier'].to_bytes(2,'little'));cpu.mem_write(0x1cc7a,case['floor'].to_bytes(2,'little'))
 def code(uc,address,size,_):
  if address==0x10100:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code)
 def run(offset,ax,dx):
  done.clear();cpu.mem_write(0x2c0ae,b'\0\1')
  for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x5000),(UC_X86_REG_SI,0x7777),(UC_X86_REG_BX,0x1234),(UC_X86_REG_AX,ax),(UC_X86_REG_DX,dx),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfffe)]:cpu.reg_write(r,v)
  cpu.emu_start(0x10000+offset,0xfffff,count=48)
  assert done==[0x10100] and cpu.reg_read(UC_X86_REG_SP)==0
  assert cpu.reg_read(UC_X86_REG_DS)==0x5000 and cpu.reg_read(UC_X86_REG_SI)==0x7777 and cpu.reg_read(UC_X86_REG_BX)==0x1234
 run(0xa14,case['size'],0xabcd);expected=case['expected']
 assert cpu.reg_read(UC_X86_REG_AX)==0 and cpu.reg_read(UC_X86_REG_DX)==expected['handle']
 assert int.from_bytes(cpu.mem_read(0x1cc46,2),'little')==expected['frontier']
 if expected['success']:
  successes+=1;assert int.from_bytes(cpu.mem_read(expected['headerSegment']*16,2),'little')==expected['headerWord']
  run(0xa50,0,expected['handle'])
  assert int.from_bytes(cpu.mem_read(0x1cc46,2),'little')==case['released']['frontier']==case['frontier']
  assert cpu.reg_read(UC_X86_REG_DX)==case['released']['dx']
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'allocateReleasePairs':successes,'result':'request rounding, wrap, floor failure, header, handle and inverse release match','limits':'controlled allocator bounds, no whole-engine memory layout invariants'}))
