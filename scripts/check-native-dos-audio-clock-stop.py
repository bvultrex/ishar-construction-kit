"""Native audio clock stop, including actual IVT/PIT/PIC instructions in emulation."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-audio-clock-stop-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];ports=[];reads=[]
def code(uc,address,size,_):
 if address==0x19510:done.append(address);uc.emu_stop()
def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
def inp(uc,port,size,_):assert port==0x21 and size==1;reads.append(port);return case['port21']
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
for case in cases:
 done.clear();ports.clear();reads.clear();cpu.mem_write(0x20,b'\x23\x01\x67\x45')
 for at,value,size in [(0x19415,case['deviceByte'],1),(0x199ab,case['segment'],2),(0x199ad,case['offset'],2),(0x1e93c,case['divisor'],2),(0x3fefe,0x100,2)]:cpu.mem_write(at,value.to_bytes(size,'little'))
 for r,v in [(UC_X86_REG_CS,0x1941),(UC_X86_REG_DS,0x5000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2|(512 if case['interruptsEnabled'] else 0))]:cpu.reg_write(r,v)
 cpu.emu_start(0x19972,0xfffff,count=64)
 expected=case['expected'];assert done==[0x19510] and ports==expected['ports']
 vector=expected['vector'];wanted=vector['offset'].to_bytes(2,'little')+vector['segment'].to_bytes(2,'little') if vector else b'\x23\x01\x67\x45'
 assert bytes(cpu.mem_read(0x20,4))==wanted and len(reads)==(0 if case['deviceByte'] else 1)
 assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&512)==expected['interruptsEnabled']
 assert cpu.reg_read(UC_X86_REG_DS)==0x5000 and cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'audio clock stop vector restoration, PIT/PIC ports, IF and DS match','limits':'controlled port input; device dispatch and complete outer stop not included'}))
