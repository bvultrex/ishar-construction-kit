"""Original module cache-miss open/read header on actual verified startup state."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoint',type=Path);p.add_argument('resource',type=Path);p.add_argument('--checkpoint-end',type=Path);p.add_argument('--header-hex');a=p.parse_args();repo=Path(__file__).resolve().parent.parent;source=a.checkpoint.read_bytes();meta=json.loads(a.checkpoint.with_suffix('.json').read_text());resource=a.resource.read_bytes();header=bytes.fromhex(a.header_hex) if a.header_hex is not None else resource[:6];assert len(header)==6;g=0x1c0b0;assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256'] and meta['boundary']==0x7917
assert meta['captureSha256']=={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}[meta['profile']]
state=meta['registers'];keys=['ax','bx','cx','dx','di','si','bp','ds','es','sp'];request={'memory':base64.b64encode(source).decode(),'ss':0x1c0b,'registers':{k:state[k] for k in keys},'header':list(header),'handle':42};expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-module-header-vector.mjs')],input=json.dumps(request),text=True,cwd=repo))
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS};cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
for key,value in state.items():cpu.reg_write(regs[key],value)
events=[];drive=[None];done=[]
def interrupt(uc,number,_):
 assert number==0x21;ah=uc.reg_read(UC_X86_REG_AH)
 if ah==14:drive[0]=uc.reg_read(UC_X86_REG_DL);events.append({'operation':'select-drive','drive':drive[0]});uc.reg_write(UC_X86_REG_AL,3);return
 r={k:uc.reg_read(regs[k]) for k in ['ax','bx','cx','dx','ds']}
 if ah==0x3d:events.append({**r,'operation':'open','drive':drive[0]});uc.reg_write(UC_X86_REG_AX,42)
 elif ah==0x3f:events.append({**r,'operation':'read'});assert r['bx']==42 and r['cx']==6 and r['dx']==0x2480 and r['ds']==0x1c0b;uc.mem_write(r['ds']*16+r['dx'],header);uc.reg_write(UC_X86_REG_AX,6)
 else:raise AssertionError(ah)
 uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
def stop(uc,address,size,_):done.append(True);uc.emu_stop()
cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,stop,None,0x10000+expected['entry'],0x10000+expected['entry']);cpu.emu_start(0x17917,0xfffff,count=10000);assert done==[True] and events==expected['events'],events
for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,(key,cpu.reg_read(regs[key]),value)
actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0x7a8:g+0x7ee]=bytes(70);assert hashlib.sha256(actual).hexdigest()==expected['hash']
if a.checkpoint_end:
 assert not a.checkpoint_end.exists() and not a.checkpoint_end.resolve().is_relative_to(repo.resolve()) and not a.checkpoint_end.resolve().is_relative_to(a.checkpoint.parent.resolve()) and not a.checkpoint_end.resolve().is_relative_to(a.resource.parent.resolve());a.checkpoint_end.mkdir(parents=True);raw=bytes(cpu.mem_read(0,0x100000))
 with (a.checkpoint_end/a.checkpoint.name).open('xb') as f:f.write(raw)
 with (a.checkpoint_end/a.checkpoint.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({**meta,'sourceCheckpointSha256':meta['memorySha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'boundary':cpu.reg_read(UC_X86_REG_IP),'registers':{k:cpu.reg_read(r) for k,r in regs.items()}},f,indent=2)
assert a.checkpoint.read_bytes()==source and a.resource.read_bytes()==resource
print(json.dumps({'syntheticHeaderOverride':a.header_hex is not None,'profile':meta['profile'],'checkpointSha256':meta['memorySha256'],'resourceSha256':hashlib.sha256(resource).hexdigest(),'resourceBytes':len(resource),'headerSha256':hashlib.sha256(header).hexdigest(),'result':expected,'limits':'Actual original7917 open/read6 and header dispatch, explicit successful DOS replies and supplied original header. All registers/SP and full1MiB except07A8..07ED; no allocation, payload decode, DTA side effects or host writes.'}))
