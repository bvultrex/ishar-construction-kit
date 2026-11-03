"""Native sorted module registration up to notifications or original error branch."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-module-registry-vectors.mjs')],cwd=repo,text=True))
exits={}
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 def word(at,v):cpu.mem_write(at,v.to_bytes(2,'little'))
 def read(at):return int.from_bytes(cpu.mem_read(at,2),'little')
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DX,0x30),(UC_X86_REG_CX,case['endOffset'])]:cpu.reg_write(r,v)
 for at,v in [(0xbc2,0x100),(0xbd0,0x100+4*len(case['entries'])),(0xb14,0x4000),(0xb96,case['upper']),(0xbce,case['count']),(0xbcc,case['limit'])]:word(0x1c0b0+at,v)
 cpu.mem_write(0x50100,bytes([0xa5])*64);word(0x40030,case['incoming']['id'])
 for i,entry in enumerate(case['entries']):
  word(0x50100+i*4,entry['offset']);word(0x50102+i*4,entry['segment']);word(entry['segment']*16,entry['id'])
 def code(uc,address,size,_):
  if address in [0x18205,0x18468]:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x18182,0xfffff,count=300)
 expected=case['expected'];error=expected['error'];assert done==[0x18205 if error is None else 0x18468]
 assert read(0x1cc7a)==expected['lower'] and read(0x1c0b0+0xbd0)==expected['nextPointer'] and read(0x1c0b0+0xbce)==expected['count']
 for i,entry in enumerate(expected['entries']):assert read(0x50100+i*4)==entry['offset'] and read(0x50102+i*4)==entry['segment']
 assert cpu.reg_read(UC_X86_REG_SP)==(0xfef6 if error==11 else 0xfef8)
 if error is not None:assert cpu.reg_read(UC_X86_REG_AX)==error
 if error!=11:assert cpu.reg_read(UC_X86_REG_DS)==0x4000
 exits[str(error)]=exits.get(str(error),0)+1
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'exits':exits,'result':'sorted far pointers, duplicate ordering, lower bound and both original error paths match','limits':'stops before device notifications/error handler; controlled pointers; no wrapping table or complete loader claim'}))
