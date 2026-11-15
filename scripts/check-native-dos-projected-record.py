"""Original40DC/4115 through bounds4197 and stable signed insertion4278."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-projected-record-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x60000:0x61000]=bytes(0x1000);m[0x70000:0x80000]=bytes(0x10000);ds=case['ds'];sc=case['scenario']
 def word(s,o,value):
  at=s*16+(o&65535);m[at:at+2]=value.to_bytes(2,'little')
 def byte(s,o,value):m[s*16+o]=value
 for at,value in [(0xc5e,0x100),(0xc60,0x6000),(0xc62,sc['x']),(0xc64,10),(0xc66,sc['depth']),(0xc2c,65436 if case['bounded'] else 32767),(0xc2e,65516 if case['bounded'] else 32767),(0xc30,200 if case['bounded'] else 32768),(0xc32,100 if case['bounded'] else 32768),(0xbec,0x2000),(0xff00,0xe000)]:word(0x1c0b,at,value)
 byte(0x1c0b,0xc68,1);word(0x6000,0x100,0x100);byte(0x6000,0x200,1);word(0x6000,0x202,4);word(0x6000,0x204,6)
 byte(ds,0x1000,case['status']);byte(ds,0x1001,sc['group']);byte(ds,0x1020,sc['priority'])
 for at,value in [(0x1008,0x100),(0x100a,0x6000),(0x100c,sc['x']),(0x100e,10),(0x1010,sc['depth'])]:word(ds,at,value)
 nodes=[0x1200+i*0x200 for i in range(len(sc['nodes']))];chain=[nodes[0],0x1000]+nodes[1:] if case['middle'] and nodes else [0x1000]+nodes;word(ds,0x306,chain[0])
 for i,item in enumerate(chain):word(ds,item+6,chain[i+1] if i+1<len(chain) else 0)
 for at,values in zip(nodes,sc['nodes']):
  flag,depth,priority,group=values;byte(ds,at,flag);byte(ds,at+1,group);byte(ds,at+32,priority);word(ds,at+16,depth)
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for name,r in names.items():cpu.reg_write(r,case['registers'][name])
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_BX,case['previous']),(UC_X86_REG_DI,0x1000),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x1e000:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x140dc if case['operation']=='commit' else 0x14115,0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff02
 for name,r in names.items():assert cpu.reg_read(r)==case['registers'][name],(case,name)
 assert cpu.reg_read(UC_X86_REG_BX)==case['bx'] and cpu.reg_read(UC_X86_REG_DI)==case['di']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Six script registers, BX/DI, SP and full memory except CPU stack saves; no pixels'}))
