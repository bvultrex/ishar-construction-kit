"""Native opcode75 record removal: sorted lists, retirement and owner unlink."""
import argparse,base64,hashlib,json,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
p=argparse.ArgumentParser();p.add_argument('capture',type=Path);a=p.parse_args();original=a.capture.read_bytes();digest=hashlib.sha256(original).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo=Path(__file__).resolve().parent.parent;count=0
for mode in [0,1,2,3]:
 for opcode in [75]:
  for seed in [0,1,128,255]: # record status
   for bound in [0,1,2,3]: # requested group
    m=bytearray(original);g=0x1c0b0;m[g:g+0x28c0]=bytes(0x28c0);m[0x40000:0x70000]=bytes(0x30000)
    def word(at,v):m[at:at+2]=v.to_bytes(2,'little')
    for at,v in [(g+0xbea,0x6000),(g+0xbf6,0x1000),(g+0xbec,0x400),(0x501e8,0x200),(0x501ea,0x20),(0x51022,0x200)]:word(at,v)
    nodes=[0x200,0x240,0x280,0x2c0]
    for n,at in enumerate(nodes):
     m[0x60000+at]=seed;m[0x60000+at+1]=3-n
     word(0x60000+at+2,0x20);word(0x60000+at+4,nodes[n+1] if n<3 else 0);word(0x60000+at+6,nodes[n+1] if n<3 else 0)
    m[g+0xbf3]=1 if mode==1 else 0
    if mode==2:word(0x501e8,0)
    if mode==3:
     for at in nodes:m[0x60000+at+1]=2
    code=[opcode,0,bound,66];m[0x40100:0x40100+len(code)]=bytes(code)
    request={'memory':base64.b64encode(m).decode(),'ss':0x1c0b,'registers':{'ds':0x4000,'es':0x5000,'si':0x100,'bp':0x200,'dx':0xfedc,'cx':0x1234}}
    expected=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-physical-script-prefix-vector.mjs')],input=json.dumps(request),text=True,cwd=repo));assert expected['reason'] is None and len(expected['steps'])==2,expected
    cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));names={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
    for key,v in request['registers'].items():cpu.reg_write(names[key],v)
    for r,v in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(r,v)
    def hook(uc,at,size,_):
     if at==0x126f7:uc.emu_stop()
    cpu.hook_add(UC_HOOK_CODE,hook);cpu.emu_start(0x126eb,0xfffff,count=10000)
    step=expected['steps'][0]
    for key,v in step['registers'].items():assert cpu.reg_read(names[key])==v,(opcode,seed,bound,key)
    assert cpu.reg_read(UC_X86_REG_SP)==0xff00 and cpu.reg_read(UC_X86_REG_IP)==0x26f7
    actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(0x50);assert hashlib.sha256(actual).hexdigest()==step['hash'],(opcode,seed,bound)
    count+=1
assert a.capture.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':count,'limits':'Original75 full dispatch; six script registers, SP and full memory except CPU stack scratch; group matching, signed status, free-list and owner-chain writes; no devices'}))
