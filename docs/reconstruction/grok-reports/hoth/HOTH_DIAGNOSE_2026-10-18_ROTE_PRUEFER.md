# Diagnose: zwei rote Prüfer und Vorschlag „Save-Position auf massiver Zelle“ (Hoth), 18.10.2026

Auftrag von Cupero, 18.10. 16:41. Bearbeitet 16:41–16:50 Europe/Berlin (MESZ).
Format wie `HOTH_ABNAHME_2026-10-18.md` (Handoff-Punkte 1–7). Reine Diagnose: Prüferdateien und Codex-Bereich (original-dos-*, check-native-*) sind **nicht geändert**. Nichts gepusht. Saves und Originale sind nur gelesen; die sha256 aller 311 Originale und aller 435 .SAV unter `dosbox/ishar2*` sind vorher und nachher gleich (`private/bisect/*-nachher.sha` gegen `private/xpgold/*-vorher.sha`).

## 1. Basis
- Clone `/workspace/ishar/clones/hoth`, geprüfter Stand 319819c (Repo bvultrex/ishar-construction-kit, Branch workbench/playable-slice).
- Node v24.22.0 (`/workspace/ishar/tools/node-v24.22.0-linux-x64`).
- Beide Prüfer sind synthetisch, brauchen keine Originaldaten und stehen **nicht** in package.json. Deshalb fallen sie in keinem `npm run test:*` auf.

## 2. Fragestellung
Sind `scripts/check-dos-physical-frame.mjs` und `scripts/check-native-script-diagnostic.mjs` auf 319819c veraltet, oder liegt eine echte Regression vor? Welcher Commit ist der erste rote, welcher der letzte grüne?

## 3. Befehle und Exitcodes
```
cd /workspace/ishar/clones/hoth
git worktree add --detach /workspace/ishar/codex-support/hoth/private/wt-bisect 319819c        # exit 0
cd …/wt-bisect; git checkout -q add644a                                     # Prüfer physical-frame entsteht hier (einziger Commit der Datei)
node scripts/check-dos-physical-frame.mjs       # exit 0 (add644a, 2026-10-18 05:34 +0200)
node scripts/check-native-script-diagnostic.mjs # exit 0 (add644a); letzte Änderung der Datei: 9a8fb3e
git bisect start 319819c add644a
git bisect run sh -c "test -f scripts/<P>.mjs || exit 125; node scripts/<P>.mjs >/dev/null 2>&1"   # exit 0, je 6 Schritte
git bisect log > private/bisect/<P>.bisect-log.txt; git bisect reset
git checkout -q 319819c; git worktree remove …/wt-bisect; git worktree prune  # sauber; Haupt-Clone wieder 319819c (detached), kein Bisect aktiv
```
- Die Prüferdateien sind im gesamten Bereich add644a..319819c **unverändert** (`git log --follow`). Bisect testet also überall dieselbe Prüferversion; eine temporäre Kopie war für den Bisect nicht nötig.
- Die Fix-Proben laufen als temporäre Kopien **außerhalb des Repos**: `private/bisect/tmpfix/*.fix.mjs`, Importe auf den Worktree-Stand 319819c umgeschrieben.

## 4./5. Ergebnis je Prüfer

### A. `check-dos-physical-frame.mjs`: **veraltet (keine Regression), bewiesen**
- **Letzter grüner Commit:** 604d60b (2026-10-18 12:25:42 +0200, „Verify actual startup MAIN decode and root return for both games“). Exit 0, Ausgabe:
  `Physical frame traversal/hidden flags, waits, draw boundary, cycles and stored-root scheduler continuation passed`
- **Erster roter Commit:** **f46db969e16765440d70084d3a28d94d25140405** (2026-10-18 12:32:41 +0200, „Support original startup memory aliases in scheduler and MAIN expressions“). Exit 1.
- **Erwartet (Zeile 14):** `assert.throws(()=>prepare(memory,0x5000,input),/alias/)`, also ein Fehler „…alias needs shared scheduler preparation“.
- **Tatsächlich (wörtlich):** `AssertionError [ERR_ASSERTION]: Missing expected exception.` bei `check-dos-physical-frame.mjs:14:8`, `expected: /alias/`, `actual: undefined`.
- **Ursache:** f46db96 entfernt in `original-dos-physical-context.ts` die beiden absichtlichen Ablehnungen (`Globals/context alias …`, `Globals/module alias …`) und leitet auf `prepareOriginalDosSharedScheduler` um. DOS_STARTUP.md beschreibt das im selben Commit ausdrücklich: „The former MAIN scheduler and context continuation rejected any such window overlap. `original-dos-shared-scheduler.ts` replaces that restriction …“. Nativ belegt laut Doku über `check-native-dos-shared-scheduler.py` (576 Fälle je Spiel; von mir nicht ausgeführt). Der Prüfer erwartet also ein Verhalten, das Codex bewusst ersetzt hat.
- **Neues Verhalten an der Stelle (gemessen):** `prepare(memory,0x5000,input)` wirft nicht mehr. Ergebnis `phase:'skip'`, `entry:0x2632`, Eingabe unverändert.
- **Fix-Vorschlag** (nur als Diff, nicht angewandt; mit temporärer Kopie geprüft: Exit 0, gleiche Erfolgsmeldung). Die neue Erwartung `skip/0x2632` ist ein Regressionsanker auf das heutige Verhalten. Ob sie nativ stimmt, sollte Codex gegen die Shared-Scheduler-Vektoren prüfen.
```diff
--- a/scripts/check-dos-physical-frame.mjs
+++ b/scripts/check-dos-physical-frame.mjs
@@ -11,6 +11,6 @@
 word(g+0xbd2,0x100);word(g+0xb02,0);word(c+0x100,0x200);memory[c+0x200-36]=2;memory[c+0x200-4]=1;memory[c+0x200-1]=1;word(c+0x200-8,0x1234);word(c+0x200-6,0x4000);
 const prepared=prepare(memory,0x1c0b,input);assert.equal(prepared.phase,'main');assert.equal(prepared.registers.si,0x1234);assert.equal(prepared.stackDelta,-2);assert.equal(prepared.memory[c+0x200-1],0);
 word(c+0x100,0);assert.equal(prepare(memory,0x1c0b,input).registers.bp,0);
-assert.throws(()=>prepare(memory,0x5000,input),/alias/);
+{const aliasBefore=memory.slice(),aliased=prepare(memory,0x5000,input);assert.equal(aliased.phase,'skip');assert.equal(aliased.entry,0x2632);assert.deepEqual(memory,aliasBefore);}
 assert.throws(()=>frame(new Uint8Array(1),0x1c0b,input),/1MiB/);
 console.log('Physical frame traversal/hidden flags, waits, draw boundary, cycles and stored-root scheduler continuation passed');
```

### B. `check-native-script-diagnostic.mjs`: **veraltet (keine Regression), bewiesen**
- **Letzter grüner Commit:** a6b77b3 (2026-10-18 15:22:11 +0200, „Reconstruct original context controls and BIOS seed operand“). Exit 0.
- **Erster roter Commit:** **12dc2f29b84d799cd4501c2f8c592f684bac98f1** (2026-10-18 15:28:56 +0200, „Connect original physical string assignments and local string expressions“). Exit 1.
- **Erwartet (Zeile 29):** Ausdruckstag 10 gilt als *nicht unterstützt*: `expression[31]=10; … assert.equal(unknownExpression.status,'stopped'); assert.equal(unknownExpression.steps,0)`.
- **Tatsächlich (wörtlich):** Die vorherigen vier Abschnitte laufen durch (bis „Native diagnostic: opcode156 empty/linked enumeration and unsupported result preservation passed.“), dann:
  `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `'ready' !== 'stopped'` bei `check-native-script-diagnostic.mjs:29:117`.
- **Ursache:** 12dc2f2 erweitert `original-dos-script-expression.ts` um Tag 10 (Kommentar `strings4/34` → `strings4/10/34`; `if(tag===4||tag===10||tag===34)`; Quelle `bp+offset` für Tag 10). Das steht so in PHYSICAL_STRING_ASSIGNMENT.md („`original-dos-script-expression.ts` unterstützt außerdem Tag 10 beim Lesen von Ausdrücken“). Der Prüfer hatte Tag 10 als Beispiel für einen *unbekannten* Tag gewählt. Diese Annahme ist durch den Fortschritt überholt.
- **Fix-Vorschlag:** Ein weiterhin nicht rekonstruierter Tag als Beispiel. 160 ist laut PHYSICAL_STRING_ASSIGNMENT.md der Tag, an dem der Ishar-1-Start ausdrücklich stoppt. Mit temporärer Kopie geprüft: Exit 0. Alle Abschnitte laufen durch, letzte Zeile „Native diagnostic: explicit DOS service request, success result and atomic missing-service halt passed.“ Nicht angewandt.
```diff
--- a/scripts/check-native-script-diagnostic.mjs
+++ b/scripts/check-native-script-diagnostic.mjs
@@ -26,7 +26,7 @@
 console.log('Native diagnostic: opcode156 empty/linked enumeration and unsupported result preservation passed.');
 const expression=bytes.slice();expression.set([31,56,0,255,76,0,255,58],30);const expressionInitial=openNativeScriptDiagnostic(expression);expressionInitial.dx=15;const expressionNext=stepNativeScriptDiagnostic(expressionInitial);assert.equal(expressionNext.si,32);assert.equal(expressionNext.steps,1);assert.equal(expressionNext.dx,0);assert.equal(expressionNext.cx,65535);assert.equal(expressionInitial.dx,15);
 expression[37]=0;const cutExpression=stepNativeScriptDiagnostic(openNativeScriptDiagnostic(expression));assert.equal(cutExpression.status,'stopped');assert.equal(cutExpression.steps,0);assert.equal(cutExpression.si,24);assert.equal(cutExpression.dx,0);
-expression[31]=10;const unknownExpression=stepNativeScriptDiagnostic(openNativeScriptDiagnostic(expression));assert.equal(unknownExpression.status,'stopped');assert.equal(unknownExpression.steps,0);
+expression[31]=160;const unknownExpression=stepNativeScriptDiagnostic(openNativeScriptDiagnostic(expression));assert.equal(unknownExpression.status,'stopped');assert.equal(unknownExpression.steps,0);
 console.log('Native diagnostic: opcode31 expression registers and unchanged truncated/unknown expression stops passed.');
 for(const [dx,takenSi] of [[0,31],[1,28]]){const conditional=bytes.slice();conditional.set([20,3,0,0],30);const initialConditional=openNativeScriptDiagnostic(conditional);initialConditional.dx=dx;initialConditional.cx=7;const nextConditional=stepNativeScriptDiagnostic(initialConditional);assert.equal(nextConditional.si,takenSi);assert.equal(nextConditional.dx,dx);assert.equal(nextConditional.cx,7);assert.equal(nextConditional.steps,1);assert.equal(initialConditional.si,24);}
 const truncatedConditional=bytes.slice();truncatedConditional.set([20,1],36);const initialConditional=openNativeScriptDiagnostic(truncatedConditional);initialConditional.si=30;const nextConditional=stepNativeScriptDiagnostic(initialConditional);assert.equal(nextConditional.status,'stopped');assert.equal(nextConditional.si,30);assert.equal(nextConditional.steps,0);
```
- **Grenze:** Ich habe nur festgestellt, dass Tag 160 heute stoppt. Eine robustere Variante wäre ein Tag, der dauerhaft ungültig bleibt; welcher das ist, kann nur Codex sagen.

**Empfehlung (beide):** Die beiden synthetischen `.mjs`-Prüfer in package.json als `test:*` aufnehmen, damit solche veralteten Annahmen sofort im npm-Lauf auffallen. Laut meiner Abnahme gibt es 43 `.mjs`-Prüfer außerhalb von package.json.

## C. Vorschlag: Warnung im Save-Writer bei Position auf massiver CONT-Zelle
- **Befund (Abnahme 18.10.):** HOTPOS (GRIMZEL, Spalte 16→19, A(53,19) = 0xFF) lässt das Original beim Laden neu starten. A = 0xFF blockiert im Original die Bewegung (Lauf C4).
- **Lokaler Branch:** `grok/hoth-save-solid-pos-proposal` (Basis 319819c), Commit **cc53059b58d9bf2088fa3826fa4f21c9e4c2da9a**. **Nicht gepusht, noch nicht integriert.** Der Haupt-Clone steht danach wieder auf 319819c (detached).
- **Dateien:**
  - neu `src/lib/ishar/save-position-check.ts` (sha256 3c471fb3…c0a4): `ishar2SavePosition(main)` liest 0x2ab4/0x2ab5/0x2ab6/0x2d18 aus `readIshar2SavedMain`; `checkIshar2PositionOnCont(pos,cont)` liefert `walkable | solid (A=0xFF) | negative (A<0, Semantik suspected) | outside | bad-cont`. Ebene B wird ignoriert.
  - geändert `scripts/save-main.mjs` (sha256 6dc63daf…7b): optionales 6. Argument `[CONT directory]`. Wenn gesetzt, liest das Skript nach dem Schreiben `CONT<Karte>.FIC`, hängt `positionCheck` an den JSON-Report und schreibt `WARNING: …` nach stderr. **Nur eine Warnung, kein Abbruch.** Ohne das Argument verhält es sich wie bisher.
  - neu `scripts/proposals/grok-check-save-solid-position.mjs` (sha256 311934a8…765b), nicht in package.json.
- **Tests:**
  - `env -u ISHAR2_DIR node scripts/proposals/grok-check-save-solid-position.mjs` → **Exit 0**. Rein synthetisch: walkable, solid, negative, outside (4 Fälle), B-Ebene ohne Einfluss, falsche CONT-Größe, Eingabe unverändert, Feldauslese.
  - `ISHAR2_DIR=…/originals/ishar2/Ishar2 node scripts/proposals/grok-check-save-solid-position.mjs` → **Exit 0**. Privat: GRIMZEL = (53,16,3,5) walkable; Spalte 19 in-memory → solid. CLI Ende-zu-Ende in ein neues `mktemp`-Verzeichnis: stderr enthält „WARNING: Position r53 c19 is on a solid CONT cell“, Report `positionCheck.code = solid`. Das Temp-Verzeichnis ist danach gelöscht.
  - Regression: `npm run typecheck` 0; `test:ishar2-save-layout` 0; `test:save-main-cli-local` 0; `test:ishar2-save-layout-local` 0.

## 6. Grenzen und nächster Schritt
- Bisect prüft nur den Exitcode des jeweiligen Prüfers. Native Python-Prüfer habe ich nicht ausgeführt, die Fix-Erwartungen sind also nicht nativ bestätigt.
- Die Warnung erklärt den Neustart nicht. Ob der Neustart eine Plausibilitätsprüfung im Original ist oder ein Absturz, bleibt offen. Negative A-Werte ≠ −1 sind nur suspected.
- **Nächster Schritt (Codex):** die zwei Diffs prüfen und übernehmen oder anpassen; beide Prüfer in package.json aufnehmen; über die Integration der Save-Warnung entscheiden (eventuell auch für `cont-mod apply`, wenn eine Save-Position auf eine neu massive Zelle fällt).

## 7. Codevorschläge (noch nicht integriert)
- Prüfer-Fixes: nur als Diff oben. Temporäre Kopien in `private/bisect/tmpfix/`, kein Commit.
- Save-Warnung: Branch `grok/hoth-save-solid-pos-proposal`, Commit cc53059, Dateien und Tests wie unter C.
