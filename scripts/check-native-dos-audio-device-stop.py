"""Real 019D zero-device path through timer reset and captured dispatch targets."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-audio-device-stop-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];ports=[];reads=[]
def code(uc,address,size,_):
 if address==0x70100:done.append(address);uc.emu_stop()
def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
def inp(uc,port,size,_):
 assert size==1 and port in [0x21,0x61];reads.append(port);return case['port21'] if port==0x21 else case['port61']
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
saved=[(UC_X86_REG_AX,0x1111),(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0x7777)]
for case in cases:
 done.clear();ports.clear();reads.clear()
 for at,value,size in [(0x19410,case['index'],2),(0x19414,1,1),(0x19415,0,1),(0x199ab,0x4567,2),(0x199ad,0x3456,2),(0x1e93c,case['divisor'],2)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 cpu.mem_write(0x3fefc,b'\0\1\0\x70');cpu.mem_write(0x20,b'\xaa'*4)
 for r,v in saved+[(UC_X86_REG_CS,0x1941),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefc),(UC_X86_REG_EFLAGS,2|(512 if case['interruptsEnabled'] else 0))]:cpu.reg_write(r,v)
 cpu.emu_start(0x195ad,0xfffff,count=160)
 expected=case['expected'];assert done==[0x70100] and ports==expected['ports']
 assert reads==([0x21,0x61] if case['index']==1 else [0x21])
 assert bytes(cpu.mem_read(0x20,4))==b'\x56\x34\x67\x45' and cpu.mem_read(0x19414,1)==b'\1'
 assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&512)==expected['interruptsEnabled'] and bool(cpu.reg_read(UC_X86_REG_EFLAGS)&1)==expected['carry']
 for r,v in saved:assert cpu.reg_read(r)==v
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'captured zero-device stop branches, clock restore, ports, carry and registers match','limits':'table indices 0..7 in identified captures; later target patching and hardware timing unproven'}))
