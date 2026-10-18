"""All byte values through original opcode fetch and indirect CALL; no handlers."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-opcode-dispatch-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];armed=[False]
def code(uc,address,size,_):
 if armed[0]:done.append(address);uc.emu_stop()
 elif address==0x126f2:armed[0]=True
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear();armed[0]=False
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,case['si']),(UC_X86_REG_AX,65535),(UC_X86_REG_BX,65535),(UC_X86_REG_EFLAGS,2|(1024 if case['df'] else 0))]:cpu.reg_write(r,v)
 cpu.mem_write(0x40000+case['si'],bytes([case['opcode']]))
 cpu.emu_start(0x126eb,0xfffff,count=16)
 expected=case['expected'];assert done==[0x10000+expected['target']]
 assert cpu.reg_read(UC_X86_REG_AX)==expected['index']==cpu.reg_read(UC_X86_REG_BX)
 assert cpu.reg_read(UC_X86_REG_SI)==expected['si'] and cpu.reg_read(UC_X86_REG_SP)==0xfefe
 assert int.from_bytes(cpu.mem_read(0x2bfae,2),'little')==expected['returnOffset']
 assert cpu.reg_read(UC_X86_REG_DS)==0x4000 and bool(cpu.reg_read(UC_X86_REG_EFLAGS)&1024)==case['df']
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'all 256 byte values, both directions, SI wrap, actual handler target and CALL return match','limits':'captured handler table only; no handler body, later table patching or opcode validity claim'}))
