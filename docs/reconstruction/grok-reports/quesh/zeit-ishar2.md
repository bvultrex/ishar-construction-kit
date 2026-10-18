# Time, actor facing, save gate in Ishar 2: static, handoff format
Status 2026-10-18 20:40 CEST, Quesh. Read-only. Nothing committed. Basis: Hoth's report HOTH_ABNAHME_2026-10-18_TUER28_ZEIT.md, with saves HOTK753 → HOTZ0/HOTZ1/HOTZ1N/HOTZ2/HOTZ3B/HOTZ4.
SHA-256 (prefix) MAIN/GERDEP/FRISE/EAFF/IO.IO: bfab5e9175931dbb… 58d2c57ff3eb8318… 27117c124caf904a… 6ab9102e2566617a… 0df1f34cf2519341… 
Offsets are zero-based.

## Q1. Byte 3220 = 0x35ce table, actor facing
- 0x35ce is a word array of 110 entries (220 bytes, one per actor id). It is in the save at **3041 + 2·id** (IO.IO cfwriteb main:0x35ce, 0x00dc). **proven**
- Byte 3220 is the low byte of the big-endian word at 3219–3220, so **id = (3219−3041)/2 = 89**. 0→1 means actor 89 got facing 1. (Hoth's "+179" is the byte offset, not the index.) **proven** (arithmetic)
- Meaning: the actor's facing, 1..4 (the same codes as the party facing 0x2ab6).
  - Writers: EAFF 0x00bfc/0x00c22/0x00c48/0x00c6e (fixed 2/4/3/1 by relative position) and EAFF 0x00c7c (= party facing 0x2ab6).
  - Readers:
    - EAFF (compares with 0x2ab6)
    - EATT 0x0069a… (attack-direction checks for values 2/4/1/3 against dx/dy)
    - EDPLT (8 reads, sprite orientation)
    - GERDEP: cswitch on 0x35ce[id] with cases 1,2,3,4
  - **proven** (writers/readers); "facing" **hypothesis** (strong).
- Link: actor 89 was turned by EAFF (it engaged or approached during the 4–7 h run). It has **nothing to do with the hour block or actor 69**: GERDEP 0x0048a–0x0054d writes only 0x449a[69] and 0x4aa4[28]. **proven**

## Q2. Clock
- Clock tick: MAIN 0x03f95–0x0405e, the MAIN interrupt routine (header ret_offset 0x3f8f).
  - Runs when 0x51c6 ≠ 0. If 0x2ab7 == 0 (game not paused or in a menu; FRISE sets 0x2ab7 = 1 for the disk/menu screens), **0x4fca += 1**.
  - If 0x4fca ≥ 0x4fcc: **hour 0x4fc6 += 1**, 0x4fca = 0. If hour ≥ 24: hour −= 24 and day 0x4fc8 += 1.
  - There are no minutes; 0x4fca is the only sub-counter.
  - Debug key "a" adds 200 ticks (0x0412b). New game: hour 7 (0x00ab4), 0x4fca = 0x4fcc−1 (0x011d9).
  - **proven** (code); once per frame: **hypothesis**, backed by the measurement below.
- 0x4fcc is set at MAIN init, chosen by **omodel** only:
| omodel | 0x4fcc | ctiming 0x51c2 | address |
|---|---|---|---|
| < 2000 | 600 | 1 | 0x00417 |
| 2000–2999 | 1000 | 3 | 0x004a7 |
| 3000–3999 | 600 | 1 | 0x00585 |
| 4000–5999 | 1000 | 1 | 0x005ec |
| 6000–6999 | 1000 | 1 | 0x00640 |
  - Not difficulty, not in the save. Ctiming 3 means 3 VBLs per frame, so at 70 Hz that is about 23.3 fps (hud-anim.md).
- **DOS value = 1000.** 1000 passes ÷ 23.3 fps ≈ **42.9 s per game hour**, which matches Hoth's 43 s. 600 ticks at ctiming 1 (70 fps) would be ≈ 8.6 s, and 600 at 23.3 fps ≈ 25.7 s; both are ruled out by the measurement. **proven** (code + measurement)
- One day is 24 000 passes ≈ 17.2 min of real time. The clock stops while 0x2ab7 = 1 (menus).

## Q3. Save at 02:00
- The disk menu (FRISE L_05c6e → io.IO at 0x05ca6) only opens when:
  - **0x2d16 == 0** (no item held at the cursor)
  - **0x4aa0 == 0** (set only by AIGLE/PUIT sequences)
  - **0x2ab7 == 0** (no other menu open)
  - Gate sites: FRISE 0x002b0 and 0x00982. **proven**
- There is **no other save gate**:
  - no check of 0x4b80, of actors, of the hour, or of 0x449a[69]
  - the GERDEP 2 h block sets no flag; it writes 0x449a[69] = 12 and wakes the type-13 entity (cwakeup)
  - **proven** (no other readers in the gate)
- Hoth's failure is therefore not a time lock. Likely causes:
  - (a) an item still held on the cursor (0x2d16 ≠ 0)
  - (b) the click falling into a frame in which FRISE was busy, for example while the woken type-13 entity was loading
  - Rated **hypothesis / open**. A static read cannot decide it.
- Test: before saving, check that the cursor is empty. Then click the disk at 02:xx again and wait about 1 s.
