"""Original raw audio envelope arithmetic vs productive TS; stop target excluded."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--complete-fm-stop',action='store_true');p.add_argument('--with-resource',action='store_true');a=p.parse_args()
assert not a.with_resource or a.complete_fm_stop, '--with-resource requires --complete-fm-stop'
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-audio-envelope-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];io=[];stops=0
fields=[(7,1,'base'),(0x12,1,'skipFirst'),(0xc,2,'first'),(0xe,2,'firstDivisor'),(0x10,2,'hold'),(8,2,'last'),(0xa,2,'lastDivisor'),(6,1,'value'),(0x71b,1,'operand')]
def code(uc,address,size,_):
 if address==0x19510 or address==0x197a6 and not a.complete_fm_stop:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
def out(uc,port,size,value,_):assert size==1;io.append({'kind':'write','port':port,'value':value})
def inp(uc,port,size,_):assert size==1 and port==0x388;io.append({'kind':'read','port':port});return 0xff
cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
saved=[(UC_X86_REG_AX,0x1111),(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0x7777)]
for case in cases:
 done.clear();io.clear()
 if a.complete_fm_stop:
  cpu.mem_write(0x19414,b'\x01\x01');cpu.mem_write(0x1b71a,b'\xa5'*256);cpu.mem_write(0x1e960,b'\0\0')
  if a.with_resource:cpu.mem_write(0x1e960,b'\0\x40');cpu.mem_write(0x1cc46,b'\xff\x3f');cpu.mem_write(0x3fff0,b'\x20\0')
  for at in [0x1ceba,0x1cd88,0x186c1]:cpu.mem_write(at,b'\x55')
 for offset,size,key in fields:cpu.mem_write(0x19410+offset,case['source'][key].to_bytes(size,'little'))
 cpu.mem_write(0x3fefe,b'\0\1')
 for r,v in saved+[(UC_X86_REG_CS,0x1941),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.emu_start(0x19732,0xfffff,count=14000 if a.complete_fm_stop else 64)
 expected=case['expected'];assert done==[0x197a6 if expected['stopCall'] and not a.complete_fm_stop else 0x19510]
 for offset,size,key in fields:assert int.from_bytes(cpu.mem_read(0x19410+offset,size),'little')==expected['state'][key],(case,key)
 assert cpu.reg_read(UC_X86_REG_SP)==(0xfeec if expected['stopCall'] and not a.complete_fm_stop else 0xff00)
 if a.complete_fm_stop:
  assert io==case['stopIo'] and bytes(cpu.mem_read(0x1b71a,256))==bytes(case['stopShadow'])
  for at in [0x1ceba,0x1cd88,0x186c1]:assert cpu.mem_read(at,1)[0]==(0 if expected['stopCall'] else 0x55)
  assert cpu.mem_read(0x19414,1)[0]==(0 if expected['stopCall'] else 1)
  assert bytes(cpu.mem_read(0x1e960,2))==(b'\0\x40' if a.with_resource and not expected['stopCall'] else b'\0\0')
  if a.with_resource:assert int.from_bytes(cpu.mem_read(0x1cc46,2),'little')==(case['release']['frontier'] if expected['stopCall'] else 0x3fff)
  for r,v in saved:assert cpu.reg_read(r)==v
  stops+=int(expected['stopCall'])
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'completeFmStop':a.complete_fm_stop,'withResource':a.with_resource,'executedStops':stops,'result':'native envelope state and configured stop composition match','limits':'nonfaulting DIV; FM device, controlled zero or frontier resource handle; other stop paths excluded'}))
