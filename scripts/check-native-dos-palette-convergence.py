"""Explicit IRQ deliveries on a verified frame; native fade convergence, not wall time."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
from dos_platform_bios_timer import apply_controlled_bios_timer
p=argparse.ArgumentParser();p.add_argument('checkpoint',type=Path);p.add_argument('output',type=Path);p.add_argument('--ticks',type=int,default=64);a=p.parse_args();assert 1<=a.ticks<=256;repo=Path(__file__).resolve().parent.parent;assert not a.output.resolve().is_relative_to(repo.resolve()) and not a.output.exists();source=a.checkpoint.read_bytes();meta=json.loads(a.checkpoint.with_suffix('.json').read_text());assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256'] and meta['boundary']==0x264c
assert meta['captureSha256']=={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}[meta['profile']]
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS};g=0x1c0b0;cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
for key,value in meta['registers'].items():cpu.reg_write(regs[key],value)
events=[];rows=[]
def read(uc,port,size,_):assert port==0x3da and size==1;events.append({'kind':'in','port':port,'value':8});return 8
def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT)
for tick in range(a.ticks):
 saved={k:cpu.reg_read(r) for k,r in regs.items()};assert saved['flags']&512
 request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'registers':{k:v for k,v in saved.items() if k!='ss'},'retraceReads':[8,8],'stackMaskStart':0x798,'stackMaskEnd':0x7ee,'biosProfile':{'kind':'dosbox-ega-unhooked','handlerSegment':0x7000,'handlerOffset':0x1234}}
 expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-runtime-timer-irq-vector.mjs')],input=json.dumps(request),text=True,cwd=repo));assert expected['phase']=='iret';sp=saved['sp']
 for value in [saved['flags'],saved['cs'],saved['ip']]:sp=(sp-2)&65535;cpu.mem_write(g+sp,value.to_bytes(2,'little'))
 cpu.reg_write(regs['sp'],sp);cpu.reg_write(regs['flags'],saved['flags']&~0x300);cpu.reg_write(regs['cs'],0x1000);cpu.reg_write(regs['ip'],expected['installedOffset']);events.clear();done=[]
 target=0x71234 if 'platformService' in expected else saved['cs']*16+saved['ip']
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 hook=cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(0x10000+expected['installedOffset'],0xfffff,count=100000);cpu.hook_del(hook);assert done==[True]
 if 'platformService' in expected:events.append(apply_controlled_bios_timer(cpu,0x1c0b))
 for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value
 assert cpu.reg_read(regs['flags'])==expected['flags'] and events==expected['events'];assert cpu.reg_read(regs['cs'])==expected['segment'] and cpu.reg_read(regs['ip'])==expected['entry'];raw=bytearray(cpu.mem_read(0,0x100000));raw[g+0x798:g+0x7ee]=bytes(86);assert hashlib.sha256(raw).hexdigest()==expected['hash']
 rows.append({'tick':tick+1,'eventCount':len(events),'eventSha256':hashlib.sha256(json.dumps(events,separators=(',',':')).encode()).hexdigest(),'memoryHash':expected['hash'],'platformReply':bool(expected.get('platformService'))})
raw=bytes(cpu.mem_read(0,0x100000));target=raw[g+0x1443:g+0x1743];current=raw[g+0xe43:g+0x1143];shadow=raw[g+0x1143:g+0x1443];settled=target==current==shadow and raw[g+0xcb8]==0
assert settled,'Explicit tick budget did not settle palette';assert raw[0xa0000:0xa0000+64000]==source[0xa0000:0xa0000+64000];a.output.mkdir(parents=True)
with (a.output/a.checkpoint.name).open('xb') as f:f.write(raw)
with (a.output/a.checkpoint.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({**meta,'sourceCheckpointSha256':meta['memorySha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'registers':{k:cpu.reg_read(r) for k,r in regs.items()},'explicitPaletteIrqTicks':a.ticks,'platformAdapter':'dosbox-ega-unhooked'},f,indent=2)
assert a.checkpoint.read_bytes()==source
print(json.dumps({'profile':meta['profile'],'ticks':rows,'settled':settled,'vgaSha256':hashlib.sha256(raw[0xa0000:0xa0000+64000]).hexdigest(),'dacShadowSha256':hashlib.sha256(shadow).hexdigest(),'limits':'Original installed IRQ/palette/tail compared each delivery; BIOS branch uses explicit registered platform reply. MAIN/frame execution intentionally paused; diagnostic convergence, not wall time, complete startup or firmware capture. Full memory except0798..07ED, saved registers and original files preserved; no raw RGB payload.'}))
