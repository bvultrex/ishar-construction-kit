# HOTH Abnahme 18.10.2026: Hebel/Tür, Teil 2 (Schlüsseltür 8, zweiter Klick auf den Rahmen von Tür 5)

Ersteller: Hoth (Grok Bot, Executor). Zeit: 18:00–18:14 MESZ. Private Belege: `codex-support/hoth/private/hebel2/`.
Offsets: **ab 0** = save_layout/Quesh, **cmp** = `cmp -l`, ab 1.

## 1. Aufbau
- Klon `clones/hoth` steht detached auf 319819c. Den Position-Check habe ich auf dem lokalen Zweig `grok/hoth-save-solid-pos-proposal` (cc53059) laufen lassen und danach auf 319819c zurückgeschaltet. Nichts committet oder gepusht.
- Frische Arbeitskopie `private/hebel2/work-20261018-1801` per `cont-mod apply`.
  - Mod-Bytes wie zuvor: CONT5 124 = 67, 5525 = 33.
  - Alle Datei-mtimes auf 2026-01-01 gesetzt.
- Eigene Conf `private/dosbox-x-auto2-hebel2.conf` mit **`cycles=fixed 25000`**, Xvfb :97, je Session eine Instanz, am Ende mit kill -9 auf das eigene Muster beendet. Am Schluss laufen weder Instanz noch Xvfb. Alderaans Instanzen habe ich nicht angefasst.
- Eingangs-Saves:

| Save | Herkunft | Inhalt |
|---|---|---|
| HOTHC0 | Kopie von HOTHB1 aus `hebel/` | Tür 5 offen, r40 c31 Blick 3, Zone 33 |
| HOTKY1 | Patch von HOTHD8 (sha eedb1e68…; GRIMZEL mit Tür 8 zu) | Schlüssel in die Hand, siehe 3 |

## 2. Punkt 2: zweiter Klick auf den Rahmen von Tür 5
- Ausgang HOTHC0: Tür 5 offen (ab 0: 7386 = 1), offener Durchgang zu sehen (`04`).
- Klick (128,70) mit leerer Hand: **keine sichtbare Änderung** (`05`, `06`). Der Durchgang bleibt offen.
- Neuer Slot **HOTHC1** (18:04:56 MESZ). `cmp -l HOTHC0 HOTHC1` zeigt nur 49 0→3 und 50 63→201 (Spielzeit). **Tür- und Schaltertabelle unverändert**, Tür 5 bleibt 1.
- Neuladen in frischer Session:
  - Bilddiff GRIMZEL→HOTHC1: 28 630 px, der Ladevorgang hat gegriffen.
  - HOTHC1 gegen das Bild nach dem Klick (`06`): 403 px; gegen den Ausgang (`04`): 22 px. Die Tür bleibt offen.
- Bytecode passt dazu: PCAVE spawnt den Rahmen nur bei 0x4aa4[d] == 0. Bei offener Tür gibt es nichts zu klicken.

**Urteil Punkt 2: known. Der Rahmen öffnet nur, ein zweiter Klick schaltet nicht zurück.**

## 3. Punkt 1: Schlüsseltür 8 mit Schlüssel −17
**Patch-Beleg:**
- `save_layout.py` liefert für das Inventar `1036 150 main:0x2d8e`. Laut Quesh `dataflow-ishar2.md` Zeile 11 ist das 5 Charaktere × 15 Wörter, Slots 9 und 10 sind die Hände.
- Charakter 0, Slot 9 liegt ab 0 bei 1036 + 2·9 = **1054/1055**, Adresse 0x2da0 = 11680.
- Patch `[{"address":11680,"width":2,"value":-17}]`.
- `cmp -l HOTHD8 HOTKY1`: **1055 0→0377** und **1056 0→0357** (oktal) = ab 0 1054/1055 = FF EF. Sonst ist nichts geändert. Position-Check: walkable (r53 c16 Blick 3, Karte 5, Zone 36).
- Sichtprüfung: Im Charakterbogen von Eliandr liegt ein goldener Schlüssel in der linken Hand (`11`, `zoom.png`).

**Im Spiel:**
- Bogen öffnen (30,193), den Schlüssel aus der Hand nehmen (222,67): Der Cursor zeigt den Schlüssel. Danach EXIT (244,109).
- Vor dem Gitter von Tür 8 (Tiefe 1) mit dem Schlüssel auf (128,70), (128,40), (128,100), (100,70) und (160,70) geklickt: **das Gitter bleibt zu** (`30`–`36`).
- Schlüssel zurück in die Hand gelegt und gespeichert, neuer Slot **HOTKY2** (18:10:38 MESZ).
- `cmp -l HOTKY1 HOTKY2` zeigt nur 46, 49 und 50 (Spielzeit). **0x4aa4[8] (ab 0 7389, cmp 7390) bleibt 0.** Das Schlüsselwort 1054/1055 ist weiter FF EF.
- Neuladen in frischer Session:
  - Bilddiff HOTHC1→HOTKY2: 28 640 px, der Ladevorgang hat gegriffen.
  - HOTKY2 gegen HOTKY1 (vor dem Test): 120 px, das Gitter ist weiter zu.
  - Charakterbogen nach dem Laden gleich dem vor dem Test (0 px), der Schlüssel liegt in der Hand.

**Warum es nicht greift (Bytecode, eigen):**
- SOURIS 0x00a35 `ctstform 32767` → `cmatent`. Nur bei Material 66 und gehaltenem −17 wird 0x4aa4[8] = 1 gesetzt (0x00a5d). Ein Inventar-Schreibzugriff fehlt dort, also wird der Schlüssel nach Bytecode **nicht verbraucht**.
- PCAVE 0x000fb–0x00131: Das Türblatt von Tür 8 bekommt Sprite 41 (wie Tür 29), aber **kein `cforme`**. Nur Tür 29 erhält Form 4.
- Das Gitter ist also nicht klickbar. Zudem liegt die Gruppe in Zone 36 (DJCAT), wo laut Quesh kein Rahmen gespawnt wird.
- Die Quelle der Form mit Material 66 bleibt offen. Möglich ist der Rahmenweg 0x09 = 2 → `cforme 2` (PCAVE 0x001a2), Stufe suspected.

**Urteil Punkt 1:**
- **Patch und Schlüssel in der Hand: known.**
- **Tür 8 per Schlüssel öffnen: nicht erreicht (unknown).**
- Kein Tür-Byte geändert, Schlüssel nicht verbraucht (known für diesen Lauf ohne Treffer). „Wird bei Erfolg nicht verbraucht“ ist nur suspected (Bytecode).

## 4. CONT und Saves
- CONT1–4, 6 und 7 sind byte-gleich mit dem Original. CONT5 weicht nur in den 2 Mod-Bytes ab (sha 56e0771f…224b7b). Alle CONT-mtimes stehen auf 1767222000.
- Abweichende mtimes haben nur die neuen HOTHC1 und HOTKY2, dazu das Verzeichnis „Ishar 2 - Lösung“ (Kopier-mtime).
- sha256 von 311 Originalen und 435 Saves unter `dosbox/ishar2*`: vorher und nachher identisch. Nichts überschrieben.

## 5. Vorschläge
- Ermitteln, wer PCAVE mit 0x09 = 2 spawnt (DJ1/DJ2: Zelle mit A in 70–77 und B = 68?). Dort den Schlüssel testen.
- Alternativ Zone 31 bis 34 (DJ1) an einer Tür-8-Zelle per Patch setzen und prüfen, ob dann eine klickbare Form erscheint.
- Hand-Koordinaten im Charakterbogen: linke Hand (222,67), EXIT (244,109), Spielkoordinaten.

## 6. Belege
`private/hebel2/`: `session.log`, `snaps/`, Bilder `NN-*.png`, Kontaktbögen `m1`–`m3`, `zoom.png`, `in/key.json`, `out/HOTKY1.report.json`, Arbeitskopie, sha-Listen vorher und nachher.
