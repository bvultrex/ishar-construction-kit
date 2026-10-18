"""Original palette IRQ far callback, exact DAC/retrace ports and signed delay."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-vga-palette-irq-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
for case in cases:
 m=bytearray(original)
 for at,value in [(0xcb9,case['blocked']),(0xcbd,case['delay']),(0xcbc,2),(0xcbe,3),(0xc69,case['adapter'])]:m[g+at]=value
 for n in range(768):
  m[g+0xe43+n]=(n*7)&63;m[g+0x1143+n]=m[g+0xe43+n] if case['pattern']==0 or case['pattern']==1 and n%3!=2 else 0;m[g+0x1443+n]=(n*11)&63
 m[g+0xff00:g+0xff04]=bytes([0,0xe0,0,0x10]);cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[];events=[];read_index=[0]
 saved={UC_X86_REG_BX:0x5678,UC_X86_REG_CX:0x9abc,UC_X86_REG_DX:0xdef0,UC_X86_REG_DI:0x1133,UC_X86_REG_SI:0x2244,UC_X86_REG_DS:0x1c0b,UC_X86_REG_ES:0x5000,UC_X86_REG_BP:0x6677}
 for reg,value in {**saved,UC_X86_REG_AX:0xabcd,UC_X86_REG_CS:0x1e97,UC_X86_REG_SS:0x1c0b,UC_X86_REG_SP:0xff00,UC_X86_REG_EFLAGS:0x202 if case['replies']['interruptFlag'] else 2}.items():cpu.reg_write(reg,value)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 def read(uc,port,size,_):
  assert port==0x3da and size==1;value=case['replies']['retraceReads'][read_index[0]];read_index[0]+=1;events.append({'kind':'in','port':port,'value':value});return value
 def write(uc,port,size,value,_):assert size==1 and port in [0x3c8,0x3c9];events.append({'kind':'out','port':port,'value':value})
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x1e000,0x1e000);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.emu_start(0x1e970+0xea8,0xfffff,count=30000);assert done==[True]
 for reg,value in saved.items():assert cpu.reg_read(reg)==value
 expected=case['expected'];assert cpu.reg_read(UC_X86_REG_AX)==expected['ax'] and cpu.reg_read(UC_X86_REG_SP)==0xff04;assert bool(cpu.reg_read(UC_X86_REG_EFLAGS)&0x200)==expected['interruptFlag'];assert events==expected['events'] and read_index[0]==expected['retraceReplies']
 actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff04]=bytes(68);assert hashlib.sha256(actual).hexdigest()==case['hash']
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original VGA0EA8/0BDB and optional0EC9; CB9 exact1 skip, adapter retrace wait, changed RGB cache/DAC output, signed CBD countdown/reload and fade; whole1MiB except FEC0..FF03, preserved registers/AX/SP/IF and exact ports. No outer IRQ delivery, BIOS tail, real DAC/device timing or colored-frame claim.'}))
