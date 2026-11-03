# HOTH – Ishar-1-Magie-Fixtures (3.11.2026, CET)

Quelle: `quesh/magic-contract-ishar1.md`. Neuer Vertrag `magic-ishar1` mit 34 Vektoren (I01–I34) in `fixtures/contract-fixtures.json`; Datei jetzt 151 Vektoren. Commit d073f89 auf `grok/hoth-contract-fixtures` (lokal, nicht gepusht; Clone danach wieder auf 319819c detached).

## Methode
- Generator `build-contract-fixtures.py` (Python) rechnet die Erwartungswerte. Checker-Modell `magic1` in `check-contract-fixtures.mjs` (JS) ist davon unabhängig geschrieben. Ergebnis: **magic-ishar1 known 6/0, suspected 28/0**; alle Verträge grün.
- Keine Save-Puffer in diesem Vertrag, nur Zahlen. Audit: 1418 Originale/Saves, 55577 Fenster, **0 Treffer** (Ausgabe in private/audit-magie-output.txt). sha256 von S1.SAV und IO.IO vorher und nachher gleich.
- Status `known` gilt nur für eigene Lesungen der Listings:
  - I01/I02 Kosten: FRISE 0x02cee–0x02d0c.
  - I06 freundlicher Wurf: 0x02413.
  - I07/I08 feindlicher Wurf: 0x02515.
  - I17 Preis 3·T[s−1] Tausend: STAGE 0x005e6.
- Alles andere ist `suspected` und trägt Quelle und Adresse (Quesh R1–R9). Darunter fallen T-Werte, Effekte, Timer, Klassenregeln, Lernwurf, Save-Offsets und die Testvorhersagen T1/T2/T3 (I03/I04/I05).
- Eigene Prüfung der Tabelle T (PARAM 0x4010): Die Spalten lvl(s)=T[s−1] und sl(s)=T[s] in Quesh R3 sind untereinander widerspruchsfrei. Die Werte selbst habe ich nicht aus den Bytes abgeleitet, darum bleibt das suspected. T[36]=0 ist eine Annahme.

## Kit-Probe (`probe-kit-against-fixtures.mjs`, Hauptergebnis)
Gesamt 56/134 passt (vorher 55/95; neu dazu nur I31.size).

| Vektor | Kit-Funktion | Urteil | ist / erwartet |
|---|---|---|---|
| I31.mental (c=3) | save-maps.ts ISHAR1_SAVE.psychic | **weicht ab** | 748 (0x2e9+c) / 771 (768+c) |
| I31.level (c=3) | ISHAR1_SAVE.level | **weicht ab** | 997 (0x3e2+c) / 741 (738+c) |
| I31.spell/rune/icon | – | fehlt | 850 / 5024 / 4953 |
| I31.size | ISHAR1_SAVE.minLength | passt (schwach) | 1035 ≤ 5216, Kit kennt die Größe 5216 nicht |
| I01–I30, I32–I34 | – | **fehlt** | keine Ishar-1-Magie im Kit (Kosten, Würfe, Heilung, Schaden, Lightning, Timer, Preis, Lernwurf, Klassenregeln, Schlaf, Zauberklassen, Bezahlregel) |

Plausibilitätsblick, nur gelesen und nicht in die Fixtures übernommen, auf S1.SAV:
- An 768+c steht 100,100,100,72,100. Das passt zu T1 (c3 = 72).
- An 738+c steht 10,10,10,8,8. Das sind plausible Level.
- Das Kit-Feld 0x3e2+c liefert 79,77,0,0,0, das Kit-Feld 0x2e9+c liefert 10,10,12,18,20. Beides ist für Level bzw. MENTAL unplausibel.
- Daraus folgt: Die DEBUG-Cheat-Map ist für die DOS-Saves mit 5216 B wahrscheinlich falsch. Bewiesen ist das erst mit einem Original-Lauf (T1).
- Nebenbefund: ISHAR1_SAVE nutzt ISHAR2_CLASSES. Die Ishar-1-Klassen-IDs (z. B. 6 Wizard, 18 Occult monk) habe ich nicht gegengeprüft.

## Urteile je Punkt
- Fixtures ohne Originalbytes: ja (Audit 0).
- Checker grün: ja, aber nur Selbstkonsistenz von Python und JS. Das belegt nicht das Originalspiel.
- Kit deckt Ishar-1-Magie ab: nein (33 Vektoren fehlen, 2 Offsets weichen ab).
- Offen (nicht geprüft): Laufzeitbeleg für T1/T2/T3, Werte T, Bedeutung von Item 40, T[36].

## Nachtrag 2026-11-03
Laufbeleg Save: MENTAL 768+c, Level 738+c, Class 728+c known (HOA/HOB); Kit-ISHAR1_SAVE psychic 0x2e9/level 0x3e2 widerlegt.
