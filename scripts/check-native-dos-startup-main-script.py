"""Compare scheduler and supported MAIN prefix on verified startup-root states."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('--traverse-empty',action='store_true');p.add_argument('--equipment-word',type=int,choices=range(65536));p.add_argument('--current-drive',type=int,choices=range(26));p.add_argument('--find-first-carry',type=int,choices=[0,1]);p.add_argument('--first-frame',action='store_true');p.add_argument('--shift-flags',type=int);p.add_argument('--cycles',type=int,default=0);p.add_argument('--checkpoint-end',type=Path);p.add_argument('--resume-context',action='store_true');p.add_argument('--palette-retrace',type=int);a=p.parse_args();assert a.palette_retrace is None or 0<=a.palette_retrace<=255;assert 0<=a.cycles<=1000;a.first_frame=a.first_frame or a.cycles>0;assert a.shift_flags is None or 0<=a.shift_flags<=255;repo=Path(__file__).resolve().parent.parent;rows=[]
profiles={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
if a.checkpoint_end:
 assert not any(a.checkpoint_end.resolve().is_relative_to(root.resolve()) for root in [repo,a.checkpoints]),'Checkpoint output must stay outside repository/input directory'
 a.checkpoint_end.mkdir(parents=True,exist_ok=True)
def reported(step):
 if step is None:return None
 return {**{key:value for key,value in step.items() if key!='events'},'eventCount':len(step.get('events',[])),'eventSha256':hashlib.sha256(json.dumps(step.get('events',[]),separators=(',',':')).encode()).hexdigest()}
paths=sorted(a.checkpoints.glob('*.bin'));assert paths
for path in paths:
 original=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert len(original)==0x100000 and hashlib.sha256(original).hexdigest()==meta['memorySha256'];assert meta['captureSha256']==profiles[meta['profile']] and meta['boundary']==(0x264c if a.resume_context else 0x2607) and meta['registers']['ip']==meta['boundary']
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original)
 for key,value in meta['registers'].items():cpu.reg_write(regs[key],value)
 def model(script,extra):
  request={**({'equipmentWord':a.equipment_word} if a.equipment_word is not None else {}),**({'equipmentWord':a.equipment_word,'currentDrive':a.current_drive} if a.current_drive is not None else {}),'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'stackMask':[0x7a8,0x7ee],**({'palette':{'retraceReads':[a.palette_retrace],'interruptFlag':True}} if a.palette_retrace is not None else {}),**extra}
  return json.loads(subprocess.check_output(['node',str(repo/'scripts'/script)],input=json.dumps(request),text=True,cwd=repo))
 def compare_hash(expected):
  actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0x7a8:0x1c0b0+0x7ee]=bytes(0x46);assert hashlib.sha256(actual).hexdigest()==expected,'Physical MAIN memory mismatch'
 def run(start,target,limit=100000,skip_hits=0):
  done=[];entered=[False];hits=[0]
  def hook(uc,address,size,_):
   if address==0x126eb:entered[0]=True
   if address==target and (start!=target or entered[0]):
    hits[0]+=1
    if hits[0]>skip_hits:done.append(True);uc.emu_stop()
  h=cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(start,0xfffff,count=limit);cpu.hook_del(h);assert done==[True],(hex(start),hex(target))
 file_events=[];drive=[None]
 def probe_entry(uc,address,size,_):drive[0]=None
 cpu.hook_add(UC_HOOK_CODE,probe_entry,None,0x12064,0x12064)
 def interrupt(uc,number,_):
  if number==0x11:
   assert a.equipment_word is not None;uc.reg_write(UC_X86_REG_AX,a.equipment_word);return
  if number==0x16:
   assert a.shift_flags is not None and uc.reg_read(UC_X86_REG_AH)==2;uc.reg_write(UC_X86_REG_AL,a.shift_flags);return
  assert number==0x21
  ah=uc.reg_read(UC_X86_REG_AH)
  if ah==0x19:
   assert a.current_drive is not None;uc.reg_write(UC_X86_REG_AL,a.current_drive);return
  if ah==0xe:drive[0]=uc.reg_read(UC_X86_REG_DL);uc.reg_write(UC_X86_REG_AL,3);return
  assert ah==0x4e and a.find_first_carry is not None
  address=uc.reg_read(UC_X86_REG_DS)*16+uc.reg_read(UC_X86_REG_DX);pattern=bytearray()
  while True:
   value=uc.mem_read(address+len(pattern),1)[0]
   if value==0:break
   pattern.append(value);assert len(pattern)<65536
  carry=bool(a.find_first_carry);file_events.append({'patternSha256':hashlib.sha256(pattern).hexdigest(),'attributes':uc.reg_read(UC_X86_REG_CX),'drive':drive[0],'carry':carry});uc.reg_write(UC_X86_REG_AX,2 if carry else 0);flags=uc.reg_read(UC_X86_REG_EFLAGS);uc.reg_write(UC_X86_REG_EFLAGS,flags|1 if carry else flags&~1)
 io_events=[]
 def read(uc,port,size,_):
  assert a.palette_retrace is not None and port==0x3da and size==1;io_events.append({'kind':'in','port':port,'value':a.palette_retrace});return a.palette_retrace
 def write(uc,port,size,value,_):assert a.palette_retrace is not None and size==1 and port in [0x3c8,0x3c9];io_events.append({'kind':'out','port':port,'value':value})
 cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT)
 cpu.hook_add(UC_HOOK_INTR,interrupt)
 if a.resume_context:
  scheduler=model('dos-physical-context-vector.mjs',{'registers':{key:cpu.reg_read(regs[key]) for key in ['ds','es','si','bp','dx','cx']}});sp=cpu.reg_read(regs['sp']);run(0x1264c,0x10000+scheduler['entry'])
  for key,value in scheduler['registers'].items():assert cpu.reg_read(regs[key])==value,key
 else:
  scheduler=model('dos-main-scheduler-vector.mjs',{'es':cpu.reg_read(regs['es']),'ds':cpu.reg_read(regs['ds'])});sp=cpu.reg_read(regs['sp']);run(0x12607,0x10000+scheduler['entry'])
  for key in ['bp','si','ds','es','bx']:assert cpu.reg_read(regs[key])==scheduler[key],key
 assert cpu.reg_read(regs['sp'])==sp+scheduler['stackDelta'];compare_hash(scheduler['hash'])
 state={key:cpu.reg_read(regs[key]) for key in ['ds','es','si','bp','dx','cx']};prefix=model('dos-physical-script-prefix-vector.mjs',{'registers':state,**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {}),**({'findFirstReplies':[bool(a.find_first_carry)]*64} if a.find_first_carry is not None else {})});counts={};port_evidence=[];start=0x126eb
 for index,step in enumerate(prefix['steps']):
  io_events.clear();sp=cpu.reg_read(regs['sp']);assert cpu.mem_read(cpu.reg_read(regs['ds'])*16+cpu.reg_read(regs['si']),1)[0]==step['opcode'];target=0x126b2 if step['status']=='yield' else 0x126f7;run(start,target);start=target
  for key,value in step['registers'].items():assert cpu.reg_read(regs[key])==value,(index,step['opcode'],key,cpu.reg_read(regs[key]),value)
  assert cpu.reg_read(regs['sp'])==sp+(2 if step['status']=='yield' else 0);compare_hash(step['hash']);assert io_events==step.get('events',[]);counts[str(step['opcode'])]=counts.get(str(step['opcode']),0)+1
  if io_events:port_evidence.append({'step':index,'opcode':step['opcode'],'eventCount':len(io_events),'eventSha256':hashlib.sha256(json.dumps(io_events,separators=(',',':')).encode()).hexdigest()})
 continuation=None;cycles=[]
 if a.first_frame and prefix['steps'] and prefix['steps'][-1]['status']=='yield':
  def state():return {key:cpu.reg_read(regs[key]) for key in ['ds','es','si','bp','dx','cx']}
  def transition(script,start,extra=None):
   expected=model(script,{'registers':state(),**(extra or {})});sp=cpu.reg_read(regs['sp']);run(start,0x10000+expected['entry'],skip_hits=len(expected.get('emptyOwners',[])) if expected['entry']==0x3de4 else 0)
   for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,('continuation',key)
   assert cpu.reg_read(regs['sp'])==sp+expected['stackDelta'];compare_hash(expected['hash']);return expected
  def execute_steps(expected,yield_target):
   start=0x126eb
   for index,step in enumerate(expected['steps']):
    io_events.clear();sp=cpu.reg_read(regs['sp']);target=yield_target if step['status']=='yield' else 0x126f7;run(start,target);start=target
    for key,value in step['registers'].items():assert cpu.reg_read(regs[key])==value,('continued script',index,key)
    assert cpu.reg_read(regs['sp'])==sp+(2 if step['status']=='yield' else 0);compare_hash(step['hash']);assert io_events==step.get('events',[])
  def finish_cycle():
   finished=transition('dos-physical-yield-vector.mjs',0x126b2);result={'yield':finished}
   if finished['phase']=='callback':
    callback=model('dos-physical-script-prefix-vector.mjs',{'registers':state(),**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})});execute_steps(callback,0x126d5)
    result['callback']={'steps':len(callback['steps']),'reason':callback['reason'],'nextOpcode':callback['nextOpcode']}
    if callback['steps'] and callback['steps'][-1]['status']=='yield':finished=transition('dos-physical-yield-vector.mjs',0x126d5,{'entry':'callback-return'});result['callbackReturn']=finished
   if finished['phase']=='frame':result['frame']=transition('dos-physical-frame-vector.mjs',0x12649,{'traverseEmpty':a.traverse_empty})
   return result
  continuation=finish_cycle();previous=continuation
  for cycle_index in range(a.cycles):
   if previous.get('frame',{}).get('phase')!='return':break
   context=transition('dos-physical-context-vector.mjs',0x1264c);item={'context':context};cycles.append(item)
   if context['phase']=='skip':break
   next_prefix=model('dos-physical-script-prefix-vector.mjs',{'registers':state(),**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})});execute_steps(next_prefix,0x126b2)
   item['execution']={'steps':len(next_prefix['steps']),'reason':next_prefix['reason'],'nextOpcode':next_prefix['nextOpcode'],'last':reported(next_prefix['steps'][-1]) if next_prefix['steps'] else None}
   if not next_prefix['steps'] or next_prefix['steps'][-1]['status']!='yield':break
   item['continuation']=finish_cycle();previous=item['continuation']
 word=lambda at:int.from_bytes(cpu.mem_read(0x1c0b0+at,2),'little')
 video={'pitch':word(0x1dd5),'destinationSegment':word(0xb86),'destinationOffset':word(0xb84)}
 if continuation and 'frame' in continuation:assert video=={'pitch':320,'destinationSegment':0xa000,'destinationOffset':0}
 assert file_events==prefix['fileEvents']
 if a.checkpoint_end:
  raw=bytes(cpu.mem_read(0,0x100000));state={key:cpu.reg_read(reg) for key,reg in regs.items()}
  with (a.checkpoint_end/path.name).open('xb') as f:f.write(raw)
  with (a.checkpoint_end/path.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({'profile':meta['profile'],'captureSha256':meta['captureSha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'sourceCheckpointSha256':meta['memorySha256'],'boundary':state['ip'],'registers':state},f,indent=2)
 assert path.read_bytes()==original
 rows.append({'checkpoint':path.name,'checkpointSha256':meta['memorySha256'],'profile':meta['profile'],'scheduler':scheduler,'cycles':cycles,'videoState':video,'continuation':continuation,'portEvidence':port_evidence,'fileEvents':file_events,'steps':len(prefix['steps']),'opcodes':counts,'reason':prefix['reason'],'nextOpcode':prefix['nextOpcode'],'last':reported(prefix['steps'][-1]) if prefix['steps'] else None,'boundary':cpu.reg_read(regs['ip']),'sp':cpu.reg_read(regs['sp'])})
print(json.dumps({'equipmentWord':a.equipment_word,'currentDrive':a.current_drive,'paletteRetrace':a.palette_retrace,'resumeContext':a.resume_context,'requestedCycles':a.cycles,'firstFrame':a.first_frame,'shiftFlags':a.shift_flags,'findFirstCarry':a.find_first_carry,'caseCount':len(rows),'cases':rows,'stackMask':'07A8..07ED active CPU scratch; saved startup registers07EE..07FF compared','limits':'Authenticated native startup-root checkpoints resumed2607 without resetting state; shared-memory scheduler and supported physical opcodes compared after every step, full1MiB except explicit stack scratch and DS/ES/SI/BP/DX/CX/SP. No IRQs delivered; optional explicit DOS FindFirst carry and drive-selection replies, no DTA writes or filesystem access; stops at yield or first unsupported opcode, not complete game/frame.'}))
