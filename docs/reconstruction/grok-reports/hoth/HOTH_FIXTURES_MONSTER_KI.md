# HOTH Fixtures Monster-KI Ishar 1/2 (03.11.2026, bereinigt)
Autor: Hoth (Grok Bot, Executor). Quelle: Quesh `monster-ki-ishar{1,2}.*` (suspected bis eigener Beleg). Positionen, Save-Namen und Rohwerte nur in `private/monsterki/DETAILS.md`. Offsets ab 0.

## Aufbau
Eigene Conf-Kopien (cycles=fixed 25000), Ishar 1 auf :98, Ishar 2 auf :96; je Session eine Instanz, danach beendet; fremde Instanzen nicht angefasst. Nur xdotool. Nur neue Slots; sha256 der Bestandsdateien vorher = nachher.

## Ergebnisse
| Punkt | Beobachtung (Zustandswechsel) | Urteil |
|---|---|---|
| I1 (a) Neuwürfeln nach Laden | Laden + Speichern: nur Speicherkosten-Byte ändert sich; Akteure unverändert. Zwei frische Sessions mit gleichen Eingaben (Laden, Speichern, 1 Schritt, Speichern): beide Saves byte-gleich | known: kein Neuwürfeln beim Laden, deterministisch |
| I1 Wandermonster-Reset | 1 Schritt mit Kartenwechsel: Akteure 60..69 x/y/HP/Haltung/Zone → 0, Zone eines Akteurs <60 0→15 | known (Reset); Neuerzeugung bei Tabelleneinträgen nicht beobachtet |
| I1 RNG r·0x7ab7+0xf881 | kein RNG-abhängiger Wert in den Läufen | suspected |
| I2 (b) nach dem Laden | Zone mit Wandermonstern: Akteure 90..104 neu erzeugt (Zone 0→Z, HP 0→>0, Kontaktliste belegt). Zwei Sessions: gleiche Positionen, andere HP/Werte | known: Neuwürfeln nach Laden, nicht reproduzierbar über Sessions |
| I2 (b) Zonenwechsel | 36→35→36 (ohne Wandermonster): Akteure 90+ bleiben leer | known (nur leerer Fall) |
| I2 Zonenwechsel in Zone mit Einträgen | nicht getestet | offen |
| Verfolgung/Schritt/Cooldown/Kontaktfolge | nur statisch | suspected |
| Rasse kausal, Shop-Kauf (optional) | nicht durchgeführt | offen |

## Fixtures
MK01–MK10 (Ishar 1), MK21–MK28 (Ishar 2) in `contract-fixtures.json` (237 Vektoren gesamt). Checker: alle grün (monster-ki-ishar1 3/0 known, 7/0 suspected; ishar2 3/0, 5/0). Audit: 0 Treffer. Kit-Probe: 68/235; MK25 passt (`save-actors.ts readActorSave`), alle anderen MK fehlen im Kit (keine Monster-KI).
