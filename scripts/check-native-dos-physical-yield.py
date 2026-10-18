"""Yield completion and next selection, actual original code and shared aliases."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--callback-return',action='store_true');a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=[]
def word(m,at,value):m[at:at+2]=(value&65535).to_bytes(2,'little')
for callback in ([20] if a.callback_return else [0,20]):
 for delta in [0,1,65535]:
  for head in [0,0x300]:
   for slot in [0,6]:
    for object_segment in [0x5000,0x6000]:
     m=bytearray(original);m[0x1c0b0:0x1c0b0+0x28c0]=bytes(0x28c0);m[0x40000:0x70000]=bytes(0x30000)
     for at,value in [(0xb02,0),(0xbd2,0x100),(0xbea,object_segment),(0xc16,14),(0xc19,1),(0xc56,0x1a0)]:word(m,0x1c0b0+at,value)
     for offset,value in [(-20,0),(-18,0x4000),(-24,head),(-10,0x100),(0,delta),(2,2*delta),(4,3*delta)]:word(m,0x50200+offset,value)
     m[0x501fe]=7;m[0x501ff]=0;word(m,0x40006,callback);word(m,0x50104,slot);word(m,0x50106,0x400)
     if head:
      word(m,object_segment*16+head+4,0x340);word(m,object_segment*16+head+22,0xffff);m[object_segment*16+0x340]=3
     registers={'ds':0x3000,'es':0x5000,'si':0x1234,'bp':0x200,'dx':0x3456,'cx':0x789a}
     expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-yield-vector.mjs')],input=json.dumps({'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':registers,'entry':'callback-return' if a.callback_return else 'yield'}),cwd=repo,text=True))
     cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
     for name,value in registers.items():cpu.reg_write(names[name],value)
     for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
     done=[]
     def hook(uc,address,size,_):
      if address in [0x126eb,0x12649,0x1264f]:done.append(address);uc.emu_stop()
     cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126d5 if a.callback_return else 0x126b2,0xfffff,count=10000)
     assert done==[0x10000+expected['entry']] and cpu.reg_read(UC_X86_REG_SP)==0xff00+expected['stackDelta']
     for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,(callback,delta,head,slot,object_segment,name)
     actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
     assert hashlib.sha256(actual).hexdigest()==expected['hash'],(callback,delta,head,slot,object_segment,'memory')
     cases.append({'callback':callback,'inputDelta':delta,'head':head,'slot':slot,'objectSegment':object_segment,**expected})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'entry':'callback-return' if a.callback_return else 'yield','cases':cases,'limits':'six script registers and full memory except stack saves; callback/frame bodies and flags excluded'}))
