"""Execute original joystick startup with explicit port traces, both captures."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-joystick-startup-vectors.mjs'),str(path.resolve())],text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g+0xfefe:g+0xff00]=(0x902).to_bytes(2,'little');m[g+0xc9d:g+0xc9f]=(0x8000).to_bytes(2,'little');m[g+0x288a:g+0x288c]=bytes([1,1])
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];index=[0];done=[]
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_BX,0xabcd),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(reg,value)
 def read(uc,port,size,_):
  assert port==0x201 and size==1;value=case['replies'][index[0]];index[0]+=1;events.append({'kind':'in','port':port,'value':value});return value
 def write(uc,port,size,value,_):events.append({'kind':'out','port':port,'value':value})
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_CODE,stop,None,0x10902,0x10902)
 cpu.emu_start(0x110cc,0xfffff,count=1200000)
 assert done==[True] and events==case['events'] and index[0]==case['repliesConsumed'],(case['high'],case['failure'])
 for reg,key in [(UC_X86_REG_AX,'ax'),(UC_X86_REG_BX,'bx'),(UC_X86_REG_CX,'cx'),(UC_X86_REG_DX,'dx')]:assert cpu.reg_read(reg)==case['registers'][key],(key,cpu.reg_read(reg),case['registers'][key])
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfef4:g+0xff00]=bytes(12);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original 10CC..1136 plus 13F1..1423; full memory except stack FEF4..FEFF, AX/BX/CX/DX/SP and exact port trace; stable/change detection, four axes, both timeout phases. Controlled port replies, no concurrent interrupts.'}))
