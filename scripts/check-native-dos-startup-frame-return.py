"""Actual first-VGA-copy return and installed IRQ's palette callback."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('--palette',action='store_true');p.add_argument('--checkpoint-frame',type=Path);a=p.parse_args();repo=Path(__file__).resolve().parent.parent;rows=[];g=0x1c0b0
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
if a.checkpoint_frame:
 assert not any(a.checkpoint_frame.resolve().is_relative_to(root.resolve()) for root in [repo,a.checkpoints]),'Private output must stay outside repo/input checkpoint directory'
 a.checkpoint_frame.mkdir(parents=True,exist_ok=True)
paths=sorted(a.checkpoints.glob('*.bin'));assert paths
for path in paths:
 source=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256'];assert meta['captureSha256']=='f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04';assert meta['profile']=='ishar2' and meta['boundary']==0x43d0 and meta['registers']['ip']==0x43d0
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
 for key,value in meta['registers'].items():cpu.reg_write(regs[key],value)
 def state():return {key:cpu.reg_read(reg) for key,reg in regs.items()}
 def model(script,extra):
  request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'stackMaskStart':0x798,'stackMaskEnd':0x7ee,**extra};return json.loads(subprocess.check_output(['node',str(repo/'scripts'/script)],input=json.dumps(request),text=True,cwd=repo))
 def run(start,target,limit=100000):
  done=[]
  def stop(uc,address,size,_):done.append(True);uc.emu_stop()
  h=cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(start,0xfffff,count=limit);cpu.hook_del(h);assert done==[True],(hex(start),hex(target))
 def compare_hash(expected):
  actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x798:g+0x7ee]=bytes(86);assert hashlib.sha256(actual).hexdigest()==expected
 expected=model('dos-rendered-frame-return-vector.mjs',{'registers':{key:cpu.reg_read(regs[key]) for key in ['ax','bx','cx','dx','di','si','bp','ds','es','sp']}});run(0x143d0,0x10000+expected['entry'])
 for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,(key,cpu.reg_read(regs[key]),value)
 compare_hash(expected['hash']);assert expected['phase']=='return';palette=None
 if a.checkpoint_frame:
  raw=bytes(cpu.mem_read(0,0x100000));registers=state()
  with (a.checkpoint_frame/path.name).open('xb') as f:f.write(raw)
  with (a.checkpoint_frame/path.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({'profile':meta['profile'],'captureSha256':meta['captureSha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'sourceCheckpointSha256':meta['memorySha256'],'boundary':registers['ip'],'registers':registers},f,indent=2)
 if a.palette:
  saved=state();assert saved['flags']&0x200;sp=saved['sp']
  for value in [saved['flags']&65535,saved['cs'],saved['ip']]:sp=(sp-2)&65535;cpu.mem_write(g+sp,value.to_bytes(2,'little'))
  vector=bytes(cpu.mem_read(32,4));offset=int.from_bytes(vector[:2],'little');segment=int.from_bytes(vector[2:],'little');assert segment==0x1000 and offset in [0xd6d,0xd98]
  cpu.reg_write(regs['sp'],sp);cpu.reg_write(regs['flags'],saved['flags']&~0x300);cpu.reg_write(regs['cs'],segment);cpu.reg_write(regs['ip'],offset);events=[]
  def read(uc,port,size,_):assert port==0x3da and size==1;events.append({'kind':'in','port':port,'value':8});return 8
  def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
  cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);run(0x10000+offset,0x1e970+0xea8);callback_state=state();prefix_hash=hashlib.sha256(json.dumps(events,separators=(',',':')).encode()).hexdigest();events.clear()
  callback=model('dos-vga-palette-irq-vector.mjs',{'replies':{'ax':callback_state['ax'],'interruptFlag':bool(callback_state['flags']&0x200),'retraceReads':[8]}});run(0x1e970+0xea8,0x10dc9)
  for key in ['bx','cx','dx','di','si','bp','ds','es']:assert cpu.reg_read(regs[key])==callback_state[key]
  assert cpu.reg_read(regs['ax'])==callback['ax'] and cpu.reg_read(regs['sp'])==callback_state['sp']+4;assert bool(cpu.reg_read(regs['flags'])&0x200)==callback['interruptFlag'];assert events==callback['events'];compare_hash(callback['hash'])
  palette={key:value for key,value in callback.items() if key!='events'};palette.update(eventSha256=hashlib.sha256(json.dumps(events,separators=(',',':')).encode()).hexdigest(),eventCount=len(events),irqPrefixEventSha256=prefix_hash,boundary=0xdc9,outerIrqPending=True)
 assert path.read_bytes()==source;rows.append({'checkpoint':path.name,'checkpointSha256':meta['memorySha256'],'frameReturn':expected,'palette':palette})
print(json.dumps({'caseCount':len(rows),'cases':rows,'stackMask':'0798..07ED CPU scratch; original entry saves compared','limits':'Actual43D0 pixel/object/frame return to264C compared with existing saved CPU frames, full memory/registers; optional real installed IRQ entry and VGA palette callback compared through0DC9, outer IRQ tail/IRET not completed. Explicit retrace8, no BIOS-chain stub or colored-screen claim.'}))
