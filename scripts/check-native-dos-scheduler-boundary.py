"""Check264C root reload plus264F scan/main preparation against original CPU.
Original captures are read only; source instruction bytes stay outside the repo.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import Uc,UC_ARCH_X86,UC_MODE_16,UC_HOOK_CODE
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-scheduler-boundary-vectors.mjs')],cwd=repo,text=True));phases={}
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);context=bytearray([0xa5])*65536;module=bytearray(65536);globals=bytes([0x5a])*0x28c0
 bp=0x200 if case['entry']=='context' else case['root']
 def word(buf,at,value):buf[at&65535]=value&255;buf[(at+1)&65535]=value>>8
 word(context,0x100,case['root'])
 for at,name in [(-36,'flag'),(-4,'active'),(-1,'delay')]:context[(bp+at)&65535]=case[name]
 for at,value in [(-20,0x100),(-18,0x4000),(-8,0x1234),(-6,0x4000)]:word(context,bp+at,value)
 word(module,0x10a,case['scan']);cpu.mem_write(0x50000,bytes(context));cpu.mem_write(0x40000,bytes(module));cpu.mem_write(0x1c0b0,globals)
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x200),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BX,0),(UC_X86_REG_DX,0x1234),(UC_X86_REG_CX,0x5678),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
 done=[]
 def code(uc,address,size,_):
  if address in [0x12632,0x126eb]:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x1264c if case['entry']=='frame-return' else 0x1264f,0xfffff,count=200)
 expected=case['expected'];phase=expected['phase'];phases[phase]=phases.get(phase,0)+1
 assert done==[0x12632 if phase=='skip' else 0x126eb],case
 for r,name in [(UC_X86_REG_BP,'bp'),(UC_X86_REG_SI,'si'),(UC_X86_REG_DS,'ds')]:assert cpu.reg_read(r)==expected[name],(case,name)
 assert cpu.reg_read(UC_X86_REG_DX)==0x1234 and cpu.reg_read(UC_X86_REG_CX)==0x5678
 assert cpu.reg_read(UC_X86_REG_SP)==(0xff00 if phase=='skip' else 0xfefe)
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['contextHash'],case
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash'],case
 assert bytes(cpu.mem_read(0x40000,65536))==bytes(module)
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'phases':phases,'result':'frame root reload and context scan/main preparation match native boundaries','limits':'explicit controlled segments; stops before opcode/callback execution; AX/BX/flags are not part of output contract'}))
