"""Native later-stage speed clamp vs TypeScript; unicorn==2.1.4, no host I/O."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
program="import {normalizeOriginalDosDeviceSpeed as f} from './src/lib/ishar/original-dos-sample-prepare.ts'; console.log(JSON.stringify(Array.from({length:256},(_,i)=>f(i))));"
expected=json.loads(subprocess.check_output([args.node,'--input-type=module','-e',program],cwd=repo,text=True))
for speed in range(256):
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 cpu.mem_write(0x1cebd,bytes([speed]));cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.reg_write(UC_X86_REG_EFLAGS,2)
 done=[]
 def code(uc,address,size,_):
  if address==0x18886:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x1886d,0x18887,count=32)
 assert done==[0x18886]
 assert cpu.mem_read(0x1cebd,1)[0]==expected[speed]
 assert cpu.reg_read(UC_X86_REG_BX)==expected[speed]
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':256,'result':'later native device speed clamp matches TypeScript for all byte values','limits':'guarded device branch only; no device call or audible output'}))
