# Monster-KI – Ishar 2 (statischer Vertrag)

Stand: 03.11.2026 (Europe/Berlin). Grundlage: `combat-contract-ishar2.md`, `hebel-tuer-trigger-ishar2.md` und die Listings EDPLT (0x0e), EATT, EAFF, GERDEP, FRISE und MAIN. Belegstufen: known / suspected / unknown.

## 1. Akteure und Save-Felder (110 Akteure; Monsterbearbeitung ab i = 50)
| Feld | Var | Save-Offset | Stufe |
|---|---|---|---|
| x / y | 0x3412 / 0x34f0 (word) | 2601+2i / 2821+2i | known |
| Ausrichtung/Typ für Wandprüfung | 0x35ce (word) | 3041+2i | known (Bedeutung suspected) |
| HP | 0x36ac (word) | 3261+2i | known |
| Status-Sperren | 0x3946, 0x3a24 (word) | 3921/4141+2i | known |
| Bewegungsart | 0x3d2e | 4911+i (32 = ignoriert Karte, suspected fliegend) | known |
| Haltung/Radius | 0x43ba | 6561+i | known |
| Zone | 0x449a | 6781+i | known |
| Heimat x/y | 0x4814 / 0x4884 | 7136+i / 7246+i | known |
| Kontaktliste | 0x4b80[3] | 7576..7578 | known |
| Party x/y/Richtung | 0x2ab4/0x2ab5/0x2ab6 | 2/4/6 | known |
| Kartentyp | 0x2d18 | 8 | known |
| Bewegungs-Cooldown | EDPLT `dirtc(0x44)` | nicht gespeichert | known |
| letzte Zone | 0x4f06 | **nicht gespeichert** | known |

## 2. Scheduler
EDPLT bearbeitet pro Frame ein Fenster von **10 Akteuren** (50–59, dann +10, Wrap bei `0x4a81`). Dazu kommt ein `cmouse`-Poll pro Akteur. (known)

## 3. Verfolgung und Zielwahl (EDPLT 0x000e6–0x0069f)
- **Bedingungen:** Zone == `0x4ef2`, HP ≠ 0, `0x3a24 == 0`, `0x3946 == 0`, Haltung h ∈ [−30, −2] oder **h == 9**, |dx| ≤ |h| und |dy| ≤ |h|. (known)
- **Ziel:** bei `0x2d18 == 1` die Zelle vor der Party, sonst die Party-Zelle selbst. (known)
- **Schritt:** gleiche 8-Nachbar-Suche wie in Ishar 1 (min. Abstandsquadrat, erster gewinnt, diagonal erlaubt). Unterschiede:
  - Kartenbytes `0x0080` und `0x159c`. Bei `0x2d18 > 4` werden Wand- und Türmaterialien je nach Ausrichtung `0x35ce` geprüft. Ist das Material > 60 und Tür `0x4aa4[mat−60] == 0`, ist der Schritt **durch eine geschlossene Tür blockiert** (L_006a0).
  - `0x3d2e == 32` ignoriert ein negatives Kartenbyte.
  - Leine |neu − Heimat| < |h|, 3 < x < 85.
  - Bei Erfolg: Flag `0x47a4[0] = 1`, **Cooldown = 2**, Position wird geschrieben.
  (alles known)
- **RNG:** keiner in der Bewegung. (known)

## 4. Kontaktliste 0x4b80 – known
- **Setzen:** EDPLT 0x0027c ff. bei Ankunft auf der Zielzelle, Slot-Reihenfolge **1, 0, 2**. EAFF 0x00503 nutzt dieselbe Reihenfolge.
- **Leeren:** GERDEP 0x013d5 setzt bei einem Schritt alle 3 Slots auf 0. FRISE 0x057b3 leert beim Tod den Slot des Akteurs. (Ishar 1 leert beim Tod nicht.)
- Leser: EATT/EAFF (Darstellung und Angriffsposition).

## 5. Angriff (EATT) – known, siehe combat-contract-ishar2 R3/A3
Zielwahl über das Formationsgitter `0x49e6[5][5]` (Save 7111), von der Angriffsseite aus, erste Zelle ≠ 0. Nur Stelle 0x0081b würfelt `rnd(2)`. RNG-Reihenfolge: [rnd(2)] → rnd(100) Treffer → rnd(dmax).

## 6. Wandermonster und Neuwürfeln
- EDPLT 0x0039a: Ist `0x4ef2 ≠ 0x4f06`, wird L_006ce ausgeführt. L_00fc2 löscht die Akteure **90..N−1** (HP, Position, Zone, Haltung, …) und zählt die Einträge in Tabelle `0x4d88` (120 Einträge, Spalte 2 = Zone). Gibt es Treffer, wird pro Zone mit mehreren `rnd`-Aufrufen erzeugt (z. B. `rnd(10)==1`, `(rnd(10)+10)*10`, `rnd(2)*5`, `rnd(2)+65`). (known)
- **Nach dem Laden:** `0x4f06` wird nicht gespeichert, und weder MAIN noch IO enthalten einen Sync auf `0x4f06`. Hatte EDPLT vorher eine andere Zone (oder läuft es neu mit `0x4f06 = 0`), werden die Akteure 90+ **nach dem Laden neu gewürfelt**. Die gespeicherten Werte der Akteure 90+ sind dann nicht stabil. (suspected; Unterschied zu Ishar 1, wo MAIN 0x04c51 synchronisiert)

## 7. Testfälle
| # | Ausgangslage | Aktion | Erwartung |
|---|---|---|---|
| N1 | Save mit Monster h=−4, Abstand 5 | warten | keine Bewegung |
| N2 | wie N1, Abstand 4 | 2 Ticks | ein Schritt, danach Cooldown 2. Doppelt so träge wie Ishar 1 bei gleicher Fenstergröße/Taktung (suspected) |
| N3 | Monster hinter geschlossener Tür (0x4aa4=0), `0x2d18 > 4` | warten | Monster bleibt stehen. Mit Patch Tür=1 läuft es durch. |
| → `private/monster-ki-ishar2-savewerte.md` SW-1 |  |  |  |
| N5 | Monster in 0x4b80 | töten | nur der eigene Slot = 0 (combat-contract: 7576 91→0) |
| N6 | Zone mit Wandermonstern (Eintrag in 0x4d88) | speichern, laden, Akteure 90+ vergleichen | **Hoth/Alderaan:** Unterschiede belegen das Neuwürfeln. Gleiche Werte belegen einen Sync, und dieser Vertrag muss korrigiert werden. |

## 8. Offen
- Die Bedeutung von `0x2d18` (Kartentyp?), Haltung 9, `0x35ce` und `0x47a4`, die Struktur der Tabelle `0x4d88` sowie die Wanderbewegung ohne Party-Sichtkontakt (EAFF nicht vollständig gelesen).
