"""Original stop branch incl. pending detection; Unicorn 2.1.4. No host I/O."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-timer-stop-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 state=case['input'];expected=case['expected'];cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 for at,value,size in [(0x186c3,state['active'],1),(0x18909,state['pending'],2),(0x186de,state['savedDivisor'],2),(0x186da,state['vectorOffset'],2),(0x186dc,state['vectorSegment'],2),(0x1ceba,7,1),(0x18947,7,1),(0x1cebb,85,1)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 cpu.mem_write(0x20,b'\xa5'*4)
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x2000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,2|(512 if state['interruptsEnabled'] else 0))]:cpu.reg_write(r,v)
 ports=[];reads=[];done=[]
 def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
 def inp(uc,port,size,_):assert port==0x61 and size==1;reads.append(port);return state['port61']
 def code(uc,address,size,_):
  if address in [0x18e34,0x18e8e,0x18eb7]:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 cpu.emu_start(0x18e2c,0x18eb8,count=128)
 assert done==[{'inactive':0x18e34,'pending':0x18e8e,'stopped':0x18eb7}[expected['kind']]]
 assert ports==expected['ports'];assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&512)==expected['interruptsEnabled'];assert cpu.reg_read(UC_X86_REG_SP)==0xff00
 if state['active']:
  assert reads==[0x61];assert cpu.mem_read(0x20,4)==state['vectorOffset'].to_bytes(2,'little')+state['vectorSegment'].to_bytes(2,'little')
  for at,value in [(0x186c3,0),(0x1ceba,0),(0x18947,0),(0x1cebb,128)]:assert cpu.mem_read(at,1)[0]==value
 else:
  assert reads==[];assert cpu.mem_read(0x20,4)==b'\xa5'*4;assert cpu.mem_read(0x1cebb,1)[0]==85
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'native stop ports, vector restoration, IF, flags and pending branch match','limits':'pending continuation stops before helper; no physical hardware'}))
