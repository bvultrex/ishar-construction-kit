"""Actual MAIN open, header reads and table layout; DOS is mocked.
Only the two identified read-only MAIN files and corresponding captures are accepted.
No emulated disk access, decompression or complete startup claim.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('main',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();data=a.main.read_bytes()
digest=hashlib.sha256(memory).hexdigest();file_digest=hashlib.sha256(data).hexdigest()
profiles={
 '5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1','27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b'),
 'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2','bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95')}
assert digest in profiles and file_digest==profiles[digest][1], 'Unsupported/mismatched capture and MAIN'
repo=Path(__file__).resolve().parent.parent
vectors=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-file-vectors.mjs'),str(a.main.resolve())],cwd=repo,text=True))
for case in vectors['cases']:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory)
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x2000),(UC_X86_REG_BX,0),(UC_X86_REG_CX,0),(UC_X86_REG_DX,0x100)]:cpu.reg_write(r,v)
 for at,value in [(0xbbe,0),(0xb90,case['offset']),(0xb92,case['segment']),(0xb94,0x1234),(0xb96,case['frontier'])]:cpu.mem_write(0x1c0b0+at,value.to_bytes(2,'little'))
 cpu.mem_write(0x1c0b0+0x289b,b'\0');cpu.mem_write(0x20100,b'MAIN.IO\0')
 cpu.mem_write(0x1e530,bytes([0xa5])*22)
 reads=[];opens=[];open_boundaries=[];done=[];position=[0]
 def interrupt(uc,n,_):
  assert n==0x21
  if uc.reg_read(UC_X86_REG_AH)==0x3d:
   request={name:uc.reg_read(r) for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]};request.update(operation='open',drive=None);opens.append(request)
   assert bytes(uc.mem_read(0x20100,8))==b'MAIN.IO\0';uc.reg_write(UC_X86_REG_AX,5);uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1);return
  assert uc.reg_read(UC_X86_REG_AH)==0x3f
  ds,dx,cx,bx=[uc.reg_read(r) for r in [UC_X86_REG_DS,UC_X86_REG_DX,UC_X86_REG_CX,UC_X86_REG_BX]]
  assert bx==5 and ds==0x1c0b
  reads.append((dx,cx));chunk=data[position[0]:position[0]+cx];position[0]+=len(chunk)
  uc.mem_write(ds*16+dx,chunk);uc.reg_write(UC_X86_REG_AX,len(chunk));uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
 def code(uc,address,size,_):
  if address==0x176c2:
   open_boundaries.append(address)
   for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]:assert uc.reg_read(r)==case['opened']['registers'][name]
   for at,value in case['opened']['words'].items():assert int.from_bytes(uc.mem_read(0x1c0b0+int(at),2),'little')==value
  if address==0x177bc:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code)
 cpu.emu_start(0x176bc,0xfffff,count=300)
 assert done==[0x177bc] and opens==case['opened']['events'] and open_boundaries==[0x176c2] and reads==[(0x2480,6),(0x2486,16)] and position[0]==22
 assert bytes(cpu.mem_read(0x1e530,22))==data[:22]
 for at,value in case['expected']['words'].items():assert int.from_bytes(cpu.mem_read(0x1c0b0+int(at),2),'little')==value,(case,at)
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
 assert cpu.reg_read(UC_X86_REG_AX)==case['expected']['bounds']['candidate']
 assert cpu.reg_read(UC_X86_REG_DS)==case['expected']['bounds']['floor']
assert a.capture.read_bytes()==memory and a.main.read_bytes()==data
print(json.dumps({'profile':profiles[digest][0],'captureSha256':digest,'mainSha256':file_digest,'cases':len(vectors['cases']),'decodedBytes':vectors['decodedBytes'],'result':'original open wrapper, two DOS reads, real 22-byte header and all18 layout words match','limits':'controlled successful DOS open/read responses; decompression and consumers excluded'}))
