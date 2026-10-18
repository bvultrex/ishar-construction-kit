"""Actual-startup visible-object checkpoints through first original render-buffer pixel fill."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('--checkpoint-end',type=Path);a=p.parse_args();repo=Path(__file__).resolve().parent.parent;rows=[];g=0x1c0b0;mask_start=0x79e;mask_end=0x7ee
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
if a.checkpoint_end:
 assert not any(a.checkpoint_end.resolve().is_relative_to(root.resolve()) for root in [repo,a.checkpoints]),'Private output must stay outside repository/input checkpoint directories'
 a.checkpoint_end.mkdir(parents=True,exist_ok=True)
paths=sorted(a.checkpoints.glob('*.bin'));assert paths
for path in paths:
 source=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256'];assert meta['captureSha256']=={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}[meta['profile']] and meta['boundary']==0x3de4;assert meta['registers']['cs']==0x1000 and meta['registers']['ip']==0x3de4
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
 for key,value in meta['registers'].items():cpu.reg_write(regs[key],value)
 def state():return {key:cpu.reg_read(regs[key]) for key in ['ds','es','si','bp','dx','cx']}
 def request(extra=None):return {'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':state(),'stackMaskStart':mask_start,'stackMaskEnd':mask_end,**(extra or {})}
 def model(script,extra=None,snapshot=None):return json.loads(subprocess.check_output(['node',str(repo/'scripts'/script)],input=json.dumps(snapshot or request(extra)),text=True,cwd=repo))
 def run(start,target,delta=None,limit=200000):
  done=[];sp=cpu.reg_read(regs['sp'])
  def stop(uc,address,size,_):done.append(True);uc.emu_stop()
  h=cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(start,0xfffff,count=limit);cpu.hook_del(h);assert done==[True],(hex(start),hex(target))
  if delta is not None:assert cpu.reg_read(regs['sp'])==sp+delta
 def compare(start,expected,target,delta):
  run(start,target,delta)
  for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,('script register',key)
  for key in ['bx','di']:
   if key in expected:assert cpu.reg_read(regs[key])==expected[key],key
  actual=bytearray(cpu.mem_read(0,0x100000));actual[g+mask_start:g+mask_end]=bytes(mask_end-mask_start);assert hashlib.sha256(actual).hexdigest()==expected['hash'],('physical memory',hex(start))
 def interrupt(uc,number,_):raise AssertionError(f'Unexpected interrupt{number:02X}')
 cpu.hook_add(UC_HOOK_INTR,interrupt)
 owner=cpu.reg_read(regs['bx']);batch_snapshot=request({'object':owner});prepared=model('dos-visible-object-vector.mjs',{'object':owner});compare(0x13de4,prepared,0x10000+prepared['entry'],prepared['stackDelta']);assert prepared['phase'] in ('new-record','changed-record','other-record')
 projected=None;committed=None
 if prepared['phase']=='new-record':
  run(0x1408a,0x136e1,-4,20);projected=model('dos-record-projection-vector.mjs',{'di':prepared['di']});compare(0x136e1,projected,0x140dc,2)
  committed=model('dos-projected-record-vector.mjs',{'di':prepared['di'],'bx':prepared['bx']});compare(0x140dc,committed,0x1408d,2)
  batch=model('dos-object-batch-vector.mjs',snapshot=batch_snapshot);compare(0x1408d,batch,0x10000+batch['entry'],6);assert batch['phase']=='pixels'
 else:
  batch=model('dos-object-batch-vector.mjs',snapshot=batch_snapshot);compare(0x10000+prepared['entry'],batch,0x10000+batch['entry'],6);assert batch['phase']=='pixels'
 pixels=model('dos-pixel-batch-vector.mjs',{'bx':batch['bx'],'di':batch['di'],'callerEntry':batch['entry']});compare(0x10000+batch['entry'],pixels,0x10000+pixels['entry'],pixels['stackDelta']);assert pixels['phase']=='record'
 sprite=model('dos-sprite-blit-vector.mjs',{'di':pixels['di']});compare(0x10000+pixels['entry'],sprite,sprite['graphicsSegment']*16+sprite['entry'],sprite['stackDelta']);assert sprite['phase']=='format' and sprite['type']==1
 solid=model('dos-solid-blit-vector.mjs',{'di':sprite['di']});assert solid['destination']['segment']==int.from_bytes(source[g+0xb8a:g+0xb8c],'little') and solid['destination']['pitch']==320;target_base=solid['destination']['segment']*16
 writes=[0];addresses=set()
 def write(uc,access,address,size,value,_):
  if target_base<=address<target_base+65536:
   writes[0]+=size
   for at in range(address,address+size):addresses.add(at)
 h=cpu.hook_add(UC_HOOK_MEM_WRITE,write);compare(sprite['graphicsSegment']*16+sprite['entry'],solid,0x10000+solid['entry'],solid['stackDelta']);cpu.hook_del(h);assert writes[0]==solid['pixelWrites'] and len(addresses)==solid['pixelWrites']
 assert int.from_bytes(cpu.mem_read(g+0x1dd5,2),'little')==320
 if a.checkpoint_end:
  raw=bytes(cpu.mem_read(0,0x100000));state={key:cpu.reg_read(reg) for key,reg in regs.items()}
  with (a.checkpoint_end/path.name).open('xb') as f:f.write(raw)
  with (a.checkpoint_end/path.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({'profile':meta['profile'],'captureSha256':meta['captureSha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'sourceCheckpointSha256':meta['memorySha256'],'boundary':state['ip'],'registers':state},f,indent=2)
 assert path.read_bytes()==source
 rows.append({'checkpoint':path.name,'checkpointSha256':meta['memorySha256'],'owner':owner,'object':prepared,'projection':projected,'committed':committed,'batch':batch,'pixels':pixels,'sprite':sprite,'solid':solid,'nativePixelWrites':writes[0],'distinctTargetAddresses':len(addresses),'renderBufferSha256':hashlib.sha256(bytes(cpu.mem_read(target_base,64000))).hexdigest(),'vgaSha256':hashlib.sha256(bytes(cpu.mem_read(0xa0000,64000))).hexdigest(),'boundary':cpu.reg_read(regs['ip']),'sp':cpu.reg_read(regs['sp'])})
print(json.dumps({'profiles':sorted({json.loads(p.with_suffix('.json').read_text())['profile'] for p in paths}),'caseCount':len(rows),'cases':rows,'stackMask':'079E..07ED active CPU scratch; startup saves07EE..07FF compared','limits':'Verified actual-startup first-visible checkpoints; shared-memory object/projection/record/batch/clip/dispatch/first type1 fill compared at every boundary, script registers/SP and whole1MiB except explicit stack. No device/IRQ injection. Genuine320-pitch original-selected render-buffer writes; first solid rectangle only, not a complete displayed game frame.'}))
