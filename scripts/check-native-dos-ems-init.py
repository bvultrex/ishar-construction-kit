"""Native EMS discovery/allocation/mapping with bounded mocked DOS/EMS replies."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-ems-init-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);calls=[];done=[]
def interrupt(uc,number,_):
 ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8;calls.append({'interrupt':number,'ax':ax,'ah':ah,'bx':uc.reg_read(UC_X86_REG_BX),'dx':uc.reg_read(UC_X86_REG_DX)})
 if number==0x21:
  assert ax==0x3567;uc.reg_write(UC_X86_REG_ES,0x4000);uc.reg_write(UC_X86_REG_BX,0x1234);return
 assert number==0x67
 if ah==0x41:status=case['query'];uc.reg_write(UC_X86_REG_BX,case['frame'])
 elif ah==0x43:status=case['allocate'];uc.reg_write(UC_X86_REG_DX,case['handle'])
 elif ah==0x44:status=case['maps'][ax&255]
 else:assert ah==0x45;status=255  # cleanup reply is deliberately unsuccessful and ignored
 uc.reg_write(UC_X86_REG_AX,(status<<8)|(ax&255))
def code(uc,address,size,_):
 if address==0x10100:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code)
saved=[(UC_X86_REG_BX,0x3333),(UC_X86_REG_CX,0x4444),(UC_X86_REG_DX,0x5555),(UC_X86_REG_DI,0x6666),(UC_X86_REG_SI,0x7777),(UC_X86_REG_DS,0x5000),(UC_X86_REG_ES,0x6000),(UC_X86_REG_BP,0x8888)]
for case in cases:
 calls.clear();done.clear();signature=memory[0x10b10:0x10b18];cpu.mem_write(0x4000a,signature if case['signature'] else bytes([signature[0]^255])+signature[1:])
 for at,value in [(0x10b1a,0x1111),(0x10b18,0x2222),(0x10b1c,0xffff),(0x3fefe,0x100)]:cpu.mem_write(at,value.to_bytes(2,'little'))
 for r,v in saved+[(UC_X86_REG_AX,0xabcd),(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfefe),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.emu_start(0x10b1e,0xfffff,count=180)
 expected=case['expected'];assert done==[0x10100] and len(calls)==len(expected['calls'])
 for actual,wanted in zip(calls,expected['calls']):
  for key,value in wanted.items():assert actual[key]==value,(case,actual,wanted)
 for at,key in [(0x10b1a,'savedFrame'),(0x10b18,'savedHandle'),(0x10b1c,'active')]:assert int.from_bytes(cpu.mem_read(at,2),'little')==expected[key]
 assert cpu.reg_read(UC_X86_REG_AX)==expected['ax'] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for r,v in saved:assert cpu.reg_read(r)==v
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'DOS vector query, signature gate, EMS allocation/maps/cleanup and preserved registers match','limits':'mocked DOS/EMS replies, no actual expanded-memory manager or page contents'}))
