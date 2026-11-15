"""Real header-to-table-layout slice, including lower bound/frontier composition."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-tables-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address==0x177bc:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear();cpu.mem_write(0x1e536,bytes(case['header']))
 for at,value in [(0x1cc42,case['segment']),(0x1cc40,case['offset']),(0x1cc46,case['frontier']),(0x1cc44,0x1234)]:cpu.mem_write(at,value.to_bytes(2,'little'))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x1c0b)]:cpu.reg_write(r,v)
 cpu.emu_start(0x176d8,0xfffff,count=140)
 expected=case['expected'];assert done==[0x177bc]
 for offset,value in expected['words'].items():assert int.from_bytes(cpu.mem_read(0x1c0b0+int(offset),2),'little')==value,(case,offset)
 assert cpu.reg_read(UC_X86_REG_AX)==expected['bounds']['candidate'] and cpu.reg_read(UC_X86_REG_DS)==expected['bounds']['floor'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 assert bytes(cpu.mem_read(0x1e536,16))==bytes(case['header'])
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'all native table pointer words, arithmetic wraps, lower bound and frontier match','limits':'raw header fields, slice76D8..77BB; file reads and table consumers excluded'}))
