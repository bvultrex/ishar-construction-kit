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
