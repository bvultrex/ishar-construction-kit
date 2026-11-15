"""Actual MAIN open, header reads and table layout; DOS is mocked.
Only the two identified read-only MAIN files and corresponding captures are accepted.
Optional --decode includes actual A1 decode and close; no complete startup claim.
--root also executes registry/notifications/context and the original loader RET.
--schedule explicitly resumes at2607 to the first dispatch for nonalias layouts;
the earlier platform services and loader caller are outside this test.
--objects also executes the contiguous opcode70 prefix after that entry.
--blocks additionally compares every following opcode41 in shared physical memory.
--assignments also checks the supported consecutive indexed opcode30 prefix.
--execute then follows supported mixed opcodes using the physical script API.
--finish-main-yield compares actual26B2 completion/selection when MAIN yields.
--callback follows the actual callback; --shift-flags is an explicit INT16 AL reply.
--callback-return includes26D5 stack restoration/selection after callback yield.
--frame runs to a verified frame return/wait/device boundary; --next-main resumes264C.
--cycles N follows up to N additional yield/callback/frame/MAIN cycles on the
same CPU, stopping at the first unsupported operation or nonreturning boundary.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('main',type=Path);p.add_argument('--decode',action='store_true');p.add_argument('--root',action='store_true');p.add_argument('--schedule',action='store_true');p.add_argument('--objects',action='store_true');p.add_argument('--blocks',action='store_true');p.add_argument('--assignments',action='store_true');p.add_argument('--execute',action='store_true');p.add_argument('--finish-main-yield',action='store_true');p.add_argument('--callback',action='store_true');p.add_argument('--callback-return',action='store_true');p.add_argument('--frame',action='store_true');p.add_argument('--next-main',action='store_true');p.add_argument('--resume-after-frame',action='store_true');p.add_argument('--checkpoint',type=Path);p.add_argument('--cycles',type=int,default=0);p.add_argument('--shift-flags',type=int);a=p.parse_args();assert 0<=a.cycles<=1000;a.resume_after_frame=a.resume_after_frame or a.cycles>0;assert a.shift_flags is None or 0<=a.shift_flags<=255;a.next_main=a.next_main or a.resume_after_frame;a.frame=a.frame or a.next_main;a.callback_return=a.callback_return or a.frame;a.callback=a.callback or a.callback_return;a.finish_main_yield=a.finish_main_yield or a.callback;a.execute=a.execute or a.finish_main_yield;a.assignments=a.assignments or a.execute;a.blocks=a.blocks or a.assignments;a.objects=a.objects or a.blocks;a.schedule=a.schedule or a.objects;a.root=a.root or a.schedule;a.decode=a.decode or a.root
memory=a.capture.read_bytes();data=a.main.read_bytes()
digest=hashlib.sha256(memory).hexdigest();file_digest=hashlib.sha256(data).hexdigest()
profiles={
 '5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1','27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b'),
 'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2','bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95')}
assert digest in profiles and file_digest==profiles[digest][1], 'Unsupported/mismatched capture and MAIN'
repo=Path(__file__).resolve().parent.parent
if a.checkpoint:
 assert not any(a.checkpoint.resolve().is_relative_to(root.resolve()) for root in [repo,a.main.parent,a.capture.parent]), 'Checkpoint must stay outside repository and original/capture directories'

vectors=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-file-vectors.mjs'),str(a.main.resolve()),str(a.capture.resolve())]+(['--decode'] if a.decode else []),cwd=repo,text=True));results=[]
for case in vectors['cases']:
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,memory)
 cpu.mem_write(0x1c0b0,bytes(0x28c0)) # Explicit controlled globals, before graphics code.
 for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_DS,0x2000),(UC_X86_REG_BX,0),(UC_X86_REG_CX,0),(UC_X86_REG_DX,0x100)]:cpu.reg_write(r,v)
 for at,value in [(0xbbe,0),(0xb90,case['offset']),(0xb92,case['segment']),(0xb94,0x1234),(0xb96,case['frontier'])]:cpu.mem_write(0x1c0b0+at,value.to_bytes(2,'little'))
 cpu.mem_write(0x1c0b0+0x289b,b'\0');cpu.mem_write(0x20100,b'MAIN.IO\0')
 if a.decode:cpu.mem_write(0x1c0b0+0xb5c,b'\0\x90')
 if a.root:cpu.mem_write(0x1c0b0+0xff00,b'\0\xe0') # Controlled caller for the final loader RET.
 reads=[];read_events=[];read_boundaries=[];opens=[];open_boundaries=[];done=[];position=[0];saved_init={};init_counts=[0,0];init_end={};init_hash=[];packed_reads=[];closed=[];decode_entry=[];write_bounds=[0x100000,0];close_state={};notifications=[];registry_checked=[];notification_active=[False];registry_writes=[0]
 bios_calls=[];graphics_expected=[];graphics_checked=[];scheduler_expected=[];scheduler_done=[];object_phase=[False];object_done=[];yield_phase=[False];yield_done=[];frame_boundary=[None];frame_done=[];frame_visits=[0,0]
 destination=case['preparedDecode']['registers']['ds']*16+case['preparedDecode']['registers']['dx']
 def interrupt(uc,n,_):
  if n==0x16 and a.shift_flags is not None:
   assert uc.reg_read(UC_X86_REG_AH)==2 and uc.reg_read(UC_X86_REG_DX)==0
   bios_calls.append({'interrupt':22,'ax':uc.reg_read(UC_X86_REG_AX),'returnedAl':a.shift_flags});uc.reg_write(UC_X86_REG_AX,(uc.reg_read(UC_X86_REG_AX)&0xff00)|a.shift_flags);return
  assert n==0x21
  if uc.reg_read(UC_X86_REG_AH)==0x3e:
   assert a.decode and uc.reg_read(UC_X86_REG_BX)==5;request={name:uc.reg_read(r) for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]};request['operation']='close';closed.append(request);uc.reg_write(UC_X86_REG_AX,0);uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1);return
  if uc.reg_read(UC_X86_REG_AH)==0x3d:
   request={name:uc.reg_read(r) for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]};request.update(operation='open',drive=None);opens.append(request)
   assert bytes(uc.mem_read(0x20100,8))==b'MAIN.IO\0';uc.reg_write(UC_X86_REG_AX,5);uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1);return
  assert uc.reg_read(UC_X86_REG_AH)==0x3f
  if uc.reg_read(UC_X86_REG_DS)==0x9000:
   assert a.decode and uc.reg_read(UC_X86_REG_DX)==0 and uc.reg_read(UC_X86_REG_CX)==8000 and uc.reg_read(UC_X86_REG_BX)==5
   chunk=data[position[0]:position[0]+8000];assert chunk;position[0]+=len(chunk);packed_reads.append(len(chunk));uc.mem_write(0x90000,chunk);uc.reg_write(UC_X86_REG_AX,len(chunk));uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1);return
  request={name:uc.reg_read(r) for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]};request['operation']='read';read_events.append(request)
  ds,dx,cx,bx=[uc.reg_read(r) for r in [UC_X86_REG_DS,UC_X86_REG_DX,UC_X86_REG_CX,UC_X86_REG_BX]]
  assert bx==5 and ds==0x1c0b
  reads.append((dx,cx));chunk=data[position[0]:position[0]+cx];position[0]+=len(chunk)
  uc.mem_write(ds*16+dx,chunk);uc.reg_write(UC_X86_REG_AX,len(chunk));uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
 def code(uc,address,size,_):
  if frame_boundary[0] is not None:
   if address==0x13dc3:frame_visits[0]+=1
   if address==0x13dbb:frame_visits[1]+=1
   if address==frame_boundary[0]:frame_done.append(address);uc.emu_stop()
  if yield_phase[0] and address in [0x126eb,0x12649,0x1264f]:yield_done.append(address);uc.emu_stop()
  if object_phase[0] and address in [0x126f7,0x18468,0x126b2,0x126d5]:object_done.append(address);uc.emu_stop()
  if scheduler_expected and not object_phase[0] and not yield_phase[0] and address in [0x126eb,0x12632]:scheduler_done.append(address);uc.emu_stop()
  if a.root and address==0x1185e:
   request={'memory':base64.b64encode(bytes(uc.mem_read(0,0x100000))).decode(),'ss':uc.reg_read(UC_X86_REG_SS),'cs':uc.reg_read(UC_X86_REG_CS),'ds':uc.reg_read(UC_X86_REG_DS),'dx':uc.reg_read(UC_X86_REG_DX)}
   graphics_expected.append(json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-resource-graphics-vector.mjs')],input=json.dumps(request),text=True,cwd=repo)))
  if a.root and address==0x11b9d:
   actual=bytearray(uc.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==graphics_expected[-1]['hash'],('graphics mismatch',case['segment'],case['offset'],case['frontier'])
   graphics_checked.append(graphics_expected[-1])
  if address==0x176c2:
   open_boundaries.append(address)
   for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]:assert uc.reg_read(r)==case['opened']['registers'][name]
   for at,value in case['opened']['words'].items():assert int.from_bytes(uc.mem_read(0x1c0b0+int(at),2),'little')==value
  if address==0x177bc:
   for r in [UC_X86_REG_AX,UC_X86_REG_BX,UC_X86_REG_CX,UC_X86_REG_DX,UC_X86_REG_SI,UC_X86_REG_DI,UC_X86_REG_BP,UC_X86_REG_DS,UC_X86_REG_ES]:saved_init[r]=uc.reg_read(r)
  if address==0x1814b:init_counts[0]+=1
  if address==0x178cd:init_counts[1]+=1
  if address==0x177f6:
   for r,value in saved_init.items():assert uc.reg_read(r)==value;init_end[r]=value
   actual=bytearray(uc.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50);init_hash.append(hashlib.sha256(actual).hexdigest())
   if not a.decode:done.append(address);uc.emu_stop()
  if address==0x10000+case['preparedDecode']['entry']:
   decode_entry.append(address)
   for name,r in [('ax',UC_X86_REG_AX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]:assert uc.reg_read(r)==case['preparedDecode']['registers'][name]
   assert uc.mem_read(0x1c0b0+0xb57,1)[0]==case['preparedDecode']['pack']
  if address==0x17839:
   close_state['registers']={name:uc.reg_read(r) for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]};close_state['carry']=bool(uc.reg_read(UC_X86_REG_EFLAGS)&1);close_state['decodedHash']=hashlib.sha256(bytes(uc.mem_read(destination,vectors['decodedBytes']))).hexdigest();close_state['endSegment']=int.from_bytes(uc.mem_read(0x1c0b0+0xb14,2),'little')
   if not a.root:done.append(address);uc.emu_stop()
  if a.root and address==0x18205:
   ptr=case['root']['registry'];assert bytes(uc.mem_read(case['segment']*16+ptr['offset'],4))==ptr['moduleOffset'].to_bytes(2,'little')+ptr['moduleSegment'].to_bytes(2,'little');registry_checked.append(True)
   for at in [0xbca,0xbd0,0xbce]:assert int.from_bytes(uc.mem_read(0x1c0b0+at,2),'little')==case['root']['globals'][str(at)]
  if a.root and address in [0x1185e,0x116ce]:notifications.append(address);notification_active[0]=True
  if a.root and address in [0x11b9d,0x1184f]:notification_active[0]=False
  if address==0x18468 or a.root and address==0x1e000:done.append(address);uc.emu_stop()
  if address==0x176d8:
   read_boundaries.append(address)
   for name,r in [('ax',UC_X86_REG_AX),('bx',UC_X86_REG_BX),('cx',UC_X86_REG_CX),('dx',UC_X86_REG_DX),('ds',UC_X86_REG_DS)]:assert uc.reg_read(r)==case['reads']['registers'][name]
   assert hashlib.sha256(bytes(uc.mem_read(0x1c0b0,0x28c0))).hexdigest()==case['reads']['globalsHash']
 def write(uc,access,address,size,value,_):
  if decode_entry and not close_state and case['segment']*16<=address<0x90000:write_bounds[0]=min(write_bounds[0],address);write_bounds[1]=max(write_bounds[1],address+size)
  if a.root and notification_active[0] and not case['root']['error']:
   ptr=case['segment']*16+case['root']['registry']['offset']
   if address<ptr+4 and address+size>ptr:registry_writes[0]+=1
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_MEM_WRITE,write)
 cpu.emu_start(0x176bc,0xfffff,count=50000000 if a.root else 10000000 if a.decode else 100000)
 endpoint=(0x18468 if case['root']['error'] else 0x1e000) if a.root else 0x17839 if a.decode else 0x177f6
 assert done==[endpoint] and opens==case['opened']['events'] and open_boundaries==[0x176c2] and reads==[(0x2480,6),(0x2486,16)],(case,done)
 if not a.decode:assert position[0]==22
 assert read_boundaries==[0x176d8] and read_events==case['reads']['events']
 assert bytes(cpu.mem_read(0x1e530,22))==data[:22]
 if not a.root:
  for at,value in case['expected']['words'].items():assert int.from_bytes(cpu.mem_read(0x1c0b0+int(at),2),'little')==value,(case,at)
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00+(case['root']['stackDelta'] if a.root else 0)
 assert init_end[UC_X86_REG_AX]==case['expected']['bounds']['candidate']
 assert init_end[UC_X86_REG_DS]==case['expected']['bounds']['floor']
 assert init_hash==[case['initialized']['hash']],case
 assert init_counts==[case['initialized']['tableRecords'],case['initialized']['links']]
 if a.decode:
  assert decode_entry==[0x179e9] and closed==case['closed']['events'] and packed_reads
  assert close_state['registers']==case['closed']['registers'] and close_state['carry']==case['closed']['carry']
  assert close_state['decodedHash']==vectors['decodedSha256']
  assert write_bounds[0]==destination;extra=write_bounds[1]-destination-vectors['decodedBytes'];assert 0<=extra<=255
  assert close_state['endSegment']==(destination+vectors['decodedBytes'])>>4
  assert close_state['registers']['cx']==(destination+vectors['decodedBytes'])&15
  row={'tableBaseSegment':case['segment'],'tableBaseOffset':case['offset'],'upperFrontier':case['frontier'],'destination':destination,'packedReads':packed_reads,'writesPastDeclaredSize':extra,'decodedSha256':vectors['decodedSha256']}
  if a.root:
   root=case['root']
   for at,value in root['globals'].items():assert int.from_bytes(cpu.mem_read(0x1c0b0+int(at),2),'little')==value,(case,at)
   if root['error']:
    assert cpu.reg_read(UC_X86_REG_AX)==root['error'] and notifications==[];row['rootError']=root['error']
   else:
    assert notifications==[0x1185e,0x116ce] and registry_checked==[True] and len(graphics_checked)==1
    assert cpu.reg_read(UC_X86_REG_ES)==case['segment'] and cpu.reg_read(UC_X86_REG_BX)==root['context']
    assert hashlib.sha256(bytes(cpu.mem_read(case['segment']*16+root['rangeStart'],root['rangeLength']))).hexdigest()==root['rangeHash']
    assert int.from_bytes(cpu.mem_read(case['segment']*16+root['tableOffset'],2),'little')==root['context']
    ptr=root['registry'];retained=bytes(cpu.mem_read(case['segment']*16+ptr['offset'],4))==ptr['moduleOffset'].to_bytes(2,'little')+ptr['moduleSegment'].to_bytes(2,'little')
    if not retained:assert ptr['overlapsModule'] and registry_writes[0]>0,'Unexpected registry corruption outside observed notification alias'
    assert hashlib.sha256(bytes(cpu.mem_read(destination,24))).hexdigest()==root['headerSha256']
    row.update(rootError=None,rootContext=root['context'],rootEntry=root['entry'],notificationCalls=notifications,graphicsModel=graphics_checked[0],registryOverlapsModule=ptr['overlapsModule'],registryPointerRetainedAfterNotifications=retained,notificationWritesOverRegistry=registry_writes[0],convertedModuleSha256=hashlib.sha256(bytes(cpu.mem_read(destination,vectors['decodedBytes']))).hexdigest())
  if a.schedule and a.root and not root['error'] and not root['registry']['overlapsModule']:
   request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':cpu.reg_read(UC_X86_REG_SS),'es':cpu.reg_read(UC_X86_REG_ES),'ds':cpu.reg_read(UC_X86_REG_DS)}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-scheduler-vector.mjs')],input=json.dumps(request),text=True,cwd=repo));scheduler_expected.append(expected)
   previous={r:cpu.reg_read(r) for r in [UC_X86_REG_SP,UC_X86_REG_DX,UC_X86_REG_CX]}
   cpu.emu_start(0x12607,0xfffff,count=10000)
   assert scheduler_done==[0x10000+expected['entry']]
   for r,name in [(UC_X86_REG_BP,'bp'),(UC_X86_REG_SI,'si'),(UC_X86_REG_DS,'ds'),(UC_X86_REG_ES,'es'),(UC_X86_REG_BX,'bx')]:assert cpu.reg_read(r)==expected[name],('scheduler',name)
   assert cpu.reg_read(UC_X86_REG_SP)==previous[UC_X86_REG_SP]+expected['stackDelta']
   for r in [UC_X86_REG_DX,UC_X86_REG_CX]:assert cpu.reg_read(r)==previous[r]
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],'scheduler memory mismatch'
   row['scheduler']={**expected,'opcode':cpu.mem_read(expected['ds']*16+expected['si'],1)[0] if expected['phase']!='skip' else None}
  if a.objects and 'scheduler' in row:
   row['objects']=[];object_phase[0]=True
   while cpu.mem_read(cpu.reg_read(UC_X86_REG_DS)*16+cpu.reg_read(UC_X86_REG_SI),1)[0]==70:
    assert len(row['objects'])<100,'Object prefix host bound exceeded'
    registers={name:cpu.reg_read(r) for name,r in [('ds',UC_X86_REG_DS),('es',UC_X86_REG_ES),('si',UC_X86_REG_SI),('bx',UC_X86_REG_BX),('di',UC_X86_REG_DI),('dx',UC_X86_REG_DX)]}
    registers['si']=(registers['si']+1)&65535;registers['bx']=140 #26EB fetch/dispatch before handler entry.
    expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-object-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers,**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})}),text=True,cwd=repo))
    previous_sp=cpu.reg_read(UC_X86_REG_SP);object_done.clear();cpu.emu_start(0x126eb,0xfffff,count=100000)
    assert object_done==[0x18468 if expected['error'] else 0x126f7]
    names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bx':UC_X86_REG_BX,'di':UC_X86_REG_DI,'dx':UC_X86_REG_DX,'ax':UC_X86_REG_AX,'cx':UC_X86_REG_CX}
    for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,('loaded object',name)
    assert cpu.reg_read(UC_X86_REG_SP)==previous_sp+expected['stackDelta']-(2 if expected['error'] else 0)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==expected['hash'],'loaded object memory mismatch'
    row['objects'].append(expected)
    if expected['error']:break
   row['nextOpcode']=cpu.mem_read(cpu.reg_read(UC_X86_REG_DS)*16+cpu.reg_read(UC_X86_REG_SI),1)[0]
  if a.blocks and 'objects' in row:
   request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'ds':cpu.reg_read(UC_X86_REG_DS),'es':cpu.reg_read(UC_X86_REG_ES),'si':cpu.reg_read(UC_X86_REG_SI),'bp':cpu.reg_read(UC_X86_REG_BP)}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-block-prefix-vector.mjs')],input=json.dumps(request),text=True,cwd=repo))
   for step in expected['steps']:
    assert cpu.mem_read(cpu.reg_read(UC_X86_REG_DS)*16+cpu.reg_read(UC_X86_REG_SI),1)[0]==41
    saved={r:cpu.reg_read(r) for r in [UC_X86_REG_SP,UC_X86_REG_CX,UC_X86_REG_DX,UC_X86_REG_DI,UC_X86_REG_BP,UC_X86_REG_DS,UC_X86_REG_ES]}
    object_done.clear();cpu.emu_start(0x126eb,0xfffff,count=100000)
    assert object_done==[0x126f7] and cpu.reg_read(UC_X86_REG_SI)==step['si']
    for r,value in saved.items():assert cpu.reg_read(r)==value,('block preserved register',r)
    assert cpu.reg_read(UC_X86_REG_AX)==82 and cpu.reg_read(UC_X86_REG_BX)==82
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==step['hash'],'loaded block memory mismatch'
   row['blocks']={'steps':len(expected['steps']),'si':expected['si'],'nextOpcode':expected['nextOpcode'],'lastHash':expected['steps'][-1]['hash'] if expected['steps'] else None}
  if a.assignments and 'blocks' in row:
   names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX,'bx':UC_X86_REG_BX,'di':UC_X86_REG_DI,'ax':UC_X86_REG_AX}
   registers={name:cpu.reg_read(names[name]) for name in ['ds','es','si','bp','dx']}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-assignment-prefix-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers,**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})}),text=True,cwd=repo))
   for step in expected['steps']:
    previous_sp=cpu.reg_read(UC_X86_REG_SP);object_done.clear();cpu.emu_start(0x126eb,0xfffff,count=100000)
    assert object_done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==previous_sp
    for name,value in step['registers'].items():assert cpu.reg_read(names[name])==value,('assignment',name,cpu.reg_read(names[name]),value)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==step['hash'],'assignment memory mismatch'
   row['assignments']={'steps':len(expected['steps']),'nextOpcode':expected['nextOpcode'],'reason':expected['reason'],'last':expected['steps'][-1] if expected['steps'] else None}
  if a.execute and 'assignments' in row:
   names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
   registers={name:cpu.reg_read(r) for name,r in names.items()}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-script-prefix-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers,**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})}),text=True,cwd=repo))
   for index,step in enumerate(expected['steps']):
    assert cpu.mem_read(cpu.reg_read(UC_X86_REG_DS)*16+cpu.reg_read(UC_X86_REG_SI),1)[0]==step['opcode']
    previous_sp=cpu.reg_read(UC_X86_REG_SP);object_done.clear();cpu.emu_start(0x126eb,0xfffff,count=100000)
    yielding=step['status']=='yield';assert object_done==[0x126b2 if yielding else 0x126f7] and cpu.reg_read(UC_X86_REG_SP)==previous_sp+(2 if yielding else 0),(index,step)
    for name,value in step['registers'].items():assert cpu.reg_read(names[name])==value,('physical step',index,step['opcode'],name,cpu.reg_read(names[name]),value)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==step['hash'],('physical step memory',index,step['opcode'])
   row['execution']={'steps':len(expected['steps']),'opcodes':sorted(set(step['opcode'] for step in expected['steps'])),'nextOpcode':expected['nextOpcode'],'reason':expected['reason'],'last':expected['steps'][-1] if expected['steps'] else None}
  if a.finish_main_yield and 'execution' in row and row['execution']['last']['status']=='yield':
   names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
   registers={name:cpu.reg_read(r) for name,r in names.items()}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-yield-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers,**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})}),text=True,cwd=repo))
   previous_sp=cpu.reg_read(UC_X86_REG_SP);yield_phase[0]=True;object_phase[0]=False;cpu.emu_start(0x126b2,0xfffff,count=100000)
   assert yield_done==[0x10000+expected['entry']] and cpu.reg_read(UC_X86_REG_SP)==previous_sp+expected['stackDelta']
   for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,('yield finish',name,cpu.reg_read(names[name]),value)
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],'yield finish memory mismatch'
   row['yieldFinish']=expected
  if a.callback and 'yieldFinish' in row and row['yieldFinish']['phase']=='callback':
   yield_phase[0]=False;object_phase[0]=True
   names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
   registers={name:cpu.reg_read(r) for name,r in names.items()}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-script-prefix-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers,**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})}),text=True,cwd=repo))
   for index,step in enumerate(expected['steps']):
    assert cpu.mem_read(cpu.reg_read(UC_X86_REG_DS)*16+cpu.reg_read(UC_X86_REG_SI),1)[0]==step['opcode']
    previous_sp=cpu.reg_read(UC_X86_REG_SP);object_done.clear();cpu.emu_start(0x126eb,0xfffff,count=100000)
    yielding=step['status']=='yield';assert object_done==[0x126d5 if yielding else 0x126f7] and cpu.reg_read(UC_X86_REG_SP)==previous_sp+(2 if yielding else 0)
    for name,value in step['registers'].items():assert cpu.reg_read(names[name])==value,('callback step',index,step['opcode'],name)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==step['hash'],('callback memory',index,step['opcode'])
   row['callback']={'shiftFlags':a.shift_flags,'biosCalls':bios_calls,'steps':len(expected['steps']),'nextOpcode':expected['nextOpcode'],'reason':expected['reason'],'last':expected['steps'][-1] if expected['steps'] else None}
  if a.callback_return and 'callback' in row and row['callback']['last']['status']=='yield':
   registers={name:cpu.reg_read(r) for name,r in names.items()}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-yield-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers,'entry':'callback-return'}),text=True,cwd=repo))
   yield_phase[0]=True;object_phase[0]=False;yield_done.clear();previous_sp=cpu.reg_read(UC_X86_REG_SP);cpu.emu_start(0x126d5,0xfffff,count=100000)
   assert yield_done==[0x10000+expected['entry']] and cpu.reg_read(UC_X86_REG_SP)==previous_sp
   for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,('callback finish',name)
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],'callback finish memory mismatch'
   row['callbackReturn']=expected
  if a.frame and 'callbackReturn' in row and row['callbackReturn']['phase']=='frame':
   registers={name:cpu.reg_read(r) for name,r in names.items()}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-frame-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers}),text=True,cwd=repo))
   frame_boundary[0]=0x10000+expected['entry'];yield_phase[0]=False;previous_sp=cpu.reg_read(UC_X86_REG_SP);cpu.emu_start(0x12649,0xfffff,count=100000)
   assert frame_done==[frame_boundary[0]] and cpu.reg_read(UC_X86_REG_SP)==previous_sp+expected['stackDelta']
   for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,('frame',name,cpu.reg_read(names[name]),value)
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],'physical frame memory mismatch'
   assert frame_visits==[expected['visited'],expected['hidden']]
   row['frame']=expected
  if a.next_main and 'frame' in row and row['frame']['phase']=='return':
   registers={name:cpu.reg_read(r) for name,r in names.items()}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-context-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers}),text=True,cwd=repo))
   frame_boundary[0]=0x10000+expected['entry'];frame_done.clear();previous_sp=cpu.reg_read(UC_X86_REG_SP);object_phase[0]=True;cpu.emu_start(0x1264c,0xfffff,count=100000)
   assert frame_done==[frame_boundary[0]] and cpu.reg_read(UC_X86_REG_SP)==previous_sp+expected['stackDelta']
   for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,('next main',name)
   actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
   assert hashlib.sha256(actual).hexdigest()==expected['hash'],'next main memory mismatch'
   row['nextMain']={**expected,'opcode':cpu.mem_read(cpu.reg_read(UC_X86_REG_DS)*16+cpu.reg_read(UC_X86_REG_SI),1)[0]}
  if a.resume_after_frame and 'nextMain' in row and row['nextMain']['phase']=='main':
   frame_boundary[0]=None;object_phase[0]=True
   registers={name:cpu.reg_read(r) for name,r in names.items()}
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-script-prefix-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers,**({'shiftFlags':a.shift_flags} if a.shift_flags is not None else {})}),text=True,cwd=repo))
   for index,step in enumerate(expected['steps']):
    assert cpu.mem_read(cpu.reg_read(UC_X86_REG_DS)*16+cpu.reg_read(UC_X86_REG_SI),1)[0]==step['opcode']
    previous_sp=cpu.reg_read(UC_X86_REG_SP);object_done.clear();cpu.emu_start(0x126eb,0xfffff,count=100000)
    yielding=step['status']=='yield';assert object_done==[0x126b2 if yielding else 0x126f7] and cpu.reg_read(UC_X86_REG_SP)==previous_sp+(2 if yielding else 0)
    for name,value in step['registers'].items():assert cpu.reg_read(names[name])==value,('resumed MAIN',index,step['opcode'],name)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==step['hash'],('resumed MAIN memory',index,step['opcode'])
   row['resumedMain']={'steps':len(expected['steps']),'nextOpcode':expected['nextOpcode'],'reason':expected['reason'],'last':expected['steps'][-1] if expected['steps'] else None}
  if a.cycles and 'resumedMain' in row and row['resumedMain']['last']['status']=='yield':
   scheduler_expected.clear();object_phase[0]=False;yield_phase[0]=False;row['cycles']=[]
   def model(script,extra=None):
    request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':{name:cpu.reg_read(r) for name,r in names.items()}}
    if a.shift_flags is not None:request['shiftFlags']=a.shift_flags
    request.update(extra or {})
    return json.loads(subprocess.check_output(['node',str(repo/'scripts'/script)],input=json.dumps(request),text=True,cwd=repo))
   def compare(start,expected,endpoint,stack_delta):
    frame_boundary[0]=endpoint;frame_done.clear();previous_sp=cpu.reg_read(UC_X86_REG_SP)
    cpu.emu_start(start,0xfffff,count=100000)
    assert frame_done==[endpoint] and cpu.reg_read(UC_X86_REG_SP)==(previous_sp+stack_delta)&65535,('cycle endpoint',start,endpoint)
    for name,value in expected['registers'].items():assert cpu.reg_read(names[name])==value,('cycle register',start,name)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==expected['hash'],('cycle memory',start)
   def prefix(callback=False):
    result=model('dos-physical-script-prefix-vector.mjs')
    for step in result['steps']:
     yielding=step['status']=='yield'
     compare(0x126eb,step,(0x126d5 if callback else 0x126b2) if yielding else 0x126f7,2 if yielding else 0)
    return {'steps':len(result['steps']),'nextOpcode':result['nextOpcode'],'reason':result['reason'],'last':result['steps'][-1] if result['steps'] else None}
   for cycle in range(a.cycles):
    item={'cycle':cycle+1};row['cycles'].append(item)
    finish=model('dos-physical-yield-vector.mjs');compare(0x126b2,finish,0x10000+finish['entry'],finish['stackDelta']);item['yieldFinish']=finish
    if finish['phase']!='callback':break
    callback=prefix(True);item['callback']=callback
    if not callback['last'] or callback['last']['status']!='yield':break
    returned=model('dos-physical-yield-vector.mjs',{'entry':'callback-return'});compare(0x126d5,returned,0x10000+returned['entry'],returned['stackDelta']);item['callbackReturn']=returned
    if returned['phase']!='frame':break
    frame=model('dos-physical-frame-vector.mjs');compare(0x12649,frame,0x10000+frame['entry'],frame['stackDelta']);item['frame']=frame
    if frame['phase']!='return':break
    context=model('dos-physical-context-vector.mjs');compare(0x1264c,context,0x10000+context['entry'],context['stackDelta']);item['context']=context
    if context['phase']!='main':break
    main=prefix();item['main']=main
    if not main['last'] or main['last']['status']!='yield':break
  if a.checkpoint and 'cycles' in row:
   a.checkpoint.mkdir(parents=True,exist_ok=True)
   stem=f"{case['segment']:04x}-{case['offset']:04x}-{case['frontier']:04x}"
   (a.checkpoint/(stem+'.bin')).write_bytes(bytes(cpu.mem_read(0,0x100000)))
   state={name:cpu.reg_read(r) for name,r in {**names,'cs':UC_X86_REG_CS,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'ip':UC_X86_REG_IP,'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'di':UC_X86_REG_DI,'flags':UC_X86_REG_EFLAGS}.items()}
   (a.checkpoint/(stem+'.json')).write_text(json.dumps(state))
  results.append(row)
assert a.capture.read_bytes()==memory and a.main.read_bytes()==data
print(json.dumps({'profile':profiles[digest][0],'captureSha256':digest,'mainSha256':file_digest,'cases':len(vectors['cases']),'decodedBytes':vectors['decodedBytes'],'decodeAndClose':a.decode,'rootCreation':a.root,'decodeResults':results,'result':'MAIN chain through requested initialization/decode/root boundary matches','limits':('controlled DOS replies; full-memory compare at initialization; root context/registry checked; normal185E host model matches native memory except stack saves;16CE and alternate graphics not reconstructed' if a.root else 'controlled DOS replies; initialization memory checked; registry/root and notification bodies excluded')}))
