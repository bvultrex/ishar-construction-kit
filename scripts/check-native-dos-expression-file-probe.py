"""Native tag156 and2064 with controlled INT21 responses, not real DOS/DTA."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();source=a.capture.read_bytes();digest=hashlib.sha256(source).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
assert int.from_bytes(source[0x101f2+156:0x101f4+156],'little')==0x6f55 and source[0x12151]==0xc3
repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-expression-file-probe-vectors.mjs')],cwd=repo,text=True));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source);done=[];events=[];response_index=0;drive=None
def code(uc,address,size,_):
 if address==0x126f7:done.append(address);uc.emu_stop()
def interrupt(uc,number,_):
 global response_index,drive
 assert number==0x21;ah=uc.reg_read(UC_X86_REG_AH)
 if ah==0x4e:
  assert uc.reg_read(UC_X86_REG_DS)==0x1c0b and uc.reg_read(UC_X86_REG_DX)==case['buffer'] and uc.reg_read(UC_X86_REG_CX)==0
  assert bytes(uc.mem_read(0x1c0b0+case['buffer'],case['length']+1))==bytes([65+i%26 for i in range(case['length'])]+[0])
  carry=case['responses'][response_index];response_index+=1;events.append({'operation':'find-first','drive':drive,'carry':carry})
  flags=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,(flags|1) if carry else flags&~1);uc.reg_write(UC_X86_REG_AX,2 if carry else 0)
 elif ah==0x0e:
  drive=uc.reg_read(UC_X86_REG_DL);events.append({'operation':'select-drive','drive':drive});uc.reg_write(UC_X86_REG_AL,26)
 else:raise AssertionError(('Unexpected DOS service',ah))
cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_INTR,interrupt)
for case in cases:
 done.clear();events.clear();response_index=0;drive=None;script=bytearray(65536);script[0x100:0x100+len(case['script'])]=bytes(case['script']);globals=bytearray([0x5a])*0x28c0
 globals[0xc58:0xc5a]=case['buffer'].to_bytes(2,'little');globals[0xbf6:0xbf8]=b'\0\x04';globals[0x289b:0x289e]=bytes([case['flag'],2,5]);pattern=bytes([65+i%26 for i in range(case['length'])]+[0]);globals[case['buffer']:case['buffer']+case['length']+1]=pattern
 context=bytearray(65536);context[0x400:0x400+len(pattern)]=pattern
 cpu.mem_write(0x40000,bytes(script));cpu.mem_write(0x50000,bytes(context));cpu.mem_write(0x1c0b0,bytes(globals))
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0x8000),(UC_X86_REG_ES,0x5000),(UC_X86_REG_DS,0x4000),(UC_X86_REG_SI,0x100),(UC_X86_REG_BP,0x200),(UC_X86_REG_DX,0x3456),(UC_X86_REG_EFLAGS,2)]:cpu.reg_write(r,v)
 cpu.emu_start(0x126eb,0xfffff,count=20000);expected=case['expected'];assert done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==0x8000
 assert events==expected['events'] and response_index==len(case['responses']),(case,events)
 for r,name in [(UC_X86_REG_SI,'si'),(UC_X86_REG_DX,'dx'),(UC_X86_REG_CX,'cx')]:assert cpu.reg_read(r)==expected[name],(case,name)
 assert cpu.reg_read(UC_X86_REG_DS)==0x4000 and cpu.reg_read(UC_X86_REG_ES)==0x5000
 assert hashlib.sha256(bytes(cpu.mem_read(0x1c0b0,0x28c0))).hexdigest()==expected['globalsHash']
 assert bytes(cpu.mem_read(0x50000,65536))==context and bytes(cpu.mem_read(0x40000,65536))==script
assert a.capture.read_bytes()==source
print(json.dumps({'captureSha256':digest,'cases':len(cases),'result':'tag156 FindFirst carry result, retry/drive events and native registers match','limits':'controlled INT21 carry/AX/drive-count responses; no real DOS filesystem, DTA writes or initialization claim'}))
