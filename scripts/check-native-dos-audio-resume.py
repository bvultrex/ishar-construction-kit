"""Composed original stop -> pending pop -> timer install, Unicorn 2.1.4."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-audio-resume-vectors.mjs'),str(args.capture.resolve())],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 def word(at,value):cpu.mem_write(at,value.to_bytes(2,'little'))
 count=len(case['queue']);pointer=0x893d-8*count
 word(0x18909,count);word(0x1890b,pointer)
 for i,e in enumerate(case['queue']):cpu.mem_write(0x10000+pointer+8*i,bytes([e['priority'],e['speed']])+b''.join(e[k].to_bytes(2,'little') for k in ['repeatWord','segment','offset']))
 for at,value in [(0x186de,55),(0x186da,0x1234),(0x186dc,0x5678),(0x10bf8,0x4567),(0x1c0b0+0xc9f,101),(0x1c0b0+0x2894,2)]:word(at,value)
 cpu.mem_write(0x186c3,b'\x01');target=0x40000+case['expected']['current']['offset'];cpu.mem_write(target,bytes([165])*128)
 initial={UC_X86_REG_CS:0x1000,UC_X86_REG_DS:0x5000,UC_X86_REG_ES:0x6000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_AX:0x1111,UC_X86_REG_BX:0x2222,UC_X86_REG_CX:0x3333,UC_X86_REG_DX:0x4444,UC_X86_REG_SI:0x5555,UC_X86_REG_DI:0x6666,UC_X86_REG_BP:0x7777,UC_X86_REG_EFLAGS:514}
 for r,v in initial.items():cpu.reg_write(r,v)
 ports=[];reads=[];done=[];portstate=[case['port61']]
 def out(uc,port,size,value,_):
  assert size==1;ports.append({'port':port,'value':value})
  if port==0x61:portstate[0]=value
 def inp(uc,port,size,_):assert port==0x61 and size==1;reads.append(port);return portstate[0]
 def code(uc,address,size,_):
  if address==0x18eb7:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 cpu.emu_start(0x18e2c,0x18eb8,count=2048)
 expected=case['expected'];assert done==[0x18eb7] and len(reads)==2
 assert ports==expected['ports'];assert bytes(cpu.mem_read(target,106))==base64.b64decode(expected['bytes'])
 assert bytes(cpu.mem_read(target+106,22))==bytes([165])*22
 assert cpu.mem_read(0x20,4)==expected['vector']['offset'].to_bytes(2,'little')+expected['vector']['segment'].to_bytes(2,'little')
 assert int.from_bytes(cpu.mem_read(0x18909,2),'little')==len(expected['queue'])
 assert int.from_bytes(cpu.mem_read(0x1890b,2),'little')==0x893d-8*len(expected['queue'])
 assert cpu.mem_read(0x186c3,1)[0]==1 and cpu.mem_read(0x18947,1)[0]==1
 for at,key,size in [(0x8945,'priority',1),(0x8946,'speed',1),(0x8943,'repeatWord',2),(0x8941,'segment',2),(0x893f,'offset',2)]:assert int.from_bytes(cpu.mem_read(0x10000+at,size),'little')==expected['current'][key]
 for at,key,size in [(0xe0b,'priority',1),(0xe0d,'speed',1),(0xe0e,'repeatWord',2),(0xe12,'segment',2),(0xe10,'offset',2)]:assert int.from_bytes(cpu.mem_read(0x1c0b0+at,size),'little')==expected['current'][key]
 for r,v in initial.items():
  if r not in [UC_X86_REG_AX,UC_X86_REG_EFLAGS]:assert cpu.reg_read(r)==v,(r,cpu.reg_read(r),v)
 assert cpu.reg_read(UC_X86_REG_EFLAGS)&512
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'composed stop/pop/reinstall state, ports, pointer use and register restoration verified','limits':'no asynchronous ticks or physical hardware'}))
