"""Original context-control98..103, seed42 and actual RET59 dispatcher entries."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-context-seed-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
regs={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
for case in cases:
 spec=case['spec'];m=bytearray(original);m[0x46c:0x46e]=spec['bios'].to_bytes(2,'little');m[g+0xc96]=0x55;m[spec['es']*16+spec['bp']-36]=spec['flag']
 for offset,value in [(-28,0x4567),(-30,0xabcd)]:at=spec['es']*16+spec['bp']+offset;m[at:at+2]=value.to_bytes(2,'little')
 m[0x60100]=spec['opcode'];m[0x60101]=spec['tag']
 if spec['tag']==0:m[0x60102]=spec['value']&255
 else:m[0x60102:0x60104]=(spec['value']&65535).to_bytes(2,'little')
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 for key,value in case['input'].items():cpu.reg_write(regs[key],value)
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x126f7,0x126f7);cpu.emu_start(0x126eb,0xfffff,count=1000);assert done==[True]
 for key,value in case['expected']['registers'].items():assert cpu.reg_read(regs[key])==value,(spec,key)
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00;actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(80);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Native dispatch98..103 context flag/word controls including identical/offset-overlapping segment windows and C96 alias;42 numeric69AB preserving CX, BIOS0040:006C fallback or supplied C4E value;59 actual RET. Full1MiB except FEC0..FF0F, six ALIS registers/SP and input immutability. No invented clock/random progression or handler scratch/flags claim.'}))
