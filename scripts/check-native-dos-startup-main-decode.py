"""Resume authenticated actual-startup checkpoints through native A1 and close.
No globals, resource pointers, decoder buffer or registers are reset.
This verifies output/transition, not complete decoder scratch memory equivalence.
"""
import argparse,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('main',type=Path);p.add_argument('--root',action='store_true');p.add_argument('--checkpoint-root',type=Path);a=p.parse_args();repo=Path(__file__).resolve().parent.parent;data=a.main.read_bytes();rows=[]
profiles={'ishar1':('5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b'),'ishar2':('f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04','bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95')}
if a.checkpoint_root:
 assert a.root,'Root checkpoint requires --root'
 assert not any(a.checkpoint_root.resolve().is_relative_to(root.resolve()) for root in [repo,a.main.parent,a.checkpoints]),'Private output must stay outside repo/original/input checkpoint directories'
 a.checkpoint_root.mkdir(parents=True,exist_ok=True)
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
paths=sorted(a.checkpoints.glob('*.bin'));assert paths,'No startup checkpoints'
for path in paths:
 original=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert len(original)==0x100000 and hashlib.sha256(original).hexdigest()==meta['memorySha256'];profile=meta['profile'];assert meta['captureSha256']==profiles[profile][0] and hashlib.sha256(data).hexdigest()==profiles[profile][1];assert meta['boundary']==0x77f6 and meta['registers']['cs']==0x1000 and meta['registers']['ip']==0x77f6
 expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-startup-main-decode-vector.mjs'),str(path.resolve()),str(a.main.resolve())],text=True,cwd=repo));cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original)
 for key,value in meta['registers'].items():cpu.reg_write(regs[key],value)
 root_phase=[False];notifications=[]
 position=[22];reads=[];close=[];done=[];entry=[];writes=[0x100000,0];active=[False];g=0x1c0b0
 def interrupt(uc,number,_):
  assert number==0x21;ax=uc.reg_read(UC_X86_REG_AX);ah=ax>>8
  if ah==0x3f:
   ds=uc.reg_read(UC_X86_REG_DS);dx=uc.reg_read(UC_X86_REG_DX);cx=uc.reg_read(UC_X86_REG_CX);bx=uc.reg_read(UC_X86_REG_BX);assert ds==expected['bufferSegment'] and dx==0 and cx==8000 and bx==expected['closed']['registers']['bx'];chunk=data[position[0]:position[0]+cx];assert chunk;position[0]+=len(chunk);uc.mem_write(ds*16,chunk);reads.append({'segment':ds,'offset':dx,'requested':cx,'returned':len(chunk)});uc.reg_write(UC_X86_REG_AX,len(chunk))
  elif ah==0x3e:assert uc.reg_read(UC_X86_REG_BX)==expected['closed']['registers']['bx'];close.append(True);active[0]=False;uc.reg_write(UC_X86_REG_AX,0)
  else:assert ah==0xe and uc.reg_read(UC_X86_REG_DX)&255==original[g+0x289c];uc.reg_write(UC_X86_REG_AX,3)
  uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
 def code(uc,address,size,_):
  if address==0x10000+expected['prepared']['entry']:
   entry.append(True);active[0]=True
   for key,value in expected['prepared']['registers'].items():assert uc.reg_read(regs[key])==value
   assert uc.mem_read(g+0xb57,1)[0]==expected['prepared']['pack']
  if address==0x10000+expected['boundary'] and not root_phase[0]:done.append(True);uc.emu_stop()
  if root_phase[0] and address in [0x1185e,0x116ce,0x11b9e]:notifications.append(address)
  if root_phase[0] and address==0x12607:done.append(True);uc.emu_stop()
 def write(uc,access,address,size,value,_):
  if active[0] and expected['destination']<=address<expected['destination']+expected['decodedBytes']+256:writes[0]=min(writes[0],address);writes[1]=max(writes[1],address+size)
 cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_MEM_WRITE,write);cpu.emu_start(0x177f6,0xfffff,count=10000000)
 assert done==entry==close==[True] and reads
 for key,value in expected['closed']['registers'].items():assert cpu.reg_read(regs[key])==value,(key,cpu.reg_read(regs[key]),value)
 assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&1)==expected['closed']['carry'];assert cpu.reg_read(UC_X86_REG_SP)==meta['registers']['sp']
 actual=bytes(cpu.mem_read(expected['destination'],expected['decodedBytes']));assert hashlib.sha256(actual).hexdigest()==expected['decodedSha256'];assert int.from_bytes(cpu.mem_read(g+0xb14,2),'little')==expected['closed']['endSegment'];assert writes[0]==expected['destination'] and 0<=writes[1]-expected['destination']-expected['decodedBytes']<=255
 root_result=None
 if a.root:
  root_phase[0]=True;cpu.emu_start(0x17839,0xfffff,count=10000000);assert done==[True,True]
  root=expected['root'];assert cpu.reg_read(UC_X86_REG_ES)==root['es'] and cpu.reg_read(UC_X86_REG_BX)==root['context'];assert cpu.reg_read(UC_X86_REG_SP)==meta['registers']['sp']+6
  for at,value in root['globals'].items():assert int.from_bytes(cpu.mem_read(g+int(at),2),'little')==value,(at,value)
  actual_context=bytes(cpu.mem_read(root['es']*16+root['rangeStart'],root['rangeLength']));assert hashlib.sha256(actual_context).hexdigest()==root['rangeSha256']
  assert int.from_bytes(cpu.mem_read(root['es']*16+int.from_bytes(original[g+0xbd2:g+0xbd4],'little'),2),'little')==root['context'];assert notifications==([0x1185e,0x116ce] if original[g+0x2898]==0 else [0x116ce])
  root_result={**root,'notifications':notifications,'sp':cpu.reg_read(UC_X86_REG_SP)}
  if a.checkpoint_root:
   raw=bytes(cpu.mem_read(0,0x100000));state={key:cpu.reg_read(reg) for key,reg in regs.items()}
   with (a.checkpoint_root/path.name).open('xb') as f:f.write(raw)
   with (a.checkpoint_root/path.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({'profile':profile,'captureSha256':meta['captureSha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'sourceCheckpointSha256':meta['memorySha256'],'mainSha256':expected['fileSha256'],'boundary':0x2607,'registers':state},f,indent=2)
 assert path.read_bytes()==original
 rows.append({'checkpoint':path.name,'checkpointSha256':meta['memorySha256'],'profile':profile,'destination':expected['destination'],'bufferSegment':expected['bufferSegment'],'decodedBytes':expected['decodedBytes'],'decodedSha256':expected['decodedSha256'],'reads':reads,'writesPastDeclaredSize':writes[1]-expected['destination']-expected['decodedBytes'],'boundary':expected['boundary'],'sp':cpu.reg_read(UC_X86_REG_SP),'closed':expected['closed'],'root':root_result})
assert a.main.read_bytes()==data
print(json.dumps({'mainSha256':hashlib.sha256(data).hexdigest(),'root':a.root,'caseCount':len(rows),'cases':rows,'limits':'Original startup checkpoints resumed at77F6 through A1 decode and close7839; no pointer/global resets; parser output bytes/hash, decode input AX/CX/DX/DS, B57/B14 and final AX/BX/CX/DX/DS/CF/SP checked. Explicit successful DOS reads/close; no IRQ delivered during decode. Decoder scratch/full-memory equivalence and optional --root executes native registry/graphics notifications/context and actual caller RETs to2607, checking context range, globals, ES/BX/SP; notification bodies not fully reconstructed.'}))
