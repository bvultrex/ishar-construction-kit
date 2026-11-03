# Composed compressed-module load and next script boundary

2026-10-18. `loadOriginalDosCompressedModule` composes the existing verified
open/header, physical A1 decoder, file close, registry prefix and empty
notification return. Explicit successful open handle/header and DOS payload/
close replies remain caller inputs. This does not open host files itself.
Unsupported packing, allocation, alternate IDs, errors or nonempty notifications
are rejected; the input memory remains unchanged.

`check-native-dos-physical-a1.py --from-open` now compares the uninterrupted
original path from7917 to26F7 with this composition using the real Ishar1
LOGO open checkpoint. Verified all exposed CPU registers/SP, exact DOS events
(including open/header read) and full1MiB memory except temporary stack
SS:0780..07E5. Result hash remains
`bc4aee4bd0e07be1de8cd36e1b712dc52db521ebd98d6c25e01588cd12c4238f`.
Typecheck passes. Source files are unchanged.

Optional `--checkpoint-end <new-private-directory>` exports the native final
state exclusively outside the repository, original resource and input folders.
The locally exported checkpoint is private. The next actual opcode is **64**,
`clive 0x0040 ->slocw(0x4268)` at MAIN image05A8. Next bytecode address05AE
tests shift keys. `clive` is not yet supported by the physical script step.

This is a callable loader composition, not yet a full opcode69 integration:
the existing physical step exposes six ALIS registers but lacks CPU stack and
explicit module-file services needed by this path. Do not inject synthetic
stack frames or assume a successful load to bypass that interface boundary.
Next: reconstruct opcode64/context creation and connect the original call
frames/services at a CPU-aware execution boundary.
