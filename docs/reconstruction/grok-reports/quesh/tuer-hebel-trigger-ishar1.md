# Türen, Hebel und Trigger – Ishar 1 (statischer Vertrag)

Stand: 03.11.2026 (Europe/Berlin). Grundlage: die Listings `decompile/alis/listings/ishar1/` (PCAVE, MCAVE, SOURIS, FRISE, GERDEP, PARAM, MAIN) und die Original-Saves `originals/ishar1/Ishar1/*.SAV`. Dieser Vertrag ist das Gegenstück zu `hebel-tuer-trigger-ishar2.md`. Das Ishar-2-Wissen diente nur als Vorlage; alles hier ist für Ishar 1 neu belegt.
Belegstufen: **known** = durch Code und/oder Saves belegt, **suspected** = plausibel, aber nicht bewiesen, **unknown** = offen.

## 1. Save-Felder
| Variable | Save-Offset | Inhalt | Stufe |
|---|---|---|---|
| `0x3b64[d]` | 4613+d (50 Byte) | Tür d: 0 = zu, 1 = offen | known |
| `0x3b98[k]` | 4663+k (50 Byte) | Hebel k: 0/1, Hebel 13 auch 2 | known |
| `0x1508` | 8 (word BE) | Zone | known |
| `0x137c/0x137d/0x137e` | 2/4/6 (word BE) | x, y, Blickrichtung 1..4 (1 = y−1, 2 = x+1, 3 = y+1, 4 = x−1) | known |
| `0x41e5` | 22 (word BE) | Schalter von Hebel 20/21 (weckt ENCONT, Spawn von Entität 0x43) | Schreiber known, Bedeutung suspected |
| `0x3d2c[c]` | 4758+c | Fertigkeitswert der Figur, Schwelle fürs Schloss | Lesezugriff known, Name unknown |

Die Koordinaten der Türen (`0x3c00/0x3c34`) und Hebel (`0x3c68/0x3c9c`) werden **nicht** gespeichert. PARAM setzt sie bei jedem Start als Konstanten (`cstore oimmb(v), ->seval(oimmb(i),smaintc(0x3c00|0x3c34|0x3c68|0x3c9c))`, PARAM 0x00b95 ff.). **Abgleich 2026-11-03: alle 40 Tür- und 19 Hebelkoordinaten in `tuer-hebel-trigger-ishar1.json` stimmen mit PARAM überein (known).** Hebel 8 = (39,15) steht bei PARAM 0x00f41/0x00f4b. Tür 8 hat keine Koordinate, die Hebel 10 und 11 sind nicht platziert.

**Neues Spiel (PARAM 0x01031):** Alle Türen und Hebel 0..49 werden auf 0 gesetzt, danach die Türen 25, 27, 28, 30, 33, 34, 36 und 38 auf 1. `0x41e5` wird auf 0 gesetzt. (known)

## 2. Dekor und Modul nach Zone
- MAIN 0x0173b, `cswitch 0x1508`: In den Zonen 12 und 15 wird L_0195d angesprungen. Dort werden `pcave.IO` (0x18) und `mcave.IO` (0x16) geladen, also die Höhlen- bzw. Dungeonzonen mit Türen und Hebeln. Die Zonen 13/14 laufen über L_01a79, einen eigenen Zweig. (known)
- Ishar 1 hat **keine DJ-Module** wie Ishar 2. (known)
- MCAVE und GERDEP filtern die Liste nicht nach Zone; die Koordinaten gelten global. Wirksam sind sie nur dort, wo das Kartenmaterial 46–85 vorkommt. (Code known; dass das nur in den Zonen 12/15 der Fall ist, ist suspected)

## 3. Materialien und Klickformen
Grundlage ist MCAVE 0x0055f, `odirb(0x26)` nach Blickrichtung:
| Material | Ziel | Bild | Spawn |
|---|---|---|---|
| 46–53 | L_03101 | 126 | Tür zu → PCAVE mit `+0c=36`, `+0d=d` |
| 54–57 | L_0311b | 132 | wie oben |
| 58–61 | L_03136 | 138 | wie oben |
| 82–85 | L_03151 | 234 | wie oben |
| 62–65 | L_0316c | 181 zu / 171 offen | **kein** Spawn (nur Optik) |
| 66–69 | L_03607/L_0368d (seitlich), L_03713 (frontal, 213/219) | je nach Zustand | Hebel `+0d=−k`, nur bei Tiefe 0 |
(alles known)

PCAVE: Formen 0..15 = Material 33..48, Form 16 = Material 64.
- Tür: `cforme d` nur bei Tiefe 0 und (d<24 oder d>40). Für d≥16 fehlt eine passende Form; die Türen 16..23 sind daher per Schlüssel wohl nicht anklickbar (suspected).
- Hebel: `cforme 16`. (known)

## 4. Klickfolgen
1. **Hebel mit leerer Hand:** SOURIS findet keine Form mit Maske 128 → `ctstform 64` → Nachricht 20 an PCAVE. (known)
2. **Tür mit Gegenstand:** Gegenstand `0x1506` auf Form mit Maske 32 und `(Material & 31) == 0x1506` → Nachricht 19 → `0x3b64[d]=1`, Sound, Animation; der Gegenstand wird verbraucht. Tür d braucht also Gegenstand d+1. (Code known, Deutung als Schlüssel suspected)
3. **Cursor-Aktion −8 (FRISE 0x01d32, vermutlich Schloss knacken):**
   - Material 64 + Hebel 13 + `0x3d2c[c] > 70` → Nachricht 20 mit Argument 1.
   - Material m (Tür m−1) → Nachricht 19, wenn `0x3d2c[c]` die Schwelle übersteigt. Schwellen: 2:60, 3:70, 4:80, 5:60, 6:80, 7:90, 8:65, 9:92, 11:85, 13:60, 14:80. Für 10 und 12 gibt es keine. (known)
4. **Tür 40:** Bei Tiefe 0 prüft eine Schleife die lebenden Mitglieder auf `item[c][11] ≠ −24` und startet dann message mit Nachricht 17 oder 18. Bedeutung unknown.

## 5. Hebellogik (PCAVE Nachricht 20, L_00213) – known
- Hebel == 2 und Argument 0 → nichts. Argument 1 und k == 13 → T23=0, T22=1, T21=1.
- Sonst: Ein Hebel auf 0 wird 1 (k=13 → 2), ein Hebel ≠ 0 (k ≠ 13) wird 0.
- Danach werden alle Türen neu berechnet:
  - T17 = H1==1
  - T16 = H2==1 ∧ H3==0 ∧ H4==1
  - T18 = H5==0 ∧ H6==0 ∧ H7==1
  - T19 = H8==1 ∧ H9==0
  - T20 = H10==0 ∧ H11==1 (die Hebel 10/11 sind nicht platziert, deshalb ist T20 immer 0; suspected)
  - (H13==2 ∨ H13==1 ∨ H12==0) → T23=1, T22=0, T21=0; sonst T23=0, T22=1, T21=1
  - Paare (Polarität durch Original-Save bestätigt, Beleg: private SW-1): H14==0 → T28=1/T29=0; H15==1 → T26=1/T27=0; H16==0 → T32=0/T33=1; H17==0 → T30=1/T31=0; H18==1 → T34=0/T35=1; H19==1 → T24=1/T25=0
  - Nur bei k==20: T36/T37 ← H20, außerdem `0x41e5` = 0/1 und ENCONT wird geweckt. Nur bei k==21: T38/T39 ← H21, `0x41e5` = 1/0.
- **Abgleich mit zwei Original-Saves (Details private SW-2):** Alle Formeltüren stimmen mit den Hebeln überein. Der Unterschied zwischen den beiden Saves betrifft genau H2 und H4 → T16. Die Formel ist damit durch echte Daten bestätigt.

## 6. Bewegung, Blockade, Reset
- GERDEP 0x011d5/0x013a9 → L_01629: Ein Schritt wird blockiert, wenn auf der eigenen oder der Zielzelle eine **geschlossene** Tür liegt (Material 46–69, passend zur Richtung) und `0x41e7 ≠ 1` ist. `0x41e7` wird nicht gespeichert; Bedeutung unknown. (known)
- **Kein Reset beim Schritt oder Drehen:** GERDEP schreibt nie in `0x3b64`/`0x3b98`; einziger Schreiber ist PCAVE. Das ist ein Unterschied zu Ishar 2. (known)
- Ein Schritt (L_0167b) setzt `0x3d54[0..2]=0`. Beim Drehen wird der erste Eintrag mit `0x3958[i]≠0` gelöscht und ENCONT geweckt; Details stehen in `monster-ki-ishar1.md`. (known)

## 7. Testfälle (Alderaan: Emulator, Hoth: Save-Patch)
Koordinaten geprüft gegen PARAM (known): Hebel 2 (25,52), 4 (25,56), 13 (23,32), 14 (35,11); Tür 2 (29,24), Tür 10 (20,53). T4 steht auf (20,52) mit Blick 3 (y+1), also direkt vor Tür 10.
| # | Ausgangs-Save | Aktion / Patch | Erwartung |
|---|---|---|---|
| T1 | Original-Save vor dem Hebelrätsel (Name/Position: private SW-3) | Hebel 2 (25,52) und 4 (25,56) mit leerer Hand umlegen, jeweils frontal bei Tiefe 0 | Hebelbytes 4665 und 4667 wechseln 0→1 → **4629 (T16)=1** |
| T2 | Save nach T1 (private SW-4) | Hebel 14 bei (35,11) umlegen | 4677 kippt; T28 (4641) und T29 (4642) tauschen ihren Wert (Formel H14==0) |
| T3 | Save nach T1 (private SW-5) | Hebel 13 bei (23,32) umlegen (0→2) | 4676=2 → 4636 (T23)=1, 4635=0, 4634=0 |
| T4 | Zone 15, Patch 4623 (T10)=0 | Party bei (20,52), Blickrichtung 3, einen Schritt vor | Schritt blockiert |
| T5 | beliebiger Save in Zone 12/15 (private SW-6) | 20 Schritte und mehrere Drehungen | 4613..4712 unverändert (kein Reset) |
| T6 | Save mit Gegenstand Nr. 3 im Inventar (private SW-7) | Gegenstand Nr. 3 (= d+1) auf Tür 2 bei (29,24) ziehen | 4615 0→1, Gegenstand verbraucht (suspected) |
| T7 | Neues Spiel | – | Türen 25, 27, 28, 30, 33, 34, 36, 38 = 1, alle anderen 0 |

## 8. Offen
- Die Namen von `0x3d2c` und `0x41e7`, die Formen der Türen 16–23, die Nachrichten 17/18 an Tür 40 und die Wirkung von `0x41e5` in GERDEP (Zähler bis 25).
- In einem Original-Save sind die Türen 12–15 offen, ohne dass PARAM sie setzt (private SW-8). Wahrscheinlich Spielfortschritt (unknown).
