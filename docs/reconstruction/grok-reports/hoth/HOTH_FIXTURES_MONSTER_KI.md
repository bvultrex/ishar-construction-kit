# HOTH Fixtures Monster-KI Ishar 1/2 (03.11.2026, bereinigt)
Autor: Hoth (Grok Bot, Executor). Quelle: Quesh `monster-ki-ishar{1,2}.*` (suspected bis eigener Beleg). Positionen, Save-Namen und Rohwerte nur in `private/monsterki/DETAILS.md`. Offsets ab 0.

## Aufbau
Eigene Conf-Kopien (cycles=fixed 25000), Ishar 1 auf :98, Ishar 2 auf :96; je Session eine Instanz, danach beendet; fremde Instanzen nicht angefasst. Nur xdotool. Nur neue Slots; sha256 der Bestandsdateien vorher = nachher.

## Ergebnisse
| Punkt | Beobachtung (Zustandswechsel) | Urteil |
|---|---|---|
| I1 (a) Neuwürfeln nach Laden | Laden + Speichern: nur Speicherkosten-Byte ändert sich; Akteure unverändert. Zwei frische Sessions mit gleichen Eingaben (Laden, Speichern, 1 Schritt, Speichern): beide Saves byte-gleich | known: kein Neuwürfeln beim Laden, deterministisch |
| I1 Wandermonster-Reset | 1 Schritt mit Kartenwechsel: Akteure 60..69 x/y/HP/Haltung/Zone → 0, Zonenfeld eines Akteurs <60 wird gesetzt | known (Reset); Neuerzeugung bei Tabelleneinträgen nicht beobachtet |
| I1 RNG r·0x7ab7+0xf881 | kein RNG-abhängiger Wert in den Läufen | suspected |
| I2 (b) nach dem Laden | Zone mit Wandermonstern: Akteure 90..104 neu erzeugt (Zone 0→Z, HP 0→>0, Kontaktliste belegt). Zwei Sessions: gleiche Positionen, andere HP/Werte | known: Neuwürfeln nach Laden, nicht reproduzierbar über Sessions |
| I2 (b) Zonenwechsel | 36→35→36 (ohne Wandermonster): Akteure 90+ bleiben leer | known (nur leerer Fall) |
| I2 Zonenwechsel in Zone mit Einträgen | Eintritt: Akteure 90+ neu gewürfelt und auf die Spawnpunkte gesetzt. Verlassen bzw. Laden in Zone ohne Einträge: Akteure 90+ gelöscht, Kontaktliste 0 (Nachtrag 2026-11-03) | known (MK29, MK30) |
| Verfolgung/Schritt/Cooldown/Kontaktfolge | nur statisch | suspected |
| Rasse kausal, Shop-Kauf | erledigt, siehe HOTH_FIXTURES_ISHAR1_SAVEMAP.md und HOTH_FIXTURES_ISHAR1_SHOP_PARTY.md (Nachtrag) | known |

## Fixtures
MK01–MK10 (Ishar 1), MK21–MK28 (Ishar 2), alle Eingabewerte synthetisch, in `contract-fixtures.json` (249 Vektoren in der Datei = Gesamtzahl, Stand Nachtrag). Checker: alle grün (monster-ki-ishar1 3/0 known, 7/0 suspected; ishar2 3/0, 5/0). Audit: 0 Treffer. Kit-Probe: 70/247 (Stand Nachtrag) (235 = Probe-Zeilen, nicht Vektoren: die Probe prüft manche Vektoren feldweise in mehreren Zeilen und lässt andere aus); MK25 passt (`save-actors.ts readActorSave`), alle anderen MK fehlen im Kit (keine Monster-KI).

## T5c: Hebel im Save (Ishar 1, Nachtrag 2026-11-03)
Quelle: Quesh dungeon-karten-ishar1.md (T5c) mit Präzisierung: auf der Hebelzelle stehen, Blick zum Hebel. Position per Patch auf Kopien (genehmigt), je frische Session, ein Klick auf den Hebel im Bild, Speichern in neuen Slot. Positionen und Werte nur in private/save_patches.md.
| Punkt | Beobachtung | Urteil |
|---|---|---|
| Hebel-Byte | Hebelbereich 4663..4712, Byte 4663+k geht 0→1 (erwartetes Byte getroffen) | known (LV01) |
| Kontrollhebel | Sein Byte 0→1, zusätzlich zwei Formeltüren im Türbereich 4613..4662 umgeschaltet | known (LV02) |
| Hebel ohne Formeltür | Nur das Hebel-Byte ändert sich (beim T5c-Hebel beobachtet) | suspected als Regel (LV03) |
| Sonstige Diffs | Nur Speichergebühr; keine Zeit-/Positionsänderung außerhalb der Bereiche | known |
| Sprite-Indizes 213/219 | nicht direkt messbar (Renderer), nur Save-Vergleich | offen |
Kit-Probe: LV01–LV03 fehlen (kein Ishar-1-Tür/Hebel-Layout; door-mechanics.ts nutzt Ishar-2-Offsets). MK29/MK30 fehlen (keine Monster-KI). Vektoren jetzt 249, Checker grün, Audit 0.
