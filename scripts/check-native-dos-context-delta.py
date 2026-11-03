"""Real post-script delta helper, complete linked-object segment comparison."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-context-delta-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 registers=[(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_BP,0x200),(UC_X86_REG_DI,0x3333),(UC_X86_REG_AX,0x1234),(UC_X86_REG_CX,0x2345),(UC_X86_REG_DX,0x3456)]
 for r,v in registers:cpu.reg_write(r,v)
 def word(at,v):cpu.mem_write(at,v.to_bytes(2,'little'))
 word(0x2bfb0,0xf000);cpu.mem_write(0x60000,bytes([0xa5])*65536)
 word(0x501e8,0x100 if case['count'] else 0);word(0x1c0b0+0xbe8,0x7777);word(0x1c0b0+0xbea,0x6000)
 for axis,value in enumerate(case['current']):word(0x50200+axis*2,value);word(0x1c0b0+0xbfa+axis*2,0)
 for i in range(case['count']):
  at=0x60100+i*0x100;cpu.mem_write(at,bytes([case['state']]));word(at+4,0x200+i*0x100 if i+1<case['count'] else 0)
  for axis in range(3):word(at+0x16+axis*2,(65535-i*17-axis)&65535)
 def code(uc,address,size,_):
  if address==0x1f000:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x13c97,0xfffff,count=200);expected=case['expected']
 assert done==[0x1f000] and cpu.reg_read(UC_X86_REG_SP)==0xff02
 assert hashlib.sha256(bytes(cpu.mem_read(0x60000,65536))).hexdigest()==expected['memorySha256']
 for r,v in registers:
  if r not in [UC_X86_REG_SP,UC_X86_REG_DS,UC_X86_REG_DI]:assert cpu.reg_read(r)==v
 assert cpu.reg_read(UC_X86_REG_DS)==(0x6000 if expected['loadedObjectSegment'] else 0x4000)
 assert cpu.reg_read(UC_X86_REG_DI)==(expected['di'] if expected['di'] is not None else 0x3333)
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'full object segment, raw deltas, state marking, register restoration and list traversal match','limits':'controlled acyclic records; coordinate semantics, renderer consumption and full scheduler continuation excluded'}))
