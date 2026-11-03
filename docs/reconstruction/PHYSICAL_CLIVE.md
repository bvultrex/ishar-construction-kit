# Opcode64 / clive: post-LOGO context creation

2026-10-18. `executeOriginalDosPhysicalClive` reconstructs2CE2 lookup,
8224 slot insertion,8268 initialization, inherited context fields and291B
scalar result dispatch in shared physical memory. It is connected to the
existing physical script step as opcode64. This uses original context layout
and sequential writes; no invented actor/entity system.

The actual post-LOGO MAIN instruction05A8 is `clive 0x0040 ->slocw(0x4268)`.
Its module exists in the registry. The new context slot returned in DX is6,
the MAIN result is stored, and execution advances to05AE.

`check-native-dos-physical-clive.py <checkpoint.bin> [case]` compares the
original captured engine and physical script step. Input is pinned to the
authenticated private LOGO-return checkpoint SHA-256:
`62b557909397ea8781603be7da060ea4996269ae24de116ef1250e9e4aea0d20`.

Six native comparisons pass:

- `actual`: unmodified post-LOGO instruction and memory.
- `missing`: synthetic absent module ID returnsFFFF without allocating.
- `inheritance`: synthetic parent positions/flags exercise copied fields.
- `byte-result`, `short-byte`, `short-word`: scalar result-width variants.

Each compares six ALIS registers, unchanged CPU SP and full1MiB memory except
SS:0780..07EB scratch. Stack bytes07EC..07FF are separately preserved. Source
memory and private files stay unchanged. Actual final masked hash:
`6a2530ceee7cd980a51c39af9a2702e0fa9a030b6a6ff2be48dc58acb3166aaf`.
Actual registers: DS2B76 ES20EE SI05AE BP02A0 DX0006 CX0000.
Frame/diagnostic regressions and typecheck also pass.

The physical constructor supports scalar local result tags6/8/18/20 only.
Native error5/error12 and odd-length/nonterminating variable initialization
are rejected explicitly, without modifying the source. Those error paths and
additional aliases have not been independently covered by this new checker.
Ishar2 and other actual modules remain open. CPU scratch registers and flags
are not this six-register API's equivalence contract.

Next: continue MAIN05AE with explicit keyboard state and original scheduler;
connect the composed file-loader through a CPU-aware boundary. Initializing a
LOGO context does not yet prove its execution or visible browser output.
