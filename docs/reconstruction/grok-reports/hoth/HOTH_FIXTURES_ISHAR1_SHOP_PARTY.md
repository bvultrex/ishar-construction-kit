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
