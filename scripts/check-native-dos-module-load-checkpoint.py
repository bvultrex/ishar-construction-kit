"""Opcode69 from an authenticated startup stop, through real cache/file boundary."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);p.add_argument('--checkpoint-end',type=Path);a=p.parse_args();repo=Path(__file__).resolve().parent.parent;rows=[];g=0x1c0b0
profiles={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}
if a.checkpoint_end:assert not a.checkpoint_end.exists() and not a.checkpoint_end.resolve().is_relative_to(repo.resolve()) and not a.checkpoint_end.resolve().is_relative_to(a.checkpoints.resolve());a.checkpoint_end.mkdir(parents=True)
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS};paths=sorted(a.checkpoints.glob('*.bin'));assert paths
for path in paths:
 source=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256'] and meta['captureSha256']==profiles[meta['profile']] and meta['boundary']==0x26f7;state=meta['registers'];assert source[state['ds']*16+state['si']]==69
 input={k:state[k] for k in ['ds','es','si','bp','dx','cx']};input['si']=(input['si']+1)&65535;request={'memory':base64.b64encode(source).decode(),'ss':0x1c0b,'registers':input,'stackMaskStart':0x7a8,'stackMaskEnd':0x7ee};expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-module-load-prefix-vector.mjs')],input=json.dumps(request),text=True,cwd=repo))
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
 for key,value in state.items():cpu.reg_write(regs[key],value)
 done=[]
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x10000+expected['entry'],0x10000+expected['entry']);cpu.emu_start(0x126f7,0xfffff,count=10000);assert done==[True] and cpu.reg_read(regs['sp'])==state['sp']+expected['stackDelta']-2
 for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,key
 if 'di' in expected:assert cpu.reg_read(regs['di'])==expected['di']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x7a8:g+0x7ee]=bytes(70);assert hashlib.sha256(actual).hexdigest()==expected['hash']
 if a.checkpoint_end:
  raw=bytes(cpu.mem_read(0,0x100000));state={key:cpu.reg_read(reg) for key,reg in regs.items()}
  with (a.checkpoint_end/path.name).open('xb') as f:f.write(raw)
  with (a.checkpoint_end/path.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({**meta,'sourceCheckpointSha256':meta['memorySha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'registers':state,'boundary':state['ip']},f,indent=2)
 assert path.read_bytes()==source;rows.append({'profile':meta['profile'],'checkpoint':path.name,'sourceSha256':meta['memorySha256'],'module':expected})
print(json.dumps({'cases':rows,'limits':'Actual startup69 dispatch and original cache lookup through file-open boundary, six ALIS registers/DI/SP and full1MiB except07A8..07ED. No DOS service or resource bytes injected here; input startup uses explicit FindFirst carry response with DTA effects still unmodeled.'}))
