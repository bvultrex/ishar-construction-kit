"""Execute original 79E9 A1 decoder: MAIN/repack or all installation A1 modules.
DOS reads are simulated from an in-memory stream; no emulated filesystem access.
Directory mode reports differences and exits 1 if any output mismatches.
Requires unicorn==2.1.4 and the identified first-interrupt capture.
"""
import argparse,base64,hashlib,json,subprocess,sys
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('main',type=Path);p.add_argument('--all',action='store_true',help='Read all A1 IO modules from directory, original streams only');p.add_argument('--only',help='With --all, comma-separated exact module names');p.add_argument('--zero-read-tail',action='store_true',help='Diagnostic host policy: clear unread bytes, NOT original DOS behavior');a=p.parse_args()
assert not a.only or a.all
main_path=a.main/'MAIN.IO' if a.all else a.main
memory=a.capture.read_bytes();original=main_path.read_bytes();digest=hashlib.sha256(memory).hexdigest()
profiles={
 '5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1','27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b'),
 'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2','bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95')}
assert digest in profiles and hashlib.sha256(original).hexdigest()==profiles[digest][1]
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-decode-vectors.mjs'),str(a.main.resolve())]+(['--all'] if a.all else []),cwd=repo,text=True))
if a.only:
 names=set(a.only.split(','));cases=[case for case in cases if case['name'] in names];assert len(cases)==len(names),'Requested A1 module not found'
results=[]
for case in cases:
 for offset in ([7] if a.all else [0,7]):
  data=base64.b64decode(case['stream']);envelope=case.get('envelopeBytes',22)
  assert 0<case['size'] and case['size']+offset+257<0x50000, 'Output must fit isolated test arena'
  if a.all:assert hashlib.sha256((a.main/case['name']).read_bytes()).hexdigest()==case['sourceSha256']
  else:assert data[:22]==original[:22]
  cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory)
  registers=[(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x1234),(UC_X86_REG_AX,case['size']>>16),(UC_X86_REG_BX,0x2345),(UC_X86_REG_CX,case['size']&65535),(UC_X86_REG_DX,offset),(UC_X86_REG_SI,0x3456),(UC_X86_REG_DI,0x4567),(UC_X86_REG_BP,0x5678)]
  for r,v in registers:cpu.reg_write(r,v)
  cpu.mem_write(0x2bfb0,(0xff00).to_bytes(2,'little'))
  cpu.mem_write(0x1cc07,bytes([data[3]&0xfe])) # SS:B57, caller removes flag bit0
  cpu.mem_write(0x1cc0a,b'\0\0\0\x90') # SS:B5A/B5C, 8000-byte input buffer, separate from largest output
  cpu.mem_write(0x1cc6e,b'\5\0') # SS:BBE, simulated open handle
  cpu.mem_write(0x40000+offset-1,b'\xa5'*(case['size']+257))
  position=[envelope];reads=[];done=[];write_bounds=[0x100000,0]
  def interrupt(uc,n,_):
   assert n==0x21 and uc.reg_read(UC_X86_REG_AX)>>8==0x3f and uc.reg_read(UC_X86_REG_BX)==5
   count=uc.reg_read(UC_X86_REG_CX);target=uc.reg_read(UC_X86_REG_DS)*16+uc.reg_read(UC_X86_REG_DX)
   assert count==8000 and target==0x90000
   chunk=data[position[0]:position[0]+count];assert chunk,'Unexpected read beyond stream'
   position[0]+=len(chunk);reads.append(len(chunk))
   if a.zero_read_tail:uc.mem_write(target,bytes(count))
   uc.mem_write(target,chunk)
   uc.reg_write(UC_X86_REG_AX,len(chunk));uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
  def code(uc,address,size,_):
   if address==0x1ff00:done.append(address);uc.emu_stop()
  def write(uc,access,address,size,value,_):
   if 0x3ffff<=address<0x90000:write_bounds[0]=min(write_bounds[0],address);write_bounds[1]=max(write_bounds[1],address+size)
  cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_MEM_WRITE,write)
  cpu.emu_start(0x179e9,0xfffff,count=10000000)
  assert done==[0x1ff00] and cpu.reg_read(UC_X86_REG_SP)==0xff02
  decoded=bytes(cpu.mem_read(0x40000+offset,case['size']))
  actual_hash=hashlib.sha256(decoded).hexdigest();matches=actual_hash==case['expectedSha256']
  differences=[]
  if not matches:
   assert a.all, (case['name'],offset,actual_hash)
   expected_image=base64.b64decode(case['expectedImage'])
   differences=[i for i,v in enumerate(decoded) if v!=expected_image[i]]
  assert write_bounds[0]==0x40000+offset
  extra=write_bounds[1]-(0x40000+offset+case['size'])
  assert 0<=extra<=255
  assert bytes(cpu.mem_read(0x40000+offset-1,1))==b'\xa5' and bytes(cpu.mem_read(0x40000+offset+case['size']+extra,1))==b'\xa5'
  for r,v in registers:
   if r not in [UC_X86_REG_SP,UC_X86_REG_CX]:assert cpu.reg_read(r)==v,(case['name'],r)
  results.append({'variant':case['name'],'offset':offset,'decodedBytes':case['size'],'writesPastDeclaredSize':extra,'reads':reads,'matches':matches,'nativeSha256':actual_hash,'decodedSha256':case['expectedSha256'],'differenceCount':len(differences),'firstDifference':differences[0] if differences else None,'lastDifference':differences[-1] if differences else None,'sourceSha256':case.get('sourceSha256')})
  if a.all:assert (a.main/case['name']).read_bytes()==data
  if a.all and len(results)%10==0:print(f"{profiles[digest][0]}: compared {len(results)}/{len(cases)} modules",file=sys.stderr,flush=True)
assert a.capture.read_bytes()==memory and main_path.read_bytes()==original
failures=sum(not row['matches'] for row in results)
print(json.dumps({'profile':profiles[digest][0],'captureSha256':digest,'inputTailPolicy':'diagnostic-zero-fill' if a.zero_read_tail else 'native-short-read-preserves-tail','cases':results,'matchingCases':len(results)-failures,'mismatchingCases':failures,'result':'all compared outputs match' if not failures else 'native/toolkit output differences require investigation','limits':'controlled memory and DOS replies; no complete startup, semantic gameplay edit or corrupt-stream proof; observed excess bound is not a general bound'}))
sys.exit(1 if failures else 0)
