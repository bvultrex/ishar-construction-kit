"""Execute native speaker record calls through RETF; no host ports."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-speaker-record-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);ports=[];reads=[];done=[];state=[0]
def out(uc,port,size,value,_):
 assert size==1;ports.append({'port':port,'value':value})
 if port==0x61:state[0]=value
def inp(uc,port,size,_):
 assert size==1
 if port==0x61:return state[0]
 assert port==0x41
 value=case['inputs'][len(reads)];reads.append(value);return value
def code(uc,address,size,_):
 if address==0x70100:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INSN,out,None,1,0,UC_X86_INS_OUT);cpu.hook_add(UC_HOOK_INSN,inp,None,1,0,UC_X86_INS_IN)
for case in cases:
 ports.clear();reads.clear();done.clear();state[0]=case['initialPort61']
 for at,data in [(0x1dead,bytes(case['record'])),(0x1e940,bytes([case['mode']])),(0x1ceba,b'\0'),(0x1cd87,b'\1'),(0x18c1a,case['cached'].to_bytes(2,'little')),(0x3fefc,b'\0\1\0\x70')]:cpu.mem_write(at,data)
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x5000),(UC_X86_REG_DI,0x1dfd),(UC_X86_REG_BX,1),(UC_X86_REG_AX,0x1234),(UC_X86_REG_CX,0x5678),(UC_X86_REG_DX,0x9abc),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefc)]:cpu.reg_write(r,v)
 cpu.emu_start(0x18bbd,0xfffff,count=256)
 assert done==[0x70100] and ports==case['ports'] and len(reads)==case['reads'],case
 assert state[0]==case['port61'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for r,v in [(UC_X86_REG_DS,0x5000),(UC_X86_REG_AX,0x1234),(UC_X86_REG_CX,0x5678),(UC_X86_REG_DX,0x9abc)]:assert cpu.reg_read(r)==v
 assert bytes(cpu.mem_read(0x1dead,16))==bytes(case['record'])
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'native modes 1/4 speaker ports, reads, record and register restoration match','limits':'controlled port inputs, no acoustic or wall-clock validation; other modes excluded'}))
