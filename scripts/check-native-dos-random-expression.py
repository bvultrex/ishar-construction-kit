"""Native RNG within store/evaluate dispatch, including zero and unsigned bounds."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;count=0
for opcode in [30,31]:
 for seed in [0,1,32767,32768,65535]:
  for bound in [0,4,100,32767,32768,65535]:
   m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x60000]=bytes(0x20000)
   def word(at,v):m[at:at+2]=v.to_bytes(2,'little')
   for at,v in [(g+0xc4e,seed),(g+0xc58,0x802),(g+0xc5c,0xa02)]:word(at,v)
   code=[opcode,56,2,bound&255,bound>>8,100,58]+([20,18] if opcode==30 else [])+[66]
   m[0x40100:0x40100+len(code)]=bytes(code)
   request={'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':{'ds':0x4000,'es':0x5000,'si':0x100,'bp':0x200,'dx':0xfedc,'cx':0x1234}}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-script-prefix-vector.mjs')],input=json.dumps(request),text=True,cwd=repo));assert expected['reason'] is None and len(expected['steps'])==2,expected
   cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
   for key,v in request['registers'].items():cpu.reg_write(names[key],v)
   for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
   def hook(uc,at,size,_):
    if at==0x126f7:uc.emu_stop()
   cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126eb,0xfffff,count=10000)
   step=expected['steps'][0]
   for key,v in step['registers'].items():assert cpu.reg_read(names[key])==v,(opcode,seed,bound,key)
   assert cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_IP)==0x26f7
   actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==step['hash'],(opcode,seed,bound)
   count+=1
assert a.capture.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':count,'limits':'Original30/31 full dispatch; six script registers, SP and full memory except CPU stack scratch; shared seed mutation, zero/unsigned bounds; no timer injection'}))
