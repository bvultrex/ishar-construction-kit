"""Compare real LOGO startup decode with shared physical A1 reconstruction."""
import base64, hashlib, json, subprocess, sys
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
checkpoint, resource = map(Path, sys.argv[1:3])
source=checkpoint.read_bytes(); packed=resource.read_bytes()
meta=json.loads(checkpoint.with_suffix('.json').read_text(encoding='utf-8'))
assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256']
assert meta['boundary']==0x7959 and meta['profile']=='ishar1'
assert meta['captureSha256']=='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'
assert meta['memorySha256']=='1f8dcd8da1677eb70f70f65f0dcf986f2b9da84889c4dde9e581c338541d0727'
assert hashlib.sha256(packed).hexdigest()=='8d1dad784ed7e8733d6f80ccade4ad2cafee5bc5c4df1e9af5fb078db10e4969'
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
state=meta['registers']; keys=['ax','bx','cx','dx','di','si','bp','ds','es','sp']
repo=Path(__file__).resolve().parent.parent
q={'memory':base64.b64encode(source).decode(),'packed':base64.b64encode(packed).decode(),'ss':state['ss'],'registers':{k:state[k] for k in keys}}
expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-a1-vector.mjs')],input=json.dumps(q),text=True,cwd=repo))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
for k,v in state.items():cpu.reg_write(regs[k],v)
events=[];position=6;done=[]
def interrupt(uc,number,_):
 global position
 assert number==0x21 and uc.reg_read(UC_X86_REG_AH)==0x3f
 r={k:uc.reg_read(regs[k]) for k in ['ax','bx','cx','dx','ds']}
 events.append({**r,'operation':'read'})
 data=packed[position:position+r['cx']];position+=len(data)
 if data:uc.mem_write(r['ds']*16+r['dx'],data)
 uc.reg_write(UC_X86_REG_AX,len(data));uc.reg_write(UC_X86_REG_EFLAGS,uc.reg_read(UC_X86_REG_EFLAGS)&~1)
def stop(uc,address,size,_):done.append(True);uc.emu_stop()
cpu.hook_add(UC_HOOK_INTR,interrupt);cpu.hook_add(UC_HOOK_CODE,stop,None,0x1795c,0x1795c)
cpu.emu_start(0x17959,0xfffff,count=5000000)
assert done==[True]
assert events==expected['events'],(events,expected['events'])
for k,v in expected['registers'].items():assert cpu.reg_read(regs[k])==v,(k,cpu.reg_read(regs[k]),v)
actual=bytearray(cpu.mem_read(0,0x100000));g=0x1c0b0
assert actual[g+0x7e6:g+0x800]==source[g+0x7e6:g+0x800],'Caller/startup frames'
actual[g+0x780:g+0x7e6]=bytes(0x66)
assert hashlib.sha256(actual).hexdigest()==expected['hash'],'Physical memory mismatch'
assert checkpoint.read_bytes()==source and resource.read_bytes()==packed
print(json.dumps({'profile':'ishar1','checkpointSha256':meta['memorySha256'],'resourceSha256':hashlib.sha256(packed).hexdigest(),'result':expected,'verified':'7959 CALL79E9 to795C; exact DOS read requests, saved CPU registers/SP and full memory except0780..07E5 stack scratch; retained caller/startup frames'}))
