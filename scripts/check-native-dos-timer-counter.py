"""Verify timer entry's saturating byte counter against original x86, not a C reference.
Stops before conditional device callbacks; no host I/O. Requires Unicorn 2.1.4.
"""
import argparse, hashlib, json
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_CODE, UC_HOOK_INSN
from unicorn.x86_const import *

p = argparse.ArgumentParser()
p.add_argument('capture', type=Path)
a = p.parse_args()
memory = a.capture.read_bytes()
digest = hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7', 'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
for initial in range(256):
    cpu = Uc(UC_ARCH_X86, UC_MODE_16)
    cpu.mem_map(0, 0x100000)
    cpu.mem_write(0, memory)
    cpu.mem_write(0x1cd4a, bytes([initial]))  # DS:0C9A, DS=1C0B
    for r, v in [(UC_X86_REG_CS, 0x1000), (UC_X86_REG_DS, 0x5000), (UC_X86_REG_SS, 0x3000), (UC_X86_REG_SP, 0xff00), (UC_X86_REG_EFLAGS, 0x402)]:
        cpu.reg_write(r, v)
    ports, reached = [], []
    def out(uc, port, size, value, _):
        ports.append((port, size, value))
    def code(uc, address, size, _):
        if address == 0x10db6:
            reached.append(address)
            uc.emu_stop()
    cpu.hook_add(UC_HOOK_CODE, code)
    cpu.hook_add(UC_HOOK_INSN, out, None, 1, 0, UC_X86_INS_OUT)
    cpu.emu_start(0x10d98, 0x10db7, count=32)
    assert reached == [0x10db6]
    assert cpu.mem_read(0x1cd4a, 1)[0] == min(initial + 1, 255)
    assert ports == [(0x20, 1, 0x60)]
    assert cpu.reg_read(UC_X86_REG_DS) == 0x1c0b
    assert cpu.reg_read(UC_X86_REG_SP) == 0xfeee  # nine pushed words
    assert cpu.reg_read(UC_X86_REG_EFLAGS) & 0x200
    assert not cpu.reg_read(UC_X86_REG_EFLAGS) & 0x400
assert a.capture.read_bytes() == memory
print(json.dumps({'captureSha256': digest, 'cases': 256, 'result': 'timer entry saturates byte counter at 255; EOI, DS, stack, STI and CLD verified', 'limit': 'stops at 0DB6 before device callbacks and remaining timer work'}))
