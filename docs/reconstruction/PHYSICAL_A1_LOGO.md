# Original startup LOGO A1 decode

2026-10-18: `original-dos-physical-a1.ts` reconstructs CALL 79E9's A0-family
path through 7B85 and returns at 795C. It operates on shared physical memory,
with explicit DOS read replies, segmented output normalization, overlapping
back-references, and short-read buffer tails retained from the input state.

The first verified case uses the existing real Ishar 1 startup checkpoint at
7959 (no manually reset input/output arenas), after successful original LOGO
open/header handling. Checkpoint SHA-256:
`1f8dcd8da1677eb70f70f65f0dcf986f2b9da84889c4dde9e581c338541d0727`.
LOGO.IO SHA-256:
`8d1dad784ed7e8733d6f80ccade4ad2cafee5bc5c4df1e9af5fb078db10e4969`.

`check-native-dos-physical-a1.py` executes the original captured x86 routine
and compares it with the host implementation. Verified:

- Two exact DOS requests for 8000 bytes; replies contain 8000 then 6414 bytes.
- All saved registers, including returned CX=8 and SP=07E6.
- Full 1 MiB memory hash after excluding only SS:0780..07E5 stack scratch:
  `96f55a51f41b6583db2607993b3d9c5d441667a8802d354663999df1a5fbaf8b`.
- Caller and startup frames SS:07E6..07FF remain unchanged.
- Source checkpoint/resource remain unchanged; host input is immutable.
- Declared payload 40632 bytes at 31E8:0000, end 3BD3:0008. The original
  decoder writes 40638 bytes: the final copy overshoots by six bytes. The host
  does not truncate this native memory effect.

Reproduce with the private checkpoint and original installation:

```
python scripts/check-native-dos-physical-a1.py <country33-mouse0.bin> <Ishar1/LOGO.IO>
```

Requires Unicorn and Node 24. This checker pins the authenticated checkpoint
and resource hashes; it is not a generic claim for every compressed resource.
Old pack families, unsupported segment overlaps, A20 and output aliasing the
executing engine are explicitly rejected. CPU scratch flags are not compared.
Ishar 2 and synthetic malformed/alias boundary cases remain to be verified.

The function is not yet connected to physical script opcode 69: allocation,
file close, module registration and the return to the script still need their
own original comparisons. No full original startup or browser integration is
claimed. This advances the common runtime needed to execute full gameplay
scripts, including the combat and time-event contracts.
