# HOTH_FIXTURES 18.10.2026: synthetic contract vectors (Hoth)

Assignment from Cupero, 21:01. Part A is small stuff, Part B is the main assignment. Offsets count from 0, `cmp -l` = from-0 + 1.
Status levels: **known** means I have my own evidence from a run of the original (report named). **suspected** means a finding by another agent (Quesh/Alderaan) or an assumption. **unknown** means open; such vectors are only counted.

## Part A: small stuff (done)
- `private/xpgold/savenew.sh` (backup `savenew.sh.bak-20261018`) and `private/actor69/savenew2.sh`: after every save there is now the close click `c 266 12 2` plus a screenshot. Both pass `bash -n`. Not run in DOSBox; no session was needed.
- I added a section "Nachtrag 18.10.2026 (suspected, source: Quesh `zeit-ishar2.md`, not rechecked by me)" to `HOTH_ABNAHME_2026-10-18_ACTOR69.md` and `HOTH_ABNAHME_2026-10-18_TUER28_ZEIT.md`. It says: 3180 = facing of actor 69 (table 0x35ce, save 3041+2·id, low byte); 3220 = actor 89; 1000 ticks per hour (0x4fcc, DOS); no time lock when saving.

## Part B: where things are
- Outside the repo: `/workspace/ishar/codex-support/hoth/fixtures/`
  - `contract-fixtures.json` (104 vectors). Each vector has id, contract, input, expected, status, source and an optional note.
  - `check-contract-fixtures.mjs`: no dependencies, its own reference model. It prints a summary per contract and exits 0 only if everything is green.
  - `build-contract-fixtures.py`: the generator. Expected values are written literally from my runs, or computed in Python as a second implementation independent of the JS model.
  - `probe-kit-against-fixtures.mjs`: read-only probe of kit functions.
  - `audit-no-original-bytes.py`: the original-bytes check.
  - `check-output.txt` and `probe-output.txt`: saved output.
- Branch: in `/workspace/ishar/clones/hoth`, local branch `grok/hoth-contract-fixtures` from 319819c, commit `235321f`. Only the new directory `fixtures/hoth-contracts/` (the 5 files above, without the outputs). No Codex files touched. **Not pushed.** The clone is back on detached 319819c.

## Commands and exit codes
```
export PATH=/workspace/ishar/tools/node-v24.22.0-linux-x64/bin:$PATH
cd /workspace/ishar/codex-support/hoth/fixtures
python3 build-contract-fixtures.py                    # Exit 0, 104 vectors
node check-contract-fixtures.mjs                      # Exit 0, "alle geprüften Vektoren grün"
node check-contract-fixtures.mjs /tmp/mut.json        # mutation test (every expected value corrupted): Exit 1, 102 red (= all evaluated vectors)
python3 audit-no-original-bytes.py                    # Exit 0, "Treffer: 0" (output in private/fixtures/audit-output.txt)
node probe-kit-against-fixtures.mjs /workspace/ishar/clones/hoth /workspace/ishar/originals/ishar2/Ishar2/IO.IO   # Exit 0, fits 48/84
node fixtures/hoth-contracts/check-contract-fixtures.mjs   # (on the branch) Exit 0
```

## Vectors per contract and status
| Contract | known | suspected | unknown | Green |
|---|---|---|---|---|
| pickup-ishar2 (P01–P08) | 0 | 8 | 0 | 8/8 |
| mechanics-ishar2 (M01–M44: B encoding, door and lever tables, lever 6, frame door 5, keyhole door 8, door 28, actor 69, day phase, clock) | 24 | 20 | 0 | 44/44 |
| rng (R01–R05) | 0 | 5 | 0 | 5/5 |
| combat-ishar2 (K201–K219) | 0 | 18 | 1 | 18/18 |
| combat-ishar1 (K101–K112) | 0 | 11 | 1 | 11/11 |
| savefields-ishar2 (S01–S16, incl. roundtrip) | 14 | 2 | 0 | 16/16 |
| **Total 104** | 38 | 64 | 2 | 102/102 evaluated |

Verdicts per point:
- **Pickup: suspected.** Source: Quesh `pickup-contract-ishar2`, Alderaan PICK9A/9B/R/Q→S. I did not reproduce it in the original myself. P08 (full backpack → item stays on the cursor) is only an assumption drawn from "first free slot".
- **Lever 6 (M15/M16), frame door 5 (M17/M18), keyhole door 8 (M19/M20), door 28 at 0→1 and 3→4 plus the unchanged middle hours (M23–M26), actor 69 (M29–M31), clock offsets (M41), day phase at hours 1/6/7/8: known.** Sources: my reports HEBEL_TUER(_2), TUER8, TUER28_ZEIT, ACTOR69.
- **B ranges outside the doors I tested (61/109/110, −11/−30, zone, walk trigger), wrong facing and wrong item at the keyhole (M21/M22), door 28 at 4→5 and 23→0, actor 69 without object 6, day phase at 12/19/20/22: suspected.**
- **Clock rollover (M42–M44): suspected.** The limit of 1000 comes from Quesh; I observed at most 957, which is consistent with it. Ticks paused while 0x2ab7≠0 also comes from Quesh.
- **RNG: suspected.** Two independent sources agree: Quesh with +0xf881, and rules.md / the kit `originalActorRandom` with −0x77f. These are equal mod 2^16. My own check in start.exe found no plain-text code: the constant sits at file 0x44ea in packed/encoded data, and I did not disassemble it.
- **Combat Ishar 2 and Ishar 1: suspected** (Quesh JSONs). Integer division is assumed to truncate (suspected). Halving when 0x2e56 is set has unconfirmed rounding. K211 assumes rnd(0)=0 for dmax≤0, giving damage 1.
- **Combat unknown: K219** (hit chances in the original, flagged as open by Quesh) and **K112** (Ishar 1 L_072f2 stat/HP gain on level-up). Not made up.
- **Save fields: known** for gold (thousands and remainder, per character), XP×100, level 1291+c, HP 996+2c, header, clock offsets, size, and the roundtrip vectors S12/S13/S14 (my runs XP_GOLD point 7 and CONT_WRITEBACK_2).
- **Save fields: suspected** for armour 1336+c (S09, Quesh/Alderaan) and S15 (an hour change during load/save also touches day and phase bytes 90..93; assumption).

## No original bytes (audit)
- Saves exist only as sparse field lists: 8359 zero bytes plus the format marker word@0 = 2 plus artificial values.
- The audit builds all 40 synthetic buffers and all fixture files, then compares 12-byte windows (≥3 non-zero bytes, ≥4 distinct values) against all 1418 files in `originals/` and `dosbox/ishar2*`. Result: 0 hits.
- No sha256 of an original appears as text, and no fixture file is identical to an original (empty files excluded).
- Trivial windows are listed but do not count: `00…00 ff e7 ff` (item code −25 after zeros, P03) and a run of spaces in the checker.
- One mistake on the way: my first audit output inside the fixtures directory scanned itself (file names in a zip directory, plus an empty file equal to the empty ET.AO). The output now goes to `private/fixtures/`.
- sha256 of originals and saves under dosbox/ishar2* before and after: identical (`private/fixtures/sha-vorher.txt` = `sha-nachher.txt`, 1418 files). IO.IO was only read (by the probe for `deriveIshar2SaveLayout`).
- No DOSBox instance started. Alderaan's dosbox-x (PID 161016) not touched.

## Assessment: existing kit functions (clone 319819c, read-only, probe-output.txt)
| File / function | Contract | Fit | Probe |
|---|---|---|---|
| `door-mechanics.ts pullLever` | lever 6 (toggles switch k and door k) | **full** | M15, M16 fit |
| `door-mechanics.ts hourTick` | door 28 at 1 and 4 o'clock | **full** | M23–M28 fit |
| `door-mechanics.ts useOnDoorForm` | key −17 on form 66 → door 8 | **partial**: the item/form rule fits; the position r61 c15, facing 2 and the "key not consumed" rule must come from outside | M19, M22 fit |
| (missing) frame click door 5 "open only" | M17/M18 | **missing**: no model for clicking the frame of a leaf door | – |
| `door-mechanics.ts afterStep` | STEP_RESET_DOORS 5, 9, 17 | not contradictory, but **open**: per the kit, door 5 falls shut after every step (GERDEP L_013af). My runs had no step after opening, so this is not tested | informational |
| `cont-grid.ts doorNumber` | B 61..109 → door | **full** for doors. Levers are in `nicheSwitch` (A 78/79, B −11..−59) and `pullLever`; zone/trigger are in `sceneTriggerAt`/`afterStep` | M01–M13 fit |
| `original-actor-frame.ts originalActorRandom` | RNG + rnd(n) | **full** (same sequence) | R01–R04 fit |
| `ishar2-save-layout.ts readIshar2SavedMain / patchIshar2SavedMain` | gold/XP/HP/level/armour/clock/door/switch tables by MAIN address | **full** (needs IO.IO and the format marker) | S01–S09, S11, S04, M15w fit; 0x4fcc is not in the save (as expected) |
| `original-commerce.ts readOriginalCarrier` | gold per character, inventory stride 30 | **full** for gold/inventory | S01–S03 fit |
| `save-actors.ts readActorSave` | header, actor 69 scene/facing (3041+2id) | **partial** (read only, no hour logic) | S10, M29r fit |
| `original-ground-runtime.ts pickOriginalGround + receiveOriginalGround` | floor pickup → first free backpack slot | **partial**: objects 9/10 only, map 1 only, no hand slots 9/10, no armour 0x2f0e, no transfer | P01, P03, P08 fit; P02, P04–P07 missing |
| combat / XP / food / cooldown | combat-ishar2 / -ishar1 | **missing** (only `cont-grid.ts trapDamage` for traps) | 29 vectors without a kit counterpart |
| clock rollover / day phase | M42–M44, M33–M40 | **missing** (no tick model found) | – |

The probe fits 48 of 84 cases. The 36 non-fitting cases are all "missing", not "wrong": 29 combat vectors, 5 pickup hand/armour vectors, and 2 frame-click vectors. No kit file was changed.

## Open points
1. Door 5 after a step: the kit (STEP_RESET_DOORS) says it closes again; untested in the original.
2. Pickup is only suspected. Confirming it would need my own run: PICK9A/B and PICKR with a new slot plus cmp.
3. RNG constant in start.exe: the code is packed, and the mapping to 1000:6d7b is not confirmed by me.
4. Combat: hit chances (K219), Ishar 1 level-up gains (K112), integer and halving rounding, and rnd(0).
5. Clock limit of 1000 and the pause condition 0x2ab7 only come from Quesh. Day phase at hours 9–21 has not been observed by me.
6. maxHP 1016 is still open (from XP_GOLD), so there is no vector for it.
7. The fixture expected values come partly from Python formulas from the same source contract. The reference model is a second implementation, but it is not independent of the contract. The mutation test only proves the checker is strict.
