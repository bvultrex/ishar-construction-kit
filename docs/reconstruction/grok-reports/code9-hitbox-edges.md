# Ishar 2, Code 9 auf CONT1: exakte Klickkanten der Aufnahme (Original-EXE)

Stand: 2026-11-14, Hoth. Messung 21:19–21:31 (Berlin, UTC+1).
Evidenzstufen: **known** = eigener Lauf, jeder Grenzpixel mindestens zweimal bestätigt; **suspected** = abgeleitet; **open** = nicht geprüft.
Öffentlich stehen hier nur UI-Koordinaten, Kantenpixel und die Regel. Bitmaps, Save-Werte und Positionen liegen privat unter `codex-support/hoth/private/itempickup/hitbox/`.

## 0. Aufbau
| Punkt | Wert |
|---|---|
| Profil | Ishar 2 DOS, `start.exe` `5e35e58d2d13`, SOURIS `78df7c73f880`, OBJET `51ec1fdf24be` |
| Eingabe | HIPB **mit Patch** (Objekt 9 auf CONT1 direkt vor der Party, 4 Weltbytes; siehe `item-pickup-original-acceptance.md`), sha-Präfix `c306cfc7c77d`. Kein neuer Patch. |
| Laufzeit | DOSBox-X 2025.02.01, cycles fixed 25000, `windowresolution=original`, eigenes Xvfb, eine Instanz, danach beendet; nur xdotool, Klick 200 ms gedrückt |
| Probe | Jede Probe lädt HIPB frisch und prüft das Laden per Bilddiff der Bodenregion gegen die Referenz. Dann Klick, Maus auf (60,60), Bild. **Treffer** = Bodensprite weg (Diff in der Bodenregion, das Item hängt am Zeiger); **kein Treffer** = Bodenregion pixelgleich zur Referenz. Gespeichert wird nicht. |
| Integrität | Originale (311 Dateien) vorher = nachher hash-gleich; Arbeitskopie unverändert |

## 1. Abbildung Fenster → Spielkoordinaten (known)
- Das DOSBox-Fenster misst 500×317. Das 320×200-Spielbild liegt bei Fensteroffset **(90, 67)**, Maßstab **1:1**. Belegt durch Bildvergleich über alle Offsets 80..100 × 57..77: eindeutiges Minimum bei (90,67), die Restpixel sind Uhr und Animation.
- Zeigerprobe: Bei Mausbewegung auf die Spielpunkte (100,60), (200,90) und (50,30) beginnt das gezeichnete Zeigerbild exakt am kommandierten Punkt. Kommandierte Koordinate = Spielkoordinate (Bildschirm, y nach unten).

## 2. Kantenpixel (alle **known**, je ≥ 2 unabhängige Proben)
| Rand | Messlinie | letzter Treffer | erster Nichttreffer |
|---|---|---|---|
| links | y = 112 | **x = 116** (2×) | **x = 115** (2×) |
| rechts | y = 112 | **x = 141** (2×) | **x = 142** (2×) |
| oben | x = 128 | **y = 104** (2×) | **y = 103** (2×), dazu 102 (1×) |
| unten | x = 128 | **y = 123** (2×) | **y = 124** (2×) |
| Ecken | – | (116,104), (141,104), (116,123), (141,123) je Treffer | (115,104), (142,123) je kein Treffer |
- Mitte (128,112): Treffer.
- Insgesamt 26 Proben. Kein einziger Klick ging verloren: Jede Wiederholung ergab dasselbe Ergebnis wie die erste Probe.

## 3. Form oder Maske
**Regel (known): Rechteck aus einer Formkollision, keine Bitmap-Maske.**
`Treffer ⇔ 116 ≤ x ≤ 141 und 104 ≤ y ≤ 123` (beide Grenzen inklusiv; 26 × 20 Pixel, Spielkoordinaten).
- **Statisch:** Die Aufnahme ist SOURIS 0x00471 `ctstform 512, 0` → 0x00498 `cmatent` (Material & 511 = Objektnummer). Getestet wird die eigene Form 0 (Strahl ab Zeiger) gegen Entitätsformen. Die Form setzt OBJET 0x003cd `cforme 40`, nur bei Tiefenindex 0. Kein Opcode im Pfad liest die Sprite-Bitmap. FRISE ist an der Aufnahme nicht beteiligt (nur an der Ablage). (known, Listing)
- **Mit Zahlen:** Mit Quesh' decodierter Form 40 (Ursprung x −12 / z −4, Ausdehnung 25 / 19), dem Zeiger-Bezug x′ = x − 128, z′ = 77 − y und der Objekthöhe z = −42 (Entfernung 1) ergibt sich x ∈ [128−12, 128−12+25] = 116..141 und y ∈ [77−(−42−4+19), 77−(−42−4)] = 104..123. Das entspricht genau der Messung, mit inklusiven Kanten auf beiden Seiten. (known)
- **Maskenprobe:** Fünf Punkte innerhalb des Rechtecks, an denen das Sprite **transparent** ist ((128,105) und die vier Eckpunkte), treffen. Ein **opaker** Spritepixel unterhalb des Rechtecks (128,124) trifft **nicht** (2×). Das sichtbare Sprite liegt ungefähr bei x 116..139, y 117..124. Das Klickfeld reicht also rund 13 Zeilen über das Sprite hinaus, und die unterste Spritezeile ist nicht anklickbar. (known)
- **Korrektur:** Die frühere Messung (Alderaan, y 103..122, „1 px höher als der Vertrag“) ist widerlegt. Quesh' Vertragswerte x 116..141, y 104..123 stimmen exakt.
- **Allgemeine Form (suspected für andere Entfernungen und Objekte):** Treffer ⇔ `128+ox ≤ x ≤ 128+ox+ex` und `77−(Z+oz+ez) ≤ y ≤ 77−(Z+oz)`, dazu die Tiefe des Strahls 0..499. Dabei ist (ox, oz, ex, ez) die OBJET-Form und Z die Objekthöhe. Wählbar ist nur Tiefenindex 0, also Entfernung 1 geradeaus. Für Objekt 10 (Form 16) ergäbe das x 122..134, y 101..119; das ist nicht gemessen.

## 4. Vergleich Kit (read-only, temporärer Clone, danach gelöscht)
- Geprüft: `6a3632f` (Nachfolger von `f4cf659`). `src/routes/playtest.tsx`, Original-Bodenebene: Klickziel ist das SVG-`<image>` des Sprites. Breite und Höhe kommen aus der Asset-Bitmap, zentriert um `VIEW_ORIGIN + (x, −y)`, skaliert 640/256 × 400/113. Das ist ein bitmapbasiertes Rechteck um das Sprite, keine Formkollision.
- Abweichung (suspected in den genauen Kit-Pixeln, known im Original):
  - Das Kit nimmt ungefähr die Spritefläche (y etwa 117..124) und damit auch die unterste Spritezeile, die im Original nicht trifft.
  - Ihm fehlen die rund 13 Zeilen über dem Sprite (y 104..116), die im Original treffen.
  - Seitlich liegt das Kit bei ungefähr x 116..139 statt 116..141.
- Die transparente 64×52-Fläche in `renderDistanceItem` gilt nur für Autoren-Items, nicht für den Original-Pfad.
- Vorschlag (nicht umgesetzt): Das Klickziel durch das Rechteck aus §3 ersetzen (Spielkoordinaten 116..141 × 104..123 inklusiv, im Kit mit 640/256 und 400/113 skaliert) oder allgemein aus OBJET-Form und Objekthöhe berechnen.

## 5. Offen
- Andere Entfernungen und seitliche Lagen: Laut Code sind nur Entfernung 1 und Mitte wählbar; nicht gemessen.
- Objekt 10 (Form 16): nur abgeleitet.
- Der Zweig `ctstmov` (bei MAIN 0x4aa0 ≠ 0): nicht ausgelöst, nicht gemessen.
