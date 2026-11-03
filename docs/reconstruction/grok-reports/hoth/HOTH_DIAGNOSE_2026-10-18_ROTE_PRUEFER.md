# Diagnose: zwei rote Prüfer und Vorschlag „Save-Position auf massiver Zelle“ (Hoth), 18.10.2026

> Bereinigte Fassung (2026-11-03): Positionen, Pixelzahlen, Spielzeiten, sha-Werte und Rohwerte aus Saves stehen in `private/bereinigung/HOTH_DIAGNOSE_2026-10-18_ROTE_PRUEFER.privat.md`.

Auftrag von Cupero, 18.10. 16:41. Bearbeitet 16:41–16:50 Europe/Berlin (MESZ).
Format wie `HOTH_ABNAHME_2026-10-18.md` (Handoff-Punkte 1–7). Reine Diagnose: Prüferdateien und Codex-Bereich (original-dos-*, check-native-*) sind **nicht geändert**. Nichts gepusht. Saves und Originale sind nur gelesen; die sha256 aller 311 Originale und aller 435 .SAV unter `dosbox/ishar2*` sind vorher und nachher gleich (`private/bisect/*-nachher.sha` gegen `private/xpgold/*-vorher.sha`).

## 1. Basis
- Clone `/workspace/ishar/clones/hoth`, geprüfter Stand 319819c (Repo bvultrex/ishar-construction-kit, Branch workbench/playable-slice).
- Node v24.22.0 (`/workspace/ishar/tools/node-v24.22.0-linux-x64`).
- Beide Prüfer sind synthetisch, brauchen keine Originaldaten und stehen **nicht** in package.json. Deshalb fallen sie in keinem `npm run test:*` auf.

## 2. Fragestellung
Sind `scripts/check-dos-physical-frame.mjs` und `scripts/check-native-script-diagnostic.mjs` auf 319819c veraltet, oder liegt eine echte Regression vor? Welcher Commit ist der erste rote, welcher der letzte grüne?

## 3. Befehle und Exitcodes
_(Rohdaten-Block → private Fassung)_
- Die Prüferdateien sind im gesamten Bereich add644a..319819c **unverändert** (`git log --follow`). Bisect testet also überall dieselbe Prüferversion; eine temporäre Kopie war für den Bisect nicht nötig.
- Die Fix-Proben laufen als temporäre Kopien **außerhalb des Repos**: `private/bisect/tmpfix/*.fix.mjs`, Importe auf den Worktree-Stand 319819c umgeschrieben.

## 4./5. Ergebnis je Prüfer

### A. `check-dos-physical-frame.mjs`: **veraltet (keine Regression), bewiesen**
- **Letzter grüner Commit:** 604d60b (2026-10-18 12:25:42 +0200, „Verify actual startup MAIN decode and root return for both games“). Exit 0, Ausgabe:
  `Physical frame traversal/hidden flags, waits, draw boundary, cycles and stored-root scheduler continuation passed`
- **Erster roter Commit:** **f46db969e167** (2026-10-18 12:32:41 +0200, „Support original startup memory aliases in scheduler and MAIN expressions“). Exit 1.
- **Erwartet (Zeile 14):** `assert.throws(()=>prepare(memory,0x5000,input),/alias/)`, also ein Fehler „…alias needs shared scheduler preparation“.
- **Tatsächlich (wörtlich):** `AssertionError [ERR_ASSERTION]: Missing expected exception.` bei `check-dos-physical-frame.mjs:14:8`, `expected: /alias/`, `actual: undefined`.
- **Ursache:** f46db96 entfernt in `original-dos-physical-context.ts` die beiden absichtlichen Ablehnungen (`Globals/context alias …`, `Globals/module alias …`) und leitet auf `prepareOriginalDosSharedScheduler` um. DOS_STARTUP.md beschreibt das im selben Commit ausdrücklich: „The former MAIN scheduler and context continuation rejected any such window overlap. `original-dos-shared-scheduler.ts` replaces that restriction …“. Nativ belegt laut Doku über `check-native-dos-shared-scheduler.py` (576 Fälle je Spiel; von mir nicht ausgeführt). Der Prüfer erwartet also ein Verhalten, das Codex bewusst ersetzt hat.
- **Neues Verhalten an der Stelle (gemessen):** `prepare(memory,0x5000,input)` wirft nicht mehr. Ergebnis `phase:'skip'`, `entry:0x2632`, Eingabe unverändert.
- **Fix-Vorschlag** (nur als Diff, nicht angewandt; mit temporärer Kopie geprüft: Exit 0, gleiche Erfolgsmeldung). Die neue Erwartung `skip/0x2632` ist ein Regressionsanker auf das heutige Verhalten. Ob sie nativ stimmt, sollte Codex gegen die Shared-Scheduler-Vektoren prüfen.
_(Rohdaten-Block → private Fassung)_

### B. `check-native-script-diagnostic.mjs`: **veraltet (keine Regression), bewiesen**
- **Letzter grüner Commit:** a6b77b3 (2026-10-18 15:22:11 +0200, „Reconstruct original context controls and BIOS seed operand“). Exit 0.
- **Erster roter Commit:** **12dc2f29b84d** (2026-10-18 15:28:56 +0200, „Connect original physical string assignments and local string expressions“). Exit 1.
- **Erwartet (Zeile 29):** Ausdruckstag 10 gilt als *nicht unterstützt*: `expression[31]=10; … assert.equal(unknownExpression.status,'stopped'); assert.equal(unknownExpression.steps,0)`.
- **Tatsächlich (wörtlich):** Die vorherigen vier Abschnitte laufen durch (bis „Native diagnostic: opcode156 empty/linked enumeration and unsupported result preservation passed.“), dann:
  `AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:` / `'ready' !== 'stopped'` bei `check-native-script-diagnostic.mjs:29:117`.
- **Ursache:** 12dc2f2 erweitert `original-dos-script-expression.ts` um Tag 10 (Kommentar `strings4/34` → `strings4/10/34`; `if(tag===4||tag===10||tag===34)`; Quelle `bp+offset` für Tag 10). Das steht so in PHYSICAL_STRING_ASSIGNMENT.md („`original-dos-script-expression.ts` unterstützt außerdem Tag 10 beim Lesen von Ausdrücken“). Der Prüfer hatte Tag 10 als Beispiel für einen *unbekannten* Tag gewählt. Diese Annahme ist durch den Fortschritt überholt.
- **Fix-Vorschlag:** Ein weiterhin nicht rekonstruierter Tag als Beispiel. 160 ist laut PHYSICAL_STRING_ASSIGNMENT.md der Tag, an dem der Ishar-1-Start ausdrücklich stoppt. Mit temporärer Kopie geprüft: Exit 0. Alle Abschnitte laufen durch, letzte Zeile „Native diagnostic: explicit DOS service request, success result and atomic missing-service halt passed.“ Nicht angewandt.
_(Rohdaten-Block → private Fassung)_
- **Grenze:** Ich habe nur festgestellt, dass Tag 160 heute stoppt. Eine robustere Variante wäre ein Tag, der dauerhaft ungültig bleibt; welcher das ist, kann nur Codex sagen.

**Empfehlung (beide):** Die beiden synthetischen `.mjs`-Prüfer in package.json als `test:*` aufnehmen, damit solche veralteten Annahmen sofort im npm-Lauf auffallen. Laut meiner Abnahme gibt es 43 `.mjs`-Prüfer außerhalb von package.json.

## C. Vorschlag: Warnung im Save-Writer bei Position auf massiver CONT-Zelle
- **Befund (Abnahme 18.10.):** HOTPOS (GRIMZEL mit geänderter Spalte auf einer Zelle mit A = 0xFF) lässt das Original beim Laden neu starten. A = 0xFF blockiert im Original die Bewegung (Lauf C4).
- **Lokaler Branch:** `grok/hoth-save-solid-pos-proposal` (Basis 319819c), Commit **cc53059b58d9**. **Nicht gepusht, noch nicht integriert.** Der Haupt-Clone steht danach wieder auf 319819c (detached).
- **Dateien:**
  - neu `src/lib/ishar/save-position-check.ts` (sha siehe private Fassung): `ishar2SavePosition(main)` liest 0x2ab4/0x2ab5/0x2ab6/0x2d18 aus `readIshar2SavedMain`; `checkIshar2PositionOnCont(pos,cont)` liefert `walkable | solid (A=0xFF) | negative (A<0, Semantik suspected) | outside | bad-cont`. Ebene B wird ignoriert.
  - geändert `scripts/save-main.mjs` (sha siehe private Fassung): optionales 6. Argument `[CONT directory]`. Wenn gesetzt, liest das Skript nach dem Schreiben `CONT<Karte>.FIC`, hängt `positionCheck` an den JSON-Report und schreibt `WARNING: …` nach stderr. **Nur eine Warnung, kein Abbruch.** Ohne das Argument verhält es sich wie bisher.
  - neu `scripts/proposals/grok-check-save-solid-position.mjs` (sha siehe private Fassung), nicht in package.json.
- **Tests:**
  - `env -u ISHAR2_DIR node scripts/proposals/grok-check-save-solid-position.mjs` → **Exit 0**. Rein synthetisch: walkable, solid, negative, outside (4 Fälle), B-Ebene ohne Einfluss, falsche CONT-Größe, Eingabe unverändert, Feldauslese.
  - `ISHAR2_DIR=…/originals/ishar2/Ishar2 node scripts/proposals/grok-check-save-solid-position.mjs` → **Exit 0**. GRIMZEL-Position walkable; mit geänderter Spalte in-memory → solid (Positionen privat). CLI Ende-zu-Ende in ein neues `mktemp`-Verzeichnis: stderr enthält „WARNING: Position … is on a solid CONT cell“, Report `positionCheck.code = solid`. Das Temp-Verzeichnis ist danach gelöscht.
  - Regression: `npm run typecheck` 0; `test:ishar2-save-layout` 0; `test:save-main-cli-local` 0; `test:ishar2-save-layout-local` 0.

## 6. Grenzen und nächster Schritt
- Bisect prüft nur den Exitcode des jeweiligen Prüfers. Native Python-Prüfer habe ich nicht ausgeführt, die Fix-Erwartungen sind also nicht nativ bestätigt.
- Die Warnung erklärt den Neustart nicht. Ob der Neustart eine Plausibilitätsprüfung im Original ist oder ein Absturz, bleibt offen. Negative A-Werte ≠ −1 sind nur suspected.
- **Nächster Schritt (Codex):** die zwei Diffs prüfen und übernehmen oder anpassen; beide Prüfer in package.json aufnehmen; über die Integration der Save-Warnung entscheiden (eventuell auch für `cont-mod apply`, wenn eine Save-Position auf eine neu massive Zelle fällt).

## 7. Codevorschläge (noch nicht integriert)
- Prüfer-Fixes: nur als Diff oben. Temporäre Kopien in `private/bisect/tmpfix/`, kein Commit.
- Save-Warnung: Branch `grok/hoth-save-solid-pos-proposal`, Commit cc53059, Dateien und Tests wie unter C.
