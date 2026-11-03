"""Expression168 and opcode215 numeric prefix, native dispatch incl69A6."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':'ishar1','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-global-control-vectors.mjs')],cwd=repo,text=True))
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original);globals=bytearray(0x28c0);globals[0xbf6:0xbf8]=b'\0\x03';globals[0xc9d:0xc9f]=case['value'].to_bytes(2,'little');globals[0xbf4:0xbf6]=b'\xaa\xbb';cpu.mem_write(0x1c0b0,bytes(globals))
 cpu.mem_write(0x40000,bytes(65536));cpu.mem_write(0x50000,bytes(65536));cpu.mem_write(0x40000,bytes(case['code']))
 if case['tag'] in [6,8,30,32]:cpu.mem_write(0x50000+(0x300 if case['tag']>=30 else 0x200)+0x100,case['value'].to_bytes(2,'little'))
 names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
 for r,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x4000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_BP,0x200),(UC_X86_REG_SI,0),(UC_X86_REG_DX,0x3456),(UC_X86_REG_CX,0x789a),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,value)
 done=[]
 def hook(uc,address,size,_):
  if address==0x126f7:done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126eb,0xfffff,count=10000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 for name,value in case['registers'].items():assert cpu.reg_read(names[name])==value,(case['tag'],case['value'],name)
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==case['globalsHash']
 assert hashlib.sha256(bytes(cpu.mem_read(0x50000,65536))).hexdigest()==case['contextHash']
 assert bytes(cpu.mem_read(0x40000,len(case['code'])))==bytes(case['code'])
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'cases':[{k:v for k,v in case.items() if k!='code'} for case in cases],'limits':'identified numeric operands; SI/DX/CX/BP/DS/ES and globals/context; flags/scratch excluded'}))
