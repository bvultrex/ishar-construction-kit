# Loaded LOGO: file close and registry prefix

2026-10-18. Extends PHYSICAL_A1_LOGO.md using the same authenticated real
Ishar 1 startup checkpoint and original LOGO.IO. No manually reset arenas.

`closeOriginalDosDecodedModule` reproduces 795C..79A0 for a successful close
and matching requested/loaded ID. It sets C4A=1, invokes the existing explicit
DOS close service, includes fallback drive restoration, and reads the loaded
module ID. Alternate-ID lookup and close errors fail at explicit boundaries.
At 79A0 the original has AX=64, CX=8, DS=31E8 and unchanged SP=07E6.
The actual DOS events are close handle42 followed by select-drive2 (C).

`prepareOriginalDosPhysicalModuleRegistration` reproduces CALL8182 at79A0
through8205, before notifications185E/16CE. It reads/inserts far pointers in
shared physical memory, advances BCA/BD0/BCE, and preserves the original
intermediate register state. The host rejects error11/error4 paths rather
than pretending registration succeeded. The four saved registry registers and
call return remain on the native stack; the host reports SP delta−10 instead
of materializing scratch stack bytes. No final return is claimed.

Native verification (`check-native-dos-physical-a1.py`):

| Mode | Boundary | Masked full-memory SHA-256 |
|---|---|---|
| `--close-phase` | 79A0 | 0b49203ed7077c9f1e6a6fafb45f337125c933753fc4c858aace5d96395e5b84 |
| `--register-phase` | 8205 | 89b4945da323d0e472af918c547dd728d978e149cbac6e93ddb66063fb29cbb5 |

Both modes compare all exposed CPU registers/SP, exact DOS requests and full
1MiB memory except SS:0780..07E5 temporary stack. Caller/startup frames
07E6..07FF are independently unchanged. At8205, BCE=2 and the original
registry includes LOGO. Typecheck passes. Full native flags are not compared.

Run the checker as documented in PHYSICAL_A1_LOGO.md, adding the chosen flag.
These are one actual Ishar-1 load case, not general registry proof for both
games. The previous descriptor registry checker covers separate synthetic
cases. Further physical insertion/alias/error fixtures remain open.

Next boundary: original device notifications185E/16CE, registry pops/RET,
caller restoration and script continuation. These must be checked before
connecting successful cache misses to physical opcode69. No browser-visible
feature or complete module-load return is claimed by this milestone.
