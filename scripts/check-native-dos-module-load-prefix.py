"""Original69/78F9/8106 cache hit or real file-open/replacement boundary."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=Path(sys.argv[1]);source=p.read_bytes();digest=hashlib.sha256(source).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-module-load-prefix-vectors.mjs'),str(p.resolve())],text=True,cwd=repo));g=0x1c0b0;regs={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
for case in cases:
 m=bytearray(source);m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x80000]=bytes(0x40000);m[0x10318]=0
 def word(at,value):m[at:at+2]=value.to_bytes(2,'little')
 es=case['input']['es'];table=0xb04 if case['alias'] else 0x1000;word(g+0xbc2,table);word(g+0xbce,case['count'])
 for i,module in [(0,16),(1,64)]:word(es*16+table+i*4,0x100+i*0x20);word(es*16+table+i*4+2,0x7000);word(0x70100+i*0x20,module)
 code=bytes([69,case['id']&255,case['id']>>8])+b'TEST.IO\0';m[0x40100:0x40100+len(code)]=code;word(g+0xff00,0x26f7)
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m))
 for key,value in case['input'].items():cpu.reg_write(regs[key],value)
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 done=[]
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 expected=case['expected'];target=0x10000+expected['entry'];cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(0x12dbd,0xfffff,count=10000);assert done==[True]
 for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,(case,key,cpu.reg_read(regs[key]),value)
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00+expected['stackDelta']
 if expected['phase']=='file-open':assert cpu.reg_read(UC_X86_REG_AX)==2
 if expected['phase']=='return':assert cpu.reg_read(UC_X86_REG_AX)==0
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(80);assert hashlib.sha256(actual).hexdigest()==case['hash'],case
assert p.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'verified':'Original69 through78F9/8106, sorted table hits/misses, empty table and shared-global table alias, six ALIS registers/SP, full memory except FEC0..FF0F. Missing module stops before1F97; replacement stops before69B8/765C, not faked.'}))
