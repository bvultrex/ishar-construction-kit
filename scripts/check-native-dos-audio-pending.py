"""Original pending stack push/pop vs TypeScript; isolated Unicorn 2.1.4."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('--node',default='node');args=p.parse_args()
image=args.capture.read_bytes();digest=hashlib.sha256(image).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output([args.node,str(repo/'scripts/dos-audio-pending-vectors.mjs')],cwd=repo,text=True))
def record_bytes(e):return bytes([e['priority'],e['speed']])+b''.join(e[k].to_bytes(2,'little') for k in ['repeatWord','segment','offset'])
for case in cases:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,image)
 def word(at,v):cpu.mem_write(0x10000+at,v.to_bytes(2,'little'))
 def current(e):
  for at,key,size in [(0x8945,'priority',1),(0x8946,'speed',1),(0x8943,'repeatWord',2),(0x8941,'segment',2),(0x893f,'offset',2)]:cpu.mem_write(0x10000+at,e[key].to_bytes(size,'little'))
 def observe():return {key:int.from_bytes(cpu.mem_read(0x10000+at,size),'little') for at,key,size in [(0x8945,'priority',1),(0x8946,'speed',1),(0x8943,'repeatWord',2),(0x8941,'segment',2),(0x893f,'offset',2)]}
 pointer=0x893d-8*len(case['queue']);word(0x8909,len(case['queue']));word(0x890b,pointer)
 for i,e in enumerate(case['queue']):cpu.mem_write(0x10000+pointer+8*i,record_bytes(e))
 current(case['current']);cpu.mem_write(0x18947,bytes([case['activeFlag']]))
 for at,key,size in [(0xe0b,'priority',1),(0xe0d,'speed',1),(0xe0e,'repeatWord',2),(0xe12,'segment',2),(0xe10,'offset',2)]:cpu.mem_write(0x1c0b0+at,case['incoming'][key].to_bytes(size,'little'))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x3000),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 ends=[]
 def code(uc,address,size,_):
  if address in [0x189df,0x18a45,0x18a4c]:ends.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,code);cpu.emu_start(0x18949,0x189e0,count=256)
 expected=case['pushed'];assert ends==[0x189df];assert observe()==expected['current']
 count=int.from_bytes(cpu.mem_read(0x18909,2),'little');ptr=int.from_bytes(cpu.mem_read(0x1890b,2),'little');assert count==len(expected['queue']) and ptr==0x893d-8*count
 assert bytes(cpu.mem_read(0x10000+ptr,8*count))==b''.join(record_bytes(e) for e in expected['queue'])
 ends.clear();cpu.emu_start(0x189e0,0x18a4d,count=128);popped=case['popped']
 assert ends==[0x18a45 if count else 0x18a4c]
 assert cpu.mem_read(0x18947,1)[0]==popped['activeFlag']
 if popped['current'] is not None:assert observe()==popped['current']
 assert int.from_bytes(cpu.mem_read(0x18909,2),'little')==len(popped['queue'])
 assert int.from_bytes(cpu.mem_read(0x1890b,2),'little')==0x893d-8*len(popped['queue'])
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00
assert args.capture.read_bytes()==image
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'native pending push/pop, six-record bound, priority rules and current fields match','limits':'normalized valid stack states; no playback or scheduler'}))
