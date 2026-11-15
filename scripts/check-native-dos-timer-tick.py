"""Installed original engine stub vs reconstructed tick. Unicorn 2.1.4, no I/O."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-timer-tick-vectors.mjs'),str(args.capture.resolve())],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image);base=0x40100
 cpu.mem_write(base,base64.b64decode(case['stub']));cpu.mem_write(0x40300,bytes([case['sample']]))
 for r,v in [(UC_X86_REG_CS,0x4000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xff00),(UC_X86_REG_AX,0x1234),(UC_X86_REG_BX,0x5678),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 ports=[];done=[]
 def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
 def code(uc,address,size,_):
  if address-base in [0x30,0x38,0x5b]:done.append({0x30:'iret',0x38:'timer-chain',0x5b:'sample-end'}[address-base]);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
 cpu.emu_start(base,base+106,count=64)
 expected=case['expected'];assert done==[expected['exit']] and ports==expected['ports']
 for at,key in [(2,'operandAX'),(12,'samplePointer'),(96,'counter'),(100,'timerStep'),(102,'timerCountdown'),(54,'timerReload')]:assert int.from_bytes(cpu.mem_read(base+at,2),'little')==expected['state'][key],(case,key)
 assert cpu.reg_read(UC_X86_REG_SP)==(0xfefc if done==['sample-end'] else 0xff00)
 if done!=['sample-end']:assert cpu.reg_read(UC_X86_REG_AX)==0x1234 and cpu.reg_read(UC_X86_REG_BX)==0x5678
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'installed tick state, ports, countdown borrow and exit traces match','limits':'stops before iret/far target; no asynchronous hardware timing'}))
