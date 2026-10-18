"""Compare consecutive supported toolkit steps against a persistent native CPU.
The original IO and memory capture are read only; no copied resource is committed.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('module',type=Path);a=p.parse_args();memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest();original=a.module.read_bytes()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;data=json.loads(subprocess.check_output(['node',str(repo/'scripts/native-script-diagnostic-file-vectors.mjs'),str(a.module.resolve())],cwd=repo,text=True));assert data['steps']
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);initial=data['initial'];done=[]
cpu.mem_write(0x40000,base64.b64decode(initial['script']));cpu.mem_write(0x50000,base64.b64decode(initial['context']));cpu.mem_write(0x1c0b0,base64.b64decode(initial['globals']))
for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,initial['si']),(UC_X86_REG_BP,initial['bp']),(UC_X86_REG_DX,initial['dx']),(UC_X86_REG_CX,initial['cx']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for index,step in enumerate(data['steps']):
 done.clear();assert cpu.mem_read(0x40000+cpu.reg_read(UC_X86_REG_SI),1)[0]==step['opcode'];cpu.emu_start(0x126eb,0xfffff,count=10000)
 assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0xff00,(index,step)
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==step[name],(index,name,cpu.reg_read(r),step[name])
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==step['contextHash'],(index,'context')
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x2200))).hexdigest()==step['globalsHash'],(index,'globals')
script=base64.b64decode(initial['script']);assert bytes(cpu.mem_read(0x40000,len(script)))==script
assert a.capture.read_bytes()==memory and a.module.read_bytes()==original
print(json.dumps({'captureSha256':digest,'moduleSha256':data['sourceSha256'],'steps':len(data['steps']),'nextOpcode':data['nextOpcode'],'result':'persistent actual dispatch/handlers match toolkit after every supported step','limits':'controlled initial context, one module, no scheduler, IRQ or multi-segment execution'}))
