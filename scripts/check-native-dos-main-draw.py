"""Resume verified local MAIN checkpoints at73 through first-child selection.
Checkpoint binaries contain original data and must remain outside the repository.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);a=p.parse_args();repo=Path(__file__).resolve().parent.parent
evidence=json.loads((repo/'docs/reconstruction/MAIN_OBJECT_SELECTION_NATIVE_2026-10-18.json').read_text(encoding='utf-8-sig'));results=[]
names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
for row in evidence['layouts']:
 stem=f"{row['segment']:04x}-0000-{row['frontier']:04x}";path=a.checkpoints/(stem+'.bin');source=path.read_bytes();state=json.loads((a.checkpoints/(stem+'.json')).read_text());g=0x1c0b0
 masked=bytearray(source);masked[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(masked).hexdigest()==row['main']['last']['hash']
 assert {name:state[name] for name in names}==row['main']['last']['registers'];assert state['cs']==0x1000 and state['ss']==0x1c0b
 request={'memory':base64.b64encode(source).decode(),'ss':state['ss'],'registers':{name:state[name] for name in names}}
 expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-draw-vector.mjs')],input=json.dumps(request),cwd=repo,text=True))
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
 for name,r in {**names,'cs':UC_X86_REG_CS,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'di':UC_X86_REG_DI,'flags':UC_X86_REG_EFLAGS}.items():cpu.reg_write(r,state[name])
 done=[]
 def hook(uc,address,size,_):
  if address==0x10000+expected['entry']:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126eb,0xfffff,count=100000)
 assert done==[0x10000+expected['entry']] and cpu.reg_read(UC_X86_REG_SP)==(state['sp']+expected['stackDelta']-2)&65535
 for name,r in names.items():assert cpu.reg_read(r)==expected['registers'][name],name
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==expected['hash']
 assert path.read_bytes()==source;results.append({'segment':row['segment'],'frontier':row['frontier'],**expected})
print(json.dumps({'profile':evidence['profile'],'captureSha256':evidence['captureSha256'],'mainSha256':evidence['mainSha256'],'layouts':results,'limits':'Original73 numeric preparation,39F5 lookup and first-child compound descent; stops before record/special bodies and remaining siblings; original source unchanged'}))
