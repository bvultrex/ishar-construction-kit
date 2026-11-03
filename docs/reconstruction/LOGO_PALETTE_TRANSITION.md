# Original ctopalet190 and first coloured Silmarils animation stage

2026-10-18. The physical VM now connects opcode190 to the original palette
selection code with a separately read duration operand. Unlike104,190 retains
the requested duration in CX and computes original fade step/countdown values.
The actual path may upload immediately when the original speed calibration
selects that branch; duration alone does not imply a timed fade.

The actual post-input-wait scheduler reaches LOGO0069, `ctopalet 6,50`.
Native/host comparison passes the command and following yield: DX6, CX50,
SI006F, exact1025 retrace/DAC events, all script registers/SP and full memory
except the documented active stack scratch. The actual captured profile takes
the immediate upload branch. No invented IRQ ticks or replacement palette.

Synthetic190 positive-resource tests:320 cases per engine,640 total. They
cover durations0/1/50/63/126, compact/RGB/nonpalette resources, slow/fast
calibration and enable/inhibit branches. Native memory, script registers/SP
and exact retrace/DAC events agree. Existing104/106 tests still pass207 cases
per engine,414 total. Typecheck passes.

Negative190 resources remain explicitly unsupported when the transition path
is enabled. The synthetic negative path did not reach the expected return and
needs separate investigation; no successful saved-palette190 behavior is
assumed. Non-VGA transitions and untested numeric-expression operands also
remain outside the verified scope.

The private diagnostic renderer now accepts the authentic VGA indices and
six-bit DAC shadow. The visually inspected320×200 preview shows the golden
Silmarils emblem and the first letter S of its animation. It is the first
coloured animation stage, not the completed word/logo or complete game boot.

Hashes:

- Palette-yield checkpoint:
  `f3c87425b710c4a94b3d394b7bfdcd214590e40487347aab0af759d28de3ea6f`
- VGA:
  `80564ae873b3811fec5208f0abc59c925971252c38358a3ec1e0bf4507819d4c`
- DAC shadow:
  `bc80dcea6fb640de5f8f2ec6c2580f850ae66917c22122ddd5eef5aa947003d3`
- Diagnostic PNG:
  `3221b448208dbbad859f4ef4a16d894a960e8d3fc1c24711a069163e18ce3c53`

Original pixels, PNG and checkpoints remain outside Git. The preview is
derived from verified original-memory indices/DAC shadow with6→8bit channel
expansion; it is not a hardware video capture or browser screenshot.

Reproduce transitions with `check-native-dos-palette-select.py <capture.bin>
--transition`. The actual LOGO continuation uses the private selected-context
checkpoint and existing startup checker with `--resume-context --shift-flags 0
--palette-retrace 8`. Next: continue LOGO006F and the remaining animation,
then the input-driven exit/message path. Toolkit integration remains open.
