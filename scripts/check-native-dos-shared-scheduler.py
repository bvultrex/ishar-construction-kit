"""Shared scheduler with real aliases of flags and snapshot globals."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-shared-scheduler-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
regs={'bp':UC_X86_REG_BP,'si':UC_X86_REG_SI,'bx':UC_X86_REG_BX,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES}
for case in cases:
 m=bytearray(original);c=case['es']*16;bp=case['bp']
 def word(at,value):m[at:at+2]=value.to_bytes(2,'little')
 word(c+0x100,bp)
 for at,value in [(-20,0x100),(-18,0x5000),(-8,0x1234),(-6,0x5000)]:word(c+bp+at,value)
 m[c+bp-36]=case['flag'];m[c+bp-4]=case['active'];m[c+bp-1]=case['delay'];word(0x5010a,case['scan'])
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));cpu.reg_write(UC_X86_REG_CS,0x1000);cpu.reg_write(UC_X86_REG_SS,0x1c0b);cpu.reg_write(UC_X86_REG_SP,0xff00);cpu.reg_write(UC_X86_REG_EFLAGS,2)
 for key,value in {**case['input'],'es':case['es']}.items():cpu.reg_write(regs[key],value)
 done=[];expected=case['expected']
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 target=0x10000+expected['entry'];cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(0x1264c if case['reload'] else 0x1264f,0xfffff,count=1000);assert done==[True]
 for key,reg in regs.items():assert cpu.reg_read(reg)==expected[key],(key,case)
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00+expected['stackDelta'];actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff00]=bytes(64);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original264C/264F..26AF and3C76; identical/offset-overlapping/disjoint segment windows, flags aliasing C19 clear and snapshot aliases; all scheduler registers/SP, full1MiB except FEC0..FEFF and immutable source. Scan/main/skip boundaries; no callback body execution.'}))
