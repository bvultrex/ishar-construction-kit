"""Original1451 memory/slot/free-chain query with wrapped paragraph arithmetic."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-memory-query-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
for case in cases:
 m=bytearray(original)
 for at,value in case['words'].items():at=g+int(at);m[at:at+2]=value.to_bytes(2,'little')
 for n in range(case['length']):at=0x50100+38*(n+1)+4;value=0 if n+1==case['length'] else 38*(n+2);m[at:at+2]=value.to_bytes(2,'little')
 m[g+0xff00:g+0xff02]=bytes([0,0xe0]);cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 saved={UC_X86_REG_CX:0xabcd,UC_X86_REG_BX:0x1234,UC_X86_REG_ES:0x4000,UC_X86_REG_DI:0x5678,UC_X86_REG_AX:0x9876}
 for reg,value in {**saved,UC_X86_REG_CS:0x1000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_DX:case['selector'],UC_X86_REG_EFLAGS:2}.items():cpu.reg_write(reg,value)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x1e000,0x1e000);cpu.emu_start(0x11451,0xfffff,count=10000);assert done==[True]
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 assert cpu.reg_read(UC_X86_REG_DX)==case['dx'] and cpu.reg_read(UC_X86_REG_SP)==0xff02
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff02]=bytes(66);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original1451..1564 memory selectors0..4 and unknown selector fallback; wrapped paragraph arithmetic, decimal KB truncation, remaining counts and0/1/3/501-node free chains; whole memory except FEC0..FF01 CPU stack, preserved AX/BX/CX/DI/ES, DX/SP and immutable source. DOS disk selectors A..D/a..d remain explicit unsupported boundaries.'}))
