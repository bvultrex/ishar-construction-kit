# Codex-Handoff 2026-11-14: Grok-Helferberichte (Quesh, Alderaan, Hoth)

Stand: 2026-11-14, Europe/Berlin. **Die Arbeit ruht seit 2026-11-03.** Seit der Pause gibt es keine neuen Commits auf den unten genannten Branches (geprüft am 2026-11-14).

**Kontext (Stand 2026-11-16, Europe/Berlin):** Kit-Tip `workbench/playable-slice` `f2a77b9`. Nachträge bis 49 sind integriert. Neu ist Nachtrag 50 (§5.4r). Offene Aufträge laufen: Hoth `taverne-multipayer-native.md`, Alderaan `lauschen-t2-native.md`.

Dieses Dokument fasst alle Nachträge, die Fixtures, die Kit-Lücken und die offenen Punkte zusammen. **Nichts davon ist im Kit integriert** (Stand 2026-11-14; den späteren Stand nennt der Kontext oben). Codex prüft und entscheidet über jede Integration.

## 1. Zweck und Regeln

- **Audit first, edit second.** Zuerst gegen Bericht und Fixture prüfen, dann den Code ändern.
- **Keine Originaldaten committen:** keine Originaldateien, Kartenbytes, Bilder, Saves oder Speicherdumps.
- **Evidenzlabels** gelten pro Aussage:
  - `known`: im Original gemessen oder im Code kausal belegt.
  - `suspected`: aus dem Code abgeleitet, aber nicht im Lauf bestätigt.
  - `unknown`: offen.
- **User-Maps nie ohne Opt-in umschreiben.**
- **Im Zweifel originalgetreu:** Bei Abweichungen gewinnt das Originalverhalten.
- **Save-Patches** gibt es nur auf Kopien unter `private/`. Jedes Byte steht in `save_patches.md`. Ergebnisse aus solchen Läufen sind als „mit Patch“ markiert.

**Public/Private-Grenze**

- Öffentlich erlaubt:
  - Offsets, Code-Formeln und Zustandsänderungen, die aus dem Code folgen
  - IDs und CONT-Zellen
  - Koordinaten eigener Patches (markiert „mit Patch“)
  - Save-Dateinamen und UI-Klickpunkte aus dem Spielinterface
  - Code-Konstanten, z. B. XP-Grenze 31000, angezeigter Preis 580 po, Speichergebühr 1000
  - Bot-Namen
  - Commit- und Hash-Präfixe mit 7 oder 12 Zeichen
  - synthetische Testwerte
- Nur privat (auf der Box unter `/workspace/ishar/codex-support/*/private`, im Repo als Verweis `SW-…`):
  - echte Save-Werte (HP, Gold, XP, MENTAL, Level, Psi)
  - Charakternamen und Party-Positionen aus Saves
  - Hashes über 12 Zeichen
  - Personennamen
  - Rohdumps

## 2. Branch-Tips (Stand 2026-11-14)

| Branch | Tip | Inhalt |
|---|---|---|
| `grok/reports-2026-10-18` | `ece3adf` (Nachtrag 26), danach dieser Handoff | Berichte unter `docs/reconstruction/grok-reports/` (Index: `README.md`, Unterordner `quesh/`, `hoth/`, `alderaan/`) |
| `grok/hoth-contract-fixtures` | `fd5beb6` | 250 synthetische Vektoren, Stand Hoth-Commit `ff50403` |
| `workbench/playable-slice` | `c786e0f` | Quesh' `HANDOFF_2026-11-03.md` im Repo-Root. Davor kommt der letzte Codex-Commit `155b22d` vom 2026-10-18. |

- Die Basis der Berichte ist `workbench/playable-slice` @ `bb42748` (Code-Stand `319819c`).
- Quesh' Handoff ist **verifiziert**. Commit `c786e0f` fügt `HANDOFF_2026-11-03.md` hinzu (208 Zeilen, Datei im Repo-Root). Dieser Handoff hier ersetzt ihn nicht, sondern fasst den späteren Stand bis Nachtrag 26 zusammen.
- Die gelöschte Fixtures-README bleibt auf dem Remote gelöscht.
- `check-output.txt` und `probe-output.txt` werden nie gepusht.

## 3. Übersicht der Nachträge

Der Index mit Links zu jeder Datei steht in `docs/reconstruction/grok-reports/README.md`. Die Labels gelten pauschal, die Details stehen im jeweiligen Bericht.

| Nachtrag | Dateien | Inhalt | Label |
|---|---|---|---|
| Grundstock, 1–3 | `quesh/README`, `dataflow-ishar1/2`, `pickup-contract-ishar2`, `combat-contract-ishar2`, `hebel-tuer-trigger-ishar2`, `tableau-editor`, `zeit-ishar2`; `alderaan/REFERENCES`; Hoth `ABNAHME_2026-10-18`, `DIAGNOSE_ROTE_PRUEFER`, `XP_GOLD`, `CONT_WRITEBACK(_2)`, `HEBEL_TUER(_2)`, `TUER8`, `TUER28_ZEIT`, `ACTOR69`, `FIXTURES_2026-10-18` | Datenfluss NPC/Monster/Item, Pickup-, Kampf- und Hebel/Tür-Verträge Ishar 2, Zeit und Speichersperre, TABLEAU-Editor. Dazu Hoth-Abnahmen für XP/Gold, CONT-Writeback, Türen 5/8/28, Actor 69 und der erste Fixtures-Branch. | Pickup confirmed/known; TABLEAU statisch; sonst gemischt |
| 4 | `combat-contract-ishar1`, `magic-contract-ishar2`, `party-contract-ishar2` | Kampf Ishar 1 mit Level-up, Magie und Party Ishar 2 | gemischt known/suspected |
| 5 | `HOTH_ABNAHME_2026-10-18_STEP_RESET` | Tür 5 ist gleich Original. Tür 6 (Hebel) hat keinen Reset. GERDEP `L_013af` setzt die Türen 5/9/17 zurück, leert die Kontaktliste `0x4b80[0..2]` und weckt Entities mit `0x0c=33`. | Tür 5/6 known; 9/17 suspected; Kit-Lücke suspected |
| 6 | `magic-contract-ishar1` | Magie Ishar 1: Zauberliste, Lernen beim Trainer, Kosten, Timer | suspected (statisch) |
| 7 | `party-contract-ishar1/2`, `dialog-text-contract-ishar2`, `quest-flags-contract-ishar2`, `flagcheck-ishar2.py`, `shop-tavern-contract-ishar1`, `npc-dialog-contract-ishar1`, `HOTH_FIXTURES_ISHAR1_MAGIE` | Party-, Dialog-, Quest-Flag-, Shop/Taverne- und NPC-Dialog-Verträge, Magie-Fixtures. Das Flag-Skript liest nur Offsets. | statisch, known/suspected je Punkt |
| 8 | `HOTH_ABNAHME_2026-11-03_ISHAR1_SAVE` und Updates | Abnahme des Ishar-1-Saves | known/suspected je Punkt |
| 9 | `HOTH_FIXTURES_ISHAR1_SHOP_PARTY` | Fixtures für Shop, Taverne und Party in Ishar 1 | gemischt |
| 10 | `save-map-ishar1` | Vollständige Save-Map Ishar 1 (5216 Bytes), soll `ISHAR1_SAVE` in `save-maps.ts` ersetzen | known/suspected je Feld |
| 11 | `tuer-hebel-trigger-ishar1`, `monster-ki-ishar1/2`, `HOTH_FIXTURES_ISHAR1_SAVEMAP` | Tür/Hebel-Trigger Ishar 1, Monster-KI Ishar 1/2, Abnahme der Save-Map. Quesh-Verträge rückwirkend bereinigt. | gemischt |
| 12 | `alderaan/REFERENCES`, Hoth `STEP_RESET`, `TUER9_ZONE`, `SAVEMAP`, `SHOP_PARTY`, `HOTH_FIXTURES_MONSTER_KI` | Bereinigte Fassungen; Monster-KI-Fixtures MK01–MK10 und MK21–MK28 | gemischt |
| 13 | `tuer-hebel-trigger-ishar1` (Korrektur der T4-Türkante), `dungeon-karten-ishar1`, `MONSTER_KI` bereinigt | Dungeon-Karten Ishar 1: Zellwerte, Zonen, Laufregeln | known/suspected |
| 14 | `dungeon-karten-ishar1` | Zellwerte → Renderer/Trigger, 21 Wertklassen, Tests R1–R5 | known/suspected |
| 15 | `HOTH_GESAMTBILD_KIT_ABWEICHUNGEN` | Kit-Abweichungen nach Priorität: Save-Map, Shop/Party, Monster-KI | gemischt |
| 16 | Hoth-Bereinigungen, `SAVEMAP` (Rasse `733+c` kausal), `save-map-ishar1` (Gold Tausender/Rest), `dungeon-karten-ishar1` (Außenrenderer, Sprites, Außenmodule) | Rasse per Patch belegt; Außenmodule je Zone | Rasse known (mit Patch); Renderer suspected |
| 17 | `io-komposit-format` | ALIS-.IO-Ressourcen Ishar 1: Tabelle, Bitmap, Komposit `0xFF` | known (Struktur) |
| 18 | Quesh-Bereinigungen, `save-map` (`0x1c3e` = Countdown), `monster-ki-ishar2` (Tabelle `0x4d88`, 114 Einträge), `dungeon-karten` (MCAVE-Sprite-Indizes) | Bereinigung und Ergänzungen | gemischt |
| 19 | Quesh-Bereinigungen, `hebel-tuer-trigger-ishar2` Teil 3 (Zone an Tür 9) | Hashes ≤ 12 Zeichen, Werte nur privat | gemischt |
| 20 | Hoth-Bereinigungen; Fixtures `02ad7a4` | KEYPOS synthetisch | – |
| 21 | Hoth-Bereinigungen (Klickpunkte aus dem Code) | – | – |
| 22 | `HOTH_DIAGNOSE_2026-10-18_ROTE_PRUEFER` bereinigt | – | – |
| 23 | `alderaan/REFERENCES` bereinigt | Patch-Ergebnisse sind als „mit Patch“ markiert | gemischt |
| 24 | `shop-tavern-contract-ishar1`, `save-map-ishar1`, `tuer-hebel-trigger-ishar1`, `SHOP_PARTY`, `MONSTER_KI`; Fixtures `2666fe4` | Speichergebühr 1000 Gold (SOS.IO), Hebelstand, T5c/Hebel 14; 248 Vektoren | Speichergebühr known |
| 25 | `SHOP_PARTY`, `MONSTER_KI`; Fixtures `42d010e` | Verteilung der Gebühr bestätigt (SG03/SG05 known). In Ishar 2 kostet Speichern kein Gold. 249 Vektoren. | known |
| 26 | `SHOP_PARTY`, `MONSTER_KI`, `shop-tavern-contract-ishar1`; Fixtures `ff50403` | n=3 und n=4 per Patch-Lauf bestätigt (SG04 known, SG06 neu). Belegung über Klassenbyte ≠ `0xFF`. Die Bytes ab 4741 sind ein Artefakt des `0xFF`-Patches. | known (mit Patch) |

Insgesamt gibt es **26 Nachträge** zuzüglich Grundstock und diesem Handoff.

## 4. Fixtures und Kit-Probe

- Branch `grok/hoth-contract-fixtures` @ `fd5beb6` enthält **250 Vektoren**, alle synthetisch (Hoth `ff50403`).
- Die Kit-Probe lief zuletzt über den IO.IO-Pfad: **70/248 Vektoren bestehen** (Stand vor SG06, Hoth 2666fe4 / 42d010e).
  - Codex sollte die Probe gegen 250 neu laufen lassen.
- Die fehlenden Vektoren gehen fast vollständig auf die Lücken in Abschnitt 5 zurück.

## 5. Kit-Lücken, in empfohlener Integrationsreihenfolge

### 5.1 Ishar-1-Speichergebühr (known)

- Jedes Speichern kostet **1000 Gold** (SOS.IO `L_00b5e`/`L_00cf8`). Der Abzug erfolgt vor dem Schreiben.
- `n` ist die Zahl der Slots, deren Klassenbyte `728+c` ≠ 255 ist. Jeder Charakter zahlt `1000 div n`.
- Rest und Fehlbetrag übernimmt der erste zahlungsfähige Charakter in Slot-Reihenfolge.
  - Bei n=4 zahlt jeder 250.
  - Bei n=3 ist die Aufteilung 334/333/333.
- Unter 1000 Gold gesamt erscheint Meldung **−21 „SIE HABEN KEIN GOLD MEHR.“**, und es wird nicht gespeichert.
- **Ishar 2:** Speichern kostet kein Gold.
- Fixtures: SG01–SG06.

### 5.2 Ishar-1-Tür- und Hebel-Layout (known/suspected je Punkt)

- Zellwerte:
  - 46–65 und 82–85 sind Türen.
  - 66–69 sind Hebel.
  - −80..−82 sind Übergänge.
  - −1..−25 und −40..−43 sind Spezialwände (Meldung 17 mit k; k=2 ist der Händler).
- **Kantenregel aus `value mod 4`:** 66 → Blickrichtung 4, 67 → 2, 68 → 1, 69 → 3. Man steht auf der Hebelzelle selbst.
- Hebel:
  - Hebel 2 auf (25,52), Blick 2, Byte 4665.
  - Hebel 13 auf (23,32), Blick 4, Byte 4676 (mit Patch belegt).
  - Hebel 14 auf (35,11), Blick 1, Byte 4677, mit den Türen 4641/4642 (T28/T29) (mit Patch belegt).
- Byte 2117 ist ein Halte-Countdown.
- Dazu gehören der STEP_RESET-Pfad (GERDEP `L_013af`, Kontaktliste, Typ-33-Wecken; suspected) und die Fixtures LV01–LV03.

### 5.3 Monster-KI und Respawn (gemischt)

- Monster-KI Ishar 1 und 2 fehlen im Kit vollständig (MK01–MK10, MK21–MK30).
- Ishar 1: Beim Laden wird nicht neu gewürfelt. Ein Kartenwechsel löscht die Akteure 60..69 (known).
- Ishar 2:
  - Beim Zonenwechsel werden die Akteure 90+ auf den Spawnpunkten neu erzeugt. Wandermonster gibt es in den Zonen 44/47/48/58.
  - In Zonen ohne Wandermonster werden sie gelöscht.
  - Beim Laden werden Position und HP neu gewürfelt (known).
  - Die Zonentabelle `0x4d88` hat 114 Einträge.
- `save-actors.ts readActorSave` passt bereits (MK25).

### 5.4 Shop: Spaltenwahl und Stapelzähler Ishar 1

- Nur der Käufer (Porträtspalte) zahlt, und zwar genau den angezeigten Preis (known).
- Der Stapelzähler `4971+10c+(item+66)` steigt beim Kauf um die Sortimentsmenge qty, begrenzt auf den Deckel D: neuer Zähler = min(D, alt + qty). qty ist 5 für −57, 20 für −58, sonst 1. Im Kit steht 7629, Index item+59 (Offset known seit Nachtrag 31).
  - **Korrektur 2026-11-14:** Die frühere Angabe „+1“ gilt nur für Stapelcodes mit qty = 1. Siehe Nachtrag 30 (Alderaan STK: −58 in leeren Stapel, 0 → 20) und Nachtrag 31 (Quesh, MARCHAND L_007a1). Bei vollem Stapel folgt Meldung −43 ohne Abbuchung (T2r).
- Der Stapelbereich ist −66..−57 statt −59..−49 (known, SH07).
- Stapelkappe: −57 → 5, −58 → 20, sonst 10 (known seit Nachtrag 31, MARCHAND L_007a1).
- Gold-Offsets: Tausender `478+2c`, Rest `3993+2c`, je BE16.
- Inventar: `498+26c+2k`, int16 BE, 13 Slots.

### 5.4b Korrektur Pickup Ishar 2 (Nachtrag 32, 2026-11-14)

- **A1 (known, Listing):** In Ishar 2 geht Code 10 über Porträt oder Handfeld als Gold an die Figur und **nicht ins Gepäck**: Einheiten 1026+2c += Geldbeutel 16–17, Tausender 1006+2c += Geldbeutel 14–15 plus Übertrag, danach 14–17 = 0; das Objekt ist verbraucht (FRISE 0x0032b, `L_04825`/`L_06865`). Das Kit (`receiveOriginalGround`, `f4cf659`) schreibt Code 10 derzeit in 1036+30c+2s; `check-original-ground-roundtrip-local.mjs` erwartet das ebenfalls. Siehe Nachtrag 32, A1.
- Weitere fehlende oder abweichende Writes (Nachtrag 32):
  - **A2:** Bodenablage schreibt zusätzlich T50c8[id] = Blickrichtung (Save 8039+id); das Kit stellt den alten Snapshot wieder her.
  - **A3:** Ablage von Code 9 auf Handfeld 9/10 (1036+30c+18/20, Rüstung +0) fehlt im Kit.
  - **A4:** Tausch mit belegtem Slot (Rüstung nur für −29..−26 angepasst) fehlt.
  - **A5:** Aufnahme aus einem Slot (Übergabe an andere Figur, Slot → 0, Rüstung −=) fehlt.
  - **A6:** Code 9 auf Material 100 bei 0x4aa0 == 1 setzt 0x4f13 = 3 (Save 20–21); fehlt (außerhalb Karte 1).
- **Stand Kit (Nachtrag 35, `playable-slice` `1f96371`):** A1 erledigt in `6a3632f`, A2 erledigt in `1f96371`. Für den 9/10-Pfad ist zwingend nur noch **A3** (Handfeld) offen; A4–A6 kommen später.

### 5.4c Originalabnahme Pickup Ishar 2 (Nachtrag 33, 2026-11-14)

- **Original-EXE-Reload für Ishar 2 / Objekt 9 / CONT1 ist known (mit Patch):** Aufnahme, Ablage in Rucksack oder Hand, Speichern und Reload in der Original-EXE. Der Save-Diff ist genau 336/536/736+i → 0 und das Inventarwort 1036+30c+2s → i; der Blick 8039+i bleibt. Beim Vergleich die Uhr (44–49) und den Neuwurf der Akteure ≥ 90 tolerieren.
- **Code 10 ist ein Goldbeutel (known, mit Patch; Nachtrag 34, korrigiert B7 aus Nachtrag 33):** Am Porträt gilt Einheiten 1026+2c += Wort(16–17) mit Übertrag (Summe > 999 → Tausender += Summe div 1000, Einheiten = Summe mod 1000), Tausender 1006+2c += Wort(14–15), danach 14–17 → 0. Es gibt keinen Slot-Write, das Objekt bleibt nicht in der Welt. Belegt mit HIPG (Beutelbetrag ≠ 0, Werte privat) und Reload in der Original-EXE. Damit ist **A1 aus §5.4b nativ bestätigt**. Die frühere Beobachtung „verbraucht, ohne Wirkung“ kam daher, dass der Beutel in HIPA leer war.
  - Die Kit-Abweichung bleibt: `receiveOriginalGround(…, 10, …)` in `f4cf659` schreibt 10 in 1036+30c+2s.
  - Objekt 10 über den Handplatz ist weiter **suspected** (nicht gespielt).

### 5.4d I2-Shop-Roundtrip (Nachtrag 36, 2026-11-14)

- **known (ohne Patch, Original-EXE-Reload):** Ishar 2, CONT1 selector 6, Ware −61, Preis 1800, Empfänger c0 ab `START.SAV`. Gold- und Inventarbytes (1007, 1026, 1027, 1036, 1037) stimmen mit `EXPECTED.SAV` aus `check-original-shop-roundtrip-local.mjs` überein; nach Reboot, Reload und Wiederspeichern bleiben sie unverändert.
- Kit-Hinweise:
  1. Das Skript wählt bei mehreren SAVs alphabetisch `FINALE.SAV` und Empfänger c1. `ISHAR2_DIR` darf nur `START.SAV` enthalten, oder die Quelldatei muss explizit gewählt werden.
  2. Die Kit-Richtung „east“ (Code 1) bewegt im Original auf Spalte−1. Bitte prüfen.
  3. Offset 7577 (Block 0x4b80) ändert sich beim Neuspeichern; Bedeutung offen.

### 5.4e Hitbox Code 9 (Nachtrag 37, 2026-11-14)

- **known (Original-EXE, Eingabe mit Patch):** Die Aufnahme-Hitbox von Code 9 auf CONT1 ist ein festes Rechteck x 116..141 × y 104..123 (Spielkoordinaten, inklusiv). Sie entsteht aus OBJET-Form 40 plus Objekthöhe −42 (Formkollision, keine Bitmap-Maske).
- **Kit-Abweichung:** `6a3632f` nutzt das Bitmap-Rechteck des SVG-`<image>`. Ihm fehlen y 104..116, es nimmt fälschlich y 124 an, und seitlich reicht es nur bis etwa x 139.
- **Vorschlag:** Das Rechteck aus OBJET-Form plus Objekthöhe berechnen: `128+ox ≤ x ≤ 128+ox+ex`, `77−(Z+oz+ez) ≤ y ≤ 77−(Z+oz)`. Objekt 10 (Form 16, rechnerisch x 122..134, y 101..119) ist nur abgeleitet.

### 5.4f Hitbox Code 10 (Nachtrag 38, 2026-11-14)
- Bericht: `code10-hitbox-edges.md` (Hoth). known: x 122..135, y 101..119 inklusiv (14×19), Rechteck, keine Maske.
- Regel (known, Form 40 und 16 konsistent): x 128+ox .. 128+ox+ex; y 77−(Z+oz+ez) .. 77−(Z+oz), Z = −42. Vergleich `<=` in start.exe suspected.
- Kit 21bc808: Objekt 9 stimmt; Objekt 10 fällt auf Bitmap-Rechteck zurück (suspected ~121..133 × 106..124). Vorschlag: {x:122, y:101, width:14, height:19} bzw. allgemein aus Form + Objekthöhe.

### 5.4g I2-Shop Stapelware (Nachtrag 39, 2026-11-14)
- Bericht: `i2-shop-stack-cases.md` (Alderaan). selector 6, Ware −50, qty 5, Preis 300, Deckel 10, Zähler 7629+20c+(Code+59). Vier Fälle known per EXE-Reload; Gold/Inventar/Stapel-Bytes identisch mit Kit.
- Teilbündel: min(D, alt+qty), voller Preis wird trotzdem abgebucht.
- Kit-Abweichungen (Verhalten): Original hat einen gemeinsamen Text für Stapel/Rucksack voll; nach Ablehnung bleibt Ware in der Hand, Meldung braucht Quittierklick.
- Offen: voller Rucksack, Stapel in der Hand, Code −49 mit Deckel 20, Offset 7577.

- **Korrektur:** Der Hinweis „Nachtschließung fehlt im Kit“ war falsch; sie war bereits in `21bc808` über SAV-Phase 90/91 angeschlossen, Phase 3 ist in `64a3c4f` browsergeprüft. Offen bleibt nur die Uhrfortschreibung.

### 5.4h Itemtransfer-Prüfung cb511ba/de424b7 (Nachtrag 40, 2026-11-14)
- Bericht: `item-transfer-check-cb511ba.md` (Quesh), rein statisch gegen FRISE. Keine Abweichung in Nichtstapelcodes, Handtausch-Rüstungsregel und Empfängerrouting.
- Grenzen: L_02610 (Charakterblatt) nicht im Kit (Entnahme ohne Handlungsprüfung suspected); Kit lehnt Tausch mit nicht unterstützten Altcodes ab (vorsichtiger); Freigabe nur bei T4bbc == 0 suspected.

### 5.4i Nativer Ladetest der Codex-Exportdatei (Nachtrag 41, 2026-11-14)
- Bericht: `codex-export-native-load.md` (Hoth). START und `START.SAV-9-received.SAV` hash-gleich mit Codex' Vorgabe (Präfixe e685cd690257 / 74378c770176); Kit 64a3c4f „1 cases passed“.
- known: Export lädt nativ, Objekt 9 im Inventar von Figur 0, nicht mehr am Boden; Neuspeicherung + Reload: 17 Bytes Diff, alle erklärt (Uhr 45/48/49, 14 Bytes Akteur-Neuwurf 90–92). Pickup-Bytes identisch zur nativen Aufnahme.
- suspected: `--controlled-placement` setzt die Party auf die erste begehbare Zelle am Kartenrand; dort ist ein fremdes Bodensprite sichtbar (vermutlich auf einer gemeinsamen Parkposition geparkte Objekte, Wert privat).
- Offen: reguläres Gehen ab Exportposition, nativer Load des controlled-input-Stands, `--controlled-gold`.

### 5.4j Stapelweitergabe 26e290c (Nachtrag 42, 2026-11-14)
- Bericht: `stack-transfer-check-26e290c.md` (Quesh), statisch gegen FRISE. Keine Abweichung (ganz/ein Stück, Rest am Cursor T4bbc, Quelle nur bei Zähler 0 gelöscht, Ziel gleicher Code 0..10 sonst erster freier 0..8, Deckel 20 für −49 sonst 10, Bilanz geht auf).
- Listinglücke geschlossen (Budget 4096, Ende 0x02d4f); im Vertrag `pickup-contract-ishar2.md` per Nachtrag korrigiert.
- Grenzen: Klickzone 0x02cbb als Zahlenanzeige suspected; Kit lehnt Weitergabe auf Handfeld ab (vorsichtiger); loc100 in L_03580 unknown.

### 5.4k Waffenpfad 97a7367 (Nachtrag 43, 2026-11-14)
- Bericht: `weapon-path-check-97a7367.md` (Quesh), statisch gegen FRISE 02e20/03b98. Keine Abweichung.
- known: Waffen −116..−90 (0x02e36), Profil T4a08 27×4 Byte nur aus PARAM (0x00f58), nicht im Save; zweihändig = Feld 2 mod 10 == 2 (12 Waffen). Reservierung −125 in der anderen Hand (0x02ea1/0x02eea), belegt → Ablehnung ohne Write (0x02f0b). Freigabe L_03b98 bei Entnahme (0x02c6d) und vor jeder Handablage (0x02e32).
- Abgelehnte Tausche: Original gibt zuerst frei, dann Prüfung; Kit prüft zuerst. In allen Ablehnungsfällen keine Writes, keine verwaiste Reservierung. Einziger Pfad „reserviert, aber abgelehnt“: L_0315b bei T4bbc ≠ 0, mit gehaltener Waffe vermutlich unerreichbar (suspected).
- Vertrag `quesh/pickup-contract-ishar2.md`: Nachtrag „Zweihand-Reservierung und L_03b98“.

### 5.4l LOGO-Palette-6-Modtest I1/I2 (Nachtrag 44, 2026-11-14)
- Bericht: `logo-palette6-modtest.md` (Alderaan). Modkopien via `npm run mod:logo-probe` (Kit 64a3c4f), Ziel-SHAs stimmen (I1 0c5d8f5cc9ea, I2 b33a15437d82); geändert nur LOGO.IO (Bild-Offset 20172) plus Manifest.
- known: Original startet mit Modkopie (I2 nach Sprachwahl); zweiter Lauf identisch; 311 Originale und ORIGINALROOT vorher = nachher.
- known: Farbe 0 wirkt nur im VGA-Rahmen (10800 px Overscan, nur mit DOSBox-X overscan=10 sichtbar), im 320×200-Bild 0 rote Pixel. Grund: Logo-Hintergründe nutzen nur Index 5, Sprites behandeln Index 0 als transparent.
- Vorschlag (nicht umgesetzt): sichtbarer Test über tatsächlich genutzten Index, etwa 5. Entscheidung bei Codex.
- Offen: Übergang LOGO → Spiel nicht geprüft; Kit-Feld `verification` steht weiter auf `prepared-not-tested-in-original`.

### 5.4m Stapel-Handadapter c3df950 (Nachtrag 45, 2026-11-14)
- Bericht: `hand-runtime-check-c3df950.md` (Quesh), statisch gegen FRISE 02e20–03348/03580. Beide Kernfälle liefern im Original dasselbe Ergebnis wie im Kit (known); Restblockade 0x03161, alter Stapel 0x03212/0x0322c, Doppelslot-Unterdrückung 0x0326b, Sentinel-Freigabe L_03b98 und AND-Rüstungsregel passen. Die frühe Buchung (0x02e2e) liegt im Kit hinter den Prüfungen, mit gleichem Ergebnis außer H1.
- **H1, Abweichung (known), Entscheidung bei Codex:** gehaltener Stapel auf Handfeld mit −125. Kit lehnt ab (`placeOriginalHandItem` Z. 18, Button deaktiviert). Original bucht über 0x02e2e bis zum Deckel und geht über 0x03012 nach L_03348, ohne Slot-Write und ohne Freigabe: bei vorhandenem Slot gültige Zusammenführung, sonst Zähler ohne Slot; Folgezustand des Cursors suspected. Empfehlung: mindestens die Zusammenführung bei vorhandenem Slot nachbilden.
- Vertrag: Nachtrag „Stapel auf Handfeld, Reihenfolge der Mengenwrites“; JSON um addendum_2026_11_14_stack_gap/_twohand/_stack_hand ergänzt.

### 5.4n Ausrüstungsplatz 12 (Nachtrag 46, 2026-11-14)
- Bericht: `slot12-adapter-check-83d51c0.md` (Quesh), statisch gegen FRISE 0x026cf–0x02a66; Adapter 83d51c0/17245f4 unverändert bis 8b2a4ee. Keine Abweichung, alle Punkte known.
- Nur −89..−82 nach Slot 12 (0x027d2/0x027e8, 0x0294c); Speicherung Code+1 (0x029b4/0x02a23), Lesen Code−1; Rüstung nach L_03f22, beim Tausch erst neu addieren (0x02a3e), dann alt abziehen (0x02a5c), Kit netto mit & 255, gleiches Ergebnisbyte; Write-Reihenfolge nur in RAM-Zwischenständen verschieden.
- Kit strenger (keine Abweichung): alte Werte außerhalb des Bereichs abgelehnt, Routing über Slot-12-Band zu 11/13/14 gesperrt.
- H1 aus §5.4m ist in Kit 83852b4 umgesetzt (Codex).

### 5.4o Stapel-Handadapter nativ (Nachtrag 47, 2026-11-14)
- Bericht: `hand-stack-native-check.md` (Hoth). Beide Kernfälle in Ishar 2 nativ wie vom Kit erwartet; Inventar- und Zählerbytes identisch zur Erwartungsdatei (323f0fc0bd9f = Codex' Browserexport), sonst nur Uhr und Akteur-Neuwurf 90–92 (known). Mengenbilanz geht auf, keine Duplikation; Reload in neuer Session ohne unbekannte Bytes.
- Hinweis Lesart: „dritte Figur“ und „viertes Gepäck“ sind im Kit-Generator beide Figur 3 (die vierte Figur); geprüft wurde die Generator-Lesart.
- B2 (known): Linksklick auf einen Stapel hebt im Original nur eine Einheit; ganzer Stapel nur über Tausch an den Cursor. Kit-Aufnahme nicht geprüft; falls das Kit den ganzen Stapel per Klick nimmt, weicht es ab.
- B3 (known): Bei offenem Charakterblatt öffnet der Disk-Knopf kein Speichermenü.
- Offen: Kit-Stapelaufnahme; Fälle −125, Zielcode 16, Teilübernahme bis Deckel 20, Nicht-Stapel gegen Stapel im Rucksack; Rucksack-Tausch nur beobachtet (suspected).

### 5.4p TAVERNE-Zahlungsvertrag Ishar 2 (Nachtrag 48, 2026-11-14)
- Bericht: `taverne-payment-contract.md` (Quesh), statisch, TAVERNE.IO ea315973f218 (= Hash des Kit-Prüfers), fünf synthetische Fälle. Ishar 1 hat nur ITAVERNE.IO.
- Zahlung (known): belegte Figuren (Klasse ≠ −1) c = 0..4, Anteil ⌊Preis/n⌋ (L_00bff). Pass 1 (0x004b8–0x00574): Anteil zahlen oder alles (0/0). Pass 2 (0x0057c–0x00628): erste Figur, die den Rest deckt, zahlt ihn; davor zahlen alle alles. Borgen über L_00b6f.
- Preis (known): t = |B| − 1, Taverne nur bei 0 < |B| < 16; Preis = 500 + 40t (0x001ae).
- Zu wenig Gesamtgold (known): Meldung −21 (0x00239/0x0025d), Abbruch, kein Save-Write.
- Write-Reihenfolge (known): Stunde Save 44, Tick Save 48, Essensnachricht, Gold Pass 1 dann Pass 2 (Tausender 1006+2c, dann Einheiten 1026+2c), danach Nahrung 1326+c nur bei HP > 0.
- **Kit-Abweichungen:** `original-tavern.ts` Z. 10 prüft beim Essen die Klasse statt HP > 0 (eine belegte Figur mit HP ≤ 0 zahlt mit, isst aber nicht, known). Nahrung > 127: Original liest signed (+40-Zweig), Kit nimmt 100-Zweig (Vorkommen unknown).
- Grenzen: Division mit Abschneiden gegen 0 suspected; nativ belegt nur Einzelzahler t = 2.

### 5.4q Sichtbarer LOGO-Modtest Palette 6 / Index 5 (Nachtrag 49, 2026-11-14)
- Berichte: `logo-palette6-visible-index.md` und `logo-palette6-visible-modtest.md` (Alderaan).
- Kandidat (analytisch): Palette 6 / Index 5 in I1 und I2 (LOGO-Bilder identisch). Sichtbar 44093 von 64000 px (Hintergrund 44086, Emblem 7), deterministisch I1 43930 / I2 43934; Hintergrund opak, Index nicht animiert. Zweiter Platz Index 17 (3012 px). Index 0: 0 sichtbare px. Kit-Zahl 109307 zählt über alle dekodierten Bilder (Hintergrund 320×300 plus Einträge 12–15 und Emblem) und passt zum Kandidaten. Risiko: Einträge 12–15 nutzen ebenfalls Index 5.
- Nativer Test (Kit c472220, known): `mod:logo-visible-probe` exit 0 in beiden Spielen, Ziel-Hashes stimmen (I1 6a1f8bf02cfb, I2 08caa6f1a1cc), geändert nur LOGO.IO plus Manifest. In je zwei Starts ca. 44000 px schwarz → rot, alle an Index-5-Positionen; Rest im Referenzrauschen. Rahmen, Index 17, Schrift und Emblem unverändert. Übergang nach dem Logo: Titel und Intro normal, 0 rote Pixel (Palette wird zurückgesetzt). Quellen vorher = nachher.
- Risiken: Zwei I2-Läufe hingen im Logo wegen verlorener Leertasten der Tastenautomatik (auch bei der Referenz); mit Fokus-Tasten liefen alle vier Kontrollläufe normal. Spätere Programmteile mit eigenen Paletten ungeprüft. Kit-Feld `verification` steht weiter auf `prepared-not-tested-in-original`.

### 5.4r Nachtrag 50 – Code-16-Effekte (Quesh)
- Bericht: `quesh/code16-effects-check-f2a77b9.md` (Quesh, 2026-11-16), statisch: Kit `f2a77b9` (`original-hand-runtime.ts` `placeOriginalHandItem`, `playtest.tsx`) gegen FRISE.IO 27117c124caf.
- Stimmt (known): Gehaltene Stapel −59..−51 auf ein Handfeld mit Code 16 buchen in den Effektzweig 0x03069–0x03157: −59..−56 → Save 12 (main 0x4c3a) += q·1000/100/10/1, −55..−52 → Save 10 (main 0x4c38) += q·1000/100/10/1, −51 → Save 10 = −1; danach Cursor leer, kein Slot- oder Zählerwrite. −50/−49 auf 16: Abbruch ohne Tausch, im Kit und im Original gleich (0x03161).
- **D1 (known):** Kit Z. 22–30 fängt jeden gehaltenen Code auf Code 16 ab, auch Nicht-Stapel. Ohne Menge entsteht NaN, Save 10 oder 12 wird auf 0 gesetzt und der Gegenstand verschwindet (`held: null`). Der Button ist aktiv (`playtest.tsx` Z. 1305). Das Original tauscht über `L_0315b` (0x03053): Code 16 an den Cursor, gehaltener Code in den Slot, Rüstungstausch. Bei Zweihandwaffen setzt 0x02ea1/0x02eea vorher −125 in der anderen Hand, sonst Abbruch bei 0x02f0b.
  - **Empfehlung:** originalgetreuen Tausch umsetzen; mindestens ablehnen (`null`) statt Save 10/12 zu nullen. Betroffen: `original-hand-runtime.ts` Z. 22–30 und `playtest.tsx` Z. 1305.
- **D2 (suspected):** `L_03b98` (0x02e32) gibt −125 der anderen Hand auch bei Ziel 16 frei; das Kit kehrt vorher zurück (Sentinel-Behandlung Z. 54). Der Zustand ist über belegte Pfade nicht erreichbar, nur über einen inkonsistenten Spielstand.
- Offen (unknown): fachliche Bedeutung von Save 10/12 (main 0x4c38/0x4c3a); native Erreichbarkeit von D2; wie Code 16 in ein Handfeld gelangt.

### 5.5 Danach

- Save-Map Ishar 1 komplett in `save-maps.ts`:
  - `minLength` ist 5216.
  - Level liegt bei `738+c`, Psi bei `768+c`, Rasse bei `733+c`.
  - Details stehen im Bericht `HOTH_GESAMTBILD_KIT_ABWEICHUNGEN`.
- Taverne und Party Ishar 1 (TV01–TV10, PA03–PA11).

## 6. CONT-Formate

- **Ishar 1:**
  - `CONT1..6.FIC` sind ungepackt: 54×90 Zellen zu je 1 Byte signed, Index `x·90+y`, gelesen ab Datei-Offset 0. `0x0080` und `0x234a` sind RAM-Puffer.
  - Die Zonen 1–6 laden CONT1–6, die Zonen 12–15 laden CONT2–5.
  - MAIN-Module: 1/3/4 PLAINE, 2/5 Wald, 6 TEMPLE, 12/15 Höhle, 13/14 VILLE.
- **Ishar 2:** CONT ist 60×180. Layer B liegt bei `5400+r·60+c`.
- **Sprites:** Index in die .IO-Ressourcentabelle; Kompositformat `0xFF` (`io-komposit-format`).

## 7. Offene Punkte

1. Der Outdoor-Renderer für Ishar 1 ist nicht fertig (suspected).
2. Die Sprite-Indizes für VILLE und TEMPLE sind unknown. Für MCAVE sind sie bekannt.
3. Die Bedeutung der Zellwerte 78–81 ist unknown.
4. Alderaan T1 ist blockiert, weil Monster die Route versperren.
5. Alderaan T6 mit Item: Das Spiel fror zweimal ein, der Punkt ist offen. T6 mit Patch ist geklärt: Die Tür wird geschlossen gezeichnet und der Schritt blockiert.
6. Quesh muss SG06 in seinen Verträgen nachtragen. SG04 ist known.
7. Hoth braucht weitere Tests, unter anderem den Zonenwechsel in Ishar 2 mit Wandermonstern im Lauf und die Kauf-Diff beim Gold.
8. Die Kit-Probe muss gegen die 250 Vektoren neu laufen.

## 8. Wiederaufnahme

- Die Arbeit ruht seit 2026-11-03. Neue Lieferungen kommen als Nachtrag 27 ff. auf `grok/reports-2026-10-18`, jeweils nach strenger Prüfung gegen die Public/Private-Grenze.
- Fixtures-Updates kommen auf `grok/hoth-contract-fixtures`.
- Die Originaldateien waren beim letzten Abgleich hash-identisch (311 Dateien).
