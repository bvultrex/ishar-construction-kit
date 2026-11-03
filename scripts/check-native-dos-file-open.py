"""Execute complete Ishar1F97 open/create/seek wrapper with explicit DOS replies.
No original file is opened for writing; INT21 is an in-memory test boundary.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
assert source[0x12151]==0xc3
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-file-open-vectors.mjs')],cwd=repo,text=True));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);events=[];done=[];counts={};drive=None
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'ds':UC_X86_REG_DS}
def code(uc,address,size,_):
 if address in [0x1e000,0x18468]:done.append(address);uc.emu_stop()
def interrupt(uc,number,_):
 global drive
 assert number==0x21;ah=uc.reg_read(UC_X86_REG_AH)
 if ah==0x0e:
  drive=uc.reg_read(UC_X86_REG_DL);events.append({'operation':'select-drive','drive':drive});uc.reg_write(UC_X86_REG_AL,26);return
 op={0x4e:'find-first',0x3c:'create',0x3d:'open',0x42:'seek'}[ah];request={name:uc.reg_read(r) for name,r in regs.items()};request.update(operation=op,drive=drive);events.append(request)
 assert request['ds']==0x4000 and bytes(uc.mem_read(0x40100,9))==b'EXIST.AO\0'
 index=counts.get(op,0);counts[op]=index+1;response=case['scenario']['find' if op=='find-first' else op]
 if isinstance(response,list):response=response[min(index,len(response)-1)]
 uc.reg_write(UC_X86_REG_AX,response['ax'])
 if op=='seek' and 'dx' in response:uc.reg_write(UC_X86_REG_DX,response['dx'])
 flags=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,flags|1 if response['carry'] else flags&~1)
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INTR,interrupt)
errors={}
for case in cases:
 events.clear();done.clear();counts.clear();drive=None;globals=bytearray([0x5a])*0x28c0;globals[0x289b:0x289e]=bytes([case['flag'],2,5]);cpu.mem_write(0x1c0b0,bytes(globals));cpu.mem_write(0x40100,b'EXIST.AO\0');cpu.mem_write(0x1c0b0+0x8000,b'\0\xe0')
 for name,r in regs.items():cpu.reg_write(r,case['input'][name])
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x8000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_SI,0x3456),(UC_X86_REG_BP,0x4567),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
 cpu.emu_start(0x11f97,0xfffff,count=1000);expected=case['expected']
 assert done==[0x1e000 if expected['error'] is None else 0x18468],case
 assert events==expected['events'],(case,events)
 for name,r in regs.items():assert cpu.reg_read(r)==expected['registers'][name],(case,name,cpu.reg_read(r))
 assert cpu.reg_read(UC_X86_REG_SP)==0x8000+expected['stackDelta'],case
 assert cpu.reg_read(UC_X86_REG_SI)==0x3456 and cpu.reg_read(UC_X86_REG_BP)==0x4567 and cpu.reg_read(UC_X86_REG_ES)==0x5000
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash'],case
 errors[str(expected['error'])]=errors.get(str(expected['error']),0)+1
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'outcomes':errors,'result':'complete1F97 wrapper requests, register effects, globals, fallback and error-stack boundaries match','limits':'controlled INT21 preserving BX/CX/DS; no actual disk writes, DTA, file data or8468 body execution'}))
