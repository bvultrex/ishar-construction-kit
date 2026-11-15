"""Native lower resource bound and conditional frontier update, controlled header."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-memory-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x177bc:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear()
 for at,value in [(0x1e53a,case['low']),(0x1e53c,case['high']),(0x1cc46,case['frontier']),(0x1cc44,case['offset']),(0x1cc78,0x5555),(0x1cc7a,0x5555)]:cpu.mem_write(at,value.to_bytes(2,'little'))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_AX,case['base']),(UC_X86_REG_DS,0x5000)]:cpu.reg_write(r,v)
 cpu.emu_start(0x17778,0xfffff,count=48)
 expected=case['expected'];assert done==[0x177bc]
 for at,key in [(0x1cc78,'floorOffset'),(0x1cc7a,'floor'),(0x1cc44,'frontierOffset'),(0x1cc46,'frontier')]:assert int.from_bytes(cpu.mem_read(at,2),'little')==expected[key],(case,key)
 assert cpu.reg_read(UC_X86_REG_AX)==expected['candidate'] and cpu.reg_read(UC_X86_REG_BX)==expected['paragraphs'] and cpu.reg_read(UC_X86_REG_DS)==case['base'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'native resource lower bound, truncated paragraph size, carry rejection and frontier match','limits':'slice 7778..77BB, controlled raw header fields; earlier table allocations and resource loading excluded'}))
