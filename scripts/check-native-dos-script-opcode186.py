"""Execute actual opcode186 dispatch/numeric routines; no native handler stubs."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-opcode186-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);done=[]
assert int.from_bytes(source[0x10024+186*2:0x10026+186*2],'little')==0x296b
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear();script=bytearray(65536);script[0x100:0x101+len(case['script'])]=bytes([186]+case['script']);context=bytearray([0xa5])*65536
 for i in range(5):value=(case['seed']+i)&65535;context[0x200+i*2:0x202+i*2]=value.to_bytes(2,'little')
 cpu.mem_write(0x40000,bytes(script));cpu.mem_write(0x50000,bytes(context));cpu.mem_write(0x1c0b0,bytes([0x5a])*0x28c0)
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x200),(UC_X86_REG_DX,0x3456),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.emu_start(0x126eb,0xfffff,count=200);expected=case['expected']
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==expected[name],(case,name)
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash'],case
 assert bytes(cpu.mem_read(0x40000,65536))==script and bytes(cpu.mem_read(0x50000,65536))==context
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode186 mixed global writes, SI/DX/CX and actual dispatch/RET match','limits':'DF0, separate segments; numeric tags0/2/6/8; global field purposes remain unassigned'}))
