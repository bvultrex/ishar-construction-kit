"""Original8ADB RETF, internal audio quiesce and inactive SB stop."""
import sys,json,hashlib,base64,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=Path(sys.argv[1]);original=p.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent;count=0
for mode in [0,1,2,4]:
 for active in [0,1]:
  for port61 in [0,3,255]:
   m=bytearray(original)
   for off,value in [(0xe940,mode),(0xe93e,1),(0x86c3,active),(0x86c1,0),(0xceba,0),(0x8947,1)]:m[0x10000+off]=value
   for off,value in [(0x8909,7),(0x890b,0x8905),(0x86da,0x1234),(0x86dc,0x5678),(0x86de,0x5d2a)]:m[0x10000+off:0x10000+off+2]=value.to_bytes(2,'little')
   m[0x1c0b0+0xff00:0x1c0b0+0xff04]=bytes([0,0,0,0x70]);expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-audio-quiesce-vector.mjs')],input=json.dumps({'memory':base64.b64encode(m).decode(),'port61':port61}),text=True,cwd=repo))
   cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[]
   initial={UC_X86_REG_CS:0x1000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_AX:0x1111,UC_X86_REG_BX:0x2222,UC_X86_REG_CX:0x3333,UC_X86_REG_DX:0x4444,UC_X86_REG_DS:0x5000,UC_X86_REG_ES:0x6000,UC_X86_REG_SI:0x123,UC_X86_REG_DI:0x456,UC_X86_REG_BP:0x789,UC_X86_REG_EFLAGS:0x202}
   for r,v in initial.items():cpu.reg_write(r,v)
   def read(uc,port,size,_):assert port==0x61 and size==1;events.append({'kind':'in','port':port,'value':port61});return port61
   def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
   def stop(uc,address,size,_):done.append(True);uc.emu_stop()
   cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_CODE,stop,None,0x70000,0x70000);cpu.emu_start(0x18adb,0xfffff,count=5000);assert done==[True] and events==expected['events']
   for r,v in initial.items():
    if r not in [UC_X86_REG_CS,UC_X86_REG_SP,UC_X86_REG_EFLAGS]:assert cpu.reg_read(r)==v
   assert cpu.reg_read(UC_X86_REG_SP)==0xff04;actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(80);assert hashlib.sha256(actual).hexdigest()==expected['hash'],(mode,active,port61);count+=1
assert p.read_bytes()==original
print(json.dumps({'captureSha256':digest,'cases':count,'verified':'8ADB through RETF; internal sample timer stop, queue clear, IRQ-vector restore, ports, registers and full1MiB except FEC0..FF0F. External2209 and active SB92E0 excluded; CPU flags not contracted.'}))
