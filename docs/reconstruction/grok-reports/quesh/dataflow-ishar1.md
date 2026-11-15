# Data-flow matrix: Ishar 1 (DOS), NPC / monster / item

- **Base commit:** `bb42748` (handoff); code `319819c`.
- **Profile:** Ishar 1 DOS, `start.exe` SHA-256 `3ea63234c97b77d88e3c18aa5d88ac10dede1f10daf2854225b88b7d948d588b`.
- **Script hashes (SHA-256):**
  - MAIN.IO `27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b`
  - FRISE.IO `3bd158963fdaf0f88517b03509002100159a7587c8e2486389314b8abc707e15`
  - AFFOBJ.IO `abe105fad328b76d813dfb496f9d37ea691a7a7e38ed84917be2f7d780e38ec6`
  - OBJET.IO `03bd357d89c0bb58295ebf79cc6864896b08e837bde63840a45b76787524565f`
  - MARCHAND.IO `77db63b52c23075261e7a5776545cc9435dc38f679b29823468eb43872c1c706`
  - MESSAGE.IO `38c1082c5901e748541b1c46f23db19ab12eb76e4c22a0be59858ebe3efd7717`
  - GEREN.IO `60405e4537abff12c5756a79506eb555c616a91b64069451fcc11419bcb8a405`
  - GERDEP.IO `8b3f93c1acf8f2c8b07570db77ff78a25723161befd98982ee719a7b27c411f3`
- **No EAFF/EATT modules:** Ishar 1 has none; monsters are per-type modules (ORC, LOUP, SKELET, …) plus FRISE/GEREN.
- **Save:** 5216 B, written by MAIN.IO 0x4816–0x4a1c, read by 0x4a43–0x4c49, 107 fields. Derived with the kit's `deriveIshar1SaveLayout`; full table in `private/`.

## Matrix
| # | Stage | Original routine / address | Evidence | Kit function / test | Open gap |
|---|---|---|---|---|---|
| 1 | Persistence | MAIN.IO save I/O above | proven | `ishar1-save-layout.ts`, `test:ishar1-save-layout` | block byte order "opaque" in kit; values read plausibly as BE16 (hypothesis) |
| 2 | Party fields | 0x1536 (file 458) XP?; 0x1542 (468) HP; 0x154e (478) gold; 0x155a (488) max HP; 0x16d4/0x16bc byte stats | proven offsets; names hypothesis (FRISE 0x0012e life bar = 155a·100/1542; recruit 0x035f3/0x03623 copies T1bb0→154e, T1b22→155a) | none | confirm by in-game diff |
| 3 | Entity tables | 70-entry tables 0x1978…0x22f2 (row 0x1978?, col 0x1a06?, HP 0x1b22, gold 0x1bb0, XP value 0x1f06) | proven (layout) / roles hypothesis | none | meaning per table |
| 4 | Spawn / placement | GEREN.IO, per-monster modules, ENCONT.IO | open | none | locate the spawn routine (Ishar-1 equivalent of EAFF) |
| 5 | Visibility | AFFOBJ.IO (objects); monster drawing in the modules | open | none (outdoor/grid renderers are kit-side) | |
| 6 | Interaction / NPC | MESSAGE*.IO, DEALER/MARCHAND, ITAVERNE | open | none | |
| 7 | Inventory / gold | 0x154e gold (single word, no thousands split, hypothesis); inventory table not identified (candidates 0x1568 130 B, 0x16de 100 B) | open / hypothesis | none | Hoth-style item-swap diff on an Ishar-1 save |
| 8 | Player attack | FRISE 0x02e00–0x02e5a: hit if `rnd(100) < l136 − 3·(dirb5c − l134)`; damage l13a ×4 / ÷60 modifiers for entity 39 / weapon 32; `T1b22[t] −= dmg` | proven (static expression); operand roles hypothesis | none | port |
| 9 | Death + XP | FRISE 0x06845–0x068ac: `T1b22[t]=0`, `T1ccc[t]=0`, entity 39 special; living members: killer `0x1536 += T1f06[t]·50`, others `+= T1f06[t]·20` | proven (static) | none | level-up for Ishar 1 not located (open) |
| 10 | Damage to party | FRISE 0x0644e `0x1542[slot] −= l13a` | proven (write) | none | attacker formula |

## Browser-side kit inventions
Everything gameplay-related in the browser for Ishar 1 (NPCs, items, trading) uses the generic kit modules (`trading.ts`, `inventory.ts`, authored views). **No original Ishar-1 gameplay path is wired.**

## Smallest end-to-end flow (Ishar 1)
None can be built yet. The minimum prerequisite is an Ishar-1 inventory layout (row 7) via an item-swap save diff in the original. After that, AFFOBJ/OBJET pickup is the analogue of the Ishar-2 flow.

## Limits / next step
Static only. Next: Alderaan/Hoth produce an Ishar-1 save pair (move one item; give/receive gold) so rows 2/7 can become proven. Then trace AFFOBJ.IO the same way as Ishar 2.
