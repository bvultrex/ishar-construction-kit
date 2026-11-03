"""Native differential DAC upload and controlled retrace reads; no host ports."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-palette-upload-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[];ports=[];reads=[]
def code(uc,address,size,_):
 if address==0x1ea70:done.append(address);uc.emu_stop()
def out(uc,port,size,value,_):assert size==1;ports.append({'port':port,'value':value})
def inp(uc,port,size,_):
 assert port==0x3da and size==1
 value=0 if len(reads)<case['delay'] else 8;reads.append(value);return value
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
saved=[(UC_X86_REG_BX,0x2222),(UC_X86_REG_CX,0x3333),(UC_X86_REG_DX,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_SI,0x6666),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000)]
for case in cases:
 done.clear();ports.clear();reads.clear();cpu.mem_write(0x1cef3,bytes(case['current']));cpu.mem_write(0x1d1f3,bytes(case['shadow']));cpu.mem_write(0x1cd19,bytes([case['mode']]));cpu.mem_write(0x2bfae,b'\0\1')
 for r,v in saved+[(UC_X86_REG_CS,0x1e97),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2|(512 if case['interruptsEnabled'] else 0))]:cpu.reg_write(r,v)
 cpu.emu_start(0x1f54b,0xfffff,count=12000)
 expected=case['expected'];assert done==[0x1ea70] and ports==expected['ports']
 assert bytes(cpu.mem_read(0x1d1f3,768))==bytes(expected['shadow']) and bytes(cpu.mem_read(0x1cef3,768))==bytes(case['current'])
 assert len(reads)==(case['delay']+1 if case['mode']==1 else 0)
 assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&512)==expected['interruptsEnabled']
 for r,v in saved:assert cpu.reg_read(r)==v
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'DAC port order, shadow writes, retrace polling, IF and saved registers match','limits':'DF=0, controlled retrace, no real display timing; outer fade countdown excluded'}))
