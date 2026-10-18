# Ghidra als ergänzender Analysearbeitsplatz

## Belegter bisheriger Einsatz

HANDOFF_2026-10-11.md §10 nennt Quesh mit der Aufgabe „Engine (Ghidra auf start.exe)“. §15 dokumentiert, dass Ghidra-Projekte und Decompiler-Ausgaben aus dem Handoff ausgeschlossen wurden. Daraus folgt ein früherer Einsatz bei Grok, jedoch kein Nachweis einer aktuell verfügbaren lokalen Ghidra-Einrichtung. Am18.10.2026 waren ghidraRun/analyzeHeadless nicht über PATH auffindbar. Die derzeitige Rekonstruktion und native Vergleichsinfrastruktur bleiben unabhängig davon nutzbar.

## Vorgesehene Rolle

Ghidra ergänzt die statische Analyse mit Funktionsgraphen, Querverweisen, Datentypen, Symbolnamen und Decompiler-Pseudocode. Offizielles Projekt: https://github.com/NationalSecurityAgency/ghidra (README am18.10.2026 geprüft). Die Ausgaben sind Analysehypothesen, kein zurückgewonnener ursprünglicher Quellcode und kein alleiniger Nachweis gleicher Funktion.

Für die vorliegenden DOS-Versionen sind die entpackten und bereits über SHA256 identifizierten Speicherabbilder der geeignete Ausgangspunkt. Ein Import nur der gepackten START.EXE reicht nicht für die nach dem Entpacken tatsächlich ausgeführten Routinen. 16-Bit-Segmentierung, Far-Pointer, Segmentaliasse, Opcode-Sprungtabellen und Laufzeitänderungen müssen ausdrücklich modelliert werden. Erkannte Funktionen und Globals sollten ihre bereits belegten Adressen und Namen erhalten. Analyseprojekte bleiben von unveränderten Originaldateien getrennt.

## Nächster überprüfbarer Schritt

1. Vorhandene lokale Ghidra-/Java-Installation und eventuell noch vorhandene Grok-Analyseprojekte gezielt suchen und deren Zustand prüfen.
2. Einen reproduzierbaren Import für eines der identifizierten entpackten DOS-Captures einrichten. Prozessor-/Compilerkonfiguration und Segmentbasis dokumentieren.
3. Eine bereits nativ geprüfte Routine, etwa2632 oder26B2, importieren, benennen und mit den belegten Instruktionen/Hostfunktionen abgleichen.
4. Erst nach diesem Vergleich offene Routinen, Callbackpfade und Datenstrukturen systematisch erschließen; hilfreiche Import-/Benennungsskripte ohne Originalbytes ins Repo übernehmen.
5. Neue Erkenntnisse weiterhin gegen die Originalinstruktionen und tatsächlichen Ressourcen testen. Ghidra soll die Rekonstruktion beschleunigen, nicht die vorhandenen Belege ersetzen.

Noch nicht erfüllt: aktuell nutzbare Installation, erfolgreicher Import, geprüfte Decompilerausgabe und automatisierter Export. Diese Datei dokumentiert den Arbeitsweg, keine bereits abgeschlossene Einrichtung.
