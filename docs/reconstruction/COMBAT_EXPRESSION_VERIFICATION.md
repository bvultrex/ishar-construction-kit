# Original combat expression verification

2026-10-18. `scripts/check-original-combat-expressions-local.mjs` executes
expressions read from local FRISE disassembly listings using the existing ALIS
integer interpreter. It does not introduce a second combat rules engine.

The checker requires the exact packed FRISE SHA-256 from Quesh's profile and
compares each listing instruction's available hex prefix with the decoded IO
image. Listings contain truncated hex previews: this prefix check is not proof
of the complete textual disassembly. The formula comparison is a local static
cross-check, not a native full-routine equivalence result.

| Profile | Original expression offsets | Cases |
|---|---|---|
| Ishar 1 | 06609 hit, 06721 damage bound, 06760 damage | 108 |
| Ishar 2 | 05651 hit, 056EF fist, 05707 weapon damage | 108 |

Cases vary level, agility, food, target constitution and armour. Independent
arithmetic checks integer division, different hit coefficients, different
damage formulas and deterministic RNG results. Ishar 1 includes a zero random
bound after the externally applied bound clamp. Damage assertions deliberately
check the pre-final-clamp scalar result; the later HP write is not executed.

Reproduce from the repository with Node 24:

```
node scripts/check-original-combat-expressions-local.mjs ishar1 <Ishar1/FRISE.IO> <ishar1/FRISE.IO.asm>
node scripts/check-original-combat-expressions-local.mjs ishar2 <Ishar2/FRISE.IO> <ishar2/FRISE.IO.asm>
```

Both commands passed locally. No original listing, resource bytes or private
save is added to the repository. Native RNG evidence is separate in
COMBAT_ZERO_BOUND_RANDOM.md.

Next: verify the complete bytecode expressions and branch/write path against
native handlers; connect target selection, hit roll, HP writes, death/XP and
process-local timers. This scalar check does not claim a playable battle or
browser integration. The original DOS module-loader continuation also remains
open and is needed for running full scripts from the original startup state.
