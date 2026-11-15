"""Differential original DOS parameter preparation. unicorn==2.1.4; no host I/O."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
vectors=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-sample-prepare-vectors.mjs')],cwd=repo,text=True))
for case in vectors:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 cpu.mem_write(case['segment']*16+case['offset'],bytes(case['header']))
 cpu.mem_write(0x30e0d,bytes([case['speed']]))
 for register,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_AX,case['segment']),(UC_X86_REG_DI,case['offset']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(register,value)
 done=[]
 def code(uc,address,size,_):
  if address==0x1633f:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x16302,0x16340,count=64)
 assert done==[0x1633f]
 word=lambda at:int.from_bytes(cpu.mem_read(0x30000+at,2),'little')
 actual={'speed':cpu.mem_read(0x30e0d,1)[0],'length':word(0xe14),'sampleOffset':word(0xe10),'sampleSegment':word(0xe12),'frequency':word(0xe18)}
 assert actual==case['expected'],(case,actual)
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(vectors),'result':'native sample words and speed/frequency match TypeScript','limits':'parameter block only; no channel/device execution'}))
