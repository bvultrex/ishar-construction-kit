# Ishar 2: Stapel-Handadapter, zwei Kernfälle nativ in der Original-EXE

Stand: 2026-11-14, Hoth. Lauf 22:58–23:13 (Berlin, UTC+1). Kit `workbench/playable-slice` `5598ad1` (Generator aus `40c8ae2`), read-only in einem temporären Clone gelesen, danach gelöscht.
Evidenzstufen: **known** = eigener Lauf/eigene Messung; **suspected** = abgeleitet; **unknown** = nicht geprüft.

**Bezeichner:** Saves nur als SW-Referenzen, Hashes als 12-Zeichen-Präfix. Werte aus dem Testaufbau (Codes, Mengen) sind **mit Patch** gesetzt und stammen aus der Fallbeschreibung (Codex) bzw. dem Kit-Generator, nicht aus Original-Saves. Rohsaves, Diffs und Bilder liegen privat (SW-HS-…).

| Referenz | Bedeutung | SHA256-Präfix |
|---|---|---|
| SW-HS-IN | Arbeitskopie von START + Patch (= Kit-Generator `INPUT.SAV`) | `9f8e29653304` |
| SW-HS-EXP | Kit-Erwartung (`EXPECTED.SAV`, = Browser-Exporthash im Kit-Vertrag) | `323f0fc0bd9f` |
| SW-HS-1 / SW-HS-2 | native Speicherung nach Fall 1 / nach Fall 2 | `2e1239f06d8a` / `bd72bbff6e9a` |
| SW-HS-1R / SW-HS-2R | neue Session: SW-HS-1 / SW-HS-2 laden, sofort neu speichern | `6772ea423305` / `fc3284b43dbe` |

## 1. Lesart der Notation (aus Kit-Code, known)
Quelle: `STACK_HAND_CONTRACT.md`, `original-hand-runtime.ts`, `scripts/prepare-original-stack-hand-browser.mjs`.

| Notation | Bedeutung |
|---|---|
| negative Codes −59…−40 | Stapelgegenstände. Im Slotwort steht nur der Code. Fall 1 nutzt −50, Fall 2 nutzt −49 (beide **mit Patch**). Die Spielgrafik zeigt −50 als Brot und −49 als Pfeile (known, Bild). |
| ×N | Menge. Die Charaktermenge steht **nicht** im Slot, sondern in einem Zähler pro Figur und Stapelcode: Save `7629 + 20·Figur + (Code+59)`, 1 Byte. Über das IO.IO-Layout ist das RAM `0x4bd4` (T4bd4), 100 Byte (known). Die Cursormenge (`0x4bbc`) wird nicht gespeichert. |
| „vorhandene 8“ | Der Empfänger hat bereits einen Stapel −50 mit Zähler 8 in einem anderen Slot (Rucksack-Slot 0). |
| „Hand 9“ | Inventarslot-Index 9 = erste Hand. Slotwort `1036 + 30·Figur + 2·Slot` (BE16); 9/10 sind die Hände. Er enthält Code 9. |
| Figuren | Der Generator zählt C1…C5 = Figur 0…4. Fall 1: Halter ist Figur 4, Ziel ist Figur 0, der Rest geht an Figur 3. Fall 2: Code 9 liegt bei Figur 2 in Slot 0, der Handstapel −49×20 bei Figur 1 in Hand 9, das alte Ende geht zu Figur 3, Slot 1. |
| „dritte Figur“ / „viertes Gepäck“ | Im Generator ist das beide Male **Figur 3 = vierte Figur (C4)**. „dritte Figur“ im Kurztext passt dazu nicht wörtlich. Ich habe die Generator-Lesart genommen, weil die Erwartungsdatei daran hängt. |

**Kit-Erwartung als Writes** (SW-HS-IN → SW-HS-EXP, 14 Bytes):
- Fall 1: Zähler Figur 0 / −50 auf 10, Slot Figur 4 s0 und Zähler Figur 4 / −50 geleert, Slot Figur 3 s0 = −50 mit Zähler 4, Hand Figur 0 s9 unverändert.
- Fall 2: Hand Figur 1 s9 = 9, Zähler Figur 1 / −49 geleert, Slot Figur 2 s0 geleert, Slot Figur 3 s1 = −49 mit Zähler 20.

## 2. Ausgangslage (mit Patch)
SW-HS-IN = Kit-Generator, angewendet auf eine Arbeitskopie von START (die Kit-Datei selbst ist unverändert). 12 Bytes gegenüber START, alle **mit Patch**: Slots 1036/1037, 1054/1055, 1084/1085, 1097, 1156/1157 und Zähler 7638, 7659, 7718. Der Generator nullt den gesamten Inventar- und Zählerbereich; der einzige vorherige Inhalt war eine Waffe in einer Hand von Figur 0. Jedes Byte ist privat dokumentiert (SW-HS-IN).

## 3. Bedienung im Original (known)
| Beobachtung | Folge |
|---|---|
| Linksklick mit leerem Cursor auf einen Stapel (Rucksack oder Hand) hebt **nur 1 Einheit** (Anzeige 6 → 5 im Slot, 1 am Cursor). Ein Klick mit demselben Stapel legt die Einheit zurück. Langes Drücken ändert nichts. | „Gehalten −50×6“ ist durch einfaches Aufnehmen **nicht** erreichbar |
| Ein **ganzer** Stapel kommt nur über einen Tausch an den Cursor: Code 9 halten, auf den Stapelslot klicken. Danach liegt der ganze Stapel am Cursor, Code 9 im Slot. | So habe ich −50×6 hergestellt (Fall 1). Fall 2 nutzt denselben Mechanismus. |
| Ein Klick auf einen Namensstreifen bei offenem Charakterblatt wechselt das Blatt, auch mit belegtem Cursor (der Gegenstand bleibt am Cursor). Ein Rechtsklick schließt das Blatt, der Cursor bleibt belegt. | Bedienweg |
| Klickpunkte (Spielbild 320×200): Namensstreifen Figur c (32+64c, 193); Rucksack-Slot 0 (148,70); Hände-Icon (40+64c, 131); Hand 9 (26+64c, 167), Hand 10 (50+64c, 167); Porträt (32+64c, 170) | kalibriert per Bild |

Damit die Bilanz mit der Kit-Erwartung vergleichbar bleibt, habe ich den Code 9 aus Figur 2 Slot 0 als „Tauschwerkzeug“ benutzt (Fall 1). In Fall 2 kam er von Figur 4 Slot 0 zurück. Endzustand und Erwartung decken sich damit Byte für Byte; nur der Zwischenzustand nach Fall 1 enthält diese Hilfsbewegung (siehe §4).

## 4. Ergebnisse
### Fall 1: gehalten −50×6 auf Hand 9 (Code 9) von Figur 0, die bereits −50×8 hat
| Punkt | Ergebnis | Evidenz |
|---|---|---|
| Klick Hand 9 | Cursoranzeige 6 → **4**, Hand 9 zeigt weiter Code 9, im Blatt von Figur 0 zeigt der Stapel **10** | known (Bild) |
| Rest | Porträt Figur 3: Rucksack-Slot 0 = −50, Anzeige 4, Cursor leer | known |
| Writes (SW-HS-IN → SW-HS-1) | Zähler 7638 (Figur 0 / −50) → 10, 7698 (Figur 3 / −50) → 4, 7718 (Figur 4 / −50) → leer; Slot Figur 3 s0 (1126/1127) = −50. Dazu die Hilfsbewegung: Figur 2 s0 (1097) geleert, Figur 4 s0 (1156/1157) = 9. Hand Figur 0 s9 (1054/1055) **unverändert**. Sonst nur Uhr und Neuwurf. | known |
| Mengenbilanz −50 | vorher 8 + 6 = 14, nachher 10 + 4 = 14; Cursor beim Speichern leer. Keine Duplikation, kein Verlust. | known |
| gegen Kit | Zähler, Zielslot, Rest und Hand stimmen. Die Abweichung bei Figur 4 s0 (9 statt leer) und Figur 2 s0 kommt allein aus dem Tausch-Bedienweg, nicht aus dem Adapter. | known |

### Fall 2: Code 9 gegen Hand 9 von Figur 1 mit −49×20
| Punkt | Ergebnis | Evidenz |
|---|---|---|
| Klick Hand 9 mit Code 9 | Tausch: Hand 9 = Code 9, Cursor = −49 mit Anzeige **20** | known (Bild) |
| Rest | Porträt Figur 3: −49 in den ersten freien Slot = Slot 1, Anzeige 20, Cursor leer | known |
| Writes (SW-HS-1 → SW-HS-2) | Slot Figur 1 s9 (1084/1085) = 9; Zähler 7659 (Figur 1 / −49) → leer; Slot Figur 3 s1 (1128/1129) = −49; Zähler 7699 (Figur 3 / −49) → 20; Figur 4 s0 (1157) geleert (Code 9 kam von dort). Sonst nur Uhr (45, 48, 49), **kein** Neuwurf-Byte. | known |
| Mengenbilanz | −49: 20 → 20; Code 9: 2 Stück vorher und nachher (Figur 0 Hand, jetzt Figur 1 Hand) | known |
| gegen Kit | identisch | known |

### Gesamtvergleich mit der Kit-Erwartung (known)
SW-HS-EXP → SW-HS-2: 24 Bytes, davon 3 Uhr (45, 48, 49) und 21 Neuwurf der Akteure (alle Offsets per IO.IO-Layout in den bekannten Blöcken 0x36ac, 0x3868, 0x3d2e, 0x3d9e, 0x3e7e, 0x3eee, 0x3f5e, 0x4040, 0x41fc, 0x43ba, Akteurindex 90–92). **Alle Inventar- und Zählerbytes sind identisch.** Der Neuwurf ist erwartbar: SW-HS-IN trägt noch die Akteurdaten von START, die bisher nie nativ gespeichert wurden.

## 5. Reload (known)
| Save | neue Session: laden → sofort speichern | Diff | Bild |
|---|---|---|---|
| SW-HS-1 → SW-HS-1R | lädt | 5 Bytes: Uhr 48/49, Neuwurf 5001, 5003, 6652 (Index 90–92) | Blätter: Figur 0 Brot 10 + Code 9 in der Hand, Figur 1 Pfeile 20 in der Hand, Figur 3 Brot 4, Figur 4 Code 9 |
| SW-HS-2 → SW-HS-2R | lädt | 26 Bytes: Uhr 45/48/49, 23 Neuwurf-Bytes (Index 90–92) | Figur 0 Brot 10 + Code 9, Figur 1 Code 9 in der Hand, Figur 3 Brot 4 + Pfeile 20, Figur 2 und Figur 4 leer |

Kein Inventar- oder Zählerbyte ändert sich beim Neuladen. Unbekannte Bytes: keine.

## 6. Befunde
- **B1 (known):** Beide Kernfälle verhalten sich nativ wie vom Adapter erwartet: Teilübernahme bis zum Deckel 10 ohne Tausch, Rest am Cursor, und umgekehrter Tausch mit ganzem Altstapel am Cursor. Der Endzustand ist bytegleich zur Kit-Erwartung, abgesehen von Uhr und Neuwurf.
- **B2 (known, Bedienung):** Ein einfacher Klick auf einen Stapel hebt im Original nur eine Einheit. Ein „gehaltener ganzer Stapel“ entsteht nativ nur über einen Tausch. Ein Browserablauf, der einen ganzen Stapel per Einzelklick aufnimmt, wäre eine Abweichung. Den Aufnahmeweg des Kits habe ich **nicht** geprüft (unknown).
- **B3 (known, Bedienung):** Bei offenem Charakterblatt öffnet der Disk-Knopf kein Speichermenü; ich habe erst nach dem Schließen gespeichert. Die Tastatureingaben ins vermeintliche Menü hatten keine sichtbare Wirkung, und der Save-Diff zeigt keine Spuren davon.

## 7. Integrität (known)
Die Originalinstallation (311 Dateien) ist vorher und nachher hash-gleich. In einer privaten Arbeitskopie sind nur SW-HS-IN, -1, -2, -1R und -2R hinzugekommen; alle älteren Saves sind hash-gleich. Pro Session lief eine eigene Instanz, danach beendet; fremde Instanzen habe ich nicht berührt. Am Kit habe ich nichts geändert; der temporäre Clone ist gelöscht.

## 8. Offen
- unknown: Wie aufnehmen im Kit-Browser funktioniert (eine Einheit oder ganzer Stapel pro Klick).
- unknown: Die Sonderfälle aus dem Vertrag habe ich nativ nicht gespielt: reservierte Gegenhand −125, Zielcode 16, Deckel 20 für −49 bei Teilübernahme, Nicht-Stapel gegen Stapel im Rucksack ohne Hand.
- suspected: Die Rucksack-Tauschroutine (Code 9 auf Stapelslot im Blatt) folgt derselben Logik wie der Handpfad (ganzer Stapel an den Cursor, Zähler geleert). Beobachtet ist das, statisch gegen FRISE habe ich es aber nicht einzeln belegt.
