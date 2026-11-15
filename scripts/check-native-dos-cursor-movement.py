"""Persistent original 670D cursor movement, with real restore/save/draw helpers."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--full-timer',action='store_true');a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-cursor-movement-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 cpu.mem_write(0x60000,bytes((i*13+7)&255 for i in range(65536)));cpu.mem_write(0x50200,bytes(case['sprite']));cpu.mem_write(0x1e830,b'\xa5'*262)
 for at,value,size in [(0x1cc34,0,2),(0x1cc36,0x6000,2),(0x1cd5a,0x2780,2),(0x1cd5c,0x1c0b,2),(0x1cd64,0x200,2),(0x1cd66,0x5000,2),(0x1de85,320,2),(0x1cd56,10,2),(0x1cd58,10,2),(0x1cd53,0,1),(0x1e946,case['mode'],1),(0x1cd61,case['hidden'],1),(0x1cd62,case['guard'],1)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 saved=[(UC_X86_REG_AX,0x1111),(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x1c0b),(UC_X86_REG_ES,0x7000),(UC_X86_REG_BP,0x8888)]
 def code(uc,address,size,_):
  if address in [0x1ea70,0x10100]:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code)
 def run(segment,offset,target):
  done.clear();cpu.mem_write(0x3fefe,b'\0\1')
  for r,v in saved+[(UC_X86_REG_CS,segment),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
  cpu.emu_start(segment*16+offset,0xfffff,count=20000)
  assert done==[target] and cpu.reg_read(UC_X86_REG_SP)==0xff00
  for r,v in saved:assert cpu.reg_read(r)==v
 run(0x1e97,0xf2a,0x1ea70)  # establish original background and cursor first
 if a.full_timer:
  cpu.mem_write(0x1dead,b''.join(bytes(r) for r in case['initialRecords']))
  for at,value in [(0x1e948,0),(0x19414,0),(0x1e940,0),(0x1cd4a,254),(0x1cd47,3),(0x1cd48,3),(0x1cd88,0),(0x1cd75,0)]:cpu.mem_write(at,bytes([value]))
  cpu.mem_write(0x10bf2,b'\0\3\0\x70')
  ports=[]
  def out(uc,port,size,value,_):assert size==1;ports.append((port,value))
  cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT)
  def timer_end(uc,address,size,_):
   if address in [0x70200,0x70300]:done.append(address);uc.emu_stop()
  cpu.hook_add(UC_HOOK_CODE,timer_end)
 for frame in case['frames']:
  cpu.mem_write(0x111bd,frame['nextX'].to_bytes(2,'little'));cpu.mem_write(0x111bf,frame['nextY'].to_bytes(2,'little'))
  if not a.full_timer:run(0x1000,0x670d,0x10100)
  else:
   done.clear();ports.clear();cpu.mem_write(0x3fefa,b'\0\2\0\x70\x02\x06')
   for r,v in saved+[(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefa),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
   cpu.emu_start(0x10d98,0xfffff,count=24000)
   chain=frame['timer']['exit']=='saved-handler'
   assert done==[0x70300 if chain else 0x70200] and ports==[(0x20,0x60)]
   for r,v in saved:assert cpu.reg_read(r)==v
   assert cpu.reg_read(UC_X86_REG_SP)==(0xfefa if chain else 0xff00)
   assert cpu.mem_read(0x1cd4a,1)[0]==255 and cpu.mem_read(0x1cd47,1)[0]==frame['timer']['counter']
   assert cpu.mem_read(0x1cd87,1)[0]==frame['timer']['selected']
   assert bytes(cpu.mem_read(0x1dead,48))==b''.join(bytes(r) for r in frame['timer']['records'])
   if not chain:assert cpu.reg_read(UC_X86_REG_EFLAGS)&0x600==0x600
   else:assert bytes(cpu.mem_read(0x3fefa,6))==b'\0\2\0\x70\x02\x06'
  assert hashlib.sha256(bytes(cpu.mem_read(0x60000,65536))).hexdigest()==frame['screen'],(case['mode'],case['hidden'],case['guard'],frame)
  assert hashlib.sha256(bytes(cpu.mem_read(0x1e830,262))).hexdigest()==frame['backup']
  assert int.from_bytes(cpu.mem_read(0x1cd56,2),'little')==frame['x'] and int.from_bytes(cpu.mem_read(0x1cd58,2),'little')==frame['y']
  assert cpu.mem_read(0x1cd62,1)[0]==case['guard']
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'fullTimer':a.full_timer,'sequences':len(cases),'movements':len(cases)*5,'result':'persistent original timer/cursor state and composed models match','limits':('early timer callbacks disabled, audio device mode0, external saved handler not executed, synthetic sprites and controlled IRQ frames' if a.full_timer else 'direct 670D calls, valid coordinates and synthetic sprites; no real mouse driver')}))
