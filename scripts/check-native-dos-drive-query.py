"""Expression160 original DOS/BIOS drive selection, with synthetic sector replies."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-drive-query-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
regs={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
for case in cases:
 m=bytearray(original);m[0x1e940]=0;m[0x60100:0x60102]=bytes([31,160]);cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));events=[];done=[];attempt=[0]
 for key,value in case['input'].items():cpu.reg_write(regs[key],value)
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  if number==0x11:events.append(['equipment']);uc.reg_write(UC_X86_REG_AX,case['equipment']);return
  if number==0x13:
   drive=uc.reg_read(UC_X86_REG_DL);n=attempt[0];attempt[0]+=1;events.append(['sector',drive,n]);assert uc.reg_read(UC_X86_REG_AX)==0x201 and uc.reg_read(UC_X86_REG_CX)==0x101 and uc.reg_read(UC_X86_REG_DH)==0
   at=uc.reg_read(UC_X86_REG_ES)*16+uc.reg_read(UC_X86_REG_BX);assert at==0x1227e;uc.mem_write(at,bytes((i+drive+n*17)&255 for i in range(512)));uc.reg_write(UC_X86_REG_AH,case['statuses'][n]);return
  assert number==0x21
  ah=uc.reg_read(UC_X86_REG_AH)
  if ah==0x19:events.append(['current']);uc.reg_write(UC_X86_REG_AL,case['current']);return
  assert ah==0xe;events.append(['select',uc.reg_read(UC_X86_REG_DL)]);uc.reg_write(UC_X86_REG_AL,3)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,stop,None,0x126f7,0x126f7);cpu.emu_start(0x126eb,0xfffff,count=10000);assert done==[True] and events==case['events'],case
 for key,value in case['registers'].items():assert cpu.reg_read(regs[key])==value,(case,key)
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00;actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(80);assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original dispatch31/tag160; six ALIS registers/SP, full1MiB except FEC0..FF0F, exact DOS/BIOS event order and sector-buffer writes including failures/retry. Optional8AE4 dialog excluded; explicit synthetic services, no host disk access.'}))
