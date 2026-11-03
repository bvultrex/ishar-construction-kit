# HOTH-Abnahme 03.11.2026: Tür 9 und Zone (Queshs DJCAT-Hypothese), bereinigte Fassung

Autor: Hoth (Grok Bot, Executor). Party-Positionen, Pixelzahlen und Save-Namen nur in `private/HOTH_ABNAHME_2026-11-03_TUER9_ZONE.privat.md`. Offsets ab 0. Zone = Bytes 18–19 (BE16), Tür 9 = 7390. Blickcode 1 = W, 2 = S, 3 = O, 4 = N.

## Aufbau
Private Arbeitskopie, eigene Conf (cycles=fixed 25000), eigenes Xvfb, eine Instanz pro Session, danach beendet. Nur xdotool. Nur neue Slots; Patch-Saves nur an den angegebenen Bytes. sha256 vorher = nachher. Erstes Laden nach dem Start nahm nicht (Bilddiff), das zweite jeweils.

## Ergebnisse
| Test | Zustandswechsel | Urteil |
|---|---|---|
| Zone 35 (gepatcht), Schritt vor die Tür, Klick | 7390 0→1, Zone bleibt 35 | known |
| Zone 33 (gepatcht), dito | 7390 0→1 | known |
| Klick von der Nachbarzelle (Blick W), Zone 35 | 7390 0→1; Schritt in die Türzelle 1→0 | known |
| Zone 36 | Klick ohne Wirkung, 7390 bleibt 0 | known (frühere Läufe) |
| Laufweg ohne Zonenmarker | Zone bleibt die mitgebrachte | known |
| Echte Zone auf diesem Weg | vermutlich 36 | suspected |

## Gesamt
Bei Zone 33/35 öffnet der Klick Tür 9, bei Zone 36 nicht (known). Zuordnung Zone → Skript (DJ1/DJCAT) nur über Grafik/Verhalten, nicht im Code gelesen (suspected). Offen: reguläre Zone an der Tür.

## Nachtrag 03.11.2026 (Steuerung T1–T3, bereinigt)
| Test | Zustandswechsel | Urteil |
|---|---|---|
| T1a: von Markerzelle Zone 36 einen Schritt nach O | Zone 36→35 | known (Quesh-These bestätigt) |
| T1b: weiter bis vor Tür 9 (ohne Marker) | Zone bleibt 35 | known |
| T1c: Klick Tür 9 | 7390 0→1 | known |
| T2: drei Schritte nach W auf die Marker (Start mit Zone 35) | 1. Schritt: Zone bleibt 35 (nicht trennscharf, da Start 35); 2. Schritt: 35; 3. Schritt: 36 | known |
| T3 Gang zur Halle | nicht durchgeführt | offen |
Damit: Marker B=−75 → Zone 35, B=−76 → Zone 36 bestätigt (Zone = |B|−40 für diese zwei Werte known; allgemeine Regel −99..−70 suspected; Marker 34/33 nicht getestet).
