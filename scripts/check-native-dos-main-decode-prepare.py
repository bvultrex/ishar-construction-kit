"""Original77F6 caller through decoder entry, no decoder stubs or execution."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-decode-prepare-vectors.mjs')],cwd=repo,text=True));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);done=[];branches={}
def code(uc,address,size,_):
 if address in [0x179e9,0x179a5]:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for case in cases:
 done.clear();globals=bytearray([0x5a])*0x28c0
 for at,value in [(0x2480,case['low']),(0x2482,(case['pack']<<8)|case['high']),(0xbc8,case['offset']),(0xbca,0x5000)]:globals[at:at+2]=value.to_bytes(2,'little')
 cpu.mem_write(0x1c0b0,bytes(globals))
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x8000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_AX,0x1234),(UC_X86_REG_CX,0x2345),(UC_X86_REG_DX,0x3456)]:cpu.reg_write(r,value)
 cpu.emu_start(0x177f6,0xfffff,count=100);expected=case['expected'];assert done==[0x10000+expected['entry']] and cpu.reg_read(UC_X86_REG_SP)==0x8000+expected['stackDelta']
 for name,r in [('ax',UC_X86_REG_AX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]:assert cpu.reg_read(r)==expected['registers'][name],case
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash']
 branches[str(expected['entry'])]=branches.get(str(expected['entry']),0)+1
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'branches':branches,'result':'packed flag, size subtraction, destination and actual decoder-entry stack match','limits':'stops at79A5/79E9 entry; alternate decoder execution excluded'}))
