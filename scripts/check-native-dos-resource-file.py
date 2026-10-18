"""Actual MAIN open, header reads and table layout; DOS is mocked.
Only the two identified read-only MAIN files and corresponding captures are accepted.
Optional --decode includes actual A1 decode and close; no complete startup claim.
--root also executes registry/notifications/context and the original loader RET.
--schedule explicitly resumes at2607 to the first dispatch for nonalias layouts;
the earlier platform services and loader caller are outside this test.
--objects also executes the contiguous opcode70 prefix after that entry.
--blocks additionally compares every following opcode41 in shared physical memory.
--assignments also checks the supported consecutive indexed opcode30 prefix.
"""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);p.add_argument('main',type=Path);p.add_argument('--decode',action='store_true');p.add_argument('--root',action='store_true');p.add_argument('--schedule',action='store_true');p.add_argument('--objects',action='store_true');p.add_argument('--blocks',action='store_true');p.add_argument('--assignments',action='store_true');a=p.parse_args();a.blocks=a.blocks or a.assignments;a.objects=a.objects or a.blocks;a.schedule=a.schedule or a.objects;a.root=a.root or a.schedule;a.decode=a.decode or a.root
memory=a.capture.read_bytes();data=a.main.read_bytes()
digest=hashlib.sha256(memory).hexdigest();file_digest=hashlib.sha256(data).hexdigest()
profiles={
 '5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7':('ishar1','27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b'),
 'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04':('ishar2','bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95')}
assert digest in profiles and file_digest==profiles[digest][1], 'Unsupported/mismatched capture and MAIN'
repo=Path(__file__).resolve().parent.parent
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
 graphics_expected=[];graphics_checked=[];scheduler_expected=[];scheduler_done=[];object_phase=[False];object_done=[]
 destination=case['preparedDecode']['registers']['ds']*16+case['preparedDecode']['registers']['dx']
 def interrupt(uc,n,_):
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
  if object_phase[0] and address in [0x126f7,0x18468]:object_done.append(address);uc.emu_stop()
  if scheduler_expected and not object_phase[0] and address in [0x126eb,0x12632]:scheduler_done.append(address);uc.emu_stop()
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
    expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-script-object-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers}),text=True,cwd=repo))
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
   expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-main-assignment-prefix-vector.mjs')],input=json.dumps({'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':registers}),text=True,cwd=repo))
   for step in expected['steps']:
    previous_sp=cpu.reg_read(UC_X86_REG_SP);object_done.clear();cpu.emu_start(0x126eb,0xfffff,count=100000)
    assert object_done==[0x126f7] and cpu.reg_read(UC_X86_REG_SP)==previous_sp
    for name,value in step['registers'].items():assert cpu.reg_read(names[name])==value,('assignment',name,cpu.reg_read(names[name]),value)
    actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0xfec0:0x1c0b0+0xff10]=bytes(0x50)
    assert hashlib.sha256(actual).hexdigest()==step['hash'],'assignment memory mismatch'
   row['assignments']={'steps':len(expected['steps']),'nextOpcode':expected['nextOpcode'],'reason':expected['reason'],'last':expected['steps'][-1] if expected['steps'] else None}
  results.append(row)
assert a.capture.read_bytes()==memory and a.main.read_bytes()==data
print(json.dumps({'profile':profiles[digest][0],'captureSha256':digest,'mainSha256':file_digest,'cases':len(vectors['cases']),'decodedBytes':vectors['decodedBytes'],'decodeAndClose':a.decode,'rootCreation':a.root,'decodeResults':results,'result':'MAIN chain through requested initialization/decode/root boundary matches','limits':('controlled DOS replies; full-memory compare at initialization; root context/registry checked; normal185E host model matches native memory except stack saves;16CE and alternate graphics not reconstructed' if a.root else 'controlled DOS replies; initialization memory checked; registry/root and notification bodies excluded')}))
