"""Opcode30 indexed byte/word destinations and original operand stack."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=[]
def word(m,at,value):m[at:at+2]=(value&65535).to_bytes(2,'little')
for result_tag in [6,8,14,16,18,20,10,34]:
 for dimensions in [0,1,2]:
  for source_tag in ([4,10,34] if result_tag in [10,34] else [0,2,6,8,30,32]):
   m=bytearray(original);m[0x1c0b0:0x1c0b0+0x28c0]=bytes(0x28c0);m[0x40000:0x60000]=bytes(0x20000)
   word(m,0x1c0b0+0xbf6,0x400);word(m,0x1c0b0+0xc58,0x802);word(m,0x1c0b0+0xc5c,0xa02)
   code=bytearray([30,source_tag])
   if source_tag==4:code.extend(([65]*dimensions)+[0])
   elif source_tag in [10,34]:
    code.extend(b'\x00\x01');at=0x50000+(0x400 if source_tag==34 else 0x200)+0x100;m[at:at+dimensions+1]=bytes([66]*dimensions+[0])
   elif source_tag==0:code.append(0xff)
   elif source_tag==2:code.extend(b'\x34\x92')
   else:code.extend(b'\x00\x01');word(m,0x50000+(0x400 if source_tag>=30 else 0x200)+0x100,0x9234)
   if result_tag not in [10,34]:
    code.append(56)
    for n in range(dimensions):code.extend([2,n+1,0,64])
    code.extend([2,3,0,58])
   code.append(result_tag);code.extend([0x80] if result_tag in [18,20] else [0,8])
   m[0x40100:0x40100+len(code)]=code;m[0x50a00-1]=dimensions
   for n in range(dimensions):word(m,0x50a00-4-n*2,0x17+n*0x123)
   word(m,0x1c0b0+0xff00,0xe000)
   request={'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':{'ds':0x4000,'es':0x5000,'si':0x100,'bp':0x200,'dx':0xfedc}}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-assignment-prefix-vector.mjs')],input=json.dumps(request),cwd=repo,text=True));assert len(expected['steps'])==1,expected
   expected=expected['steps'][0];cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m))
   names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX,'bx':UC_X86_REG_BX,'di':UC_X86_REG_DI,'ax':UC_X86_REG_AX}
   for name,value in request['registers'].items():cpu.reg_write(names[name],value)
   cpu.reg_write(UC_X86_REG_SI,0x101)
   for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
   done=[]
   def hook(uc,address,size,_):
    if address==0x1e000:done.append(True);uc.emu_stop()
   cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x12915,0xfffff,count=100000)
   assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff02
   for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,(result_tag,dimensions,source_tag,name,cpu.reg_read(names[name]),value)
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],(result_tag,dimensions,source_tag,'memory')
   cases.append({'resultTag':result_tag,'additionalDimensions':dimensions,'sourceTag':source_tag,'hash':expected['hash']})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':cases,'limits':'explicit numeric subset; DF0; flags/CPU stack saves excluded'}))
