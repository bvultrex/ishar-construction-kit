"""Original43FB visibility/clip selection through first far call or explicit boundary."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-pixel-batch-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x50000]=bytes(65536)
 if case['es']==0x5000:m[0x50000:0x60000]=bytes(65536)
 def word(s,o,value):
  at=s*16+(o&65535);m[at:at+2]=value.to_bytes(2,'little')
 m[0x60000:0x61000]=bytes(0x1000);m[0x70000:0x80000]=bytes(0x10000);sc=case['scenario']
 for at,value in [(0xb32,0x300),(0xb34,case['es']),(0xc16,0x100),(0xbf6,0x200),(0x1dfb,0x8000)]:word(0x1c0b,at,value)
 for at,value in zip([0xc2c,0xc2e,0xc30,0xc32],sc['rect']):word(0x1c0b,at,value)
 for at,value in [(0xc18,case['aggregate']),(0xcb0,sc.get('special',0)),(0x2896,case['mode'][0]),(0x2898,case['mode'][1]),(0xcb1,case['mode'][2])]:m[g+at]=value
 m[case['es']*16+0x300]=sc.get('hidden',0);m[case['es']*16+0x301]=sc['flags'];word(case['es'],0x302,0x200)
 for at,value in [(0x20c,0),(0x20e,0),(0x216,319),(0x218,199),(0x206,0x1000),(0x1008,0x100),(0x100a,0x6000),(0x100c,sc['rect'][0]),(0x100e,sc['rect'][1]),(0x1010,sc.get('depth',0))]:word(0x7000,at,value)
 m[0x71000]=sc['status'];m[0x71022]=sc.get('mirror',0);word(0x6000,0x100,0x100);m[0x60200]=1;word(0x6000,0x202,20);word(0x6000,0x204,10)
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x7000),(UC_X86_REG_ES,case['es']),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x200),(UC_X86_REG_DX,0x1234),(UC_X86_REG_CX,0x200),(UC_X86_REG_BX,0x200),(UC_X86_REG_DI,0x1000),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x10000+case['entry']:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x10000+case['callerEntry'],0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00+case['stackDelta']
 for key,value in case['registers'].items():assert cpu.reg_read(names[key])==value,(case,key)
 assert cpu.reg_read(UC_X86_REG_BX)==case['bx'] and cpu.reg_read(UC_X86_REG_DI)==case['di']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50)
 assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'six script registers/SP and full physical memory except CPU stack saves; no drawing or device calls'}))
