# LOGO Palette 6 / Index 5 → Rot: sichtbarer Modtest im Original (Ishar 1 und Ishar 2)

Stand: 2026-11-14, Kit-Stand `c472220` (eigener Klon, unverändert, `git status` leer). Nichts committet.

## Erzeugung (reproduzierbar)

```
npm run mod:logo-visible-probe -- ishar1 ORIGINALROOT NEWCOPY
npm run mod:logo-visible-probe -- ishar2 ORIGINALROOT NEWCOPY
```

- ORIGINALROOT ist eine hash-geprüfte Arbeitskopie. NEWCOPY ist jeweils ein neues Verzeichnis.
- Beide Läufe enden mit exit=0. Ausgabe: `color 5`, `indexedPixelOccurrences 109307`, `changedImageOffsets [20187]`, `changedFiles [LOGO.IO]`, Regel: Rotkanal zwischen Maximum und 0 umschalten.
- Ziel-SHA256, in voller Länge mit dem Erwartungswert verglichen:
  - Ishar 1: `6a1f8bf02cfb…`, **Übereinstimmung ja**
  - Ishar 2: `08caa6f1a1cc…`, **Übereinstimmung ja**
- Die Mod-Kopie unterscheidet sich von ORIGINALROOT nur in `LOGO.IO` und `ishar-ck-mod-manifest.json`. Keine anderen Indizes und keine anderen Ressourcen wurden geändert.

## Abgleich mit dem Kandidaten

Der Kandidat aus der Indexanalyse ist ebenfalls Palette 6 / Index 5, also **Übereinstimmung**. Die Zahlen unterscheiden sich, weil sie Verschiedenes zählen:

- 44093 ist die Zahl der sichtbaren Pixel im statischen 320×200-Bild.
- 109307 ist die Kit-Zählung über alle dekodierten Bilder von `LOGO.IO`:
  - Hintergrund 320×300: 96000
  - Eintrag 15: 12098
  - Eintrag 14: 1194
  - Einträge 12/13: je 4
  - Emblem: 7
- Davon sind nur 320×200 abzüglich der Sprite-Flächen sichtbar. Eine Summe über Frames steckt nicht darin.

## Methode

- Ein eigenes DOSBox-X pro Lauf, Original-EXE, feste Taktrate. Gemountet wurde die Mod-Kopie bzw. eine hash-identische Referenzkopie.
- Aufgenommen wurde mit 2 fps über 75 s, mit festem Tastenplan:
  - **Ishar 1:** Logo ohne Eingabe, danach Leertaste ×3 und Sprachwahl.
  - **Ishar 2:** Sprachwahl, Logo, danach Leertasten.
- Ausgewertet wurde nur das 320×200-Bild.
- Pixel-Diff Referenz gegen Mod im selben Frame, solange das Logo statisch ist, also vor der ersten Taste nach dem Logo.
- Als Rauschmaß dient Referenz gegen Referenz. Die Funkel-Animation ist zufällig.
- Rohbilder bleiben privat.

## Ergebnisse

| Prüfung | Ishar 1 | Ishar 2 |
|---|---|---|
| Original-EXE startet mit Mod-Kopie | ja: **belegt** | ja: **belegt** |
| Diff Ref vs Mod im Logo, Start 1 | 44154 px: 44088 schwarz → rot, alle an Index-5-Positionen; 66 px Funkeln. Rahmen unverändert | 44108 px: 44026 schwarz → rot, alle Index 5; 82 px Funkeln. Rahmen unverändert |
| Diff Ref vs Mod im Logo, Start 2 | 44101 px: 44051 schwarz → rot, alle Index 5; 50 px Funkeln | 44126 px: 44046 schwarz → rot, alle Index 5; 80 px Funkeln |
| Rauschen Ref vs Ref | 50 px | 82 px |
| Bewertung | Hintergrund sichtbar rot. Kein Pixel außerhalb von Index 5 betroffen (Index 17, Schrift und Emblem unverändert): **belegt** | gleich: **belegt** |
| Übergang nach dem Logo | Das nächste Bild (Intro bzw. Titel) erscheint normal, danach 0 rote Pixel. Am Logo-Ende ausgerichtet ist der Unterschied zur Referenz 0–4 px: **belegt, Farbe wird zurückgesetzt** | Das Intro erscheint normal, danach 0 rote Pixel. 2 Frames nach dem Logo-Ende 14 px Unterschied (Ref vs Ref 18 px): **belegt, Farbe wird zurückgesetzt** |
| Quellenintegrität | Originale (alle Dateien) und ORIGINALROOT vorher = nachher. Referenzkopie unverändert, Mod-`LOGO.IO` weiter gleich dem Erwartungswert: **belegt** | gleich: **belegt** |

Ergänzungen:

- Die rote Fläche umfasst 44026–44088 der 44093 vorhergesagten Index-5-Pixel. Den Rest überdeckt gerade ein Funkel-Sprite.
- Spätere Unterschiede im Ishar-2-Intro, also mehrere Sekunden nach dem Logo, kommen nur vom Zeitpunkt der Tasten (Szenen werden übersprungen). Zwischen zwei Referenzläufen treten sie gleich groß auf.

## Reproduzierbarkeit des Übergangs

- In der ersten Fassung des Tastenplans wurden Tasten an das Fenster geschickt statt an den Fokus. Dabei gingen einzelne Leertasten verloren, in Referenz- wie in Mod-Läufen.
  - Zwei Ishar-2-Mod-Läufe blieben so bis zum Aufnahmeende im (roten) Logo.
  - Auch Referenzläufe verließen das Logo deutlich später.
- Mit Tasten an das fokussierte Fenster und wiederholten Leertasten verließen alle vier Kontrollläufe das Logo normal: Ishar 2, Mod ×2 und Referenz ×2.
- Das Hängenbleiben ist also eine Eigenschaft der Eingabe-Automatik, nicht der Mod.

## Risiken

- Geprüft ist der Übergang ins Intro bzw. den Titel. Spätere Programmteile verwenden eigene Paletten und wurden nicht einzeln durchgesehen.
- Die Neukodierung von `LOGO.IO` ändert Länge und komprimierte Bytes. Das Original lädt und spielt die Datei in allen Läufen fehlerfrei.
- Das Kit-Feld `verification` steht weiter auf `prepared-not-tested-in-original`, weil das Kit nicht geändert werden durfte.
- Die Funkel-Animation ist zufällig. Bewertet wurde gegen das Ref-vs-Ref-Rauschen.

## Regeln eingehalten

Nur Arbeitskopien, Originale hash-identisch, kein Kampf, nur die eigene Emulator-Instanz beendet, keine Kerndateien geändert, nichts committet. Öffentlich stehen nur 12-stellige Hash-Präfixe, keine Palettendaten und keine Bilder.
