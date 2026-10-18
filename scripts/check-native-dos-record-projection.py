"""Native36E1 projection and3955 transform, no graphics or arithmetic stubs."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-record-projection-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x50000:0x61000]=bytes(0x11000);m[0x70000:0x80000]=bytes(0x10000);ds=case['ds'];es=case['es']
 def word(s,o,value):
  at=s*16+(o&65535);m[at:at+2]=value.to_bytes(2,'little')
 def byte(s,o,value):m[s*16+o]=value
 for at,value in [(0xbf6,0x200),(0xb18,222),(0xb20,123),(0xff00,0xe000)]:word(0x1c0b,at,value)
 byte(es,0x301,128 if case['transform'] else 0);byte(es,0x31c,1);byte(es,0x31d,255 if case['mode']=='skip-object' else 1);byte(es,0x31e,2);word(es,0x30a,17);word(es,0x30c,23);byte(es,0x324,1)
 if case['transform']:byte(es,0x320,1);byte(es,0x328,1)
 for at,value in [(0x1002,0x100),(0x1012,0x100),(0x1014,0x6000),(0x1016,32767 if case['mode']=='fault' else 100),(0x1018,1 if case['mode']=='fault' else 20),(0x101a,1 if case['mode']=='fault' else 5)]:word(ds,at,value)
 byte(ds,0x101c,255 if case['mode']=='skip-record' else 0);byte(ds,0x1023,1);byte(ds,0x1024,case['grid']);byte(ds,0x1025,1)
 for i in range(16):
  at=0x100+4*i;word(0x6000,at,0x800-at);word(0x6000,at+0x40,0x900-at-0x40)
 byte(0x6000,0x800,case['assetType']);byte(0x6000,0x801,1);word(0x6000,0x802,16 if case['assetType']==3 else 20);word(0x6000,0x804,3 if case['assetType']==3 else 10);word(0x6000,0x806,65534);byte(0x6000,0x900,1);word(0x6000,0x902,20);word(0x6000,0x904,10)
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));saved={UC_X86_REG_AX:0x1234,UC_X86_REG_BX:0x5678,UC_X86_REG_CX:0x9abc,UC_X86_REG_DX:0xdef0,UC_X86_REG_SI:0x1111,UC_X86_REG_BP:0x2222,UC_X86_REG_DI:0x1000,UC_X86_REG_DS:ds,UC_X86_REG_ES:es}
 for r,value in {**saved,UC_X86_REG_CS:0x1000,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_EFLAGS:0x202}.items():cpu.reg_write(r,value)
 done=[];faults=[]
 def hook(uc,address,size,_):
  if address==0x1e000:done.append(True);uc.emu_stop()
 def interrupt(uc,number,_):faults.append(number);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.emu_start(0x136e1,0xfffff,count=10000)
 if 'error' in case:assert faults==[0] and not done,case;continue
 assert done==[True] and not faults and cpu.reg_read(UC_X86_REG_SP)==0xff02,case
 for r,value in saved.items():assert cpu.reg_read(r)==value,(case,r)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'caseCount':len(cases),'faultCases':sum('error' in case for case in cases),'cases':cases,'limits':'All general/segment registers and SP on return; complete memory except CPU stack saves; INT0 cases compare fault boundary only; no pixels'}))
