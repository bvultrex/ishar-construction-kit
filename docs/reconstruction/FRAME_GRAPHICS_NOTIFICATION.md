# LOGO frame notification and next pixel format

2026-10-18. `notifyOriginalDosFrameGraphics` reconstructs1000:3D55 far call
to1E97:0028/C9B, followed by109F and the C4A clear, returning3D60.
It copies4000 words (8000 bytes) from B84/B86 into B88/B8A, then restores
the saved rectangle from the CAA header/CAC payload into B8A. The row pitch
comes from1DD5. Shared physical reads/writes and segment-offset wrapping are
preserved; no guessed palette or rendering behavior.

Native comparison uses the authenticated real LOGO frame checkpoint SHA-256
`1dd38d41a4738afe67a756790a6df637c4f484ec4c98b59141b3b3f608f8472a`.
Three cases pass: actual, synthetic17×3 rectangle, and overlapping payload/
destination. The actual width and raw row count are zero; DEC BX wraps and
executes65536 empty rows. The native comparison needs a sufficiently large
instruction budget, not a fabricated early return.

`check-native-dos-frame-notification.py <checkpoint.bin> actual --resume-frame`
also compares the original continuation after3D60 with the existing frame
logic, using the correct cached AL from C99 and its existing saved frame.
It traverses empty owner686 and reaches visible owner738 at3DE4, CX154.
Native/host exposed registers/SP and full1MiB except SS:0780..SP−1 scratch
agree; caller frame bytes are independently preserved. Typecheck passes.

The exported private3DE4 checkpoint also passes the existing native startup
pixel checker: first original solid fill writes64000 distinct bytes to905F:0000,
320×200, colour5. Render-buffer SHA-256:
`14c166e1422c6217e144eedc204210bcbb9dfccd3326074bc7130fb91eadc0e6`.

Following-record traversal with `--all-records --stop-unsupported` then reaches
**sprite type20, graphics1E97:0482**. This format is not reconstructed yet;
the checker stops before its pixels. No complete LOGO image or presentation
is claimed. Native private checkpoints stay outside the repository.

Next: decode type20 at0482 and its pixel loop, compare its memory/pixel writes,
then continue the original record chain. Current evidence covers one actual
Ishar1 frame plus two synthetic rectangle variants, not all graphics modules.
