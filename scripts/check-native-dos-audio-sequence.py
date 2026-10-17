"""Repeated native ticks through original sample-end shutdown and real emulated IRET.
Unicorn 2.1.4; controlled IRQ frames and input port, never host hardware.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-audio-sequence-vectors.mjs'),str(args.capture.resolve())],cwd=repo,text=True));ticks=0
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 cpu.mem_write(0x40100,base64.b64decode(case['stub']));cpu.mem_write(0x40180,bytes(case['samples']));cpu.mem_write(0x70100,b'\x90')
 for at,value,size in [(0x186c3,1,1),(0x18909,0,2),(0x186de,0x4567,2),(0x186da,0x1234,2),(0x186dc,0x5678,2),(0x20,0x100,2),(0x22,0x4000,2)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 ports=[];done=[];portstate=[case['port61']]
 def out(uc,port,size,value,_):
  assert size==1;ports.append({'port':port,'value':value})
  if port==0x61:portstate[0]=value
 def inp(uc,port,size,_):assert port==0x61 and size==1;return portstate[0]
 def code(uc,address,size,_):
  if address==0x10d98:raise AssertionError('Unexpected timer chain')
  if address==0x70100:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 registers={UC_X86_REG_AX:0x1111,UC_X86_REG_BX:0x2222,UC_X86_REG_CX:0x3333,UC_X86_REG_DX:0x4444,UC_X86_REG_SI:0x5555,UC_X86_REG_DI:0x6666,UC_X86_REG_BP:0x7777,UC_X86_REG_DS:0x5000,UC_X86_REG_ES:0x6000}
 for frame in case['frames']:
  ports.clear();done.clear()
  for r,v in registers.items():cpu.reg_write(r,v)
  cpu.reg_write(UC_X86_REG_CS,0x4000);cpu.reg_write(UC_X86_REG_SS,0x3000);cpu.reg_write(UC_X86_REG_SP,0xfefa);cpu.reg_write(UC_X86_REG_EFLAGS,2)
  cpu.mem_write(0x3fefa,b'\x00\x01\x00\x70\x02\x02')
  cpu.emu_start(0x40100,0xfffff,count=512)
  assert done==[0x70100] and ports==frame['ports'],(case['index'],frame,ports)
  for at,key in [(2,'operandAX'),(12,'samplePointer'),(96,'counter'),(100,'timerStep'),(102,'timerCountdown'),(54,'timerReload')]:assert int.from_bytes(cpu.mem_read(0x40100+at,2),'little')==frame['state'][key]
  for r,v in registers.items():assert cpu.reg_read(r)==v
  assert cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_CS)==0x7000 and cpu.reg_read(UC_X86_REG_IP)==0x100
  assert cpu.reg_read(UC_X86_REG_EFLAGS)&512
  assert cpu.mem_read(0x186c3,1)[0]==(0 if frame['ended'] else 1);ticks+=1
 assert cpu.mem_read(0x20,4)==b'\x34\x12\x78\x56'
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'sequences':len(cases),'ticks':ticks,'result':'persistent original ticks, repeat, end shutdown, vector and IRET register/IF restoration match','limits':'controlled IRQ injection, no wall-clock/hardware audio'}))
