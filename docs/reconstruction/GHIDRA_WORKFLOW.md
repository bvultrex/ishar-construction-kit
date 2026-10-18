# Ghidra als ergänzender Analysearbeitsplatz

## Bisheriger Einsatz und aktueller Nachweis

HANDOFF_2026-10-11.md §10 nennt Quesh mit „Engine (Ghidra auf start.exe)“. §15 schließt Ghidra-Projekte und Decompiler-Ausgaben aus dem Handoff aus. Frühere Grok-Projekte wurden bei der gezielten lokalen Suche nicht gefunden.

Am 18.10.2026 wurde Ghidra 12.1.4 mit Temurin JDK 21.0.12.1+1 portabel eingerichtet. Beide offiziellen Downloadarchive wurden vor dem Entpacken gegen die in scripts/setup-ghidra-tools.ps1 festgehaltenen SHA-256-Werte geprüft. Vorhandene Installationsverzeichnisse überspringt das Setup; deren Inhalt wird dabei nicht erneut verifiziert. System-PATH und JAVA_HOME bleiben unverändert.

Für BEIDE identifizierten entpackten DOS-Captures wurden zwei begrenzte Handler importiert, disassembliert und decompiliert:

- CS1000:2EF3–2EFE, Opcode71: fünf Instruktionen.
- CS1000:289C–28A8, Opcode20: acht Instruktionen.

Die Instruktionsadressen, Längen und Byteprüfsummen stimmen mit Capture und Capstone überein. Metadaten stehen in GHIDRA_SMOKE_ISHAR1_2026-10-18.json und GHIDRA_SMOKE_ISHAR2_2026-10-18.json. Originaldateien blieben unverändert. Dies ist keine vollständige Programmanalyse und kein semantischer Gleichheitsnachweis des generierten C.

## Reproduzierbarer lokaler Ablauf

Vom Repository-Verzeichnis in PowerShell:

```powershell
./scripts/setup-ghidra-tools.ps1
./scripts/run-ghidra-dos-smoke.ps1 -Capture '../analysis-output/dos-first-interrupt-ishar2-2026-10-17/memory.bin'
# Danach mit Python + Capstone prüfen; OUTPUT ist der ausgegebene GHIDRA_OUTPUT-Pfad:
python scripts/check-ghidra-dos-smoke.py CAPTURE OUTPUT
```

Für Ishar1 denselben Aufruf mit dessen Capture verwenden. Der Launcher akzeptiert ausschließlich die zwei dokumentierten Capture-Hashes. Jeder Lauf erhält ein eigenes Projekt und Ausgabeordner außerhalb des Repos. Dort bleiben Ghidra-Datenbank, Logs, Disassembly und Pseudocode. Ins Repo gehören nur Skripte und Metadaten.

Import: BinaryLoader, Basis0000:0000, Sprache x86:LE:16:Real Mode, Compiler default; explizite CS1000- und SS1C0B-Kontexte auf den untersuchten Bereichen. Automatische Gesamtanalyse ist deaktiviert. Das Java-Skript erzeugt ausschließlich zwei begrenzte Funktionen.

Der Windows-Batchstarter scheiterte am Workspacepfad mit Klammern. Der Launcher ruft deshalb direkt Ghidras offiziellen Java-Einstieg mit den VM-Argumenten aus support/launch.properties auf. JDK25 scheiterte in der Skriptverwaltung; die Dokumentation der tatsächlich verwendeten Ghidra-Version verlangt JDK21, mit dem beide Tests erfolgreich sind. Die aktuelle README des Hauptbranches ist keine verlässliche Laufzeitvorgabe für eine ältere Veröffentlichung.

## Rolle und Grenzen

Ghidra ergänzt die statische Analyse mit Funktionsgraphen, Querverweisen, Datentypen, Symbolnamen und Pseudocode. Offizielles Projekt: https://github.com/NationalSecurityAgency/ghidra.

Ausgangspunkt sind die entpackten Speicherabbilder; die gepackte START.EXE allein enthält nicht die unmittelbar analysierbaren Laufzeitroutinen. 16-Bit-Segmentierung, Far-Pointer, Segmentaliasse, Opcode-Sprungtabellen und Laufzeitänderungen benötigen ausdrückliche Modellierung.

Der erste Opcode71-Pseudocode zeigt die Speicherzuweisung, aber nicht ausdrücklich den SI-Fortschritt von LODSW und die vollständige Segmentadressierung. Deshalb wird generiertes C nicht automatisch als Engine-Ersatz übernommen. Die bereits nativ geprüften Hostfunktionen und Registervergleiche bleiben der Verhaltensnachweis.

Als Nächstes folgen geeignete Registerverträge, Datentypen und benannte Globals für größere Dispatcher-/Callbackpfade. Neue Erkenntnisse werden weiterhin gegen Originalinstruktionen und Ressourcen geprüft. NPCs, Gegner, Shops und beide vollständigen Spiele sind durch diesen Werkzeugtest noch nicht rekonstruiert.
