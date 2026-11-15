"""Actual post-LOGO opcode64 through original return to26F7."""
import base64, hashlib, json, subprocess, sys
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);source=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text(encoding='utf-8'))
assert len(source)==0x100000 and hashlib.sha256(source).hexdigest()==meta['memorySha256']
assert meta['captureSha256']=='5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7'
assert meta['boundary']==0x26f7
state=meta['registers'];assert source[state['ds']*16+state['si']]==64
assert meta['memorySha256']=='62b557909397ea8781603be7da060ea4996269ae24de116ef1250e9e4aea0d20'
original=source
case=sys.argv[2] if len(sys.argv)>2 else 'actual'
assert case in ('actual','missing','inheritance','byte-result','short-byte','short-word')
fixture=bytearray(source);s=state['ds']*16+state['si'];e=state['es']*16+state['bp']
if case=='missing':fixture[s+1:s+3]=bytes.fromhex('feff')
if case=='inheritance':
 for o,v in ((0,1234),(2,5678),(4,65530),(-14,6),(-22,77),(-34,88)):
  fixture[e+o:e+o+2]=v.to_bytes(2,'little')
 for o,v in ((9,17),(10,31),(11,63)):fixture[e+o]=v
if case=='byte-result':fixture[s+3]=6
if case in ('short-byte','short-word'):
 fixture[s+3]=18 if case=='short-byte' else 20;fixture[s+4]=32
source=bytes(fixture)
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
repo=Path(__file__).resolve().parent.parent
q={'memory':base64.b64encode(source).decode(),'ss':state['ss'],'registers':{k:state[k] for k in ['ds','es','si','bp','dx','cx']}}
expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-clive-vector.mjs')],input=json.dumps(q),text=True,cwd=repo))
cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,source)
for k,v in state.items():cpu.reg_write(regs[k],v)
done=[]
def stop(uc,address,size,_):done.append(True);uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE,stop,None,0x126f7,0x126f7)
cpu.emu_start(0x126eb,0xfffff,count=500000)
assert done==[True]
for k,v in expected['registers'].items():assert cpu.reg_read(regs[k])==v,(k,cpu.reg_read(regs[k]),v)
assert cpu.reg_read(UC_X86_REG_SP)==state['sp']
actual=bytearray(cpu.mem_read(0,0x100000));g=0x1c0b0
assert actual[g+0x7ec:g+0x800]==source[g+0x7ec:g+0x800]
actual[g+0x780:g+0x7ec]=bytes(0x6c)
assert hashlib.sha256(actual).hexdigest()==expected['hash'],'Physical clive memory mismatch'
assert path.read_bytes()==original
print(json.dumps({'case':case,'checkpointSha256':meta['memorySha256'],'result':expected,'verified':'Original opcode64 lookup/allocation/initialization/inheritance/result; six ALIS registers/SP and full1MiB except0780..07EB stack scratch'}))
