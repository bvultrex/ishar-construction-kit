# Original LOGO return to the script loop

2026-10-18. Continues MODULE_CLOSE_REGISTRATION.md. Native exploration and
host comparison now reach 1000:26F7 from the authenticated LOGO decode
checkpoint at7959, including the real file reads, close and registry insertion.

Actual notification path for this startup case:

- SS:2898 is nonzero, so8205 skips185E.
- 16CE saves the registers, copies DS:[SI+5] to CS:16CC, resolves the module's
  relative header pointer, reads its count word at+10h, decrements it and
  stores FFFF to SS:B16. The original takes its negative-count branch1846.
- Registers are restored, then the registry and load calls return.
- 2DCF restores the caller's script DS from the existing stack, skips the
  filename through its NUL terminator and returns to26F7.

`returnOriginalDosEmptyModule` implements only this empty-table/disabled185E
path. It checks the original caller frames and rejects other notifications.
Do not infer the complete semantics of the resource tables from this empty
case. The host does not materialize temporary push/pop scratch bytes.

Verification command, using the existing private checkpoint and original:

```
python scripts/check-native-dos-physical-a1.py <checkpoint.bin> <LOGO.IO> --return-phase
```

Verified native/host final registers: AX=0, BX=42, CX=8, DX=0, DI=8,
SI=05A8, BP=02A0, DS=2B76, ES=20EE, SP=07EC, entry26F7.
Full-memory hash excluding only SS:0780..07E5 stack scratch:
`bc4aee4bd0e07be1de8cd36e1b712dc52db521ebd98d6c25e01588cd12c4238f`.
Caller/startup frame bytes07E6..07FF remain unchanged. Exact DOS service
events, source preservation and TypeScript typecheck pass. Flags are not
claimed equivalent. This is one original Ishar1 LOGO case, not all modules.

Next: compose open/header/decode/close/register/return into physical opcode69
with explicit services and preserve atomic unsupported boundaries. Then resume
the original script to its next genuinely unsupported operation. Nonempty
185E/16CE resource notifications and Ishar2 load cases remain open.
