"""Original configuration F43..10C4, no OS services and no actual files modified."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--settings',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':'ishar2'}
assert digest in profiles;repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-startup-configuration-vectors.mjs'),str(a.capture.resolve())]+([str(a.settings.resolve())] if a.settings else []),cwd=repo,text=True))
for case in cases:
 n=case['n'];m=bytearray(original);base=0x23d70;data=[82,0,86,n&255,83,n&255,80,n&255,74,n&255,77,n&255,75,n&255]
 if 256<=n<263:data[(n-256)*2]=0
 if case.get('resourceCase'):
  data=list(a.settings.read_bytes()[:14]);data[3]=case['videoValue']
 m[base+0x386:base+0x394]=bytes(data)
 for at in [0x3a6,0x5fc,0x66a,0x48a,0x402,0x574]:m[base+at]=255
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[]
 for reg,value in [(UC_X86_REG_CS,0x23d7),(UC_X86_REG_DS,0x23d7),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00)]:cpu.reg_write(reg,value)
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,finish,None,base+0x10c5,base+0x10c5);cpu.emu_start(base+0xf43,0xfffff,count=200)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00
 assert hashlib.sha256(cpu.mem_read(0,0x100000)).hexdigest()==case['hash']
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profiles[digest],'captureSha256':digest,'settingsSha256':hashlib.sha256(a.settings.read_bytes()).hexdigest() if a.settings else None,'caseCount':len(cases),'cases':cases,'limits':'F43..10C4 only; controlled14-byte configuration in original buffer, full1MiB exact without stack masks; read/close/device detection and final drive selection excluded'}))
