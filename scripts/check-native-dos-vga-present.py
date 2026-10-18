"""VGA0010/0148 word-copy rectangle, including overlapping forward copies."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-vga-present-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
for case in cases:
 m=bytearray(original);m[0x70000:0x80000]=bytes([90])*65536;m[0x60000:0x70000]=bytes((n*17+(n>>8))&255 for n in range(65536))
 for at,value in [(0xb88,case['offsets'][0]),(0xb8a,0x6000),(0xb84,case['offsets'][1]),(0xb86,case['destination']),(0x1dd5,case['pitch']),(0xc1a,2),(0xc1c,1),(0xc1e,case['width']+1),(0xc20,case['rows'])]:m[g+at:g+at+2]=value.to_bytes(2,'little')
 m[g+0xff00:g+0xff04]=bytes([0xd0,0x43,0,0x10]);cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[];writes=[0]
 saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x5678,UC_X86_REG_CX:0x9abc,UC_X86_REG_DX:0xdef0,UC_X86_REG_DI:0x1133,UC_X86_REG_SI:0x2244,UC_X86_REG_DS:0x4000,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x6677}
 for reg,value in {**saved,UC_X86_REG_CS:0x1e97,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_EFLAGS:0x202}.items():cpu.reg_write(reg,value)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 def write(uc,access,address,size,value,_):
  if case['destination']*16<=address<case['destination']*16+65536:writes[0]+=size
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x143d0,0x143d0);cpu.hook_add(UC_HOOK_MEM_WRITE,write);cpu.emu_start(0x1e980,0xfffff,count=10000);assert done==[True]
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 assert cpu.reg_read(UC_X86_REG_SP)==0xff04 and writes[0]==case['expected']['copiedBytes']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff04]=bytes(68);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original VGA0010/0148..01A6/0013 with DF0; odd/even widths (word-copy drops odd last column), row stride0/16/320, wrapped offsets, same/overlapping/disjoint buffers; whole memory except FEC0..FF03, nine preserved registers/SP and exact destination write counts. No palette/DAC/retrace/hardware display claim.'}))
