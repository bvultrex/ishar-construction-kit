"""Native mouse initialization vs planned INT33 requests, with controlled replies.
Does not emulate a mouse driver or connect to host input.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-mouse-init-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);calls=[];done=[]
def interrupt(uc,number,_):
 assert number==0x33
 call={k:uc.reg_read(r) for k,r in [('ax',UC_X86_REG_AX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('es',UC_X86_REG_ES)]};calls.append(call)
 if call['ax']==0:uc.reg_write(UC_X86_REG_AX,case['resetAX'])
def code(uc,address,size,_):
 if address==0x10100:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 calls.clear();done.clear()
 for at,value,size in [(0x1cd53,case['blocked'],1),(0x1e946,case['mode'],1),(0x1cd4d,0x8120,2),(0x1cd5a,0x3456,2),(0x1cd5c,0x4567,2),(0x1cd61,0x55,1),(0x2c0ae,0x100,2)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfffe),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000)]:cpu.reg_write(r,v)
 cpu.emu_start(0x111c3,0xfffff,count=128)
 expected=case['expected'];assert done==[0x10100] and len(calls)==len(expected['calls']),case
 for actual,wanted in zip(calls,expected['calls']):
  for key,value in wanted.items():assert actual[key]==value,(case,actual,wanted)
 for at,size,key in [(0x1cd53,1,'blocked'),(0x1cd4d,2,'flags'),(0x1cd5a,2,'cursorOffset'),(0x1cd5c,2,'cursorSegment'),(0x1cd61,1,'hiddenByte')]:assert int.from_bytes(cpu.mem_read(at,size),'little')==expected[key],(case,key)
 assert cpu.reg_read(UC_X86_REG_SP)==0 and cpu.reg_read(UC_X86_REG_DS)==0x5000
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'INT33 request sequence, success/failure state and cursor pointer match','limits':'controlled driver replies, unspecified driver register effects and real mouse behavior excluded'}))
