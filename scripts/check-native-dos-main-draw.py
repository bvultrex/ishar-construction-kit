"""Resume verified local MAIN checkpoints at73 through first-child selection.
Checkpoint binaries contain original data and must remain outside the repository.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('--complete',action='store_true');p.add_argument('--follow',action='store_true');p.add_argument('--finish-yield',action='store_true');p.add_argument('--object-prefix',action='store_true');p.add_argument('--projection',action='store_true');p.add_argument('--projected-record',action='store_true');p.add_argument('--batch',action='store_true');p.add_argument('--shift-flags',type=int);a=p.parse_args();a.projected_record=a.projected_record or a.batch;a.projection=a.projection or a.projected_record;a.object_prefix=a.object_prefix or a.projection;a.finish_yield=a.finish_yield or a.object_prefix;a.follow=a.follow or a.finish_yield;a.complete=a.complete or a.finish_yield;assert a.shift_flags is None or 0<=a.shift_flags<=255;assert not a.follow or a.complete;repo=Path(__file__).resolve().parent.parent
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
 done=[];endpoint=[0x10000+expected['entry']];text_counts={'characters':0,'glyphDrawCalls':0}
 def hook(uc,address,size,_):
  if address==0x12b93:text_counts['characters']+=1
  if address==0x12bd3:text_counts['glyphDrawCalls']+=1
  if address==endpoint[0]:done.append(address);uc.emu_stop()
 def interrupt(uc,number,_):
  assert number==0x16 and a.shift_flags is not None and uc.reg_read(UC_X86_REG_AH)==2
  uc.reg_write(UC_X86_REG_AX,(uc.reg_read(UC_X86_REG_AX)&0xff00)|a.shift_flags)
 cpu.hook_add(UC_HOOK_INTR,interrupt)
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
  result['following']={'opcodes':sorted(set(step['opcode'] for step in following['steps'])),**text_counts,'steps':len(following['steps']),'nextOpcode':following['nextOpcode'],'reason':following['reason'],'last':following['steps'][-1] if following['steps'] else None}
 if a.finish_yield and following['steps'] and following['steps'][-1]['status']=='yield':
  def model(script,extra=None):
   request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':state['ss'],'registers':{name:cpu.reg_read(r) for name,r in names.items()}}
   if a.shift_flags is not None:request['shiftFlags']=a.shift_flags
   request.update(extra or {})
   return json.loads(subprocess.check_output(['node',str(repo/'scripts'/script)],input=json.dumps(request),cwd=repo,text=True))
  def compare(start,expected,target,delta):
   endpoint[0]=target;done.clear();previous_sp=cpu.reg_read(UC_X86_REG_SP);cpu.emu_start(start,0xfffff,count=100000)
   assert done==[target] and cpu.reg_read(UC_X86_REG_SP)==(previous_sp+delta)&65535
   for name,r in names.items():assert cpu.reg_read(r)==expected['registers'][name],('after string',start,name)
   for key,r in [('bx',UC_X86_REG_BX),('di',UC_X86_REG_DI)]:
    if key in expected:assert cpu.reg_read(r)==expected[key],('boundary register',start,key)
   actual=bytearray(cpu.mem_read(0,0x100000));bottom=expected.get('stackMaskStart',0xfec0);actual[g+bottom:g+0xff10]=bytes(0xff10-bottom);assert hashlib.sha256(actual).hexdigest()==expected['hash'],('after string memory',start)
  finish=model('dos-physical-yield-vector.mjs');compare(0x126b2,finish,0x10000+finish['entry'],finish['stackDelta']);result['yieldFinish']=finish
  if finish['phase']=='callback':
   callback=model('dos-physical-script-prefix-vector.mjs')
   for step in callback['steps']:
    yielding=step['status']=='yield';compare(0x126eb,step,0x126d5 if yielding else 0x126f7,2 if yielding else 0)
   result['callback']={'steps':len(callback['steps']),'reason':callback['reason'],'nextOpcode':callback['nextOpcode']}
   if callback['steps'] and callback['steps'][-1]['status']=='yield':
    returned=model('dos-physical-yield-vector.mjs',{'entry':'callback-return'});compare(0x126d5,returned,0x10000+returned['entry'],returned['stackDelta']);result['callbackReturn']=returned
    if returned['phase']=='frame':
     frame=model('dos-physical-frame-vector.mjs');compare(0x12649,frame,0x10000+frame['entry'],frame['stackDelta']);result['frame']=frame
     if a.object_prefix and frame['phase']=='object':
      frame_request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':state['ss'],'registers':{name:cpu.reg_read(r) for name,r in names.items()},'object':frame['bx']}
      prepared=model('dos-visible-object-vector.mjs',{'object':frame['bx']});compare(0x13de4,prepared,0x10000+prepared['entry'],prepared['stackDelta']);result['objectPrefix']=prepared
      if a.projection and prepared['phase']=='new-record':
       endpoint[0]=0x136e1;done.clear();previous_sp=cpu.reg_read(UC_X86_REG_SP);cpu.emu_start(0x1408a,0xfffff,count=20);assert done==[0x136e1] and cpu.reg_read(UC_X86_REG_SP)==previous_sp-4
       projected=model('dos-record-projection-vector.mjs',{'di':prepared['di'],'stackMaskStart':min(0xfec0,cpu.reg_read(UC_X86_REG_SP)-18)});compare(0x136e1,projected,0x140dc,2);result['projection']=projected
       if a.projected_record:
        committed=model('dos-projected-record-vector.mjs',{'di':prepared['di'],'bx':prepared['bx'],'stackMaskStart':min(0xfec0,cpu.reg_read(UC_X86_REG_SP)-12)});compare(0x140dc,committed,0x1408d,2);result['projectedRecord']=committed
        if a.batch:
         frame_request['stackMaskStart']=projected['stackMaskStart'];batch=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-object-batch-vector.mjs')],input=json.dumps(frame_request),cwd=repo,text=True));compare(0x1408d,batch,0x10000+batch['entry'],6);result['batch']=batch
 assert path.read_bytes()==source;results.append(result)
print(json.dumps({'profile':evidence['profile'],'captureSha256':evidence['captureSha256'],'mainSha256':evidence['mainSha256'],'layouts':results,'controlledBiosShiftFlags':a.shift_flags,'limits':('Complete normal/compound73 and supported following MAIN steps; optional yield/callback/frame boundary checked; FE and unconnected operations excluded; no pixels rendered' if a.complete else 'Original73 preparation and first-child descent only'),'sourceUnchanged':True}))
