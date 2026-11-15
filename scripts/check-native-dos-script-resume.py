"""Real yield exit -> main continuation -> callback dispatch or next context."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--complete-callback',action='store_true');a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-resume-vectors.mjs')]+(['--complete-callback'] if a.complete_callback else []),cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_BP,0x200),(UC_X86_REG_SI,0x1234)]:cpu.reg_write(r,v)
 def word(at,v):cpu.mem_write(at,v.to_bytes(2,'little'))
 word(0x2bfae,0x26f7);word(0x2bfb0,0x26b2);cpu.mem_write(0x50000,bytes([0xa5])*65536);cpu.mem_write(0x40000,bytes(65536));cpu.mem_write(0x60000,bytes([0xa5])*65536)
 for at,v in [(-20,0x100),(-18,0x4000),(-10,16),(-24,0x100 if case['count'] else 0),(0,65535 if case['changed'] else 0),(2,0),(4,0)]:word(0x50200+at,v)
 cpu.mem_write(0x501fe,bytes([case['reload'],17]));word(0x40106,case['callback']);word(0x1c0b0+0xbe8,0x7777);word(0x1c0b0+0xbea,0x6000);cpu.mem_write(0x1c0b0+0xbfa,bytes(8));cpu.mem_write(0x1c0b0+0xc19,b'\1')
 if a.complete_callback and case['callback']:
  assert int.from_bytes(memory[0x10024+66*2:0x10026+66*2],'little')==0x2d94
  cpu.mem_write(0x40116,bytes([5,0,66])) # call pushes script stack, direct yield ->26D5 restores it
 for i in range(case['count']):
  at=0x60100+i*0x100;cpu.mem_write(at,b'\0');word(at+4,0x200 if i==0 and case['count']>1 else 0)
  for axis in range(3):word(at+0x16+axis*2,1)
 def code(uc,address,size,_):
  if address==0x12632 or (address==0x126eb and not a.complete_callback):done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x12d94,0xfffff,count=200);expected=case['expected'];callback=expected['phase']=='callback'
 assert done==[0x126eb if callback else 0x12632]
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['contextSha256']
 assert hashlib.sha256(bytes(cpu.mem_read(0x60000,65536))).hexdigest()==expected['objectsSha256']
 assert cpu.reg_read(UC_X86_REG_DS)==expected['ds'] and cpu.reg_read(UC_X86_REG_SI)==expected['si']
 assert cpu.reg_read(UC_X86_REG_SP)==(0xff00 if callback else 0xff02)
 for at,v in expected['globals'].items():assert int.from_bytes(cpu.mem_read(0x1c0b0+int(at),1 if int(at)==0xc19 else 2),'little')==v
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'completeControlledCallback':a.complete_callback,'result':'yield, pointer persistence, callback path, actual delta helper and countdown reload match','limits':'controlled call5/yield66 callback when enabled; arbitrary callback bodies and next-context selection excluded; not full VM'}))
