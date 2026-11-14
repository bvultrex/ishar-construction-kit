# Ishar 2, Objekt 10 (Goldbeutel) auf CONT1: exakte Klickkanten der Aufnahme (Original-EXE)

Stand: 2026-11-14, Hoth. Messung 21:47–21:58 (Berlin, UTC+1). Gleiche Methode wie `code9-hitbox-edges.md`.
Evidenzstufen: **known** = eigener Lauf, jeder Grenzpixel mindestens zweimal bestätigt; **suspected** = abgeleitet; **unknown** = nicht geprüft.

**Save-Bezeichner:** Saves heißen hier nur über synthetische Referenzen (SW-HIPA). Es stehen keine Bytewerte, Positionen oder Original-SAV-Inhalte im Bericht. Die Zuordnung zu Dateien, Hashes und Werten liegt privat unter `codex-support/hoth/private/itempickup/hitbox10/` und in `private/save_patches.md`.

## 0. Aufbau
| Punkt | Wert |
|---|---|
| Profil | Ishar 2 DOS, `start.exe` `5e35e58d2d13`, SOURIS `78df7c73f880`, OBJET `51ec1fdf24be` |
| Eingabe | SW-HIPA: Arbeitskopie von START **mit Patch** (Objekt 10 in Entfernung 1 geradeaus, 4 Weltbytes). Kein neuer Patch. |
| Laufzeit | DOSBox-X 2025.02.01, cycles fixed 25000, `windowresolution=original`, eigenes Xvfb, eine Instanz, danach beendet; nur xdotool, Klick 200 ms |
| Abbildung | Spielbild bei Fensteroffset (90,67), Maßstab 1:1. Erneut per Zeigerprobe geprüft: Das Zeigerbild beginnt am kommandierten Punkt (known) |
| Probe | Jede Probe lädt frisch, Laden per Bilddiff geprüft. Dann Klick, Maus auf (60,60), Bilddiff der Bodenregion. Treffer = Sprite weg und Item am Zeiger. Kein Speichern. |
| Integrität | Originale (311 Dateien) vorher = nachher hash-gleich; Arbeitskopie unverändert |

## 1. Geforderte Einzelpunkte (known, je 2×)
| Punkt | Messlinie | Treffer |
|---|---|---|
| x = 134 | y = 110 | **ja** |
| x = 135 | y = 110 | **ja** |
| x = 136 | y = 110 | **nein** |
| y = 100 | x = 128 | **nein** |
| y = 101 | x = 128 | **ja** |
| y = 119 | x = 128 | **ja** |
| y = 120 | x = 128 | **nein** |

## 2. Kanten je Rand (known, je 2×)
| Rand | Messlinie | letzter Treffer | erster Nichttreffer |
|---|---|---|---|
| links | y = 110 | **x = 122** | **x = 121** |
| rechts | y = 110 | **x = 135** | **x = 136** |
| oben | x = 128 | **y = 101** | **y = 100** |
| unten | x = 128 | **y = 119** | **y = 120** |
- Ecken (122,101), (135,101) und (135,119): Treffer. Mitte (128,110): Treffer, 1×.
- Insgesamt 24 Proben, alle Wiederholungen stimmen mit der ersten Probe überein.
- Frühere Notiz: In der Abnahme (s5) nahm ein Klick bei (128,110) nicht auf. Das war ein verlorener Klick, keine Kante; der Punkt liegt innen und trifft hier.

## 3. Form oder Maske (known)
- **Rechteck, keine Bitmap-Maske:** Transparente Spritepunkte innerhalb des Rechtecks treffen: (122,101), (135,101), (135,119). Opake Spritepunkte außerhalb treffen nicht: links (121,119) und unten (128,121). Das sichtbare Sprite liegt ungefähr bei x 121..133, y 106..124.
- **Regel Objekt 10:** `Treffer ⇔ 122 ≤ x ≤ 135 und 101 ≤ y ≤ 119` (inklusiv, 14 × 19 Spielpixel).
- Meine frühere Ableitung „x 122..134“ war falsch; die lokale Form-16-Rechnung (122..135) ist richtig.

## 4. Herleitung und Konsistenz mit Form 40
Die Aufnahme ist SOURIS 0x00471 `ctstform 512` → 0x00498 `cmatent` gegen die OBJET-Form (Objekt 9: `cforme 40` bei 0x003cd; Objekt 10: `cforme 16` bei 0x003fb). Bezug: x′ = x − 128, z′ = 77 − y, Objekthöhe Z = −42 (Entfernung 1).

**Regel:** Die Ausdehnung ist **inklusiv auf beiden Seiten**. Das Intervall ist geschlossen, [Ursprung, Ursprung + Ausdehnung]. Die Ausdehnung ist also die Differenz zwischen erstem und letztem Pixel, nicht die Breite. Pixelzahl = Ausdehnung + 1.
- x: `128 + ox ≤ x ≤ 128 + ox + ex`
- y: `77 − (Z + oz + ez) ≤ y ≤ 77 − (Z + oz)`

| Form | Ursprung (x, z) | Ausdehnung (x, z) | x-Bereich | Pixel | y-Bereich | Pixel | Messung |
|---|---|---|---|---|---|---|---|
| 40 (Objekt 9) | −12, −4 | 25, 19 | 116..141 | 26 | 104..123 | 20 | exakt (code9-Bericht) |
| 16 (Objekt 10) | −6, 0 | 13, 18 | 122..135 | 14 | 101..119 | 19 | exakt (hier) |

- **Warum 26 Pixel bei Ausdehnung 25:** Das geschlossene Intervall von −12 bis +13 enthält 25 + 1 = 26 ganze Zahlen. Bei Form 16 enthält −6..+7 genau 13 + 1 = 14.
- Die Regel gilt für beide Formen auf allen vier Rändern ohne Korrekturterm (**known**, 2 Formen, 8 Ränder).
- Dass der Kollisionstest intern mit `≤` auf beiden Seiten vergleicht, ist aus dem Messergebnis gefolgert. Den Vergleich in `start.exe` habe ich nicht bis zum Maschinencode verfolgt (**suspected**).
- Die Formdaten (Ursprung und Ausdehnung) stammen aus der lokalen OBJET-Formdecodierung (Quesh, Vorgabe). Ich habe sie nicht selbst neu decodiert; die Messung bestätigt sie.

## 5. Vergleich Kit `21bc808` (read-only, temporärer Clone, danach gelöscht)
- `originalGroundPickupBounds` liefert nur für Objekt 9 in Entfernung 1 geradeaus das gemessene Rechteck 116..141 × 104..123. Für Objekt 9 stimmt das mit dem Original überein.
- **Abweichung Objekt 10:** Für Objekt 10 gibt die Funktion `null` zurück. Klickziel bleibt das SVG-`<image>` des Sprites, also ein Rechteck aus der Bitmap (ungefähr x 121..133, y 106..124; genaue Kit-Pixel **suspected**). Gegenüber dem Original:
  - fehlen oben die Zeilen 101..105 und rechts die Spalten 134..135;
  - zusätzlich treffen im Kit die linke Spalte 121 und die Zeilen 120..124, die im Original nicht treffen.
- Vorschlag (nicht umgesetzt): Objekt 10 auf `{x:122, y:101, width:14, height:19}` setzen, oder beide Objekte allgemein aus Form und Objekthöhe nach §4 berechnen.

## 6. Offen
- Andere Entfernungen und seitliche Lagen: laut Code nicht wählbar (nur Tiefenindex 0); nicht gemessen.
- Zweig `ctstmov` (MAIN 0x4aa0 ≠ 0): nicht ausgelöst.
- Interner Vergleichsoperator in `start.exe`: suspected (§4).
