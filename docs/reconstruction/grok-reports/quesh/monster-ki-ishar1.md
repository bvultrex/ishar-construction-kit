# Monster-KI – Ishar 1 (statischer Vertrag)

Stand: 03.11.2026 (Europe/Berlin). Grundlage: `combat-contract-ishar1.md` sowie die Listings DPLT (0x10), GEREN (0x0d), ENCONT (0x0a), GERDEP und MAIN, ergänzt um die Original-Saves. Belegstufen: known / suspected / unknown.

## 1. Akteure und Save-Felder (70 Akteure, i = 0..69; Monster ab i = 28)
| Feld | Var | Save-Offset | Stufe |
|---|---|---|---|
| x / y | 0x1978 / 0x1a06 (word) | 1448+2i / 1588+2i | known |
| HP | 0x1b22 (word) | 1728+2i | known |
| Typ (Grafik) | 0x1ebe | 2638+i | known |
| Haltung/Radius | 0x22f2 (signed) | 3688+i | known |
| Zone | 0x3910 | 4033+i | known |
| Verfolgt-Flag | 0x3958 | 4103+i | known |
| Heimat x/y | 0x3d5a / 0x3da2 | 4781+i / 4851+i | known |
| Status-Timer | 0x1c3e, 0x1ccc, 0x1d5a, 0x3ad6, 0x1de8 (word) | 2008/2148/2288/4473/… +2i | known (Bedeutung suspected) |
| Kontaktliste | 0x3d54[3] | 4778..4780 | known |
| Bewegungs-Cooldown | DPLT `dirtc(0x40)` | **nicht gespeichert** | known |
| Angriffs-Cooldown | GEREN `dirti(0x20)` | **nicht gespeichert** | known |

**Haltung `0x22f2`:** <0 = feindlich; der Betrag ist der Erkennungs- und Leinenradius. >0 = NPC mit Dialog (GEREN startet message 0x0e). Bewegt werden nur Akteure mit −30 ≤ h ≤ −2 oder h = −41. (known)

## 2. Scheduler
DPLT und GEREN arbeiten pro Frame (`cstop`) ein Fenster von **5 Akteuren** ab (28–32, dann +5, bei `0x3697` Wrap auf 28). GEREN pausiert, solange `0x137f≠0`. (known)

## 3. Verfolgung und Zielwahl (DPLT 0x0018b–0x005ae) – known
Ein Akteur wird bearbeitet, wenn Zone == `0x1508`, HP > 0, `0x1ccc == 0`, die Haltung im Bewegungsbereich liegt und |dx| ≤ |h| sowie |dy| ≤ |h| zur Party.
- **Ziel** = die Zelle vor der Party (Richtung 1: y−1, 2: x+1, 3: y+1, 4: x−1).
- Ist der Cooldown `dirtc40 > 0`, wird er um 1 verringert und `0x3958 = 0` gesetzt.
- Ist der Cooldown 0 und gilt (Akteur steht nicht auf dem Ziel) oder (ein Slot in `0x3d54` ist frei): Schritt nach L_00493.
  - Geprüft werden die 8 Nachbarn in der Reihenfolge dx = [0,−1,−1,−1,0,1,1,1], dy = [−1,−1,0,1,1,1,0,−1]. Gewählt wird das minimale Abstandsquadrat zum Ziel; bei Gleichstand gewinnt der erste Nachbar. Diagonale Schritte sind erlaubt.
  - Gültig ist die Zelle nur, wenn das Kartenbyte ≥ 0 ist (gerade Zone: 0x234a, ungerade: 0x0080), außer für Akteur 40. Außerdem muss |neu − Heimat| < |h| sein (Leine) und 3 < x < 50.
  - Danach `0x3958 = 1`, Cooldown = 1, Position wird geschrieben.
- **Türen werden von Monstern nicht geprüft** (Türen sind Wandmaterial, keine Kartenbytes). Monster gehen also durch geschlossene Türen (suspected).
- **RNG:** Die Bewegung ist deterministisch. (known)
- Sonderfall: Akteur 39 setzt beim Schritt seine Haltung auf −41. Akteur 40 wird über `0x3eac`/`0x3ffe` nach (20,61) bzw. (38,61) gesetzt.

## 4. Kontaktliste 0x3d54 – known
- **Schreiber:**
  - DPLT, wenn der Akteur auf der Zielzelle ankommt: Eintrag in den ersten freien Slot in der Reihenfolge **1, 0, 2** (Mitte, links, rechts), sofern er noch nicht eingetragen ist.
  - ENCONT, beim Zeichnen von Monstern in Tiefe 1, mit derselben Reihenfolge.
- **Leser:** ENCONT nutzt den Slot für die x-Verschiebung der Darstellung (−65 / 0 / +57).
- **Leerung:** bei jedem erfolgreichen Schritt (GERDEP L_016a1, alle 3 Slots). Beim Tod gibt es keine Leerung (laut Kampfvertrag).
- **Drehen** (GERDEP 0x003df/L_003f6): Nur der erste Eintrag mit `0x3958 ≠ 0` wird gelöscht, danach wird ENCONT geweckt.

## 5. Angriff (GEREN) – known
- Ein Angriff erfolgt nur bei orthogonaler Nachbarschaft oder auf derselben Zelle (|dx| < 2, |dy| < 2, dx == 0 oder dy == 0) und Haltung < 0 → L_004eb → Angriff 0x00920 (siehe combat-contract R4).
- Cooldown `40/(AGI+1)+rnd(5)`; sonst wird `dirti20 = −1` gesetzt.
- Bei `0x3ad6 > 0` wird `rnd(100) < 50` gewürfelt und L_00ca1 aufgerufen (suspected Panik/Zufallsaktion). Das ist ein zusätzlicher RNG-Aufruf pro Besuch.
- Typen 5, 6, 9, 16, 18 mit Haltung < 0 → L_00e5e (Fernkampf/Zauber, suspected).
- Pro Besuch werden die Status-Timer um 1 verringert.

## 6. Wandermonster und Neuwürfeln
- DPLT L_005b9: Ändert sich `0x3eac` (Karte, Save 32) gegenüber `0x422f`, werden die Akteure **60..69** gelöscht (HP, Position, Zone, Haltung, Inventar) und aus der Tabelle `0x4048` mit `rnd` neu erzeugt (z. B. Typ `31+rnd(3)`, `35+rnd(3)`, `53+rnd(4)`). (known)
- **Nach dem Laden:** MAIN 0x04c51 setzt direkt nach `cfclose` `0x422f = 0x3eac` (und `0x422e = 0x41e6`). Dadurch wird beim Laden **nicht** neu gewürfelt, und die Akteure 60..69 aus dem Save bleiben erhalten. (known)
- Nach dem Laden starten die Cooldowns (`dirtc40`, `dirti20`) neu, weil sie lokal sind (suspected: Modul-Neustart).

## 7. Testfälle
| # | Save | Aktion | Erwartung |
|---|---|---|---|
| → `private/monster-ki-ishar1-savewerte.md` SW-1 |  |  |  |
| → `private/monster-ki-ishar1-savewerte.md` SW-2 |  |  |  |
| → `private/monster-ki-ishar1-savewerte.md` SW-3 |  |  |  |
| M4 | nach M3 | 1 Schritt | 4778..4780 = 0 |
| M5 | nach M3 | Laden desselben Saves | Akteure 60..69 unverändert (kein Neuwürfeln) |
| → `private/monster-ki-ishar1-savewerte.md` SW-4 |  |  |  |  |  |

## 8. Offen
- L_00ca1 und L_00e5e im Detail, die Bedeutung der Timer, ob ENCONT-Typ 35 / Entität 0x43 (`0x41e5`) ein Monster-Spawn ist, und die genaue Form der Tabelle `0x4048`.
