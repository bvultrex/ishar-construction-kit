"""Original3D64 frame resumption; cached AL, saved frame and empty owners."""
import sys,json,base64,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=Path(sys.argv[1]);original=p.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent;rows=[];g=0x1c0b0
regs={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
for target in [0,1,3,255]:
 for counter in [0,1,2,255]:
  for changed_target in [0,255]:
   for empty in [False,True]:
    m=bytearray(original);m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x70000]=bytes(0x30000);m[0x10318]=0;m[g+0xc99]=changed_target;m[g+0xc9a]=counter
    def word(at,value):m[at:at+2]=value.to_bytes(2,'little')
    for off,value in [(0xbea,0x6000),(0xbe8,0x100),(0xbf6,0x200),(0xb88,0x1234),(0xb8a,0x5678),(0x1dd5,320)]:word(g+off,value)
    if empty:word(g+0xc16,14);word(0x50210,116);word(0x50212,52);word(0x50236,120)
    r={'ds':0x4000,'es':0x5000,'si':0x1234,'bp':0x200,'dx':0x3456,'cx':0x789a};saved=[r['bp'],r['es'],r['ds'],r['si'],0x3333,r['dx'],r['cx'],0x2222,0x1111,0x264c]
    for index,value in enumerate(saved):word(g+0xff00+index*2,value)
    request={'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':r,'resumeWait':{'ax':target,'sp':0xff00},'traverseEmpty':True};expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-frame-vector.mjs')],input=json.dumps(request),text=True,cwd=repo))
    cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m))
    for key,value in r.items():cpu.reg_write(regs[key],value)
    for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_AX,target),(UC_X86_REG_BX,0x2222),(UC_X86_REG_DI,0x3333),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
    done=[];hits=[0]
    def stop(uc,address,size,_):
     hits[0]+=1
     if expected['phase']=='wait' and hits[0]==1:return
     done.append(True);uc.emu_stop()
    cpu.hook_add(UC_HOOK_CODE,stop,None,0x10000+expected['entry'],0x10000+expected['entry']);cpu.emu_start(0x13d64,0xfffff,count=100000);assert done==[True]
    for key,value in expected['registers'].items():assert cpu.reg_read(regs[key])==value,(target,counter,changed_target,empty,key)
    assert cpu.reg_read(UC_X86_REG_SP)==0xff00+expected['stackDelta']
    if expected['phase']=='return':assert cpu.reg_read(UC_X86_REG_AX)==0x1111 and cpu.reg_read(UC_X86_REG_BX)==0x2222 and cpu.reg_read(UC_X86_REG_DI)==0x3333
    actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(80);assert hashlib.sha256(actual).hexdigest()==expected['hash']
    rows.append({'cachedAl':target,'counter':counter,'currentTargetByte':changed_target,'emptyOwners':empty,'phase':expected['phase']})
assert p.read_bytes()==original
print(json.dumps({'captureSha256':digest,'cases':rows,'verified':'Native3D64 cached AL rather than refreshed C99, empty-owner path, saved register/frame restoration and full1MiB except FEC0..FF0F. No IRQ or platform service in these isolated fixtures.'}))
