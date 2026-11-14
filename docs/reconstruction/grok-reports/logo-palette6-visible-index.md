# LOGO Palette 6: benutzte Indizes im 320×200-Bild und Kandidat für einen sichtbaren Folgetest

Stand: 2026-11-14. Rein analytisch, nichts geändert, keine Modkopie gebaut, kein zusätzlicher Emulatorlauf. Kit-Stand `64a3c4f`, Decoder nur gelesen.

## Grundlage und Methode

- **Referenz-Rohframes** aus dem LOGO-Modtest, nur Referenzläufe, jeweils zwei Starts, alle Frames nach dem Einblenden von Palette 6: Ishar 1 138 Frames, Ishar 2 142 Frames. Ausgewertet wurde der 320×200-Bildbereich ohne Rahmen.
- **Bildschirmfarbe → Index:** nächster Palette-6-Eintrag, alle Pixel eindeutig einer Farbe zugeordnet. Mehrere Indizes teilen sich dieselbe Farbe, vor allem Schwarz (u. a. 0, 5, 17 und ein großer unbenutzter Bereich). Schwarz lässt sich am Bildschirm daher nicht nach Index trennen.
- **Trennung über den Kit-Decoder:** Das statische Bild wurde aus den dekodierten `LOGO.IO`-Bildern rekonstruiert. Hintergrund (Eintrag 23, vollständig Index 5) plus Sprites an ihrer per Mustervergleich gefundenen Position: Emblem (0), Schrift (7, 1, 21 zweimal, 22). Die Sprites überlappen nicht.
  - Die Rekonstruktion weicht vom echten Frame nur in 25 Pixeln ab, und zwar genau an einem Funkel-Sprite.
  - Index 0 kommt im sichtbaren Bild nicht vor (0 Pixel). Das bestätigt den ersten Modtest.
- Die `LOGO.IO`-Bilder sind in Ishar 1 und Ishar 2 identisch. Die Pixelzahlen gelten für beide Spiele.
- **Deterministisch** heißt: Das Pixel ist in allen Referenzframes beider Starts gleich der statischen Rekonstruktion.
  - Die Funkel-Animation weicht in der Summe über alle Frames in 566 Pixeln (Ishar 1) bzw. 535 Pixeln (Ishar 2) davon ab.
  - Indizes, die nur in der Animation vorkommen: 10, 15, 130–140.
- **Sichtbarkeit:** Bewertet wird, ob ein Index im Bild als zusammenhängende Fläche erscheint und sich bei Rot-Umschaltung nach der Kit-Regel (Rotkanal Maximum ↔ 0) sichtbar ändert. RGB- und Luminanzwerte werden nicht veröffentlicht.

## Kandidat (je Spiel)

| | Ishar 1 | Ishar 2 |
|---|---|---|
| Kandidat | **Palette 6 / Index 5** | **Palette 6 / Index 5** |
| Pixel im statischen Bild | 44093 von 64000 (68,90 %) | 44093 von 64000 (68,90 %) |
| Bildteile | Hintergrund 44086, Emblem 7 | Hintergrund 44086, Emblem 7 |
| deterministisch | 43930 (163 zeitweise von Funkeln überdeckt) | 43934 (159 zeitweise von Funkeln überdeckt) |
| Sichtbarkeit | schwarz, wird bei Rot-Umschaltung rot | gleich |

Begründung:

- **Größter, stabiler Anteil:** Über zwei Drittel des Bildes, als durchgehende Fläche um Emblem und Schrift.
- **Nicht transparent:** Der Hintergrund ist ein opakes Vollbild ohne Transparenzindex. Die Sprites benutzen 0 bzw. 128 als Transparenz, nicht 5.
- **Nicht Animation:** Index 5 gehört zum statischen Hintergrund. Die Funkel-Sprites zeichnen mit eigenen Indizes darüber, nur wenige Pixel und nur zeitweise.
- **Sichtbarer Effekt:** Bei Rot-Umschaltung wird aus dem schwarzen Hintergrund eine rote Vollfläche, die sich klar von der goldenen Schrift abhebt.
- **Eng und deterministisch:** Ein einziger Paletteneintrag ohne weitere Änderung. Das Ergebnis ist pixelgenau vorhersagbar: 44093 Pixel werden rot, der Rest bleibt gleich, abgesehen vom Funkeln.

Zweiter Platz, nicht gewählt: Index 17 (3012 Pixel, Emblem-Inneres, ebenfalls schwarz). Er ist kleiner und liegt teilweise im Bereich des Funkelns.

## Abgleich mit der Kit-Zählung

Das Kit zählt für Index 5 109307 Vorkommen. Das ist die Summe über alle dekodierten Bilder von `LOGO.IO`, einschließlich der nicht sichtbaren:

| Eintrag | Index-5-Pixel |
|---|---|
| 23 (Hintergrund 320×300) | 96000 |
| 15 (263×46) | 12098 |
| 14 (48×48) | 1194 |
| 12, 13 (je 16×1) | 4 + 4 |
| 0 (Emblem) | 7 |
| **Summe** | **109307** |

Unterschied zu 44093:

- Der Hintergrund ist 320×300 groß, sichtbar sind nur 320×200. Davon sind 19914 Pixel von Sprites überdeckt.
- Die Einträge 12–15 sind im statischen Bild nicht zu sehen.

Beide Zahlen meinen also denselben Index. Die Kit-Zahl zählt Vorkommen in den Daten, nicht sichtbare Bildpixel.

## Vollständige Indextabelle (statisches Bild, beide Spiele gleich)

| Index | Pixel (von 64000) | Anteil | Bildteile (Pixel) | deterministisch I1 / I2 |
|---|---|---|---|---|
| 5 | 44093 | 68.90 % | Hintergrund 44086, Emblem 7 | 43930 / 43934 |
| 17 | 3012 | 4.71 % | Emblem 3011, Schrift 1 | 2951 / 2961 |
| 23 | 1528 | 2.39 % | Emblem 889, Schrift 639 | 1488 / 1490 |
| 21 | 1355 | 2.12 % | Emblem 721, Schrift 634 | 1330 / 1331 |
| 22 | 1255 | 1.96 % | Emblem 731, Schrift 524 | 1227 / 1228 |
| 24 | 1136 | 1.77 % | Emblem 603, Schrift 533 | 1115 / 1118 |
| 25 | 1108 | 1.73 % | Schrift 558, Emblem 550 | 1078 / 1081 |
| 26 | 1038 | 1.62 % | Emblem 585, Schrift 453 | 1005 / 1008 |
| 20 | 957 | 1.50 % | Emblem 601, Schrift 356 | 946 / 947 |
| 29 | 809 | 1.26 % | Schrift 450, Emblem 359 | 787 / 787 |
| 19 | 660 | 1.03 % | Emblem 364, Schrift 296 | 651 / 652 |
| 38 | 660 | 1.03 % | Schrift 367, Emblem 293 | 623 / 623 |
| 28 | 589 | 0.92 % | Emblem 311, Schrift 278 | 572 / 573 |
| 27 | 578 | 0.90 % | Emblem 347, Schrift 231 | 564 / 564 |
| 31 | 496 | 0.78 % | Emblem 279, Schrift 217 | 484 / 484 |
| 30 | 458 | 0.72 % | Emblem 306, Schrift 152 | 449 / 449 |
| 35 | 379 | 0.59 % | Emblem 217, Schrift 162 | 376 / 376 |
| 37 | 361 | 0.56 % | Emblem 242, Schrift 119 | 355 / 356 |
| 43 | 331 | 0.52 % | Emblem 168, Schrift 163 | 328 / 328 |
| 34 | 309 | 0.48 % | Emblem 156, Schrift 153 | 304 / 304 |
| 39 | 297 | 0.46 % | Emblem 173, Schrift 124 | 296 / 296 |
| 36 | 259 | 0.40 % | Emblem 154, Schrift 105 | 257 / 257 |
| 40 | 258 | 0.40 % | Emblem 188, Schrift 70 | 257 / 257 |
| 18 | 250 | 0.39 % | Emblem 201, Schrift 49 | 240 / 240 |
| 47 | 213 | 0.33 % | Emblem 118, Schrift 95 | 213 / 213 |
| 41 | 166 | 0.26 % | Emblem 112, Schrift 54 | 166 / 166 |
| 42 | 163 | 0.25 % | Emblem 90, Schrift 73 | 162 / 162 |
| 45 | 133 | 0.21 % | Emblem 102, Schrift 31 | 133 / 133 |
| 44 | 130 | 0.20 % | Emblem 102, Schrift 28 | 130 / 130 |
| 46 | 86 | 0.13 % | Emblem 54, Schrift 32 | 86 / 86 |
| 33 | 79 | 0.12 % | Schrift 53, Emblem 26 | 77 / 77 |
| 81 | 59 | 0.09 % | Emblem 59 | 59 / 59 |
| 65 | 51 | 0.08 % | Emblem 51 | 51 / 51 |
| 97 | 51 | 0.08 % | Emblem 51 | 51 / 51 |
| 69 | 31 | 0.05 % | Emblem 31 | 31 / 31 |
| 98 | 28 | 0.04 % | Emblem 28 | 28 / 28 |
| 99 | 28 | 0.04 % | Emblem 28 | 28 / 28 |
| 100 | 28 | 0.04 % | Emblem 28 | 28 / 28 |
| 101 | 26 | 0.04 % | Emblem 26 | 26 / 26 |
| 68 | 24 | 0.04 % | Emblem 24 | 24 / 24 |
| 86 | 24 | 0.04 % | Emblem 24 | 24 / 24 |
| 70 | 23 | 0.04 % | Emblem 23 | 23 / 23 |
| 72 | 23 | 0.04 % | Emblem 23 | 23 / 23 |
| 73 | 22 | 0.03 % | Emblem 22 | 22 / 22 |
| 91 | 22 | 0.03 % | Emblem 22 | 22 / 22 |
| 79 | 20 | 0.03 % | Emblem 20 | 20 / 20 |
| 103 | 20 | 0.03 % | Emblem 20 | 20 / 20 |
| 102 | 19 | 0.03 % | Emblem 19 | 19 / 19 |
| 55 | 18 | 0.03 % | Schrift 18 | 18 / 18 |
| 83 | 18 | 0.03 % | Emblem 18 | 18 / 18 |
| 95 | 18 | 0.03 % | Emblem 18 | 18 / 18 |
| 71 | 17 | 0.03 % | Emblem 17 | 17 / 17 |
| 87 | 17 | 0.03 % | Emblem 17 | 17 / 17 |
| 89 | 17 | 0.03 % | Emblem 17 | 17 / 17 |
| 16 | 16 | 0.03 % | Emblem 16 | 16 / 16 |
| 66 | 16 | 0.03 % | Emblem 16 | 16 / 16 |
| 74 | 14 | 0.02 % | Emblem 14 | 14 / 14 |
| 85 | 14 | 0.02 % | Emblem 14 | 14 / 14 |
| 92 | 14 | 0.02 % | Emblem 14 | 14 / 14 |
| 67 | 13 | 0.02 % | Emblem 13 | 13 / 13 |
| 84 | 13 | 0.02 % | Emblem 13 | 13 / 13 |
| 90 | 13 | 0.02 % | Emblem 13 | 13 / 13 |
| 88 | 11 | 0.02 % | Emblem 11 | 11 / 11 |
| 93 | 11 | 0.02 % | Emblem 11 | 11 / 11 |
| 106 | 11 | 0.02 % | Emblem 11 | 11 / 11 |
| 104 | 10 | 0.02 % | Emblem 10 | 10 / 10 |
| 107 | 10 | 0.02 % | Emblem 10 | 10 / 10 |
| 82 | 9 | 0.01 % | Emblem 9 | 9 / 9 |
| 105 | 9 | 0.01 % | Emblem 9 | 9 / 9 |
| 75 | 7 | 0.01 % | Emblem 7 | 7 / 7 |
| 94 | 7 | 0.01 % | Emblem 7 | 7 / 7 |
| 108 | 7 | 0.01 % | Emblem 7 | 7 / 7 |
| 51 | 6 | 0.01 % | Schrift 6 | 6 / 6 |
| 76 | 6 | 0.01 % | Emblem 6 | 6 / 6 |
| 110 | 6 | 0.01 % | Emblem 6 | 6 / 6 |
| 52 | 5 | 0.01 % | Schrift 5 | 5 / 5 |
| 53 | 4 | 0.01 % | Schrift 4 | 4 / 4 |
| 54 | 4 | 0.01 % | Schrift 4 | 4 / 4 |
| 77 | 3 | 0.00 % | Emblem 3 | 3 / 3 |
| 78 | 3 | 0.00 % | Emblem 3 | 3 / 3 |
| 109 | 3 | 0.00 % | Emblem 3 | 3 / 3 |
| 111 | 3 | 0.00 % | Emblem 3 | 3 / 3 |
| 49 | 2 | 0.00 % | Schrift 2 | 2 / 2 |

Spalte „deterministisch“: Pixel, die in allen Referenzframes unverändert sind. Die Differenz zur Pixelzahl kommt von der zufälligen Funkel-Animation.

## Risiken

- Index 5 wird außer im Hintergrund auch in Einträgen 12–15 benutzt. Falls das Skript diese im weiteren Ablauf zeichnet, färben auch sie sich rot. Für einen sichtbaren Test ist das unkritisch, es ist aber zu beachten.
- Die Rot-Umschaltung wirkt nur, solange Palette 6 aktiv ist. Ob das Spiel danach eine eigene Palette lädt und die Farbe so zurücksetzt, ist hier nicht geprüft (Folgetest).
- Schwarz teilt sich am Bildschirm mehrere Indizes. Die Trennung 5/17 beruht auf der Decoder-Rekonstruktion. Diese stimmt bis auf 25 Funkel-Pixel mit dem echten Frame überein.

## Prüfungen

Originale und Kit-Klon unverändert, keine Kerndateien geändert, nichts committet. Der Bericht enthält keine Palettendaten und keine Bilder. Die `rg`-Prüfung folgt unten.
