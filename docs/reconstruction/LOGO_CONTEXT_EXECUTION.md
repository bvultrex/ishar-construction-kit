# Execute the original LOGO context

2026-10-18. The native startup checker now supports resuming an authenticated
script-return checkpoint at26F7 (`--resume-script`) and an already-selected
context at264F (`--resume-context`, separate from264C frame return). These
paths do not reset globals, context pools, stacks or module pointers.

Actual Ishar1 sequence, compared against native execution at every step:

1. LOGO-return checkpoint → MAIN: four commands64/31/20/66 with explicit
   BIOS shift-flags0. MAIN creates the LOGO context and yields.
2. Original MAIN callback:11 supported commands, then scheduler selects LOGO
   at264F. Private checkpoint SHA-256:
   `a813c78c54bfa944220a5f1e2a1fdc3c0764db3b8884d6ef8cb6220aecb306ee`.
3. Original LOGO context: **3009 commands** through yield. Counts:
   10/100/98/188/30 once each,32/31/21 each1000 times,73 three times,66 once.
   This executes the original local increment/comparison loop, not a host delay.
4. Original yield/frame preparation reaches **1000:3D55**, the graphics
   notification boundary. LOGO has queued three original resource draw records.
   Their pixels are not yet rendered by this verification.

New reconstructed operations:

- Opcode32 (`cadd`) and33 (`csub`) scalar local targets6/8/18/20. Native33
  negates DX then uses the same addition handlers; byte/word wrapping is kept.
  String/indexed add/sub destinations still fail explicitly.
- Numeric local short-offset tags18/20 in the operand and expression readers.
  The offset is an unsigned byte; the read value is sign-extended for byte form.

Verification:

- Native numeric checker:1584 cases per game,3168 total, including short forms.
- Native assignment checker `--operation add|subtract`:8 cases per operation
  per game,32 total; initialFFFF tests wrapping and signed immediate operands.
  CPU registers/SP and physical memory except explicit scratch agree.
- Actual LOGO3009-step sequence: six ALIS registers/SP and full1MiB except
  SS:07A8..07ED active stack scratch agree after each command. Callback and
  context transitions are also compared. Saved startup bytes remain compared.
- Existing indexed-assignment and physical-frame regressions and typecheck pass.

Reproduction uses the private LOGO-return and selected-context checkpoints:

```
python scripts/check-native-dos-startup-main-script.py <logo-return-dir> --resume-script --shift-flags 0 --first-frame --traverse-empty --palette-retrace 8
python scripts/check-native-dos-startup-main-script.py <logo-context-dir> --resume-context --shift-flags 0 --first-frame --traverse-empty --palette-retrace 8
```

This verifies the actual Ishar1 context execution only. Synthetic arithmetic
and operand checks cover both identified engine captures, not actual Ishar2
startup through this path. Next: reconstruct3D55 graphics notification and
draw traversal. No visible LOGO image, complete startup or browser integration
is claimed here.
