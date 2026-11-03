"""Original operand110/1334 keyboard and finite port201 query paths."""
import base64, hashlib, json, subprocess, sys
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);source=path.read_bytes();digest=hashlib.sha256(source).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert len(source)==0x100000 and digest in profiles
cases=[{'selector':s,'disabled':d,'configured':c,'calibration':k,'replies':[0,0,0,0,b]} for s in (0,1,256,257) for d in (0,1) for c in (0,1) for k in (2,65535) for b in (0,255)]
repo=Path(__file__).resolve().parent.parent
expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-joystick-query-vectors.mjs')],input=json.dumps({'memory':base64.b64encode(source).decode(),'cases':cases}),text=True,cwd=repo))
for case,result in zip(cases,expected):
 m=bytearray(source);g=0x1c0b0;m[g+0xca1]=case['disabled'];m[g+0x288a]=m[g+0x288b]=case['configured']
 for o in (0x2886,0x2888):m[g+o:g+o+2]=case['calibration'].to_bytes(2,'little')
 m[0x10390:0x10396]=bytes([1])*6;m[g+0x7ec:g+0x7ee]=b'\x00\xff'
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m))
 for r,v in ((UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x7ec),(UC_X86_REG_AX,110),(UC_X86_REG_DX,case['selector']),(UC_X86_REG_BX,0x277c),(UC_X86_REG_CX,0x1234),(UC_X86_REG_EFLAGS,0x202)):cpu.reg_write(r,v)
 events=[];index=[0];done=[]
 def read(uc,port,size,_):
  assert port==0x201 and size==1 and index[0]<len(case['replies'])
  value=case['replies'][index[0]];index[0]+=1;events.append({'kind':'in','port':port,'value':value});return value
 def write(uc,port,size,value,_):assert port==0x201 and size==1;events.append({'kind':'out','port':port,'value':value})
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_CODE,stop,None,0x1ff00,0x1ff00)
 cpu.emu_start(0x16dd6,0xfffff,count=1000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_DX)==result['value'] and cpu.reg_read(UC_X86_REG_SP)==0x7ee,case
 assert cpu.reg_read(UC_X86_REG_CX)==0x1234 and cpu.reg_read(UC_X86_REG_BX)==0x277c
 assert events==result['events'] and index[0]==result['repliesConsumed'],case
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x780:g+0x7ec]=bytes(0x6c);m[g+0x780:g+0x7ec]=bytes(0x6c);assert actual==m,case
assert path.read_bytes()==source
print(json.dumps({'profile':profiles[digest],'cases':len(cases),'verified':'Operand110 result, preserved BX/CX/SP, exact IN/OUT201 events and memory outside scratch; explicit finite replies, no physical joystick timing claim'}))
