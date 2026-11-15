"""Original timer OUT/IN sequence vs TypeScript, Unicorn 2.1.4. No host port access."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-timer-complete-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 cpu.mem_write(0x20100,bytes([165])*106)
 cpu.mem_write(0x30c9f,case['setting'].to_bytes(2,'little'));cpu.mem_write(0x32894,case['systemType'].to_bytes(2,'little'))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x2000),(UC_X86_REG_BX,0x100),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 ports=[];reads=[];done=[]
 def out(uc,port,size,value,_):
  assert size==1;ports.append({'port':port,'value':value})
 def inp(uc,port,size,_):
  assert port==0x61 and size==1;reads.append(port);return case['port61']
 def code(uc,address,size,_):
  if address==0x1905a:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 cpu.emu_start(0x19009,0x1905b,count=256)
 assert done==[0x1905a] and reads==[0x61]
 expected=case['expected'];assert ports==expected['ports'],(case,ports)
 assert bytes(cpu.mem_read(0x20100,106))==base64.b64decode(expected['bytes'])
 assert cpu.reg_read(UC_X86_REG_EFLAGS)&512
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'original OUT trace, IN usage, stub patches, IF and stack match','limits':'controlled port input, no host I/O or hardware timing'}))
