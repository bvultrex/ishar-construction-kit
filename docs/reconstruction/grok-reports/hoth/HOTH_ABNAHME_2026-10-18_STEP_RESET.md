# HOTH-Abnahme 18.10.2026: STEP_RESET_DOORS im Original (bereinigte Fassung)

Autor: Hoth (Grok Bot, Executor). Bereinigt am 03.11.2026: Party-Positionen, Pixelzahlen und Save-Namen stehen nur in `private/HOTH_ABNAHME_2026-10-18_STEP_RESET.privat.md`. Offsets ab 0 (cmp -l = +1).

## Aufbau
Private Arbeitskopie, eigene Conf (cycles=fixed 25000), eigenes Xvfb, eine Instanz pro Session, danach beendet; fremde Instanzen nicht angefasst. Nur neue Slots. sha256 der Originale und Saves vorher = nachher. Das Spiel schreibt keine CONT-Datei.

## Ergebnisse (Zustandswechsel)
| Punkt | Zustandswechsel | Urteil |
|---|---|---|
| Tür 5 (Rahmenklick) | 7386 0→1; nach einem erfolgreichen Schritt 1→0; Laden ohne Schritt: bleibt 1 | known: Kit = Original |
| Tür 6 / Hebel 6 | Hebel: 7387 1→0, 7437 1→0; danach über 22 Schritte/Drehungen unverändert | known: Kit = Original |
| Tür 9 nach Schritt | 7390 1→0 (Zustand gepatcht, nicht im Spiel geöffnet) | known |
| Tür 9 beim Drehen | 7390 1→0 | known |
| Tür 9 Laden ohne Schritt | bleibt 1 | known |
| Tür 17 (Klick) | 7398 0→1; nach Schritt 1→0; beim Drehen 1→0; Laden ohne Schritt bleibt 1 | known |
| Kontaktliste 7576–7578 nach Schritt | → [0,0,0] | known |
| Kontaktliste beim Drehen | bleibt (Neueintrag vermutet) | known (Wert), Mechanismus suspected |
| Drehen ruft L_013af (0x0083a TL, 0x0096b TR) | Tür 5 1→0 beim Drehen | known (Nachtrag 03.11.) |

## Statisch (GERDEP)
L_013af: 0x4b80[0..2] = 0 (0x013d5–0x013e9), 0x4aa4[5/9/17] = 0 (0x013f3–0x01407), danach `cjsr L_0162a`. Aufrufer: alle erfolgreichen Bewegungspfade und TL/TR.

## Kit
`door-mechanics.ts afterStep` passt für Schritte (Türen 5/9/17). Lücken: kein Turn-Hook, keine Kontaktliste (Diff-Vorschlag nur im Bericht, Kit nicht geändert). Fixtures M45–M58 auf `grok/hoth-contract-fixtures`.

## Tür 9 und Zone (Nachträge 03.11.)
Siehe `HOTH_ABNAHME_2026-11-03_TUER9_ZONE.md`: Rahmen/Klick öffnet Tür 9 bei Zone 33 oder 35, nicht bei Zone 36.
