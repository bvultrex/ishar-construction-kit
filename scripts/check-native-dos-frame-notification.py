"""Original3D55 frame notification from the real LOGO startup frame."""
import base64, hashlib, json, subprocess, sys
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);source=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text(encoding='utf-8'))
assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256']=='1dd38d41a4738afe67a756790a6df637c4f484ec4c98b59141b3b3f608f8472a'
assert meta['captureSha256']=='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7' and meta['boundary']==0x3d55
state=meta['registers'];keys=['ax','bx','cx','dx','di','si','bp','ds','es','sp']
original=source;case=sys.argv[2] if len(sys.argv)>2 else 'actual'
assert case in ('actual','rectangle','overlap')
if case!='actual':
 fixture=bytearray(source);g=0x1c0b0
 def word(at,value):fixture[at:at+2]=value.to_bytes(2,'little')
 target=int.from_bytes(fixture[g+0xb8a:g+0xb8c],'little')
 word(g+0xcaa,0x2400);word(g+0xcac,target if case=='overlap' else 0x8000)
 word(g+0x2400,0x2407 if case=='overlap' else 100);word(g+0x2402,17);word(g+0x2404,3)
 payload=(target if case=='overlap' else 0x8000)*16+0x2406
 fixture[payload:payload+51]=bytes((n*37+11)&255 for n in range(51))
 source=bytes(fixture)
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
repo=Path(__file__).resolve().parent.parent
q={'memory':base64.b64encode(source).decode(),'ss':state['ss'],'registers':{k:state[k] for k in keys}}
q['resumeFrame']='--resume-frame' in sys.argv[3:]
expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-frame-notification-vector.mjs')],input=json.dumps(q),text=True,cwd=repo))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
for k,v in state.items():cpu.reg_write(regs[k],v)
done=[];hits=[0];skip=len(expected.get('emptyOwners',[])) if expected['entry']==0x3de4 else 0
def stop(uc,address,size,_):
 hits[0]+=1
 if hits[0]>skip:done.append(True);uc.emu_stop()
target=0x10000+expected['entry']
cpu.hook_add(UC_HOOK_CODE,stop,None,target,target);cpu.emu_start(0x13d55,0xfffff,count=1000000)
assert done==[True],{'cs':cpu.reg_read(UC_X86_REG_CS),'ip':cpu.reg_read(UC_X86_REG_IP),'width':expected['width'],'rows':expected['rows']}
for k,v in expected['registers'].items():assert cpu.reg_read(regs[k])==v,(k,cpu.reg_read(regs[k]),v,expected['entry'])
actual=bytearray(cpu.mem_read(0,0x100000));g=0x1c0b0
assert actual[g+state['sp']:g+0x800]==source[g+state['sp']:g+0x800]
actual[g+0x780:g+state['sp']]=bytes(state['sp']-0x780)
assert hashlib.sha256(actual).hexdigest()==expected['hash'],'Frame notification memory mismatch'
assert path.read_bytes()==original
if '--checkpoint-end' in sys.argv[3:]:
 output=Path(sys.argv[sys.argv.index('--checkpoint-end')+1]).resolve()
 assert case=='actual' and not output.exists() and not any(output.is_relative_to(p.resolve()) for p in (repo,path.parent))
 output.mkdir(parents=True);raw=bytes(cpu.mem_read(0,0x100000));final={k:cpu.reg_read(r) for k,r in regs.items()}
 with (output/path.name).open('xb') as f:f.write(raw)
 with (output/path.with_suffix('.json').name).open('x',encoding='utf-8') as f:json.dump({**meta,'sourceCheckpointSha256':meta['memorySha256'],'memorySha256':hashlib.sha256(raw).hexdigest(),'boundary':expected['entry'],'registers':final},f,indent=2)
print(json.dumps({'case':case,'resumeFrame':q['resumeFrame'],'checkpointSha256':meta['memorySha256'],'result':expected,'verified':'3D55 notification and optional frame continuation to reported entry; exposed registers/SP and full1MiB except0780..SP-1 temporary stack; caller frames preserved'}))
