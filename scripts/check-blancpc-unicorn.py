"""Differential CPU test, no host I/O: unicorn==2.1.4, node with TS stripping.
Stops BEFORE iret/far-jump; never installs an interrupt or executes DOS APIs.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_CODE, UC_HOOK_INSN
from unicorn.x86_const import UC_X86_REG_CS, UC_X86_REG_SS, UC_X86_REG_SP, UC_X86_REG_AX, UC_X86_REG_BX, UC_X86_REG_EFLAGS, UC_X86_INS_OUT

parser=argparse.ArgumentParser()
parser.add_argument('source',type=Path)
parser.add_argument('--node',default='node')
args=parser.parse_args()
raw=args.source.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='fa35da163339385cc8fb95b5469bc5fb52e8d31a803f84854da5c89d7196c229'
code=raw[6+64:6+64+79]
repo=Path(__file__).resolve().parent.parent
vectors=json.loads(subprocess.check_output([args.node,str(repo/'scripts/blancpc-interrupt-vectors.mjs')],cwd=repo,text=True))
base=0x10000
for case in vectors:
    # Fresh CPU per case also isolates translated self-modifying code caches.
    cpu=Uc(UC_ARCH_X86,UC_MODE_16)
    cpu.mem_map(0,0x100000)
    cpu.mem_write(base,code)
    state=case['state']
    for off,key in [(2,'operandAX'),(12,'samplePointer'),(77,'counter')]:
        cpu.mem_write(base+off,state[key].to_bytes(2,'little'))
    cpu.mem_write(base+state['samplePointer'],bytes([case['sample']]))
    cpu.reg_write(UC_X86_REG_CS,0x1000)
    cpu.reg_write(UC_X86_REG_SS,0x3000)
    cpu.reg_write(UC_X86_REG_SP,0xfff0)
    cpu.reg_write(UC_X86_REG_AX,0x1234)
    cpu.reg_write(UC_X86_REG_BX,0x5678)
    cpu.reg_write(UC_X86_REG_EFLAGS,2)
    ports=[]; terminal=[]
    def out_hook(uc,port,size,value,_):
        assert size==1
        ports.append({'port':port,'value':value})
    def code_hook(uc,address,size,_):
        if address-base in [0x25,0x30,0x48]:
            terminal.append('far-jump' if address-base==0x48 else 'iret')
            uc.emu_stop()
    cpu.hook_add(UC_HOOK_INSN,out_hook,None,1,0,UC_X86_INS_OUT)
    cpu.hook_add(UC_HOOK_CODE,code_hook)
    cpu.emu_start(base,base+77,count=64)
    expected=case['expected']
    actual={key:int.from_bytes(cpu.mem_read(base+off,2),'little') for off,key in [(2,'operandAX'),(12,'samplePointer'),(77,'counter')]}
    assert actual==expected['state'],(case,actual)
    assert ports==expected['ports'],(case,ports)
    assert terminal==[expected['exit']],(case,terminal)
    if terminal==['iret']:
        assert cpu.reg_read(UC_X86_REG_SP)==0xfff0
        assert cpu.reg_read(UC_X86_REG_AX)==0x1234
        assert cpu.reg_read(UC_X86_REG_BX)==0x5678
    else:
        assert cpu.reg_read(UC_X86_REG_SP)==0xffec
assert args.source.read_bytes()==raw
print(json.dumps({'sourceSha256':hashlib.sha256(raw).hexdigest(),'cases':len(vectors),'result':'all CPU state projections, port traces, exit paths and stack checks match','limits':'stops before iret/far jump; no hardware timing, vector installation or audible output'}))
