"""Deliver installed IRQ8 from authenticated runtime checkpoints; never stub BIOS."""
import sys,json,base64,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
from dos_platform_bios_timer import apply_controlled_bios_timer
root=Path(sys.argv[1]);repo=Path(__file__).resolve().parent.parent;rows=[];g=0x1c0b0;platform=len(sys.argv)>2 and sys.argv[2]=='platform';countdown=int(sys.argv[2]) if len(sys.argv)>2 and not platform else None;assert countdown is None or 0<=countdown<=255
profiles={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
paths=sorted(root.glob('*.bin'));assert paths
for path in paths:
 source=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256'] and meta['captureSha256']==profiles[meta['profile']];assert meta['boundary'] in [0x3d64,0x264c] and meta['registers']['ip']==meta['boundary']
 original=source
 if countdown is not None:
  fixture=bytearray(source);fixture[g+0xc97]=countdown;source=bytes(fixture)
 saved=meta['registers'];request={'memory':base64.b64encode(source).decode(),'ss':0x1c0b,'registers':{k:saved[k] for k in ['ax','bx','cx','dx','di','si','bp','ds','es','sp','cs','ip','flags']},'retraceReads':[8,8],'stackMaskStart':0x798,'stackMaskEnd':0x7ee}
 if platform:request['biosProfile']={'kind':'dosbox-ega-unhooked','handlerSegment':0x7000,'handlerOffset':0x1234}
 expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-runtime-timer-irq-vector.mjs')],input=json.dumps(request),text=True,cwd=repo))
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
 for k,value in saved.items():cpu.reg_write(regs[k],value)
 sp=saved['sp']
 for value in [saved['flags'],saved['cs'],saved['ip']]:sp=(sp-2)&65535;cpu.mem_write(g+sp,value.to_bytes(2,'little'))
 cpu.reg_write(regs['sp'],sp);cpu.reg_write(regs['flags'],saved['flags']&~0x300);cpu.reg_write(regs['cs'],0x1000);cpu.reg_write(regs['ip'],expected['installedOffset']);events=[];done=[]
 def read(uc,port,size,_):assert port==0x3da and size==1;events.append({'kind':'in','port':port,'value':8});return 8
 def write(uc,port,size,value,_):assert size==1;events.append({'kind':'out','port':port,'value':value})
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 target=0x71234 if platform else expected['segment']*16+expected['entry'];hook=cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.emu_start(0x10000+expected['installedOffset'],0xfffff,count=100000);assert done==[True];cpu.hook_del(hook)
 if platform:
  events.append(apply_controlled_bios_timer(cpu,0x1c0b))
 assert events==expected['events']
 for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,(key,cpu.reg_read(regs[key]),value)
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x798:g+0x7ee]=bytes(86);assert hashlib.sha256(actual).hexdigest()==expected['hash']
 if expected['phase']=='iret':assert cpu.reg_read(regs['flags'])==expected['flags']
 if expected['phase']=='saved-handler':assert bytes(cpu.mem_read(g+saved['sp']-6,6))==b''.join(saved[k].to_bytes(2,'little') for k in ['ip','cs','flags'])
 wait_exited=False
 if platform and meta['boundary']==0x3d64:
  done.clear();hook=cpu.hook_add(UC_HOOK_CODE,stop,None,0x13d6b,0x13d6b);cpu.emu_start(0x13d64,0xfffff,count=10);cpu.hook_del(hook);assert done==[True];wait_exited=True
 assert path.read_bytes()==original;rows.append({'explicitPlatformAdapter':platform,'nativeWaitExited':wait_exited,'syntheticCountdownOverride':countdown,'checkpoint':path.name,'profile':meta['profile'],'sourceSha256':meta['memorySha256'],'irq':{k:v for k,v in expected.items() if k!='events'},'eventCount':len(events),'eventSha256':hashlib.sha256(json.dumps(events,separators=(',',':')).encode()).hexdigest(),'counterBefore':source[g+0xc9a],'counterAfter':cpu.mem_read(g+0xc9a,1)[0]})
print(json.dumps({'cases':rows,'stackMask':'0798..07ED active CPU scratch, saved startup registers compared; hardware frame separately checked','limits':'Original installed IRQ, palette and tail; optional explicit DOSBox EGA/no-INT1C-hook platform service, independently applied to native CPU, NOT captured BIOS execution. Optional native wait exit checked. No countdown override unless separately requested. Originals unchanged; raw DAC data omitted.'}))
