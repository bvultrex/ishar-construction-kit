# Type20 transparent byte renderer and complete LOGO pixel chain

2026-10-18. `blitOriginalDosByteSprite` reconstructs normal1E97:0482,
helper02DD..038A and the zero-run loop through04BE, returning430A. Type20
has an eight-byte header and one8-bit pixel per byte. Zero pixels leave the
destination unchanged. The zero-run optimization also affects returned BX,
which is explicitly compared rather than discarded. This differs from the
existing type0/type16 packed-nibble renderer.

Clipping uses the original C2C/C2E/C30/C32 bounds and record positions.
Source/destination strides and segment-offset wrapping are retained.
Writes into executing graphics code, excessive traversal and mirrored sprites
are rejected. The mirrored04BF path remains separate and unimplemented.

Native synthetic verification: `check-native-dos-byte-blit.py <capture.bin>`
passes108 cases for each identified Ishar1/Ishar2 capture (216 total). Cases
vary left/top clipping, width, pitch and wrapped destination offsets, including
zero runs and fully transparent clipped columns. Six script registers, BX/DI,
SP, pixel-write counts and full1MiB memory except explicit stack scratch agree.

Actual Ishar1 LOGO startup continuation now passes the existing record checker
with `--present`: following the first solid fill, the remaining record types are
20,20,20,20,0,1,20,20. The complete current nine-record chain and original VGA
word-copy presentation are verified. VGA writes64000 bytes, whose SHA-256 is:
`80564ae873b3811fec5208f0abc59c925971252c38358a3ec1e0bf4507819d4c`.
The existing native frame-return checker also reaches264C with the original
saved CPU registers restored. TypeScript typecheck passes.

This is complete **indexed pixel output for this frame**, not a verified
coloured screenshot. The current state does not satisfy the preview tool's
six-bit DAC-shadow precondition; the tool correctly refuses to generate a PNG.
No palette is fabricated or copied from a convenient resource.

The next original MAIN command, after the frame scheduler selects MAIN again,
is **opcode134 at image05CC**, currently unsupported. Next: reconstruct that
command and follow the actual palette/startup continuation. Browser integration,
full boot, mirrored type20 and actual Ishar2 usage remain open.

Private checkpoints, original pixels and resources stay outside the repository.
The checker output contains metadata/hashes only.
