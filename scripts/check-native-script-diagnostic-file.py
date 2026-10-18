"""Compare consecutive supported toolkit steps against a persistent native CPU.
The original IO and memory capture are read only; no copied resource is committed.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('module',type=Path);p.add_argument('--finish-yield',action='store_true');p.add_argument('--select-next',action='store_true');a=p.parse_args();a.finish_yield=a.finish_yield or a.select_next;memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest();original=a.module.read_bytes()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;data=json.loads(subprocess.check_output(['node',str(repo/'scripts/native-script-diagnostic-file-vectors.mjs'),str(a.module.resolve())]+(['--finish-yield'] if a.finish_yield else [])+(['--select-next'] if a.select_next else []),cwd=repo,text=True));assert data['steps']
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);initial=data['initial'];done=[]
cpu.mem_write(0x40000,base64.b64decode(initial['script']));cpu.mem_write(0x50000,base64.b64decode(initial['context']));cpu.mem_write(0x1c0b0,base64.b64decode(initial['globals']))
for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,initial['si']),(UC_X86_REG_BP,initial['bp']),(UC_X86_REG_DX,initial['dx']),(UC_X86_REG_CX,initial['cx']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
caller=0x26b2 if a.finish_yield else 0xe000;cpu.mem_write(0x1c0b0+0xff00,caller.to_bytes(2,'little'));phase='steps'
def code(uc,address,size,_):
 if phase=='steps' and address in [0x126f7,0x10000+caller] or phase=='continuation' and address in [0x12632,0x126eb] or phase=='selection' and address in [0x12649,0x1264f]:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
for index,step in enumerate(data['steps']):
 done.clear();assert cpu.mem_read(0x40000+cpu.reg_read(UC_X86_REG_SI),1)[0]==step['opcode'];cpu.emu_start(0x126eb,0xfffff,count=10000)
 yielding=step['status']=='yield';assert done==[0x10000+caller if yielding else 0x126f7] and cpu.reg_read(UC_X86_REG_SP)==(0xff02 if yielding else 0xff00),(index,step)
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==step[name],(index,name,cpu.reg_read(r),step[name])
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==step['contextHash'],(index,'context')
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x2200))).hexdigest()==step['globalsHash'],(index,'globals')
if a.finish_yield:
 expected=data['continuation'];phase='continuation';done.clear();cpu.emu_start(0x126b2,0xfffff,count=1000);callback=expected['status']=='callback'
 assert done==[0x126eb if callback else 0x12632] and cpu.reg_read(UC_X86_REG_SP)==(0xff00 if callback else 0xff02)
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==expected[name],('continuation',name)
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['contextHash']
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x2200))).hexdigest()==expected['globalsHash']
if a.select_next:
 expected=data['selection'];phase='selection';done.clear();cpu.emu_start(0x12632,0xfffff,count=1000)
 assert done==[0x12649 if expected['status']=='frame' else 0x1264f] and cpu.reg_read(UC_X86_REG_SP)==0xff02
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_BP,'bp'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==expected[name],('selection',name)
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['contextHash']
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x2200))).hexdigest()==expected['globalsHash']
script=base64.b64decode(initial['script']);assert bytes(cpu.mem_read(0x40000,len(script)))==script
assert a.capture.read_bytes()==memory and a.module.read_bytes()==original
print(json.dumps({'captureSha256':digest,'moduleSha256':data['sourceSha256'],'steps':len(data['steps']),'boundary':data['boundary'],'yieldCompletion':data['continuation']['status'] if a.finish_yield else None,'selection':data['selection']['status'] if a.select_next else None,'nextOpcode':data['nextOpcode'],'result':'persistent actual dispatch/handlers match toolkit after every supported step','limits':'controlled initial context/caller boundary, one module, optional26B2/2632 boundaries only; no frame, preparation, IRQ or multi-segment execution'}))
