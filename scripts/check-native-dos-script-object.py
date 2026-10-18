"""Opcode70 incl both called helpers, using hash-identified original instructions."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;results=[]
def word(m,at,value):m[at:at+2]=(value&65535).to_bytes(2,'little')
for seed in [0,1,128,255]:
 for links in [0,1,2,-1]:
  for alias in [False,True]:
   m=bytearray(original);m[0x1c0b0:0x1c0b0+0x28c0]=bytes(0x28c0);m[0x40000:0x70000]=bytes(0x30000)
   ds=0x5000 if alias else 0x4000;si=0x301 if alias else 0x100
   for at,value in [(0xbf6,0x200),(0xbe8,0x100),(0xbea,0x6000),(0xbec,0xff00 if links==-1 else 0x200),(0xc16,0x40 if links>0 else 0)]:word(m,0x1c0b0+at,value)
   if links>0:word(m,0x50244,0x50 if links==2 else 0)
   word(m,0x60304,0x400);word(m,ds*16+si,0x100);m[ds*16+si+2]=seed
   for n in range(32):m[ds*16+si+3+n]=(seed+n*37)&255
   word(m,0x1c0b0+0xff00,0xe000)
   regs={'ds':ds,'es':0x5000,'si':si,'bx':0x1234,'di':0x5678,'dx':0x9abc}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-object-vector.mjs')],input=json.dumps({'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':regs}),cwd=repo,text=True))
   cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bx':UC_X86_REG_BX,'di':UC_X86_REG_DI,'dx':UC_X86_REG_DX,'ax':UC_X86_REG_AX,'cx':UC_X86_REG_CX}
   for name,value in regs.items():cpu.reg_write(names[name],value)
   for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_BP,0x2468),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
   done=[]
   def code(uc,address,size,_):
    if address in [0x1e000,0x18468]:done.append(address);uc.emu_stop()
   cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x12ded,0xfffff,count=100000)
   assert done==[0x18468 if expected['error'] else 0x1e000]
   assert cpu.reg_read(UC_X86_REG_SP)==0xff00+expected['stackDelta']+(0 if expected['error'] else 2)
   assert cpu.reg_read(UC_X86_REG_BP)==0x2468
   for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,(seed,links,alias,name,cpu.reg_read(names[name]),value)
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],(seed,links,alias,'memory')
   results.append({'seed':seed,'existingLinks':links,'sourceContextAlias':alias,'error':expected['error'],'hash':expected['hash']})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':len(results),'results':results,'limits':'DF0; full memory except stack saves; flags/error-handler body excluded'}))
