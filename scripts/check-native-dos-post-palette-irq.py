"""Original post-palette IRQ return, real IRET or saved BIOS-target boundary."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-post-palette-irq-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'sp':UC_X86_REG_SP}
for case in cases:
 spec=case['spec'];branch=spec['branch'];m=bytearray(original);m[0x19414]=1 if branch=='audio' else 0
 for at,value in [(0xc97,spec['counter']),(0xc98,spec['reload']),(0xcd8,spec['inhibit']),(0xcc5,spec['mode']),(0x2896,1),(0xcb1,0 if branch=='cursor' else 255),(0x1dfd,1 if branch=='record0' else 0),(0x1e0d,1 if branch=='record1' else 0),(0x1e1d,1 if branch=='record2' else 0),(0x1dfe,128),(0x1e0e,129),(0x1e1e,127)]:m[g+at]=value
 for at,value in [(0x10bf2,0x1234),(0x10bf4,0x7000)]:m[at:at+2]=value.to_bytes(2,'little')
 for index,value in enumerate([0x1111,0x4000,0x5000,0x2222,0x3333,0x4444,0x5555,0x6666,0x7777,0xe000,0x1000,0x602]):at=g+0xff00+index*2;m[at:at+2]=value.to_bytes(2,'little')
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 for key,value in case['registers'].items():cpu.reg_write(regs[key],value)
 cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.reg_write(UC_X86_REG_SS,0x1c0b);cpu.reg_write(UC_X86_REG_EFLAGS,0x202)
 expected=case['expected'];target=expected['segment']*16+expected['entry']
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(0x10dc9,0xfffff,count=1000);assert done==[True]
 for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,(branch,key)
 if expected['phase']=='iret':assert cpu.reg_read(UC_X86_REG_EFLAGS)==expected['flags']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff00]=bytes(64);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original0DC9..0E46 signed record selection, wrap/reload/inhibit/mode, saved nine-register restore and genuine IRET restoring IP/CS/FLAGS or saved BIOS far-target boundary; explicit audio/record/cursor stops also checked. Whole memory except FEC0..FEFF; saved register/hardware frames FF00..FF17 compared. BIOS/audio/active-record/cursor bodies not stubbed or executed.'}))
