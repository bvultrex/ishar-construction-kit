# Dungeonkarten Ishar 1 – Format (öffentlich, ohne Kartendaten)

Stand 2026-11-03. Belegstufen in Klammern. Kartendaten und Decoder nur in `private/`.

## 1. Fundort (known)
- Dateien `CONT1.FIC` … `CONT6.FIC`, je **4860 Bytes**, roh, **ohne Packformat und ohne Kompression**.
- **Korrektur zu Alderaan:** Die Karten liegen doch in CONTn.FIC. Beleg: MAIN liest genau 0x12fc = 4860 Bytes; alle 29 Türen von Zone 15 liegen in CONT5 auf Türmaterial, alle 7 von Zone 12 in CONT2.
- Zone → Datei (MAIN L_044c1, Zone in `0x4251`): 1–6 → CONT1–6, 12 → CONT2, 13 → CONT3, 14 → CONT4, 15 → CONT5, 7–11 → keine.
- MAIN L_04483 lädt: ungerade Zone → Puffer `0x0080`, gerade → `0x234a`. MAIN L_0444e schreibt denselben Puffer per fwriteb zurück; die Karte ist also zur Laufzeit veränderbar.

## 2. Format (known)
- 54 (x) × 90 (y), 1 Byte pro Zelle, signed int8, **Index = x·90 + y** (spaltenweise).
- Nur **ein** Layer. „A/B“ sind die zwei RAM-Puffer für benachbarte Zonen (gerade/ungerade), keine Datenlayer.
- Globale Spalte `0x3646 = 54·(zone%10−1)+x`; über x=53 hinaus → Zone+1, x=0 (GERDEP L_00934, L_00a8a). y 0..89.

## 3. Zellwerte
| Wert | Bedeutung | Stufe |
|---|---|---|
| < 0 | nicht begehbar (GERDEP L_011c3) | known |
| −1..−25, −40..−43 | Sonderwand mit Ereignis (GERDEP 0x00c84 ff.) | known, Ereignis unknown |
| −80..−87 | Übergang/Teleport mit fester Zielposition (GERDEP L_0101c ff.) | known |
| −99, −50..−52 | Fels/Wand | suspected |
| 0 | Boden | known |
| 1..45, 70..81, 100..110 | begehbar, vermutlich Grafikvariante | suspected |
| 46..65, 82..85 | Tür (begehbar), Kante aus m%4: 2→x−1, 3→x+1, 0→y−1, 1→y+1 | known |
| 66..69 | Hebel | suspected |

## 4. Bewegung (known)
Ziel = Position + Vektor(Blick `0x137e`, Taste `dirb 0x11`). Blockiert, wenn Zielwert < 0, wenn die Türkante einer geschlossenen Tür überquert wird (eigene oder Zielzelle, siehe `tuer-hebel-trigger-ishar1.md` §6) oder wenn ein Monster auf der Zielzelle steht (L_01584).

## 5. Loader
```python
b = open(f'CONT{n}.FIC','rb').read(); assert len(b) == 4860
cell = lambda x, y: (b[x*90+y] ^ 0x80) - 0x80
```

## 6. Testfälle
- **K1:** CONT5 (20,53) ist Tür mit m%4 = 1; (20,52) und (20,54) sind 0; (19,53) und (21,53) sind negativ.
- **K2:** Alle Türkoordinaten aus `tuer-hebel-trigger-ishar1.json` treffen Türmaterial (Zone 15: 29/29 in CONT5, Zone 12: 7/7 in CONT2).
- **K3:** Hinter jeder Türkante liegt eine begehbare Zelle (CONT2 7/7, CONT5 29/29).
- **L1:** Zone 15, Start (20,51), Blick 3, 5× vor, Tür 10 offen → (20,52), (20,53), (20,54), (20,55), (20,56).
- **L2:** wie L1, Tür 10 zu → Stopp auf (20,53) (= korrigiertes T4).

## 7. Offen
- Bedeutung der positiven Werte und der Sonderwände; ob Zonen 2–5 neben 12–15 genutzt werden; ob ein Save die CONTn.FIC ersetzt.
