"""Native opcode134 mouse snapshot and three scalar results, both profiles."""
import base64, hashlib, json, subprocess, sys
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);source=path.read_bytes();digest=hashlib.sha256(source).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert len(source)==0x100000 and digest in profiles
repo=Path(__file__).resolve().parent.parent
regs={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
count=0
for mode in (0,1,2):
 for disabled in (0,1):
  for x in (0,65535):
   for short in (False,True):
    m=bytearray(source);g=0x1c0b0
    def word(at,value):m[at:at+2]=value.to_bytes(2,'little')
    m[g+0xca3]=disabled;m[g+0x2896]=mode
    word(0x111bd,x);word(0x111bf,17);word(0x111c1,3)
    word(g+0xc58,0x800);word(g+0xc5c,0xa00)
    code=bytes([134,20,0x76,20,0x78,18,0x7a]) if short else bytes([134,8,0x76,0,8,0x78,0,6,0x7a,0])
    m[0x40100:0x40100+len(code)]=code
    state={'ds':0x4000,'es':0x5000,'si':0x100,'bp':0x200,'dx':0xabcd,'cx':0x1234}
    q={'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':state}
    expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-mouse-vector.mjs')],input=json.dumps(q),text=True,cwd=repo))
    cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m))
    for k,v in state.items():cpu.reg_write(regs[k],v)
    for r,v in ((UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x7ec),(UC_X86_REG_EFLAGS,0x202)):cpu.reg_write(r,v)
    done=[]
    def stop(uc,address,size,_):done.append(True);uc.emu_stop()
    cpu.hook_add(UC_HOOK_CODE,stop,None,0x126f7,0x126f7);cpu.emu_start(0x126eb,0xfffff,count=1000)
    assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0x7ec
    for k,v in expected['registers'].items():assert cpu.reg_read(regs[k])==v,(mode,disabled,x,short,k)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x780:g+0x7ec]=bytes(0x6c)
    assert hashlib.sha256(actual).hexdigest()==expected['hash'],(mode,disabled,x,short)
    count+=1
assert path.read_bytes()==source
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':count,'verified':'Original134/1259 and scalar result stores; six registers/SP and full1MiB except0780..07EB stack scratch; no host mouse or callback delivery'}))
