"""Bounded, isolated MZ startup capture. unicorn==2.1.4; no DOS services/host I/O.
Known local revisions only; stops at the first interrupt or OUT instruction.
Memory dumps are original-derived and must stay outside published artifacts.
"""
import argparse,hashlib,json,struct
from pathlib import Path
from unicorn import Uc,UcError,UC_ARCH_X86,UC_MODE_16,UC_HOOK_INTR,UC_HOOK_INSN
from unicorn.x86_const import *
parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('output',type=Path);args=parser.parse_args()
source=args.source.resolve(strict=True);output=args.output.resolve()
if output==source.parent or source.parent in output.parents:raise ValueError('Output must be outside original installation')
if output.exists():raise ValueError('Output must be a new directory')
raw=source.read_bytes();digest=hashlib.sha256(raw).hexdigest()
profiles={'3ea63234c97b77d88e3c18aa5d88ac10dede1f10daf2854225b88b7d948d588b':'ishar1','5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9':'ishar2'}
if digest not in profiles:raise ValueError('Unsupported executable revision')
h=struct.unpack_from('<14H',raw);assert h[0]==0x5a4d
declared=(h[2]-1)*512+(h[1] or 512);assert declared==len(raw)
header=h[4]*16;assert header>=28 and h[12]+h[3]*4<=header
load=0x1000;base=load*16;psp=load-16
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(base,raw[header:])
# Deliberately minimal controlled PSP: only end-of-allocation paragraph supplied.
cpu.mem_write(psp*16+2,(0x9000).to_bytes(2,'little'))
relocations=[]
for n in range(h[3]):
 off,seg=struct.unpack_from('<HH',raw,h[12]+n*4);at=seg*16+off
 assert at+2<=len(raw)-header
 value=int.from_bytes(cpu.mem_read(base+at,2),'little');cpu.mem_write(base+at,((value+load)&65535).to_bytes(2,'little'));relocations.append(at)
for register,value in [(UC_X86_REG_CS,load+h[11]),(UC_X86_REG_IP,h[10]),(UC_X86_REG_SS,load+h[7]),(UC_X86_REG_SP,h[8]),(UC_X86_REG_DS,psp),(UC_X86_REG_ES,psp),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(register,value)
events=[]
def interrupt(uc,number,_):
 events.append({'kind':'interrupt','number':number});uc.emu_stop()
def output_port(uc,port,size,value,_):
 events.append({'kind':'out','port':port,'size':size,'value':value});uc.emu_stop()
cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_INSN,output_port,None,1,0,UC_X86_INS_OUT)
cpu.emu_start((load+h[11])*16+h[10],0xfffff,timeout=5000000,count=2000000)
if not events:raise RuntimeError('Startup observation budget reached; no completion claimed')
registers={name:cpu.reg_read(reg) for name,reg in [('cs',UC_X86_REG_CS),('ip',UC_X86_REG_IP),('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS),('es',UC_X86_REG_ES),('ss',UC_X86_REG_SS),('sp',UC_X86_REG_SP)]}
memory=bytes(cpu.mem_read(0,0x100000));report={'profile':profiles[digest],'sourceSha256':digest,'sourceBytes':len(raw),'headerBytes':header,'loadSegment':load,'pspSegment':psp,'initialEntry':{'csRelative':h[11],'ip':h[10]},'relocations':relocations,'stop':events[0],'registers':registers,'memorySha256':hashlib.sha256(memory).hexdigest(),'limits':'minimal synthetic PSP; no DOS service emulation; not a runnable unpacked EXE or full game execution'}
output.mkdir(parents=True,exist_ok=False)
with (output/'memory.bin').open('xb') as f:f.write(memory)
with (output/'report.json').open('x',encoding='utf-8') as f:json.dump(report,f,indent=2)
assert source.read_bytes()==raw
print(json.dumps(report))
