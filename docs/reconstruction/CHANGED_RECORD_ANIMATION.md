# Existing-record update and next Silmarils animation frame

2026-10-18. Following original LOGO006F now executes the ownership-byte write,
`cputnat` resource9 and yield. The genuine scheduler/timer path is retained:
the original frame wait is exited with one compared Ishar IRQ and the existing
explicit DOSBox BIOS platform adapter. No direct timer-counter patch or host
sleep substitutes for that sequence.

This reaches owner738 with an existing **status2 changed record**, not a new
FF record. `prepareOriginalDosObjectBatch` now accepts changed/retired first
records: merges old bounds, projects the new resource, reinserts the record
and processes the original matching-group chain. The negative-B22 changed
first-record continuation remains an explicit unsupported boundary.

Native verification:

- Batch checker expanded to240 cases per engine,480 total: first statuses
  FF/2/1, dirty flags, matching/nonmatching groups, mixed tails, disjoint and
  aliased ES/global segments. Script registers/SP and physical memory outside
  documented stack scratch agree. New-record regression cases remain included.
- Actual LOGO resource9 frame updates one record and computes a96×71 dirty
  rectangle. First solid background restoration and subsequent type20/0/1
  rendering match native memory, registers and pixel-write counts.
- Sprites outside the dirty clip now follow their verified native early RET
  and far return. They are not treated as unsupported formats or drawn anyway.
- Original presentation copies **6816 bytes**, then frame return264C restores
  the saved CPU context. This differs from the initial full64000-byte frame.
- Typecheck and physical-frame regression pass.

The private diagnostic preview was visually inspected: the emblem persists
and the animated S updates. This is another original animation stage, not the
complete word animation. VGA/render-buffer SHA-256:
`25d01e8f50afac339d367aea2a2c5dd0b770bab8a7bf6849b9364d662d1f3ae1`.
DAC shadow remains
`bc80dcea6fb640de5f8f2ec6c2580f850ae66917c22122ddd5eef5aa947003d3`.
Diagnostic PNG SHA-256:
`597401104de37617c8f089b70699de383aca97f2aac5630efcee5ea23fdc4586`.
Original pixels/checkpoints stay outside Git.

The existing startup pixel checker now distinguishes new-record projection
from changed/retired first-record batching and compares both before rendering.
It still requires a first type1 fill; it is not a general arbitrary-frame driver.

Next actual LOGO instruction is0081 (`cputnat` resource11). The listing then
contains008D/opcode167 (`cxputat`), a mirrored resource-draw path not yet connected.
Continue those paths and their rendering before claiming the full animation.
These rendering improvements are prerequisites for moving NPC/item sprites;
they do not themselves implement gameplay or browser integration.
