"""Original timer relocation/vector writes before first OUT; unicorn==2.1.4."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-timer-install-vectors.mjs'),str(args.capture.resolve())],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 cpu.mem_write(0x10bf8,(0x4567).to_bytes(2,'little'));cpu.mem_write(0x20000+case['offset'],bytes([0xa5])*128)
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x2000),(UC_X86_REG_ES,0x4000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DX,case['offset']),(UC_X86_REG_CX,case['length']),(UC_X86_REG_BX,case['speedIndex']),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(reg,value)
 done=[]
 def code(uc,address,size,_):
  if address==0x19009:done.append(address);uc.emu_stop()
 def out(uc,port,size,value,_):raise AssertionError('Unexpected OUT before observation boundary')
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
 cpu.emu_start(0x18f49,0x1900a,count=1024)
 assert done==[0x19009]
 expected=case['expected'];target=0x20000+case['offset']
 assert bytes(cpu.mem_read(target,106))==base64.b64decode(expected['bytes'])
 assert bytes(cpu.mem_read(target+106,22))==bytes([0xa5])*22
 assert bytes(cpu.mem_read(0x20,4))==case['offset'].to_bytes(2,'little')+(0x2000).to_bytes(2,'little')
 assert cpu.reg_read(UC_X86_REG_DX)==expected['samplePointer']
 assert int.from_bytes(cpu.mem_read(0x186de,2),'little')==0x4567
 assert cpu.mem_read(0x186c3,1)[0]==1
 assert cpu.reg_read(UC_X86_REG_SP)==0xfefa
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'native stub patches, emulated vector, buffer tail and stack match','limits':'stops before OUT; no real interrupt installation or timing'}))
