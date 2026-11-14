# LOGO Palette 6 / Farbe 0 → Rot: Modtest im Original (Ishar 1 und Ishar 2)

Stand: 2026-11-14, Kit-Stand `64a3c4f` (eigener Klon, unverändert, `git status` leer). Nichts committet.

## Erzeugung (reproduzierbar)

```
npm run mod:logo-probe -- ishar1 ORIGINALROOT NEWCOPY
npm run mod:logo-probe -- ishar2 ORIGINALROOT NEWCOPY
```

- ORIGINALROOT ist jeweils eine Arbeitskopie der Originalinstallation, vor und nach dem Test hash-geprüft. NEWCOPY liegt in einem privaten Arbeitsverzeichnis.
- Beide Läufe enden mit exit=0. Ausgabe: `resource LOGO.IO`, `encoding dos-a1`, `changedImageOffsets [20172]`, `changedFiles [LOGO.IO]`, probe `palette 6, color 0, channel red, rule toggle between original maximum and zero`, `verification prepared-not-tested-in-original`.
- Ziel-SHA256, verglichen mit dem vorgegebenen Erwartungswert in voller Länge:
  - Ishar 1: `0c5d8f5cc9ea…`, **Übereinstimmung ja**
  - Ishar 2: `b33a15437d82…`, **Übereinstimmung ja**
- Die Mod-Kopie unterscheidet sich von ORIGINALROOT nur in `LOGO.IO` und der zusätzlichen `ishar-ck-mod-manifest.json`. Es wurden keine anderen Ressourcen und keine anderen Paletteneinträge geändert.
- Hinweis: `LOGO.IO` wird neu kodiert. Dateilänge und viele komprimierte Bytes ändern sich, im dekodierten Bild ändert sich aber nur Offset 20172 (Rotkanal von Palette 6, Farbe 0).

## LOGO-Ablauf (Skript)

`ctoblack` → Warteschleife → Vollbild-Zeichnung → `ctopalet` auf Palette 6 über 50 Frames. Danach bleibt die Palette konstant, es läuft nur die zufällige Funkel-Animation. Palette 6 ist also nach dem Einblenden dauerhaft aktiv.

## Methode

- Ein eigenes DOSBox-X 2025.02.01 pro Lauf. Eigene Konfiguration mit Original-EXE, `cycles fixed 25000`, Mount auf die Mod-Kopie bzw. auf eine hash-identische Referenzkopie.
- Erfasst wird das Fenster mit 2 fps. Pro Lauf wird nur die eigene Konfiguration beendet.
- Ishar 1 erreicht das Logo ohne Eingabe. Ishar 2 zeigt zuerst das Sprachmenü, das Logo erscheint erst nach der Sprachwahl (Taste 3, gleiche Zeitbasis für Referenz und Mod).
- Weil Farbe 0 im Bild nicht vorkommt (siehe unten), lief der Vergleich zusätzlich mit `overscan=10`: DOSBox-X zeichnet dann den VGA-Rahmen in Farbe 0 (Overscan-Register 0).
- Verglichen wurden Referenz und Mod im gleichen Frame nach dem Einblenden (f040, Logo statisch), dazu Referenz gegen Referenz als Rauschmaß. Rohbilder und Diffmasken bleiben privat.

## Ergebnisse

| Prüfung | Ishar 1 | Ishar 2 |
|---|---|---|
| 1. Original-EXE startet mit Mod-Kopie | ja, Logo erscheint normal: **belegt** | ja, Sprachmenü und Logo erscheinen normal: **belegt** |
| 2. Pixeldiff Ref vs Mod bei aktiver Palette 6 | Rahmen rot (252,0,0) statt schwarz: 10800 px = genau der 10-px-Rahmen um 320×200. Im Bild 96 px Unterschied = Funkel-Animation (Ref vs Ref: 114 px). Rotes Einblenden synchron mit dem Logo-Fade (`ctopalet 6`): **belegt, nur im Rahmen** | Rahmen rot, 10800 px. Im Bild 66 px = Funkel-Animation (Ref vs Ref: 66 px). Rotes Einblenden synchron mit dem Logo-Fade: **belegt, nur im Rahmen** |
| 3. Zweiter Lauf, gleiches Ergebnis | ja: 10800 rote Rahmenpixel, im Bild 98 px Animation, 0 rote Pixel im Bild: **belegt** | ja: 10800 rote Rahmenpixel, im Bild 82 px Animation, 0 rote Pixel im Bild: **belegt** |
| 4. Quellen unverändert | Originale (alle Dateien) und ORIGINALROOT vorher = nachher, Mod-`LOGO.IO` weiter = Erwartungswert, Referenzkopie unverändert: **belegt** | wie Ishar 1: **belegt** |

## Sichtbarkeit (Befund)

Im normalen 320×200-Bild ist die Änderung **nicht sichtbar**. Grund (aus der Kit-Bildextraktion von `LOGO.IO` und den Messungen):

- Die Hintergrundbilder des Logos bestehen vollständig aus Index 5, nicht aus Index 0. Das Schwarz im Logo ist also Farbe 5.
- Die Sprites behandeln Index 0 als transparent und zeichnen ihn nicht.
- Damit kommt Farbe 0 im Bildinhalt nicht vor. Gemessen: 0 rote Pixel im Bildbereich, alle Bild-Unterschiede liegen im Rauschen der zufälligen Funkel-Animation.
- Farbe 0 ist nur als VGA-Rahmenfarbe (Overscan) sichtbar. Mit `overscan=10` wird der Rahmen im Mod genau beim Einblenden von Palette 6 rot, in der Referenz bleibt er schwarz.

Fazit: Der Patch wirkt im Original wie beabsichtigt (DAC-Farbe 0 wird rot, sobald Palette 6 aktiv ist). Als sichtbarer Modtest ist Farbe 0 aber ungeeignet, weil sie nur im Rahmen erscheint. Für einen im Bild sichtbaren Test wäre ein tatsächlich benutzter Index nötig (z. B. Index 5 als Hintergrund). Das wurde nicht umgesetzt, weil keine anderen Paletteneinträge geändert werden sollten.

## Risiken

- Die Sichtbarkeit hängt am Emulator: ohne Overscan-Darstellung (DOSBox-X-Standard `overscan=0`) ist nichts zu sehen. Auf echter VGA-Hardware ist der Rahmen je nach Monitor sichtbar.
- Die Neukodierung von `LOGO.IO` ändert Länge und komprimierte Bytes. Das Original lädt die Datei fehlerfrei (Logo läuft vollständig), geprüft wurde aber nur der LOGO-Ablauf bis zum statischen Bild, nicht der Übergang ins Spiel.
- Die Funkel-Animation ist zufällig, deshalb sind Bild-Diffs nie 0. Bewertet wurde gegen das Ref-vs-Ref-Rauschen.
- Ishar 2 braucht eine Tasteneingabe (Sprachwahl), damit das Logo erscheint. Läufe ohne Eingabe bleiben im Sprachmenü und sind nicht aussagekräftig.
- Das Kit-Feld `verification` meldet weiter `prepared-not-tested-in-original`. Dieser Bericht ist der Originaltest, das Feld wurde nicht geändert (keine Kit-Änderung).

## Regeln eingehalten

Nur Arbeitskopien, Originale hash-identisch, keine Saves nötig, kein Kampf, nur die eigene DOSBox-X-Instanz beendet, keine Kerndateien geändert, nichts committet. Öffentlich stehen nur 12-stellige Hash-Präfixe.
