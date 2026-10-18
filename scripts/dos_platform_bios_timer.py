"""Explicit test-platform reply, NOT BIOS firmware execution.
DOSBox EGA/no INT1C hooks, independently expressed from the TypeScript adapter.
"""
from unicorn.x86_const import UC_X86_REG_CS,UC_X86_REG_IP,UC_X86_REG_SP,UC_X86_REG_EFLAGS

def apply_controlled_bios_timer(cpu,ss):
 assert cpu.reg_read(UC_X86_REG_CS)==0x7000 and cpu.reg_read(UC_X86_REG_IP)==0x1234
 assert bytes(cpu.mem_read(0x70,4))==bytes(4)
 ticks=(int.from_bytes(cpu.mem_read(0x46c,4),'little')+1)&0xffffffff
 if ticks>=0x1800b0:cpu.mem_write(0x470,bytes([(cpu.mem_read(0x470,1)[0]+1)&255]));ticks=0
 cpu.mem_write(0x46c,ticks.to_bytes(4,'little'));motor=cpu.mem_read(0x440,1)[0]
 if motor:cpu.mem_write(0x440,bytes([motor-1]))
 if motor==1:cpu.mem_write(0x43f,bytes([cpu.mem_read(0x43f,1)[0]&240]))
 sp=cpu.reg_read(UC_X86_REG_SP);frame=bytes(cpu.mem_read(ss*16+sp,6))
 for index,reg in enumerate([UC_X86_REG_IP,UC_X86_REG_CS,UC_X86_REG_EFLAGS]):cpu.reg_write(reg,int.from_bytes(frame[index*2:index*2+2],'little'))
 cpu.reg_write(UC_X86_REG_SP,(sp+6)&65535)
 return {'kind':'out','port':0x20,'value':32}
