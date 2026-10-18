"""Full original confirmation prompt with controlled BIOS/DOS service replies."""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
profiles={'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1',0x18cc,0x1932),'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2',0x19a0,0x1a06)}
assert digest in profiles;profile,entry,end=profiles[digest];repo=Path(__file__).resolve().parent.parent;cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-configuration-prompt-vectors.mjs'),str(a.capture.resolve())],cwd=repo,text=True))
for case in cases:
 m=bytearray(original);base=0x23d70;m[base+0xb92:base+0xb94]=case['language'].to_bytes(2,'little');m[base+0xb90]=case['flag'];events=[];done=[];times=[0];keys=[0];r=case['replies']
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m))
 for reg,value in [(UC_X86_REG_CS,0x23d7),(UC_X86_REG_DS,0x23d7),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x602)]:cpu.reg_write(reg,value)
 def interrupt(uc,number,_):
  ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8;dx=uc.reg_read(UC_X86_REG_DX);cx=uc.reg_read(UC_X86_REG_CX);bx=uc.reg_read(UC_X86_REG_BX)
  if number==0x10:
   if ah==0:events.append({'kind':'mode','value':ax&255})
   elif ah==1:events.append({'kind':'shape','cx':cx})
   elif ah==2:events.append({'kind':'cursor','dx':dx})
   elif ah==3:events.append({'kind':'read-cursor'});uc.reg_write(UC_X86_REG_DX,r['cursorDX'])
   else:assert ah==9;events.append({'kind':'text','value':ax&255,'attribute':bx&255,'count':cx})
  else:
   assert number==0x21
   if ah==0x2c:
    assert times[0]<len(r['seconds']);value=r['seconds'][times[0]];times[0]+=1;events.append({'kind':'time','second':value});uc.reg_write(UC_X86_REG_DX,(value<<8)|(dx&255))
   else:
    assert ah==6 and (dx&255)==255 and keys[0]<len(r['keys']);value=r['keys'][keys[0]];keys[0]+=1;events.append({'kind':'key','value':value});uc.reg_write(UC_X86_REG_AX,(ax&0xff00)|value)
 def finish(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,finish,None,base+end,base+end);cpu.emu_start(base+entry,0xfffff,count=100000)
 assert done==[True] and cpu.reg_read(UC_X86_REG_SP)==0xff00 and events==case['events']
 assert times[0]==case['timeReplies'] and keys[0]==case['keyReplies'] and not(cpu.reg_read(UC_X86_REG_EFLAGS)&0x400)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff00]=bytes(64);assert hashlib.sha256(actual).hexdigest()==case['hash']
 # Text event bytes remain local: publish only the trace hash, never original strings.
 case['eventSha256']=hashlib.sha256(json.dumps(case.pop('events'),separators=(',',':')).encode()).hexdigest()
assert a.capture.read_bytes()==original
print(json.dumps({'profile':profile,'captureSha256':digest,'caseCount':len(cases),'cases':cases,'limits':'Complete prompt entry to RET boundary, controlled BIOS/DOS services; text event hashes only; memory outside stack FEC0..FEFF, SP/DF and reply consumption checked; no actual display or general scratch register claim'}))
