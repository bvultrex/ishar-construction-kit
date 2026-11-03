# Combat prerequisite: zero-bound RNG

2026-10-18: Grok/Quesh's combat reports led to a confirmed evaluator defect.
Local FRISE.IO/GEREN.IO (Ishar 1) and FRISE.IO/EATT.IO (Ishar 2) SHA-256
match the report profiles. The local Ishar 2 listing at EATT 00B8F–00BA2
clamps a negative damage bound to zero, then evaluates `rnd(bound) + 1`.

Native engine 1000:6D7B loads SS:C4E, calls the recurrence at 6D89,
stores the new seed, and only then performs unsigned MUL DX. There is no
zero-bound early return: result zero still consumes a random step.

`originalActorRandom` and `evaluateOriginalAlisInteger` now accept bound zero
and require its result to be zero. Positive-bound validation is retained.
Negative bounds remain outside the existing actor helper's supported domain.

Verification: `check-native-dos-random.py` with each authenticated first-interrupt
capture executes 30 calls (five seeds, six mixed zero/positive bounds) and checks
DX, stored seed and return SP against integer arithmetic. The expression test
checks the minimum-one expression and subsequent RNG sequence against BigInt.
Both original-expression and actor-frame tests and TypeScript typecheck pass.

This verifies RNG behavior and the evaluator prerequisite. It does not implement
attack selection, status timers, cooldowns or a complete combat encounter.
