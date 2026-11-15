"""Differential test of native 222A record selection against productive TS.
Controlled RAM only; Unicorn 2.1.4 and Node with TypeScript stripping required.
"""
import argparse, hashlib, json, subprocess
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16, UC_HOOK_CODE
from unicorn.x86_const import *
p = argparse.ArgumentParser()
p.add_argument('capture', type=Path)
p.add_argument('--node', default='node')
a = p.parse_args()
memory = a.capture.read_bytes()
digest = hashlib.sha256(memory).hexdigest()
assert digest in ['5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7', 'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04']
repo = Path(__file__).resolve().parent.parent
cases = json.loads(subprocess.check_output([a.node, str(repo/'scripts/dos-timer-selection-vectors.mjs')], cwd=repo, text=True))
cpu = Uc(UC_ARCH_X86, UC_MODE_16)
cpu.mem_map(0, 0x100000)
cpu.mem_write(0, memory)
stopped = []
def code(uc, address, size, _):
    if address == 0x1224d:
        stopped.append(address)
        uc.emu_stop()
cpu.hook_add(UC_HOOK_CODE, code)
for case in cases:
    stopped.clear()
    for offset, value in zip([0x1dfe, 0x1e0e, 0x1e1e], case['values']):
        cpu.mem_write(0x1c0b0 + offset, bytes([value]))
    cpu.mem_write(0x1cd87, b'\xff')  # DS:0CD7 output
    for r, v in [(UC_X86_REG_CS, 0x1000), (UC_X86_REG_DS, 0x1c0b), (UC_X86_REG_SS, 0x3000), (UC_X86_REG_SP, 0xff00), (UC_X86_REG_AX, 0x5a37)]:
        cpu.reg_write(r, v)
    cpu.emu_start(0x1222a, 0x1224e, count=32)
    assert stopped == [0x1224d]
    assert cpu.mem_read(0x1cd87, 1)[0] == case['selected'], case
    assert cpu.reg_read(UC_X86_REG_AX) & 255 == 0x37
    assert cpu.reg_read(UC_X86_REG_SP) == 0xff00
assert a.capture.read_bytes() == memory
print(json.dumps({'captureSha256': digest, 'cases': len(cases), 'result': 'signed maximum record selection, first-index ties, AL and stack match', 'limit': 'stops before RET; downstream index consumer not identified'}))
