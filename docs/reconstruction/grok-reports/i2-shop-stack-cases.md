# Ishar 2: Stapelware im Originalshop (CONT1 selector 6, Ware −50, qty 5, Preis 300) – vier Fälle mit EXE-Reload

Stand: 2026-11-14, 21:50–22:10 Europe/Berlin. Ishar 2 DOS, MARCHAND.IO `a5b84f95b8b5…`, MAIN.IO `bfab5e917593…`, CONT1.FIC `b3f48f1856b7…`. Arbeitskopie in DOSBox-X 2025.02.01, Sprache 3, Eingabe nur per xdotool, eigene Instanz. Originale vorher und nachher hash-identisch (311 Dateien). Kit-Vergleich gegen `workbench/playable-slice` @ `21bc808` (eigener Klon, nur gelesen). Basis für die Form: Nachtrag 36 (`35ce192`).

## 1. Bezug
- Shop und Weg wie im Bericht zum Shop-Roundtrip (Nachtrag 36): Ereigniszelle vor der Tür, vorwärts → MAIN 0x0326a → `marchand.IO`, selector 6. Ausgangspunkt aller Fälle ist der dort im Spiel geschriebene, ungepatchte Zwischen-Save `IPOSE` (auf der Ereigniszelle; Werte SW-I2S-2, SW-I2S-9) bzw. private Patch-Kopien davon.
- Ware: Gitterslot oben rechts (238,59), Bündel „5“, Preis 300 (Sortimentsfelder: Code −50, (0, 300), qty 5). Statuszeile „Nahrung“.
- Kit: `src/lib/ishar/original-commerce.ts` `receiveOriginalPurchase` (Stapelbereich −59..−49, Index = Code + 59, Deckel 10, bei −49 20; Teilbündel: voller Preis, `accepted = min(qty, D − alt)`; voll → `full-stack`; Gold zuerst → `insufficient-gold`).

## 2. Code (MARCHAND.IO, Ishar 2) – known
- Stapelzähler: MAIN-Bytetabelle 0x4bd4, 5 × 20 Byte, Save-Offset **7629 + 20c + (Code + 59)**; für −50 und c0: **7638**. Restmenge im Kauf: 0x4bbc[Code + 59] = qty (0x00540).
- Reihenfolge beim Porträtklick:
  1. Goldprüfung L_004d4 (nur Gold des Empfängers): Ablehnung, wenn Tausender < 0 oder (Tausender gleich und Rest < 300) → Meldung −21, Rückkehr in die Auswahl, keine Writes.
  2. L_00693: Suche nach demselben Code in Slots 0..10; Treffer → L_00775. Sonst erster freier Slot 0..8 (L_006dd), Code dort eintragen (0x006ef), dann L_00775.
  3. L_00775: Deckel D = 10 für −50 (0x00798), 20 für −49, sonst 10. Wenn alt + Rest ≤ D: alt += Rest, Rest = 0. Sonst alt = D, Rest −= (D − alt).
  4. L_00715: Rest ≠ qty → Erfolg; Rest = qty (nichts aufgenommen) → Meldung −43 „Das ist zuviel für den Rucksack.“, keine Abbuchung.
  5. Erfolg → Abbuchung des **vollen** Bündelpreises (L_00603, Tausender-Borgen), auch wenn nur ein Teil passte.
- Regel damit: **neu = min(D, alt + qty)**, Gold −300 bei jedem Kauf mit neu > alt.
- **Nachtschließung (neu gefunden, known):** MAIN 0x02e14: bei Händlercodes (|B| 17..39) und Tageszeit-Phase 0x519f = 3 (Stunde < 6 oder ≥ 22, MAIN 0x04018) erscheint Meldung 57 („Halt' die Klappe da drüben! Weißt Du nicht wie spät es ist?“), der Shop öffnet nicht. Die Phase wird beim Eintritt geprüft, nicht während des Kaufens.

## 3. Klickfolge (je Fall)
1. Boot (Sprache `KP_3`, Intro, Musik `KP_2`), Diskette (266,12) → LOAD (238,32) → Name → Return.
2. Vorwärts (287,26) → „Möchtet Ihr etwas kaufen?“ → ok (270,134).
3. Ware (238,59) **einmal** → Zeiger weg → Porträt c0 (32,170) **einmal**.
4. Bei Meldung: Exit-Stein (288,62) einmal zum Quittieren, ein zweites Mal zum Verlassen. Ohne Meldung: einmal.
5. Diskette → SAVE (240,58) → neuer Name → Return.
6. Reload: eigene Instanz neu starten → LOAD → Charakterbogen c0 (32,193) → exit (242,107) → neu speichern → Diff.

## 4. Ergebnisse

| Fall | Ausgang | Writes (Commerce) | Gold c0 | Stapel 7638 | Slot | Meldung | Label |
|---|---|---|---|---|---|---|---|
| 1 normaler Kauf | IPOSE (ohne Patch) | 1007, 1026, 1027, 1036/1037, 7638 | **−300** | **+5** (neuer Stapel) | 0 = −50 (FF CE) | – | **known** |
| 2 Teilbündel | IPATB (**mit Patch**: Slot 0 = −50, Stapel 7) | 1007, 1026, 1027, 7638 | **−300** (voller Preis) | **+3** (7 → Deckel 10, 2 verworfen) | unverändert | – | **known** (mit Patch) |
| 3 voller Stapel, Kette | IPOSE (ohne Patch), drei Käufe in einem Besuch | 1007, 1026, 1027, 1036/1037, 7638 | **−600** (nur zwei Abbuchungen) | **+10** (0 → 5 → 10, dritter: 0) | nur Slot 0 = −50 | dritter Kauf: −43 | **known** |
| 3 voller Stapel, einzeln | IPATC (**mit Patch**: Slot 0 = −50, Stapel 10) | **keine** | 0 | 0 | unverändert | −43 | **known** (mit Patch) |
| 4 zu wenig Gold | IPATD (**mit Patch**: Gold 0 Tausender / 299 Rest) | **keine** | 0 | 0 | leer | −21 „Du bist pleite.“ | **known** (mit Patch) |

- Sonstige Bytes in den Kauf-Diffs: Facing (Byte 7, Umkehr beim Verlassen; SW-I2S-7), Uhr 45/48/49 und Tageszeit 91/93 (SW-I2S-8), Akteur-Reroll in den Blöcken 0x36ac/0x3d9e…/0x43ba. Keine anderen Party-, Gold- oder Inventarbytes.
- Der zweite Kauf in der Kette hat keinen zweiten Slot belegt (Zusammenführung in Slot 0 über L_00693).
- Konkrete Werte, Hashes und Anzeigen: SW-I2S-9…14.

## 5. EXE-Reload je Fall
| Fall | Reload-Save | Bogen c0 nach Reboot | Diff Ergebnis → Reload |
|---|---|---|---|
| 1 | STKRA | Brot mit „5“, Gold reduziert | nur Uhr/Tageszeit + Offset 7577 |
| 3 Kette | STKRD | Brot mit „10“ | nur Uhr + 7577 |
| 2 | STKRE | Brot mit „10“ | nur Uhr/Tageszeit + 7577 |
| 3 einzeln | STKRG (eigener Reboot) | Brot mit „10“, Gold unverändert | Uhr/Tageszeit, Akteur-Reroll, 7577 |
| 4 | STKRF | kein Brot, Goldanzeige = Patchwert | nur Uhr/Tageszeit + 7577 |
- In keinem Fall ändert sich beim Laden und Wiederspeichern ein Commerce-Byte (996..1305, 7629..7728). **known.** Bedeutung von 7577 (Block 0x4b80) weiterhin unknown.

## 6. Abgleich mit dem Kit (`21bc808`)
- `receiveOriginalPurchase` auf denselben Eingabesaves liefert: Fall 1 `accepted 5`, Kette `5 | 5 | full-stack`, Fall 2 `accepted 3, discarded 2`, Fall 3 `full-stack`, Fall 4 `insufficient-gold`. Die Commerce-Bytes des Kits sind in **allen** Fällen byte-identisch mit den im Spiel geschriebenen Saves. Stapel-Lage (7629 + 20c + Code + 59), Deckel 10 und Regel min(D, alt + qty) stimmen.
- **Abweichungen (nicht byte-, sondern verhaltensseitig):**
  1. **Nachtschließung fehlt im Kit.** Das Original öffnet Händler bei Phase 0x519f = 3 nicht (MAIN 0x02e14, Meldung 57). Im Kit gibt es keinen Bezug auf 0x519f.
  2. **Meldungstexte.** Original: −21 „Du bist pleite.“, −43 „Das ist zuviel für den Rucksack.“ – derselbe Text für vollen Stapel und vollen Rucksack. Kit-UI: „Nicht genügend Gold.“, „Stapel voll.“ bzw. „Rucksack voll.“/„Gepäck voll.“.
  3. **Gehaltene Ware nach Ablehnung.** Im Original bleibt die Ware nach −21/−43 in der Hand (Rückkehr nach L_00477), die Meldung braucht einen Klick; erst das Verlassen (L_005ca) leert 0x2d16/0x4bbc. Ob das Kit die Auswahl nach einer Ablehnung hält, wurde hier nicht geprüft.

## 7. Patches
- Mit Patch: Fall 2 (IPATB), Fall 3 einzeln (IPATC), Fall 4 (IPATD); jedes Byte samt Begründung in `private/save_patches.md`. Alle Patches nur auf privaten Kopien von IPOSE; Patchwerte: Slot 0 = −50 mit Stapel 7 bzw. 10; Gold 0 Tausender / 299 Rest (knapp unter 300).
- Ohne Patch: Fall 1 und die Kette für Fall 3.

## 8. Risiken und offene Grenzen
- Doppelklick-Risiko: Jeder weitere Porträtklick ist ein weiterer Kauf (in der Kette bewusst genutzt). Keine sichtbare Kaufbestätigung außer Statuszeile „Nahrung“ beim Halten.
- Verlorene Klicks: Ein Lauf (STKNB, SW-I2S-15) blieb ohne Kauf, weil der Vorwärtsklick verloren ging und der Exit-Klick (288,62) außerhalb des Shops das Bewegungsfeld traf (ein Schritt zurück). Vor dem Kaufen deshalb den Shopbildschirm per Screenshot prüfen.
- Tageszeit: Fälle nur von Saves mit Phase ≠ 3 und genug Abstand zu 22 Uhr starten. Ein zweiter Besuch aus einem Kauf-Save gelingt zeitlich oft nicht mehr.
- Fall 2 ist nur mit Patch herstellbar (mit Bündeln zu 5 ab 0 sind nur 5 und 10 erreichbar).
- Nicht abgedeckt: voller Rucksack (9 belegte Slots ohne passenden Stapel), Stapel in einer Hand (Slots 9/10), andere Empfänger, Code −49 (Deckel 20).
