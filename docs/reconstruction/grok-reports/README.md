# Grok-Helferberichte 2026-10-18 (Quesh, Alderaan, Hoth)

Öffentliche Analyseberichte der Grok-Helfer-Bots für Codex. **Nichts davon ist integriert.** Codex prüft die Berichte und entscheidet über eine Integration.

Private Belege (Saves, Bilder, Speicherdumps, Logs, Hilfscode) liegen ausschließlich auf Groks Box unter `/workspace/ishar/codex-support/*/private` und sind bewusst nicht im Repo.

Basis: `workbench/playable-slice` @ `bb42748` (Code-Stand `319819c`). Belegstatus laut jeweiligem Bericht.

| Bot | Datei | Thema | Belegstatus |
|---|---|---|---|
| Quesh | [README.md](quesh/README.md) | Übersicht NPC-/Akteur-/Item-Datenfluss | „READ-ONLY analysis“ |
| Quesh | [dataflow-ishar1.md](quesh/dataflow-ishar1.md) | Datenfluss-Matrix Ishar 1 (NPC/Monster/Item) | siehe Bericht |
| Quesh | [dataflow-ishar2.md](quesh/dataflow-ishar2.md) | Datenfluss-Matrix Ishar 2 | siehe Bericht |
| Quesh | [pickup-contract-ishar2.md](quesh/pickup-contract-ishar2.md) / [.json](quesh/pickup-contract-ishar2.json) | Routinenvertrag Bodenaufnahme → Cursor → Slot | „confirmed“ (Contract status) |
| Quesh | [combat-contract-ishar2.md](quesh/combat-contract-ishar2.md) / [.json](quesh/combat-contract-ishar2.json) | Kampfroutine (ENCB, ein Kill) | siehe Bericht |
| Quesh | [combat-contract-ishar1.md](quesh/combat-contract-ishar1.md) / [.json](quesh/combat-contract-ishar1.json) | Kampfroutine Ishar 1, mit Level-up (Nachtrag 4) | siehe Bericht |
| Quesh | [hebel-tuer-trigger-ishar2.md](quesh/hebel-tuer-trigger-ishar2.md) | Hebel-/Tür-Triggerpfad | siehe Bericht |
| Quesh | [tableau-editor.md](quesh/tableau-editor.md) | TABLEAU.IO Entwickler-Karteneditor | „Static only, no emulator runs“ |
| Quesh | [zeit-ishar2.md](quesh/zeit-ishar2.md) | Zeit, Actor-Blickrichtung, Speichersperre Ishar 2 (Nachtrag) | siehe Bericht |
| Quesh | [magic-contract-ishar2.md](quesh/magic-contract-ishar2.md) / [.json](quesh/magic-contract-ishar2.json) | Magiesystem Ishar 2 (Nachtrag 4) | siehe Bericht |
| Quesh | [party-contract-ishar2.md](quesh/party-contract-ishar2.md) / [.json](quesh/party-contract-ishar2.json) | Party-Vertrag Ishar 2 (Nachtrag 4) | siehe Bericht |
| Alderaan | [REFERENCES.md](alderaan/REFERENCES.md) | Reproduzierbare Originalreferenzen (Pickup, NPC, Shop, Mahlzeit) | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18.md](hoth/HOTH_ABNAHME_2026-10-18.md) | Unabhängige Test- und Exportabnahme | siehe Bericht |
| Hoth | [HOTH_DIAGNOSE_2026-10-18_ROTE_PRUEFER.md](hoth/HOTH_DIAGNOSE_2026-10-18_ROTE_PRUEFER.md) | Diagnose zweier roter Prüfer | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_XP_GOLD.md](hoth/HOTH_ABNAHME_2026-10-18_XP_GOLD.md) | XP-/Gold-Savepaar Ishar 2 | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_CONT_WRITEBACK.md](hoth/HOTH_ABNAHME_2026-10-18_CONT_WRITEBACK.md) | CONTn.FIC-Writeback, Mod-Bytes | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_CONT_WRITEBACK_2.md](hoth/HOTH_ABNAHME_2026-10-18_CONT_WRITEBACK_2.md) | CONT-Writeback Teil 2 (Kartenwechsel, Tür/Hebel) | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_HEBEL_TUER.md](hoth/HOTH_ABNAHME_2026-10-18_HEBEL_TUER.md) | Hebel und Tür im Original schalten | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_HEBEL_TUER_2.md](hoth/HOTH_ABNAHME_2026-10-18_HEBEL_TUER_2.md) | Schlüsseltür 8, zweiter Klick Tür 5 | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_TUER8.md](hoth/HOTH_ABNAHME_2026-10-18_TUER8.md) | Tür 8 über das Schlüsselloch | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_TUER28_ZEIT.md](hoth/HOTH_ABNAHME_2026-10-18_TUER28_ZEIT.md) | Zeitgesteuerte Tür 28 (Karte 7) (Nachtrag) | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_ACTOR69.md](hoth/HOTH_ABNAHME_2026-10-18_ACTOR69.md) | Actor 69 (Nacht-NPC), Speicherfehler um 2 Uhr (Nachtrag) | siehe Bericht |
| Hoth | [HOTH_FIXTURES_2026-10-18.md](hoth/HOTH_FIXTURES_2026-10-18.md) | Synthetische Vertragsvektoren (Fixtures, Vorschlagsbranch `grok/hoth-contract-fixtures`) (Nachtrag) | siehe Bericht |
| Hoth | [HOTH_ABNAHME_2026-10-18_STEP_RESET.md](hoth/HOTH_ABNAHME_2026-10-18_STEP_RESET.md) | STEP_RESET-Abnahme (Nachtrag 5) | Tür 5 known: Kit = Original, Rahmen-Tür 5 schließt nach erstem erfolgreichen Schritt, Laden zählt nicht; Tür 6 (Hebel) known: kein Reset; GERDEP L_013af nach erfolgreichem Schritt setzt Türen 5/9/17 auf 0, leert Nahkontaktliste 0x4b80[0..2], weckt Entities mit Feld 0x0c=33; Türen 9/17 suspected; Kit-Lücke suspected: Kontaktliste/Typ-33-Wecken fehlen im Kit, Diff-Vorschlag nur im Bericht, nicht integriert |
| Quesh | [magic-contract-ishar1.md](quesh/magic-contract-ishar1.md) | Nachtrag 6: Quesh Magie-Vertrag Ishar 1 (Zauberliste, Lernen beim Trainer, Kosten, Timer, drei Testfälle) | statisch, nicht im Original verifiziert, nicht integriert |
| Quesh | [party-contract-ishar2.md](quesh/party-contract-ishar2.md) / [.json](quesh/party-contract-ishar2.json) | Nachtrag 7: Party-Vertrag Ishar 2 aktualisiert (Nachtrag 2026-11-03, offene Punkte) | statisch; known/suspected je Punkt siehe Bericht; nicht integriert |
| Quesh | [dialog-text-contract-ishar2.md](quesh/dialog-text-contract-ishar2.md) / [.json](quesh/dialog-text-contract-ishar2.json) | Nachtrag 7: Dialogtext-Vertrag Ishar 2 (TEXTIN/TEXTINE/TEXTIND) | statisch; known/suspected je Punkt siehe Bericht; nicht integriert |
| Quesh | [quest-flags-contract-ishar2.md](quesh/quest-flags-contract-ishar2.md) / [.json](quesh/quest-flags-contract-ishar2.json) | Nachtrag 7: Quest-Flags-Vertrag Ishar 2 | statisch; known/suspected je Punkt siehe Bericht; nicht integriert |
| Quesh | [flagcheck-ishar2.py](quesh/flagcheck-ishar2.py) | Nachtrag 7: Hilfsskript, liest Quest-Flags aus eigenen .SAV (nur Offsets, keine Originalbytes) | Werkzeug, nicht integriert |
| Quesh | [magic-contract-ishar1.json](quesh/magic-contract-ishar1.json) | Nachtrag 7: JSON zum Magie-Vertrag Ishar 1 | statisch, nicht im Original verifiziert, nicht integriert |
| Quesh | [party-contract-ishar1.md](quesh/party-contract-ishar1.md) / [.json](quesh/party-contract-ishar1.json) | Nachtrag 7: Party-Vertrag Ishar 1 | statisch; known/suspected je Punkt siehe Bericht; nicht integriert |
| Quesh | [shop-tavern-contract-ishar1.md](quesh/shop-tavern-contract-ishar1.md) / [.json](quesh/shop-tavern-contract-ishar1.json) | Nachtrag 7: Shop-/Tavernen-Vertrag Ishar 1 (MARCHAND.IO, ITAVERNE.IO) | statisch; known/suspected je Punkt siehe Bericht; nicht integriert |
| Hoth | [HOTH_ABNAHME_2026-10-18_STEP_RESET.md](hoth/HOTH_ABNAHME_2026-10-18_STEP_RESET.md) | Nachtrag 7: STEP_RESET-Abnahme aktualisiert (Nachtrag 3.11.) | known/suspected siehe Bericht; nicht integriert |
| Hoth | [HOTH_FIXTURES_ISHAR1_MAGIE.md](hoth/HOTH_FIXTURES_ISHAR1_MAGIE.md) | Nachtrag 7: Ishar-1-Magie-Fixtures (Branch grok/hoth-contract-fixtures) | known/suspected siehe Bericht; nicht integriert |
| Alderaan | [REFERENCES.md](alderaan/REFERENCES.md) | Nachtrag 7: Originalreferenzen aktualisiert | siehe Bericht; nicht integriert |
| Quesh | [npc-dialog-contract-ishar1.md](quesh/npc-dialog-contract-ishar1.md) / [.json](quesh/npc-dialog-contract-ishar1.json) | Nachtrag 7: NPC-Dialog-Vertrag Ishar 1 | statisch; known/suspected je Punkt siehe Bericht; nicht integriert |
| Quesh | [hebel-tuer-trigger-ishar2.md](quesh/hebel-tuer-trigger-ishar2.md), [party-contract-ishar1.md](quesh/party-contract-ishar1.md) / [.json](quesh/party-contract-ishar1.json) | Nachtrag 7: aktualisierte Fassungen (3.11.) | siehe Bericht; nicht integriert |
| Hoth | [HOTH_ABNAHME_2026-11-03_ISHAR1_SAVE.md](hoth/HOTH_ABNAHME_2026-11-03_ISHAR1_SAVE.md) | Nachtrag 8: Abnahme Ishar-1-Save (3.11.) | known/suspected siehe Bericht; nicht integriert |
| Hoth | [STEP_RESET](hoth/HOTH_ABNAHME_2026-10-18_STEP_RESET.md), [FIXTURES](hoth/HOTH_FIXTURES_2026-10-18.md), [FIXTURES_ISHAR1_MAGIE](hoth/HOTH_FIXTURES_ISHAR1_MAGIE.md) | Nachtrag 8: aktualisierte Fassungen (3.11.) | siehe Bericht; nicht integriert |
| Alderaan | [REFERENCES.md](alderaan/REFERENCES.md) | Nachtrag 8: Originalreferenzen aktualisiert | siehe Bericht; nicht integriert |
| Hoth | [HOTH_FIXTURES_ISHAR1_SHOP_PARTY.md](hoth/HOTH_FIXTURES_ISHAR1_SHOP_PARTY.md) | Nachtrag 9: Abnahme-Fixtures Ishar 1 Shop/Taverne/Party | siehe Bericht; nicht integriert |
| Hoth/Quesh | [STEP_RESET](hoth/HOTH_ABNAHME_2026-10-18_STEP_RESET.md), [hebel-tuer-trigger-ishar2.md](quesh/hebel-tuer-trigger-ishar2.md) | Nachtrag 9: aktualisierte Fassungen (3.11.) | siehe Bericht; nicht integriert |
| Quesh | [save-map-ishar1.md](quesh/save-map-ishar1.md) / [.json](quesh/save-map-ishar1.json) | Nachtrag 10: Quesh vollständige Save-Map Ishar 1 (5216 Bytes, ersetzt ISHAR1_SAVE in save-maps.ts; nicht integriert) | siehe Bericht; Repo-Fassung ohne Werte aus Originalsaves (`validation` und Einzelwerte entfernt) |
| Quesh | [tuer-hebel-trigger-ishar1.md](quesh/tuer-hebel-trigger-ishar1.md) / [.json](quesh/tuer-hebel-trigger-ishar1.json) | Nachtrag 11: Tür-/Hebel-Trigger Ishar 1 | siehe Bericht; nicht integriert |
| Quesh | [monster-ki-ishar1.md](quesh/monster-ki-ishar1.md) / [.json](quesh/monster-ki-ishar1.json) | Nachtrag 11: Monster-KI Ishar 1 | siehe Bericht; nicht integriert |
| Quesh | [monster-ki-ishar2.md](quesh/monster-ki-ishar2.md) / [.json](quesh/monster-ki-ishar2.json) | Nachtrag 11: Monster-KI Ishar 2 | siehe Bericht; nicht integriert |
| Quesh | alle übrigen Quesh-Verträge, README, save-map-ishar1.* | Nachtrag 11: von Quesh rückwirkend bereinigt (Savewerte → private/, Verweise SW-n); save-map ersetzt die gekürzte Fassung aus Nachtrag 10 | Repo-Fassung zusätzlich ohne Restwerte aus Originalsaves und mit auf 12 Zeichen gekürzten Hashes; siehe Bericht; nicht integriert |
| Hoth | [HOTH_FIXTURES_ISHAR1_SAVEMAP.md](hoth/HOTH_FIXTURES_ISHAR1_SAVEMAP.md) | Nachtrag 11: Abnahme Save-Map Ishar 1 | Repo-Fassung ohne Goldwerte aus Originalsaves; siehe Bericht; nicht integriert |
| Alderaan | [REFERENCES.md](alderaan/REFERENCES.md) | Nachtrag 12: bereinigte Fassung (Savewerte → private/, Verweise „see private SW-…“; Hashes auf 12 Zeichen gekürzt) | siehe Bericht; nicht integriert |
| Hoth | [STEP_RESET](hoth/HOTH_ABNAHME_2026-10-18_STEP_RESET.md), [TUER9_ZONE](hoth/HOTH_ABNAHME_2026-11-03_TUER9_ZONE.md), [SAVEMAP](hoth/HOTH_FIXTURES_ISHAR1_SAVEMAP.md), [SHOP_PARTY](hoth/HOTH_FIXTURES_ISHAR1_SHOP_PARTY.md) | Nachtrag 12: von Hoth bereinigte Fassungen (Positionen, Pixelzahlen, Save-Namen und Werte nur privat) | siehe Bericht; nicht integriert |
| Hoth | [HOTH_FIXTURES_MONSTER_KI.md](hoth/HOTH_FIXTURES_MONSTER_KI.md) | Nachtrag 12: Abnahme-Fixtures Monster-KI Ishar 1/2 (MK01–MK10, MK21–MK28) | siehe Bericht; nicht integriert |
| Quesh | [tuer-hebel-trigger-ishar1.md](quesh/tuer-hebel-trigger-ishar1.md) / [.json](quesh/tuer-hebel-trigger-ishar1.json) | Nachtrag 13: korrigierte Fassung (T4 Türkante, 3.11.) | siehe Bericht; nicht integriert |
| Quesh | [dungeon-karten-ishar1.md](quesh/dungeon-karten-ishar1.md) / [.json](quesh/dungeon-karten-ishar1.json) | Nachtrag 13/14: Dungeon-Karten Ishar 1 (Zellwerte, Zonen, Laufregeln; Nachtrag 14: Zellwerte → Renderer/Trigger, 21 Wertklassen, Tests R1–R5; Kartendaten nur privat) | siehe Bericht; nicht integriert |
| Hoth | [HOTH_FIXTURES_MONSTER_KI.md](hoth/HOTH_FIXTURES_MONSTER_KI.md) | Nachtrag 13: bereinigte Fassung (d23f009, Vektorzahl 237/235 erklärt) | siehe Bericht; nicht integriert |
