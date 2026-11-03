# Hoth: Abnahme-Fixtures Ishar 1 Shop/Taverne/Party (2026-11-03, CET)

Quelle: Quesh shop-tavern-contract-ishar1.md, party-contract-ishar1.md; eigene Lesung ITAVERNE/MARCHAND; eigener Save-Diff (Namen privat) (Bericht HOTH_ABNAHME_2026-11-03_ISHAR1_SAVE.md). Kein DOSBox-Lauf. Keine Originalbytes (Audit: 0 Treffer).

## Umfang
33 neue Vektoren (insgesamt 185): shop-ishar1 12 (4 known), tavern-ishar1 10 (4 known), party-ishar1 11 (2 known). Checker-Referenzmodell: alle grün. Das ist nur Selbstkonsistenz und kein Gesamt-Grün.
known nur mit eigenem Beleg: SH03/SH04 (MARCHAND 0x00640–0x0067c Borgen), SH07 (0x006bf Bereich −66..−57), SH10 (Speichern: Byte 483), TV01/TV02 (ITAVERNE 0x0017f/0x00194/0x001a5), TV05 (0x005e4–0x00629), TV06 (0x0064b–0x006bd), PA01 (728+c/738+c/768+c/5216), PA03 (Klassenbytes = Bögen).

## Kit-Probe (Hauptergebnis): Abweichungen
| Vektor | Kit | Ist | Soll |
|---|---|---|---|
| SH07 | original-commerce.ts Z.28 | stapelbar −59..−49 | −66..−57 (MARCHAND 0x006bf) |
| SH08 | commerce Z.34 | Kappe 20 für −49, sonst 10 | −57→5, −58→20, sonst 10 (suspected); kein I1-Pfad |
| SH09 | ORIGINAL_COMMERCE_OFFSETS.stacks | 7629, Index item+59 | 4971+10c+(item+66) → 5000 für c2 −57 |
| SH10 | goldThousands | 1006+2c → 1010 | 478+2c → 482 (Low-Byte 483 belegt) |
| SH10.s | ISHAR1_SAVE.gold | 0x2df = 735, u8 | 483 (Tausender c2), 2 Byte |
| SH11 | goldRemainder / inventory | 1030 / 1036 | 3997 / 556 |
| SH01 | originalShopEntry | Layer-B-Wert (17..39 / 1..15) | Ishar 1: Tabelle (x,y,zone) 0x3fd6 / 0x3f94 |
| PA01 | ISHAR1_SAVE.level / psychic | 997 / 748 (c=3) | 741 / 771 |
| PA01.class | – | fehlt | 731 |
| PA02.hp | ISHAR1_SAVE.hp | 728 (c=3), u8 | 474, 2 Byte (suspected) |

Passt: SH03–SH06 (subtractOriginalPrice und debitOriginalGold, 8/8), PA01.size (minLength 1035 ≤ 5216; das Kit kennt die Größe 5216 nicht).
Fehlt: SH02, SH08, SH12, TV01–TV10 (keine Ishar-1-Taverne), PA02 maxHp/food/npc/rel/grid, PA03–PA11 (keine Ishar-1-Party).
Probe gesamt: 66/183 (davon neu 9/47).

Folgerung: Das Commerce-Modell im Kit ist Ishar 2 und für Ishar 1 nicht verwendbar. Nur die Gold-Arithmetik ist übertragbar. Auch ISHAR1_SAVE weicht ab: hp, gold, level und psychic stimmen nicht mit den belegten Offsets überein.

## Dateien
fixtures/: build-contract-fixtures.py, check-contract-fixtures.mjs, probe-kit-against-fixtures.mjs, contract-fixtures.json, check-output.txt, probe-output.txt.

## Nachtrag 2026-11-03 nachmittags: Gegenläufe Kauf und Speichergebühr (DOSBox, Ishar 1)
Aufbau: eigene Conf (cycles=fixed 25000), eine Instanz, frische Session je Lauf, nur xdotool, nur neue Slots, sha256 vorher/nachher in private/. Ein Lauf auf einer Kopie mit Gold-Patch (genehmigt), ein Lauf ohne Gold-Patch (Gegenstand im Spiel abgelegt), ein Lauf auf einer Kopie mit Gesamtgold unter 1000. Patches, Save-Namen und Rohwerte: private/save_patches.md.
Bedienung (öffentlich): Vorwärts (287,80), Kaufdialog OK (276,131), Gegenstand im Raster anklicken, dann Porträt des Käufers, EXIT (298,131).

| Punkt | Beobachtung | Urteil |
|---|---|---|
| Kauf: wer zahlt | Nur die Figur der Porträtspalte x/64; andere Figuren beim Kauf unverändert | known (SH13) |
| Kauf: Betrag | Genau der angezeigte Preis, mit Borgen beim Tausender, wenn der Rest nicht reicht (MARCHAND L_0062f) | known (SH13, SH14, SH03/SH04) |
| Stapelzähler | +1 je Kauf, nie +2; ein früher vermuteter Doppelkauf war keiner (Saves byte-gleich) | known |
| Bisherige „Preis + 1000“ | Die 1000 sind die Speichergebühr, nicht der Kauf | known |
| Speichergebühr | Jedes Speichern im Spiel senkt das Gesamtgold um genau 1000; per Patch erzeugte Saves nicht | known (SG01) |
| Unter 1000 Gesamtgold | Meldung −21 („Sie haben kein Gold mehr.“), kein Namensdialog, keine neue Datei | known (SG02, Quesh SOS.IO L_00b5e) |
| Verteilung der Gebühr | Quesh L_00cf8: Durchgang 1 Anteil 1000 div n je belegter Figur in Slotfolge 0..4 (sonst alles, was sie hat), Durchgang 2 erste Figur, die den Rest deckt | suspected (SG03, SG04 synthetisch) |

Vergleich mit den Läufen mit Gold-Patch (zwei Goldträgerinnen/-träger, 5 belegte Figuren): Regel ergibt Anteil 200; Käuferin zahlt 200, der zweite Träger 200 + Rest 600 = 800. Beobachtet 200/800 in beiden Läufen (Preis 300 und 500). Urteil: Regel L_00cf8 durch zwei Läufe gestützt, bleibt suspected bis ein Lauf mit mehr Trägern oder einem Träger unter dem Anteil vorliegt.
Ergänzung zu SH10: die Byte-483-Änderung beim Speichern ist dieselbe Gebühr.

### Kit-Probe neue Zeilen
| Vektor | Kit | Ergebnis |
|---|---|---|
| SH13, SH14 | original-merchants.ts subtractOriginalPrice (auf die Käuferspalte angewandt) | passt; Spaltenwahl x/64 und Stapel +1 fehlen im Kit |
| SG01–SG04 | – | fehlt (keine Ishar-1-Speichergebühr) |
Probe gesamt jetzt 70/246.
