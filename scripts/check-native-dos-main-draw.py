"""Resume verified local MAIN checkpoints at73 through first-child selection.
Checkpoint binaries contain original data and must remain outside the repository.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('--complete',action='store_true');p.add_argument('--follow',action='store_true');a=p.parse_args();assert not a.follow or a.complete;repo=Path(__file__).resolve().parent.parent
evidence=json.loads((repo/'docs/reconstruction/MAIN_OBJECT_SELECTION_NATIVE_2026-10-18.json').read_text(encoding='utf-8-sig'));results=[]
names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
for row in evidence['layouts']:
 stem=f"{row['segment']:04x}-0000-{row['frontier']:04x}";path=a.checkpoints/(stem+'.bin');source=path.read_bytes();state=json.loads((a.checkpoints/(stem+'.json')).read_text());g=0x1c0b0
 masked=bytearray(source);masked[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(masked).hexdigest()==row['main']['last']['hash']
 assert {name:state[name] for name in names}==row['main']['last']['registers'];assert state['cs']==0x1000 and state['ss']==0x1c0b
 request={'memory':base64.b64encode(source).decode(),'ss':state['ss'],'registers':{name:state[name] for name in names},'complete':a.complete}
 expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-draw-vector.mjs')],input=json.dumps(request),cwd=repo,text=True))
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
 for name,r in {**names,'cs':UC_X86_REG_CS,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'di':UC_X86_REG_DI,'flags':UC_X86_REG_EFLAGS}.items():cpu.reg_write(r,state[name])
 done=[];endpoint=[0x10000+expected['entry']]
 def hook(uc,address,size,_):
  if address==endpoint[0]:done.append(address);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126eb,0xfffff,count=100000)
 assert done==[0x10000+expected['entry']] and cpu.reg_read(UC_X86_REG_SP)==(state['sp']+expected['stackDelta']-(0 if a.complete else 2))&65535
 for name,r in names.items():assert cpu.reg_read(r)==expected['registers'][name],name
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==expected['hash']
 result={'segment':row['segment'],'frontier':row['frontier'],**expected}
 if a.follow:
  request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':state['ss'],'registers':{name:cpu.reg_read(r) for name,r in names.items()}}
  following=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-script-prefix-vector.mjs')],input=json.dumps(request),cwd=repo,text=True))
  for step in following['steps']:
   yielding=step['status']=='yield';endpoint[0]=0x126b2 if yielding else 0x126f7;done.clear();previous_sp=cpu.reg_read(UC_X86_REG_SP);cpu.emu_start(0x126eb,0xfffff,count=100000)
   assert done==[endpoint[0]] and cpu.reg_read(UC_X86_REG_SP)==previous_sp+(2 if yielding else 0)
   for name,r in names.items():assert cpu.reg_read(r)==step['registers'][name],('following',name)
   actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==step['hash']
  result['following']={'steps':len(following['steps']),'nextOpcode':following['nextOpcode'],'reason':following['reason'],'last':following['steps'][-1] if following['steps'] else None}
 assert path.read_bytes()==source;results.append(result)
print(json.dumps({'profile':evidence['profile'],'captureSha256':evidence['captureSha256'],'mainSha256':evidence['mainSha256'],'layouts':results,'limits':('Complete normal/compound73 including records and return; FE and unconnected subsequent operations excluded; no pixels rendered' if a.complete else 'Original73 preparation and first-child descent only'),'sourceUnchanged':True}))
