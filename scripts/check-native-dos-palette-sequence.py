"""Full original timer IRQ sequences through fade completion and inactive ticks."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-palette-sequence-vectors.mjs')],cwd=repo,text=True));ticks=0
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];ports=[];reads=[]
 for at,value in [(0x1e948,case['enabled']),(0x19414,0),(0x1e940,0),(0x1e946,0),(0x1cd4a,0),(0x1cd88,0),(0x1cd75,0),(0x1cd69,case['mode']),(0x1cd6d,0),(0x1cd6c,case['reload']),(0x1cd6e,4),(0x1cd68,1),(0x1cd19,1)]:cpu.mem_write(at,bytes([value]))
 cpu.mem_write(0x1dead,b'\0'*48)
 cpu.mem_write(0x1cef3,bytes([20 if case['rising'] else 30])*768);cpu.mem_write(0x1d1f3,b'\0'*768);cpu.mem_write(0x1d4f3,bytes([30 if case['rising'] else 20])*768)
 def code(uc,address,size,_):
  if address==0x70200:done.append(address);uc.emu_stop()
 def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
 def inp(uc,port,size,_):assert port==0x3da and size==1;reads.append(8);return 8
 cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
 saved=[(UC_X86_REG_AX,0x1111),(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0x7777)]
 for frame in case['frames']:
  done.clear();ports.clear();reads.clear();cpu.mem_write(0x2bfaa,b'\0\2\0\x70\x02\x06');cpu.mem_write(0x1cd47,b'\2')
  for r,v in saved+[(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfefa),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
  cpu.emu_start(0x10d98,0xfffff,count=30000)
  assert done==[0x70200] and ports==frame['ports'] and len(reads)==frame['reads']
  for at,key in [(0x1cef3,'current'),(0x1d1f3,'shadow'),(0x1d4f3,'target')]:assert hashlib.sha256(bytes(cpu.mem_read(at,768))).hexdigest()==frame[key],(case['enabled'],case['mode'],key)
  assert cpu.mem_read(0x1cd68,1)[0]==frame['active'] and cpu.mem_read(0x1cd6d,1)[0]==frame['countdown']
  for r,v in saved:assert cpu.reg_read(r)==v
  assert cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_EFLAGS)&0x600==0x600
  ticks+=1
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'sequences':len(cases),'ticks':ticks,'result':'original IRQ fade progression, completion, gated skips, ports and IRET match','limits':'second early callback disabled, audio and cursor inactive, controlled ready retrace and IRQ injection'}))
