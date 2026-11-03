"""Actual opcode30 expression/result dispatch; literal strings and numeric stores."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
assert int.from_bytes(source[0x10024+60:0x10026+60],'little')==0x2915
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-assignment-vectors.mjs')],cwd=repo,text=True));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);done=[]
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear();script=bytearray(65536);script[0x100:0x101+len(case['script'])]=bytes([30]+case['script']);globals=bytearray([0x5a])*65536
 for at,value in [(0xc58,case['buffer']),(0xc5c,0x1200),(0xbf6,case['base'])]:globals[at:at+2]=value.to_bytes(2,'little')
 cpu.mem_write(0x40000,bytes(script));cpu.mem_write(0x50000,bytes([0xa5])*65536);cpu.mem_write(0x1c0b0,bytes(globals[:0x28c0]))
 # High string buffers belong to the same explicit SS window; avoid unrelated code.
 if case['buffer']>=0x28c0:cpu.mem_write(0x1c0b0+case['buffer'],bytes(globals[case['buffer']:]))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x8000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x200),(UC_X86_REG_DX,0x3456),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.emu_start(0x126eb,0xfffff,count=10000);expected=case['expected'];assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0x8000
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==expected[name],(case,name)
 assert cpu.reg_read(UC_X86_REG_DS)==0x4000 and cpu.reg_read(UC_X86_REG_ES)==0x5000
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['contextHash'],case
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash'],case
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0+case['buffer'],case['copiedLength']))).hexdigest()==expected['bufferHash'],case
 assert bytes(cpu.mem_read(0x40000,65536))==script
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'opcode30 numeric stores and literal-string buffered copy match actual dispatch','limits':'DF0, disjoint bounded segments; literal tag4/result34 and existing numeric/direct result subset only'}))
