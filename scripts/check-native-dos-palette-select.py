"""Original104 resource/saved-palette selection and106 frame counter setter."""
import sys,json,hashlib,subprocess
from pathlib import Path
from unicorn import *
from unicorn.x86_const import *
path=Path(sys.argv[1]);original=path.read_bytes();digest=hashlib.sha256(original).hexdigest();assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7','f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04'];repo=Path(__file__).resolve().parent.parent
cases=json.loads(subprocess.check_output(['node',str(repo/'scripts/dos-palette-select-vectors.mjs'),str(path.resolve())],text=True,cwd=repo));g=0x1c0b0
regs={'ds':UC_X86_REG_DS,'es':UC_X86_REG_ES,'si':UC_X86_REG_SI,'bp':UC_X86_REG_BP,'dx':UC_X86_REG_DX,'cx':UC_X86_REG_CX}
for case in cases:
 spec=case['spec'];m=bytearray(original);m[g:g+0x28c0]=bytes(0x28c0);m[0x50000:0x71000]=bytes(0x21000)
 def word(s,o,x):at=s*16+o;m[at:at+2]=(x&65535).to_bytes(2,'little')
 for at,value in [(0x2898,1),(0x2896,spec['enabled']),(0x2894,3),(0xc9f,spec['speed'])]:word(0x1c0b,at,value)
 m[g+0xbf4]=spec['inhibit'];m[g+0xc69]=1;m[g+0xc99]=155
 for n in range(768):m[g+0xe43+n]=(n*3)&63;m[g+0x1143+n]=255;m[g+0x1443+n]=(n*5)&63;m[g+0x1763+n]=(n*7)&63;m[g+0x1a63+n]=(n*11)&63
 m[0x60100]=spec['opcode'];m[0x60101]=2;word(0x6000,0x102,spec['value']);word(0x7000,0x1fec,0x100);word(0x7000,0x1fee,0x5000);word(0x5000,0x10e,0x40);word(0x5000,0x140,0x20)
 for index in [0,3]:at=0x160+index*4;word(0x5000,at,0x4000-at);word(0x5000,at+2,0)
 m[0x54000]=1 if spec['format']=='other' else 254;m[0x54001]=0 if spec['format']=='compact' else 255 if spec['format']=='rgb256' else 3;m[0x54002]=spec['start'];m[0x54003]=0x12
 for n in range(768):m[0x54004+n]=(n*17)&255
 cpu=Uc(UC_ARCH_X86,UC_MODE_16);cpu.mem_map(0,0x100000);cpu.mem_write(0,bytes(m));done=[];events=[]
 for key,value in case['input'].items():cpu.reg_write(regs[key],value)
 for reg,value in [(UC_X86_REG_CS,0x1000),(UC_X86_REG_SS,0x1c0b),(UC_X86_REG_SP,0xff00),(UC_X86_REG_EFLAGS,0x202)]:cpu.reg_write(reg,value)
 def stop(uc,address,size,_):done.append(True);uc.emu_stop()
 def read(uc,port,size,_):assert port==0x3da and size==1;events.append({'kind':'in','port':port,'value':8});return 8
 def write(uc,port,size,value,_):assert size==1 and port in [0x3c8,0x3c9];events.append({'kind':'out','port':port,'value':value})
 cpu.hook_add(UC_HOOK_CODE,stop,None,0x126f7,0x126f7);cpu.hook_add(UC_HOOK_INSN,read,None,1,0,UC_X86_INS_IN);cpu.hook_add(UC_HOOK_INSN,write,None,1,0,UC_X86_INS_OUT);cpu.emu_start(0x126eb,0xfffff,count=50000);assert done==[True]
 for key,value in case['expected']['registers'].items():assert cpu.reg_read(regs[key])==value,(spec,key,cpu.reg_read(regs[key]),value)
 assert cpu.reg_read(UC_X86_REG_SP)==0xff00 and events==case['expected']['events'];actual=bytearray(cpu.mem_read(0,0x100000));actual[g+0xfec0:g+0xff10]=bytes(80);assert hashlib.sha256(actual).hexdigest()==case['hash'],spec
assert path.read_bytes()==original
print(json.dumps({'captureSha256':digest,'caseCount':len(cases),'verified':'Original104 VGA resource/saved palettes, FE compact16-color and RGB tables, fast/slow calibration, inhibit/enable/nonpalette/negative skip branches, DAC/retrace events;106 low-byte frame counter write. Full1MiB except FEC0..FF0F and six script registers/SP match; immutable source. Non-VGA uploads, arbitrary operands and real hardware timing excluded.'}))
