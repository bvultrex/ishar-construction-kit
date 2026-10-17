"""Static inspection only. Requires capstone==5.0.9; never executes original code.
Writes the original-derived listing only to a new caller-selected output folder.
"""
import argparse
import hashlib
import json
from pathlib import Path
from capstone import Cs, CS_ARCH_X86, CS_MODE_16

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
source = args.source.resolve(strict=True)
output = args.output.resolve()
if output == source.parent or source.parent in output.parents:
    raise ValueError('Output must be outside the original installation')
raw = source.read_bytes()
digest = hashlib.sha256(raw).hexdigest()
if digest != 'fa35da163339385cc8fb95b5469bc5fb52e8d31a803f84854da5c89d7196c229':
    raise ValueError('Unsupported BLANCPC revision; offsets not established')
image = raw[6:]
assert len(image) == 2094
assert int.from_bytes(image[50:54], 'big') == len(image) - 48 == 2046
# Payload origin is module image +64. Only the coherent first routine is decoded;
# data after its far-return trampoline is not called executable by linear sweep.
instructions = list(Cs(CS_ARCH_X86, CS_MODE_16).disasm(image[64:64+77], 0))
lookup = {i.address: i for i in instructions}
for at, mnemonic in [(0,'push'),(4,'out'),(0x15,'mov'),(0x1a,'mov'),(0x22,'out'),(0x25,'iret'),(0x30,'iret'),(0x48,'ljmp')]:
    assert lookup[at].mnemonic == mnemonic, (at, mnemonic)
assert lookup[4].op_str == '0x42, al'
assert lookup[0x22].op_str == '0x20, al'
assert lookup[0x15].op_str == 'word ptr cs:[2], ax'
assert lookup[0x1a].op_str == 'word ptr cs:[0xc], bx'
assert instructions[-1].address + instructions[-1].size == 77
report = {'sourceSha256':digest,'sourceBytes':len(raw),'imageCodeOffset':64,
          'codeBytes':77,'instructions':len(instructions),'samplePointerInitial':32768,
          'ioPorts':[66,32],'selfModifiedWordOffsets':[2,12],
          'farJumpPointerOffset':73,'counterOffset':77,
          'verification':'static x86 decode only; native loader/calling convention unverified'}
output.mkdir(parents=True, exist_ok=False)
with (output/'native-routine.asm').open('x',encoding='utf-8') as f:
    for i in instructions:
        f.write(f'{i.address:04x} {i.bytes.hex():20} {i.mnemonic} {i.op_str}\n')
with (output/'report.json').open('x',encoding='utf-8') as f:
    json.dump(report,f,indent=2)
assert source.read_bytes() == raw
print(json.dumps(report))
