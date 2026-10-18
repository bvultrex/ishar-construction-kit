"""Continue original-startup430A checkpoints through following solid/type16 records."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('--checkpoint-end',type=Path);p.add_argument('--all-records',action='store_true');p.add_argument('--present',action='store_true');p.add_argument('--stop-unsupported',action='store_true');a=p.parse_args();assert not(a.present and a.stop_unsupported);a.all_records=a.all_records or a.present;repo=Path(__file__).resolve().parent.parent;rows=[];g=0x1c0b0
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
if a.checkpoint_end:
 assert not any(a.checkpoint_end.resolve().is_relative_to(root.resolve()) for root in [repo,a.checkpoints]),'Output must stay outside repo/input checkpoint directory'
 a.checkpoint_end.mkdir(parents=True,exist_ok=True)
paths=sorted(a.checkpoints.glob('*.bin'));assert paths
for path in paths:
 source=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert hashlib.sha256(source).hexdigest()==meta['memorySha256'] and len(source)==0x100000;assert meta['boundary']==0x430a and meta['registers']['ip']==0x430a and meta['captureSha256']=={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}[meta['profile']]
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
 for key,value in meta['registers'].items():cpu.reg_write(regs[key],value)
 def model(script,extra):
  request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':{key:cpu.reg_read(regs[key]) for key in ['ds','es','si','bp','dx','cx']},'stackMaskStart':0x798,'stackMaskEnd':0x7ee,**extra}
  return json.loads(subprocess.check_output(['node',str(repo/'scripts'/script)],input=json.dumps(request),text=True,cwd=repo))
 def compare(start,expected,target):
  done=[];sp=cpu.reg_read(regs['sp'])
  def stop(uc,address,size,_):done.append(True);uc.emu_stop()
  h=cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(start,0xfffff,count=200000);cpu.hook_del(h);assert done==[True] and cpu.reg_read(regs['sp'])==sp+expected['stackDelta']
  for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,(key,cpu.reg_read(regs[key]),value)
  for key in ['bx','di']:
   if key in expected:assert cpu.reg_read(regs[key])==expected[key],key
  actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x798:g+0x7ee]=bytes(86);assert hashlib.sha256(actual).hexdigest()==expected['hash'],('physical memory',hex(start))
 steps=[];unsupported_type=None
 for index in range(500 if a.all_records else 3):
  advanced=model('dos-pixel-record-next-vector.mjs',{'bx':cpu.reg_read(regs['bx']),'di':cpu.reg_read(regs['di']),'sp':cpu.reg_read(regs['sp'])});compare(0x1430a,advanced,0x10000+advanced['entry']);
  if advanced['phase']!='record':steps.append({'advance':advanced});break
  sprite=model('dos-sprite-blit-vector.mjs',{'di':advanced['di']});compare(0x10000+advanced['entry'],sprite,sprite['graphicsSegment']*16+sprite['entry'])
  if sprite['phase']!='format' or sprite['type'] not in [1,16]:
   assert a.stop_unsupported,('unsupported sprite boundary',sprite.get('phase'),sprite.get('type'),sprite.get('entry'))
   unsupported_type=sprite.get('type');steps.append({'advance':advanced,'sprite':sprite,'unsupportedFormat':unsupported_type});break
  drawn=model('dos-solid-blit-vector.mjs' if sprite['type']==1 else 'dos-nibble-blit-vector.mjs',{'di':sprite['di']});writes=[0];target_base=drawn['destination']['segment']*16
  def write(uc,access,address,size,value,_):
   if target_base<=address<target_base+65536:writes[0]+=size
  h=cpu.hook_add(UC_HOOK_MEM_WRITE,write);compare(sprite['graphicsSegment']*16+sprite['entry'],drawn,0x10000+drawn['entry']);cpu.hook_del(h);assert writes[0]==drawn['pixelWrites'];steps.append({'advance':advanced,'sprite':sprite,'draw':drawn,'nativePixelWrites':writes[0]})
 presentation=None
 if a.present:
  assert advanced['phase']=='next-object'
  ended=model('dos-pixel-objects-end-vector.mjs',{'bx':cpu.reg_read(regs['bx']),'di':cpu.reg_read(regs['di'])});compare(0x1442f,ended,0x10000+ended['entry']);assert ended['phase']=='present'
  assert cpu.mem_read(g+0xcb1,1)[0]>=128
  saved={key:cpu.reg_read(reg) for key,reg in regs.items()};assert not(saved['flags']&0x400);sp=saved['sp'];done=[]
  def present_entry(uc,address,size,_):done.append(True);uc.emu_stop()
  h=cpu.hook_add(UC_HOOK_CODE,present_entry,None,0x1e980,0x1e980);cpu.emu_start(0x1431f,0xfffff,count=100);cpu.hook_del(h);assert done==[True] and cpu.reg_read(regs['sp'])==sp-4
  present=model('dos-vga-present-vector.mjs',{});writes=[0]
  def vga_write(uc,access,address,size,value,_):
   if 0xa0000<=address<0xb0000:writes[0]+=size
  h=cpu.hook_add(UC_HOOK_MEM_WRITE,vga_write);compare(0x1e980,present,0x10000+present['entry']);cpu.hook_del(h);assert writes[0]==present['copiedBytes']
  for key in ['ax','bx','cx','dx','di','si','bp','ds','es']:assert cpu.reg_read(regs[key])==saved[key]
  presentation={'objectsEnd':ended,'copy':present,'nativeVgaWrites':writes[0],'vgaSha256':hashlib.sha256(bytes(cpu.mem_read(0xa0000,64000))).hexdigest()}
 if not a.all_records:assert [x['sprite']['type'] for x in steps]==[1,1,16]
 assert path.read_bytes()==source
 if a.checkpoint_end:
  raw=bytes(cpu.mem_read(0,0x100000));state={key:cpu.reg_read(reg) for key,reg in regs.items()}
  with (a.checkpoint_end/path.name).open('xb') as f:f.write(raw)
  with (a.checkpoint_end/path.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({'profile':meta['profile'],'captureSha256':meta['captureSha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'sourceCheckpointSha256':meta['memorySha256'],'boundary':state['ip'],'registers':state},f,indent=2)
 rows.append({'checkpoint':path.name,'checkpointSha256':meta['memorySha256'],'stoppedUnsupportedType':unsupported_type,'completeChain':advanced['phase']=='next-object','presentation':presentation,'steps':steps,'renderBufferSegment':int.from_bytes(cpu.mem_read(g+0xb8a,2),'little'),'renderBufferSha256':hashlib.sha256(bytes(cpu.mem_read(int.from_bytes(cpu.mem_read(g+0xb8a,2),'little')*16,64000))).hexdigest(),'boundary':cpu.reg_read(regs['ip'])})
print(json.dumps({'profiles':sorted({json.loads(p.with_suffix('.json').read_text())['profile'] for p in paths}),'present':a.present,'allRecords':a.all_records,'caseCount':len(rows),'cases':rows,'stackMask':'0798..07ED active CPU stack; original entry saves compared','limits':'Optional --stop-unsupported stops at a verified format boundary without drawing that record. Original430A saved-register return/record traversal and supported type1/type16 pixels; --all-records completes the current chain; --present additionally compares active-object completion and the original direct VGA word copy, full1MiB except stack plus script registers/BX/DI/SP and pixel-write counts. No IRQ/device injection, no complete displayed frame or mirrored type16 claim.'}))
