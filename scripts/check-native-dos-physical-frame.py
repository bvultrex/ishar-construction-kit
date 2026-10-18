"""Frame2649/3D3C with real list traversal; stop before unknown device/draw calls."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;results=[]
def word(m,at,value):m[at:at+2]=(value&65535).to_bytes(2,'little')
cases=['empty','hidden','visible','mixed','alias-hidden','alias-visible','notification','wait','wait-keyboard','keyboard','equal-timer','ignored-notification','record0','record254','record1','record2','record255','record3','record-disabled','record-wrap']
for name in cases:
 m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x70000]=bytes(0x30000);es=0x1c0b if name.startswith('alias') else 0x5000
 for at,value in [(0xbf6,0x200),(0xb88,0x1234),(0xb8a,0x5678),(0xbe8,0x100),(0xbea,0x6000),(0xcae,0x200),(0xbee,0x80)]:word(m,g+at,value)
 for n in range(5):word(m,g+0x1dcd+n*2,0x1000+n*0x1111)
 m[g+0xc49]=0xaa;m[g+0xc18]=0xbb;m[0x10318]=0
 if name in ['hidden','visible','mixed','alias-hidden','alias-visible']:
  word(m,g+0xc16,14);m[es*16+0x20e]=0 if 'visible' in name else 0x40;word(m,es*16+0x210,0x345);word(m,es*16+0x212,52)
  m[es*16+0x234]=0 if name=='mixed' else 0x40;word(m,es*16+0x236,0x456)
 if name in ['notification','ignored-notification']:m[g+0xc4a]=1;m[g+0x2898]=int(name=='notification')
 if name in ['wait','wait-keyboard']:m[g+0xc99]=5;m[g+0xc9a]=4
 if name in ['keyboard','wait-keyboard']:m[0x10318]=0x73
 if name=='equal-timer':m[g+0xc99]=4;m[g+0xc9a]=4
 if name.startswith('record'):
  m[g+0xcb0]=1;kind=int(name[6:]) if name[6:].isdigit() else 2
  if name=='record-disabled':m[g+0xc37]=1
  if name=='record-wrap':word(m,g+0xbe8,0xff00)
  m[0x60000+(0x100 if name=='record-wrap' else 0x300)]=kind
 registers={'ds':0x4000,'es':es,'si':0x1234,'bp':0x200,'dx':0x3456,'cx':0x789a}
 expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-frame-vector.mjs')],input=json.dumps({'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':registers}),cwd=repo,text=True))
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for key,value in registers.items():cpu.reg_write(names[key],value)
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[];counts=[0,0]
 def hook(uc,address,size,_):
  if address==0x13dc3:counts[0]+=1
  if address==0x13dbb:counts[1]+=1
  if address==0x10000+expected['entry']:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x12649,0xfffff,count=100000)
 assert done==[0x10000+expected['entry']] and cpu.reg_read(UC_X86_REG_SP)==0xff00+expected['stackDelta'],name
 for key,value in expected['registers'].items():assert cpu.reg_read(names[key])==value,(name,key)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50)
 assert hashlib.sha256(actual).hexdigest()==expected['hash'],(name,'memory')
 assert counts==[expected['visited'],expected['hidden']],(name,'traversal')
 results.append({'case':name,**expected})
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':results,'limits':'DF0; six script registers and physical memory except stack saves; device/input/draw bodies excluded'}))
