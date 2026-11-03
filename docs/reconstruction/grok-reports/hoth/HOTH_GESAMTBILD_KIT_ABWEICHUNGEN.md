# Hoth: Gesamtbild Kit-Abweichungen (für Codex, 2026-11-03, CET)

Grundlage: HOTH_FIXTURES_MONSTER_KI.md, HOTH_FIXTURES_ISHAR1_SAVEMAP.md, HOTH_FIXTURES_ISHAR1_SHOP_PARTY.md, Probe 68/235. Ich habe keine Kit-Dateien geändert. Keine Originalbytes, Rohwerte nur privat.

## Priorität 1: Save-Map Ishar 1 (`save-maps.ts ISHAR1_SAVE`)
| # | Feld | Kit | Soll | Beleg |
|---|---|---|---|---|
| 1 | minLength | 1035 | 5216 | known (PA01.size, alle Saves) |
| 2 | gold | 735, u8, kein goldThousands | Tausender 478+2c, Rest 3993+2c, je BE16 | known für Speichern/Low-Byte (SH10); Kauf-Diff offen |
| 3 | level / psychic | 994+c (997) / 745+c (748) | 738+c / 768+c | known (SM03, SM04) |
| 4 | hp | 725/728 u8 | 468+2c BE16 (bei PA02 474) | suspected (PA02.hp) |
| 5 | race | fehlt | 733+c (1 Mensch, 2 Elf, 3 Zwerg, 4 Ork, 5 Echse) | **known kausal** (Patch RACEX: Bogen zeigt „Eidechse“ statt „Menschlich“) |
| 6 | class, xp, hpMax, temper, Inventar 498+26c+2k, Zauberbuch, Name | fehlen | siehe SAVEMAP | class known (731, PA01.class), Rest suspected (SM19, SM31–SM33) |
| 7 | Attributwerte | DEBUG-Cheat-Map | siehe SAVEMAP | known: falsch |

## Priorität 2: Shop/Party Ishar 1 (`original-commerce.ts`)
| # | Feld | Kit | Soll | Beleg |
|---|---|---|---|---|
| 1 | Stapelbereich (Z.28) | −59..−49 | −66..−57 | known (SH07) |
| 2 | Stack-Offsets | 7629, Index item+59 | 4971+10c+(item+66) | suspected (SH09) |
| 3 | goldThousands / goldRemainder / inventory | 1006+2c / 1030 / 1036 | 478+2c / 3997 / 556 | SH10 known, SH11 suspected |
| 4 | Stapelkappe (Z.34) | 20 für −49, sonst 10 | −57→5, −58→20, sonst 10 | suspected (SH08) |
| 5 | originalShopEntry | Layer-B-Wert | Tabelle (x,y,zone) im Ishar-1-Code | known (SH01, eigene Lesung) |
| 6 | Taverne/Party Ishar 1 | fehlt | TV01–TV10, PA03–PA11 | teils known (TV01/02/05/06, PA03) |
Übertragbar: Gold-Arithmetik (SH03–SH06, 8/8 passt).

## Priorität 3: Monster-KI
| # | Bereich | Kit | Beleg |
|---|---|---|---|
| 1 | Monster-KI Ishar 1 und 2 (MK01–MK10, MK21–MK28) | fehlt im Kit vollständig | gemischt known/suspected, siehe HOTH_FIXTURES_MONSTER_KI.md |
| 2 | Akteur-Save Ishar 2 (`save-actors.ts readActorSave`) | passt (MK25) | known |
| 3 | Laden Ishar 1: kein Neuwürfeln; Kartenwechsel löscht 60..69 | fehlt | known |
| 4 | Laden Ishar 2 in einer Zone mit Wandermonstern: Akteure 90+ neu gewürfelt (Position und HP), nicht reproduzierbar | fehlt | known |
| 5 | Zonenwechsel Ishar 2 mit Wandermonstern | – | offen (kein Zonenwechsel ausgelöst) |
