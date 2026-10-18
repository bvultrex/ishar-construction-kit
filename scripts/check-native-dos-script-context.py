"""Native script context construction, full destination segment comparison."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--modules',type=Path,help='Use actual IO image headers from identified installation');a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
if a.modules:
 main_hash=hashlib.sha256((a.modules/'MAIN.IO').read_bytes()).hexdigest()
 expected_main='27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b' if digest.startswith('5ce2') else 'bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95'
 assert main_hash==expected_main,'Mismatched installation and capture'
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-context-vectors.mjs')]+([str(a.modules.resolve())] if a.modules else []),cwd=repo,text=True));errors=0;results=[]
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DX,0x100),(UC_X86_REG_SI,0x1234)]:cpu.reg_write(r,v)
 cpu.mem_write(0x40100,bytes(case['header']));cpu.mem_write(0x50000,bytes([0xa5])*65536)
 for at,v in [(0xbd2,0x100),(0xbd8,case['pool']),(0xb06,6),(0xbd6,0x5000),(0xbe2,case['limit'])]:cpu.mem_write(0x1c0b0+at,v.to_bytes(2,'little'))
 def code(uc,address,size,_):
  if address in [0x18370,0x18468]:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x18268,0xfffff,count=150000)
 expected=case['expected'];error=expected['error'];errors+=error is not None
 if a.modules:
  assert hashlib.sha256((a.modules/case['name']).read_bytes()).hexdigest()==case['sourceSha256']
  assert expected['entry']==(0x100+case['parserEntry'])&65535
 assert done==[0x18468 if error else 0x18370]
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==expected['memorySha256'],case
 for at,v in expected['globals'].items():assert int.from_bytes(cpu.mem_read(0x1c0b0+int(at),2),'little')==v
 assert cpu.reg_read(UC_X86_REG_SP)==(0xfefe if error else 0xff00)
 assert cpu.reg_read(UC_X86_REG_DX)==expected['entry'] and cpu.reg_read(UC_X86_REG_DS)==0x4000 and cpu.reg_read(UC_X86_REG_ES)==0x5000
 if error:assert cpu.reg_read(UC_X86_REG_AX)==12
 else:assert cpu.reg_read(UC_X86_REG_BX)==expected['context'] and cpu.reg_read(UC_X86_REG_SI)==0x1234
 if a.modules:results.append({'name':case['name'],'sourceSha256':case['sourceSha256'],'context':expected['context'],'entry':expected['entry'],'error':error,'destinationSha256':expected['memorySha256']})
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'error12':errors,'moduleResults':results,'result':'entire 64KiB destination, globals and entry pointer match','limits':'controlled disjoint segments and pool state; no proof every module is activated during gameplay; no execution of initialized script or global error handler'}))
