"""Native timer epilogue, including real IRET or transfer to saved handler.
Controlled interrupt frame; saved handler itself is outside this test.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args()
memory=a.capture.read_bytes();digest=hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-timer-return-vectors.mjs')],cwd=repo,text=True))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory);done=[]
def code(uc,address,size,_):
 if address in [0x70100,0x70200]:done.append(address);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,code)
saved=[(UC_X86_REG_BP,0x1111),(UC_X86_REG_ES,0x2222),(UC_X86_REG_DS,0x3333),(UC_X86_REG_SI,0x4444),(UC_X86_REG_DI,0x5555),(UC_X86_REG_DX,0x6666),(UC_X86_REG_CX,0x7777),(UC_X86_REG_BX,0x8888),(UC_X86_REG_AX,0x9999)]
stack=b''.join(v.to_bytes(2,'little') for _,v in saved)+b'\0\1\0\x70\x02\x06'
cpu.mem_write(0x10bf2,b'\0\2\0\x70')
for case in cases:
 done.clear()
 for at,value in [(0xc97,case['counter']),(0xc98,case['reload']),(0xcd8,case['inhibit']),(0xcc5,case['mode'])]:cpu.mem_write(0x1c0b0+at,bytes([value]))
 cpu.mem_write(0x3fee8,stack)
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_DS,0x1c0b),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xfee8),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
 cpu.emu_start(0x10e15,0xfffff,count=64)
 chain=case['expected']['exit']=='saved-handler'
 assert done==[0x70200 if chain else 0x70100],case
 assert cpu.mem_read(0x1cd47,1)[0]==case['expected']['counter'],case
 for r,v in saved:assert cpu.reg_read(r)==v
 assert cpu.reg_read(UC_X86_REG_SP)==(0xfefa if chain else 0xff00)
 if chain:assert bytes(cpu.mem_read(0x3fefa,6))==stack[-6:]
 else:assert cpu.reg_read(UC_X86_REG_EFLAGS)&0x600==0x600
assert a.capture.read_bytes()==memory
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'countdown, reload, return/chain decision, nine registers and IRQ frame match','limits':'entry begins after 670D; saved handler not executed'}))
