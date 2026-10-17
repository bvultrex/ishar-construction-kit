"""Execute original 79E9 A1 decoder, actual MAIN and toolkit-repacked variant.
DOS reads are simulated from an in-memory stream; no emulated filesystem access.
Requires unicorn==2.1.4 and the identified first-interrupt capture.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('main',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();original=a.main.read_bytes();digest=hashlib.sha256(memory).hexdigest()
profiles={
 '5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1','27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b'),
 'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2','bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95')}
assert digest in profiles and hashlib.sha256(original).hexdigest()==profiles[digest][1]
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-decode-vectors.mjs'),str(a.main.resolve())],cwd=repo,text=True))
results=[]
for case in cases:
 for offset in [0,7]:
  data=base64.b64decode(case['stream']);assert data[:22]==original[:22]
  cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory)
  registers=[(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x1234),(UC_X86_REG_AX,0),(UC_X86_REG_BX,0x2345),(UC_X86_REG_CX,case['size']),(UC_X86_REG_DX,offset),(UC_X86_REG_SI,0x3456),(UC_X86_REG_DI,0x4567),(UC_X86_REG_BP,0x5678)]
  for r,v in registers:cpu.reg_write(r,v)
  cpu.mem_write(0x2bfb0,(0xff00).to_bytes(2,'little'))
  cpu.mem_write(0x1cc07,bytes([data[3]&0xfe])) # SS:B57, caller removes flag bit0
  cpu.mem_write(0x1cc0a,b'\0\0\0\x60') # SS:B5A/B5C, 8000-byte input buffer
  cpu.mem_write(0x1cc6e,b'\5\0') # SS:BBE, simulated open handle
  cpu.mem_write(0x40000+offset-1,b'\xa5'*(case['size']+257))
  position=[22];reads=[];done=[];output_writes=[]
  def interrupt(uc,n,_):
   assert n==0x21 and uc.reg_read(UC_X86_REG_AX)>>8==0x3f and uc.reg_read(UC_X86_REG_BX)==5
   count=uc.reg_read(UC_X86_REG_CX);target=uc.reg_read(UC_X86_REG_DS)*16+uc.reg_read(UC_X86_REG_DX)
   assert count==8000 and target==0x60000
   chunk=data[position[0]:position[0]+count];assert chunk,'Unexpected read beyond stream'
   position[0]+=len(chunk);reads.append(len(chunk));uc.mem_write(target,chunk)
   uc.reg_write(UC_X86_REG_AX,len(chunk));uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
  def code(uc,address,size,_):
   if address==0x1ff00:done.append(address);uc.emu_stop()
  def write(uc,access,address,size,value,_):
   if 0x3ffff<=address<0x50000:output_writes.append((address,size))
  cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_MEM_WRITE,write)
  cpu.emu_start(0x179e9,0xfffff,count=2000000)
  assert done==[0x1ff00] and cpu.reg_read(UC_X86_REG_SP)==0xff02
  decoded=bytes(cpu.mem_read(0x40000+offset,case['size']))
  assert hashlib.sha256(decoded).hexdigest()==case['expectedSha256'],(case['name'],offset)
  assert min(at for at,size in output_writes)==0x40000+offset
  extra=max(at+size for at,size in output_writes)-(0x40000+offset+case['size'])
  assert 0<=extra<=255
  assert bytes(cpu.mem_read(0x40000+offset-1,1))==b'\xa5' and bytes(cpu.mem_read(0x40000+offset+case['size']+extra,1))==b'\xa5'
  for r,v in registers:
   if r not in [UC_X86_REG_SP,UC_X86_REG_CX]:assert cpu.reg_read(r)==v,(case['name'],r)
  results.append({'variant':case['name'],'offset':offset,'decodedBytes':case['size'],'writesPastDeclaredSize':extra,'reads':reads,'decodedSha256':case['expectedSha256']})
assert a.capture.read_bytes()==memory and a.main.read_bytes()==original
print(json.dumps({'profile':profiles[digest][0],'cases':results,'result':'declared native A1 output equals toolkit decoder, including edited/repacked stream; native excess writes measured separately','limits':'controlled memory and DOS replies; no complete startup, semantic gameplay edit or corrupt-stream proof; observed excess bound is not a general bound'}))
