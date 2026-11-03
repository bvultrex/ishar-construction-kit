# Hoth – Fixtures Ishar-1-Save-Map (Quesh) + Original-Läufe, 2026-11-03

Quelle: `quesh/save-map-ishar1.json/.md`. Alles aus Queshs Map ist **suspected**, bis ein eigener Lauf es belegt. Offsets 0-basiert (cmp -l = +1). Ishar-2-Offsets (7386/7576) nicht verwendet (SM34). Save-Namen, Positionen und echte Werte: nur privat (`private/savemap/`, `private/bereinigung/`).

## Läufe
- DOSBox-X mit eigener Conf-Kopie (`cycles=fixed 25000`), eigenes Xvfb, eine Instanz, danach beendet. Fremde Instanzen nicht angefasst.
- Private Arbeitskopie, ein neuer Slot, nichts überschrieben; sha256 vorher = nachher bis auf den neuen Slot.
- Erstes Laden per Bilddiff geprüft.
- Spielaktion: ACTION → GEBE GELD → Aufteilen → Disk → Spiel sichern (1000 GS).
- cmp vorher→nachher: nur die Tausender-Wörter 478+2c und die Rest-Wörter 3993+2c ändern sich. Summe vorher − 1000 = Summe nachher; Anzeige = 1000·Tausender + Rest.
- Frühere Abnahme: Speichern (1000 GS) ändert nur das Low-Byte eines Tausender-Worts um 1.

## Urteile pro Punkt
| Punkt | Urteil | Beleg |
|---|---|---|
| Savegröße 5216 | known | alle geprüften Saves (SM01) |
| Klasse 728+c | known | Bögen (SM02) |
| Level 738+c | known | SM03 |
| MENTAL 768+c | known | SM04 |
| Rasse 733+c | known (kausal) | 5 von 5 Bögen (SM05). Kausaltest 2026-11-03: Patch einer Kopie von LP1 (RACEX), Bogen von Figur 0 wechselt von „Menschlich“ zu „Eidechse“. |
| Gold 478+2c = **Tausender** | known | Anzeige + Spielaktion (SM06–SM08, Vektoren synthetisch) |
| Gold 3993+2c = **Rest 0..999** | known | dito |
| Gold-Benennung bei Quesh | **Korrektur** | Quesh: `gold`=478, `goldThousands`=3993 – vertauscht. |
| Aufteilen gleichmäßig, Rest an die ersten; Speicherkosten 1000 gleichmäßig auf 5 | suspected | nur Endzustand beobachtet (SM09) |
| xp, hp, hpMax, str/con/wis/int/agi, physical, armor, npcId, rune, Skills 4738…4773 | suspected | Quesh (SM10–SM30) |
| temper 778+c | suspected | SM19 |
| Inventar 498+26c+2k, Zauberbuch 788+20c+k, Name 418+8c | suspected | SM31–SM33 |
| Gold-Kauf im Shop | offen | erster Versuch nicht abgeschlossen (Münze am Cursor) |

## Fixtures
- Contract `savemap-ishar1`, SM01–SM34 (9 known, 25 suspected); Checker-Modell `savemap1`. Synthetische Puffer; Goldwerte synthetisch (z. B. Tausender 5, Rest 123), echte Werte nur privat.
- Checker: alle 219 Vektoren grün. Audit: 0 Treffer.

## Kit-Probe (`save-maps.ts ISHAR1_SAVE`), Passt 67/217
- `minLength` 1035 statt 5216.
- level 994+c statt 738+c; psychic 745+c statt 768+c; hp 725 (u8) statt 468+2c (BE16); strength/wisdom/constitution/agility/intelligence/physical falsch (DEBUG-Cheat-Map).
- gold 735 u8, kein goldThousands → statt 478+2c/3993+2c BE16.
- Es fehlen: class, race, xp, hpMax, temper, armor, npcId, rune, Skills, Inventar, Zauberbuch, Name.
- PASST nur SM34.
