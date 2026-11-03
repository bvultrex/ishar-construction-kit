# Original script mouse and joystick queries

2026-10-18. Opcode134 at MAIN05CC is `cmouse`, not a palette command.
`readOriginalDosScriptMouse` reproduces6649/1259 and three291B local result
stores. It reads original callback snapshot fields CS:11BD/11BF/11C1,
applies2896 coordinate scaling, or returnsFFFF/FFFF/0 when CA3 is nonzero.
All results are captured before stores; buffer swaps and byte/word widths are
sequential. No INT33 call, host cursor coordinates or input event is invented.

Native134 tests:24 synthetic cases per game,48 total, varying2896 mode,
CA3, coordinate limits and short/long result targets. Six ALIS registers/SP
and full1MiB except temporary stack agree. The real post-LOGO MAIN134 also
passes the existing per-command native startup checker.

Operand110 (`ojoy`) calls1334/1137/13F1. `queryOriginalDosJoystick` implements
disabled, keyboard-snapshot and finite port201 paths. Axis discharge/count,
calibration comparisons and button masks are kept separate from wall time.
Port replies must be supplied explicitly; exhaustion throws. Keyboard fallback
tests full DX, while the hardware axis choice tests DL. For nonzero keyboard
selectors,1137 leaves AL unchanged (110 from the operand dispatcher); this
seemingly odd native behavior is retained and tested.

Native110 tests:64 cases per game,128 total. Disabled/configured flags,
selectors0/1/256/257, calibration2/FFFF and button replies vary. DX result,
preserved BX/CX/SP, exact IN/OUT201 events and memory outside scratch agree.
Timeout branches and longer physical timing sequences remain to be tested.

The actual MAIN prefix now passes six commands with explicitly supplied
neutral test port replies `0,0,0,0,255`. It executes134,31,18,31,20,66 and
returns to the original input-wait loop. The seven port events match native
execution. These are controlled device replies, not measurements from a real
joystick and not a fabricated keypress.

Reproduce with the authenticated captures and private post-LOGO frame state:

```
python scripts/check-native-dos-script-mouse.py <capture.bin>
python scripts/check-native-dos-joystick-query.py <capture.bin>
python scripts/check-native-dos-startup-main-script.py <logo-frame-return-dir> --resume-context --shift-flags 0 --palette-retrace 8 --joystick-replies 0,0,0,0,255
```

Typecheck, native-script diagnostic and original ALIS expression regressions
pass. Browser input delivery and original IRQ callback integration remain
separate work. The pending LOGO context command190 at0069 is `ctopalet 6,50`;
that is the next relevant palette continuation.
