"""Original 1000:6D7B RNG, including zero bound and persistent seed."""
import hashlib
import sys
from pathlib import Path
from unicorn import Uc, UC_ARCH_X86, UC_MODE_16
from unicorn.x86_const import UC_X86_REG_CS, UC_X86_REG_SS, UC_X86_REG_SP, UC_X86_REG_DX

data = Path(sys.argv[1]).read_bytes()
digest = hashlib.sha256(data).hexdigest()
profiles = {
    '5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7': 'ishar1',
    'f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04': 'ishar2',
}
if len(data) != 0x100000 or digest not in profiles:
    raise ValueError('Unsupported original capture')
u = Uc(UC_ARCH_X86, UC_MODE_16)
u.mem_map(0, 0x100000)
u.mem_write(0, data)
for seed in (0, 1, 32767, 32768, 65535):
    state = seed
    for bound in (0, 100, 0, 20, 0, 32767):
        u.mem_write(0x1c0b0 + 0xc4e, state.to_bytes(2, 'little'))
        u.mem_write(0x1c0b0 + 0x700, b'\x00\xff')
        for reg, value in ((UC_X86_REG_CS, 0x1000), (UC_X86_REG_SS, 0x1c0b),
                           (UC_X86_REG_SP, 0x700), (UC_X86_REG_DX, bound)):
            u.reg_write(reg, value)
        u.emu_start(0x16d7b, 0x1ff00, count=100)
        state = (state * 0x7ab7 + 0xf881) & 65535
        assert u.reg_read(UC_X86_REG_DX) == state * bound // 65536
        assert u.reg_read(UC_X86_REG_SP) == 0x702
        assert int.from_bytes(u.mem_read(0x1c0b0 + 0xc4e, 2), 'little') == state
print(profiles[digest], digest, '30 native RNG calls matched, including zero-bound advancement')
