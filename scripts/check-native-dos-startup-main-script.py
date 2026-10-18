"""Compare scheduler and supported MAIN prefix on verified startup-root states."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('checkpoints',type=Path);a=p.parse_args();repo=Path(__file__).resolve().parent.parent;rows=[]
profiles={'ishar1':'5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','ishar2':'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'}
regs={'ax':UC_X86_REG_AX,'bx':UC_X86_REG_BX,'cx':UC_X86_REG_CX,'dx':UC_X86_REG_DX,'di':UC_X86_REG_DI,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'ss':UC_X86_REG_SS,'sp':UC_X86_REG_SP,'cs':UC_X86_REG_CS,'ip':UC_X86_REG_IP,'flags':UC_X86_REG_EFLAGS}
paths=sorted(a.checkpoints.glob('*.bin'));assert paths
for path in paths:
 original=path.read_bytes();meta=json.loads(path.with_suffix('.json').read_text());assert len(original)==0x100000 and hashlib.sha256(original).hexdigest()==meta['memorySha256'];assert meta['captureSha256']==profiles[meta['profile']] and meta['boundary']==0x2607 and meta['registers']['ip']==0x2607
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,original)
 for key,value in meta['registers'].items():cpu.reg_write(regs[key],value)
 def model(script,extra):
  request={'memory':base64.b64encode(bytes(cpu.mem_read(0,0x100000))).decode(),'ss':0x1c0b,'stackMask':[0x7a8,0x7ee],**extra}
  return json.loads(subprocess.check_output(['node',str(repo/'scripts'/script)],input=json.dumps(request),text=True,cwd=repo))
 def compare_hash(expected):
  actual=bytearray(cpu.mem_read(0,0x100000));actual[0x1c0b0+0x7a8:0x1c0b0+0x7ee]=bytes(0x46);assert hashlib.sha256(actual).hexdigest()==expected,'Physical MAIN memory mismatch'
 def run(start,target,limit=100000):
  done=[];entered=[False]
  def hook(uc,address,size,_):
   if address==0x126eb:entered[0]=True
   if address==target and (start!=target or entered[0]):done.append(True);uc.emu_stop()
  h=cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(start,0xfffff,count=limit);cpu.hook_del(h);assert done==[True],(hex(start),hex(target))
 def interrupt(uc,number,_):raise AssertionError(f'Unexpected interrupt{number:02X}')
 cpu.hook_add(UC_HOOK_INTR,interrupt)
 scheduler=model('dos-main-scheduler-vector.mjs',{'es':cpu.reg_read(regs['es']),'ds':cpu.reg_read(regs['ds'])});sp=cpu.reg_read(regs['sp']);run(0x12607,0x10000+scheduler['entry'])
 for key in ['bp','si','ds','es','bx']:assert cpu.reg_read(regs[key])==scheduler[key],key
 assert cpu.reg_read(regs['sp'])==sp+scheduler['stackDelta'];compare_hash(scheduler['hash'])
 state={key:cpu.reg_read(regs[key]) for key in ['ds','es','si','bp','dx','cx']};prefix=model('dos-physical-script-prefix-vector.mjs',{'registers':state});counts={};start=0x126eb
 for index,step in enumerate(prefix['steps']):
  sp=cpu.reg_read(regs['sp']);assert cpu.mem_read(cpu.reg_read(regs['ds'])*16+cpu.reg_read(regs['si']),1)[0]==step['opcode'];target=0x126b2 if step['status']=='yield' else 0x126f7;run(start,target);start=target
  for key,value in step['registers'].items():assert cpu.reg_read(regs[key])==value,(index,step['opcode'],key,cpu.reg_read(regs[key]),value)
  assert cpu.reg_read(regs['sp'])==sp+(2 if step['status']=='yield' else 0);compare_hash(step['hash']);counts[str(step['opcode'])]=counts.get(str(step['opcode']),0)+1
 assert path.read_bytes()==original
 rows.append({'checkpoint':path.name,'checkpointSha256':meta['memorySha256'],'profile':meta['profile'],'scheduler':scheduler,'steps':len(prefix['steps']),'opcodes':counts,'reason':prefix['reason'],'nextOpcode':prefix['nextOpcode'],'last':prefix['steps'][-1] if prefix['steps'] else None,'boundary':cpu.reg_read(regs['ip']),'sp':cpu.reg_read(regs['sp'])})
print(json.dumps({'caseCount':len(rows),'cases':rows,'stackMask':'07A8..07ED active CPU scratch; saved startup registers07EE..07FF compared','limits':'Authenticated native startup-root checkpoints resumed2607 without resetting state; shared-memory scheduler and supported physical opcodes compared after every step, full1MiB except explicit stack scratch and DS/ES/SI/BP/DX/CX/SP. No IRQs or external services injected; stops at yield or first unsupported opcode, not complete game/frame.'}))
