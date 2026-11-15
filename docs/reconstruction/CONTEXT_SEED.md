# DOS-Kontextsteuerung und Initialisierungswort

Stand: 2026-10-18. Beide authentifizierten DOS-Speicherprofile wurden gegen
ihren Originaldispatcher geprüft. Ziel ist Verhaltensgleichheit, keine Binäridentität.

| Opcode | Originalhandler | Nachgewiesene Wirkung |
|---|---|---|
| 98 | 58A1 | Kontextbyte ES:[BP−36], Bit 0 löschen |
| 99 | 5898 → 588A | Bit 0 setzen, anschließend Wirkung von 102 |
| 100 | 58AD | Kontextbyte Bit 1 löschen; keine Palettensicherung |
| 101 | 58A7 | Kontextbyte Bit 1 setzen |
| 102 | 588A | Wort ES:[BP−28] nach ES:[BP−30], Kontextbit 7 löschen |
| 103 | 570B | SS:C96 auf 1 setzen |
| 59 | 2E93 | RET; ausschließlich der vorherige Opcodeabruf erhöht SI |
| 42 | 2AFC–2B13 | Numerischen Operanden nach SS:C4E schreiben; bei Null BIOS-Wort 0040:006C lesen |

Die Rekonstruktionen stehen in `original-dos-context-control.ts` und
`original-dos-seed-word.ts`; der physische Skriptinterpreter verbindet sie.
Opcode 42 benutzt den Operandenentry 69AB: CX bleibt erhalten. Der BIOS-Wert
kommt aus dem übergebenen Speicherzustand, ohne Host-Zufall oder erfundene Zeitticks.
Kontextbitnamen und weiterführende Lebenszyklussemantik bleiben offen.

`scripts/check-native-dos-context-seed.py` vergleicht je Profil 323 Fälle:
überlappende Segmentfenster, C96-Alias, Flagkombinationen und byte-/wortkodierte
Operanden einschließlich Null. Verglichen werden sechs ALIS-Register, SP und
der gesamte 1-MiB-Speicher außer FEC0–FF0F CPU-Stack-Scratch. Die Eingabe bleibt
unverändert. Scratchregister und CPU-Flags sind hier kein behaupteter Vertrag.
Die Prüfer benötigen lokale Originalcaptures; die eingecheckten Ergebnisse
enthalten nur Metadaten, keine Originalressourcen.

Im zusammenhängenden Ishar-1-Startpfad stimmen nun in allen vier Kombinationen
aus Länderkennung und Mausantwort 176 MAIN-Befehle mit dem Original überein.
Danach stoppt die Rekonstruktion ausdrücklich bei Opcode 30, Ausdruckstag 4
(Stringzuweisung). Diese Lücke wird nicht übersprungen. Vollständiger Spielstart,
BIOS-IRQ-Fortsetzung und Browserintegration sind dadurch noch nicht nachgewiesen.

Nachweise: `CONTEXT_SEED_NATIVE_2026-10-18.json` und
`STARTUP_CONTEXT_SEED_NATIVE_2026-10-18.json`. TypeScript-Prüfung und bestehender
physischer Skripttest bestehen ebenfalls.
