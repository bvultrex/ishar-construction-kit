"""Actual engine read/write/close helpers with explicit in-memory DOS effects."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-file-io-vectors.mjs')],cwd=repo,text=True));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);events=[];done=[]
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'ds':UC_X86_REG_DS}
def code(uc,address,size,_):
 if address in [0x1e000,0x18468]:done.append(address);uc.emu_stop()
def interrupt(uc,number,_):
 assert number==0x21;ah=uc.reg_read(UC_X86_REG_AH)
 if ah==0x0e:events.append({'operation':'select-drive','drive':uc.reg_read(UC_X86_REG_DL)});uc.reg_write(UC_X86_REG_AL,26);return
 operation={0x3f:'read',0x40:'write',0x3e:'close'}[ah];assert operation==case['operation'];request={name:uc.reg_read(r) for name,r in regs.items()};request['operation']=operation
 if operation=='write':request['data']=list(uc.mem_read(request['ds']*16+request['dx'],request['cx']))
 events.append(request);reply=case['reply'];length=min(reply['ax'],case['count']) if not reply['carry'] else min(2,case['count']) if reply.get('partial') else 0
 if operation=='read' and length:uc.mem_write(request['ds']*16+request['dx'],bytes(i&255 for i in range(length)))
 uc.reg_write(UC_X86_REG_AX,reply['ax']);flags=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,flags|1 if reply['carry'] else flags&~1)
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INTR,interrupt);outcomes={}
for case in cases:
 events.clear();done.clear();globals=bytearray([0x5a])*0x28c0;globals[0xbbe:0xbc0]=case['handle'].to_bytes(2,'little');globals[0x289b:0x289d]=bytes([case['flag'],2]);cpu.mem_write(0x1c0b0,bytes(globals));cpu.mem_write(0x40000,bytes([0xa5])*65536);cpu.mem_write(0x1c0b0+0x8000,b'\0\xe0')
 for name,r in regs.items():cpu.reg_write(r,case['input'][name])
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x8000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SI,0x2345),(UC_X86_REG_BP,0x4567),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
 cpu.emu_start(0x10000+{'read':0x212d,'write':0x213f,'close':0x20b5}[case['operation']],0xfffff,count=1000);expected=case['expected']
 assert done==[0x1e000 if expected['error'] is None else 0x18468] and events==expected['events'],case
 for name,r in regs.items():assert cpu.reg_read(r)==expected['registers'][name],(case,name)
 assert cpu.reg_read(UC_X86_REG_SP)==0x8000+expected['stackDelta']
 assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&1)==expected['carry'],case
 assert cpu.reg_read(UC_X86_REG_ES)==0x5000 and cpu.reg_read(UC_X86_REG_SI)==0x2345 and cpu.reg_read(UC_X86_REG_BP)==0x4567
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash'],case
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0 if case['alias'] else 0x40000,0x28c0 if case['alias'] else 65536))).hexdigest()==expected['segmentHash'],case
 key=str(expected['error']);outcomes[key]=outcomes.get(key,0)+1
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'outcomes':outcomes,'result':'read/write/close requests, explicit memory effects, short counts, aliases and error boundaries match','limits':'controlled DOS AX/CF and memory effects, preserved BX/CX/DX/DS; no real disk or8468 body execution'}))
