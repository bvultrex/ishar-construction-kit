# DOS START.STP

Both supplied installations contain a14-byte START.STP with SHA256
`d4eb29e43511a5af7e9dea13dcd64aba2679e995afffeefe560c89c90a332a9e`.
This identifies the observed configuration, not an entire game version.

Seven tag/value pairs use one byte each. Tags at offsets0,2,4,6,8,10,12
must be R,V,S,P,J,M,K. Values occupy the following bytes. No compression or
terminator is required by the separately verified Ishar1 and Ishar2 read/decode. That routine requests
14 bytes; its handling of short successful DOS reads remains unverified.

| Tag | Ishar2 bounded decoder behavior |
| --- | --- |
| R | Value not consumed in F43..10C4; preserved as opaque |
| V | C/E/V map to selection0/1/2; everything else maps3 |
| S | I/A/B/N/G map0/1/2/3/4; C maps4 and writes B8E=8; other values map0 |
| P | Subtract ASCII1 with byte wrap; values outside0..3 use the existing default |
| J | Subtract ASCII0 with byte wrap; values outside0..2 use the existing default |
| M | Subtract ASCII0 with byte wrap; values outside0..1 use the existing default |
| K | A/Q/Z map0/1/2; other values map0 |

Names for opaque parameters are deliberately not inferred from tag letters.
Ishar1 has an identical supplied file but a different configuration code layout;
its EC2..1043 decode is now separately verified with267 cases and follows
the same field rules. Ishar2 uses F43..10C4.

`startup-settings.ts` reads/writes the structure without normalizing values.
Unknown values, R and trailing bytes survive unchanged. Invalid tags or a file
shorter than14 bytes fail explicitly. The writer accepts raw numeric bytes0..255.
Changing a byte does not promise a supported hardware configuration.

From repository root, inspect a supplied file:

```powershell
node scripts/startup-settings.mjs inspect E:/Spiele/Ishar2/START.STP
```

Export to a separate, nonexistent file, then inspect it:

```powershell
node scripts/startup-settings.mjs patch E:/Spiele/Ishar2/START.STP D:/MyMod/START.STP V=86
node scripts/startup-settings.mjs inspect D:/MyMod/START.STP
```

The output parent directory must exist. The CLI refuses overwriting existing files
or the input. It never installs a configuration into the original game directory.

Verification:

```powershell
node scripts/check-startup-settings.mjs E:/Spiele/Ishar1/START.STP E:/Spiele/Ishar2/START.STP
python scripts/check-native-dos-startup-configuration.py CAPTURE --settings D:/MyMod/START.STP
```

1792 synthetic edits check unchanged bytes, trailer preservation and immutable
inputs. Both actual files round-trip exactly. A separate CLI export changes only
V to67 and has SHA256
`1d1ded3dec604180e537e73adc3afa0e1819fb7c3fc7cc43b4c4eff6793fb88d`.
Reopening this exported file feeds four video variants into the original Ishar2
decode, alongside263 controlled cases: all267 pass exact full-memory comparison.
Evidence: STARTUP_SETTINGS_RESOURCE_NATIVE_2026-10-18.json. Original files and
exported resource bytes remain outside the repository.

The complete file routines are additionally tested at Ishar1 E96..1044 and
Ishar2 EFC..10E0 with60 cases each: three handles, five read lengths and
open/read/close success or failure. Ishar2 selects its saved drive before and
after loading; Ishar1 does not. Successful short reads leave the buffer tail
unchanged and are not rejected by the original. A read error skips close.
The API requires explicit DOS replies and does not access the host filesystem.
Evidence: STARTUP_CONFIGURATION_FILE_NATIVE_2026-10-18.json.

This proves resource round-trip and native decoder compatibility. It does not prove
the full configuration UI, device probing, complete game boot or a visible change.
