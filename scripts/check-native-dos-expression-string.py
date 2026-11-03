"""Original opcode31 context-string34 and literal4 buffer effects inside loops."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
assert int.from_bytes(source[0x101f2+34:0x101f4+34],'little')==0x6ae8
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-expression-string-vectors.mjs')],cwd=repo,text=True));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear();script=bytearray(65536);script[0x100:0x100+len(case['script'])]=bytes(case['script']);context=bytearray([0xa5])*65536;globals=bytearray([0x5a])*65536
 for at,value in [(0xbf6,case['base']),(0xc58,case['buffer'])]:globals[at:at+2]=value.to_bytes(2,'little')
 at=(case['base']+case['offset'])&65535;context[at:at+case['length']+1]=bytes([1+i%255 for i in range(case['length'])]+[0])
 cpu.mem_write(0x40000,bytes(script));cpu.mem_write(0x50000,bytes(context));cpu.mem_write(0x1c0b0,bytes(globals[:0x28c0]))
 if case['buffer']>=0x28c0:cpu.mem_write(0x1c0b0+case['buffer'],bytes(globals[case['buffer']:]))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x8000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x300),(UC_X86_REG_DX,0x3456),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.emu_start(0x126eb,0xfffff,count=20000);expected=case['expected'];assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0x8000
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==expected[name],(case,name)
 assert cpu.reg_read(UC_X86_REG_DS)==0x4000 and cpu.reg_read(UC_X86_REG_ES)==0x5000
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['contextHash']
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash']
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0+case['buffer'],case['length']+1))).hexdigest()==expected['bufferHash']
 assert bytes(cpu.mem_read(0x40000,65536))==script
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode31 context/literal strings, buffer side effects and SI/DX/CX match native loops','limits':'DF0, disjoint bounded segments; no complete string-expression or IO service claim'}))
