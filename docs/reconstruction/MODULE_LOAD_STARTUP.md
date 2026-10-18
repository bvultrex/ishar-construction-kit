# MAIN-Dateisuche und ursprünglicher Modul-Ladepfad

Stand 2026-10-18. Die vorherige DISK-A-Diagnose stammt aus dem ausdrücklich
mit FindFirst-Fehlerantworten betriebenen Test. Die erste tatsächliche Suche
betrifft `main.io`: deren Pattern-SHA ist
`176bc9db0ad3db2f14d85f65778424d48b36e30c7cf65e4ec57b3b4b63aa01d4`.
Die lokale Datei `E:\Spiele\Ishar1\MAIN.IO` ist vorhanden und hat den inventarisierten
SHA-256 `27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b`.
Die Aufforderung beweist somit keine fehlenden Originaldaten auf diesem PC.

Mit einer expliziten FindFirst-Erfolgsantwort erreicht ein authentifizierter
Ishar-1-Rootzustand nach 187 verglichenen MAIN-Befehlen Opcode 69 mit Modulnummer
64 und Dateiname `logo.IO`. Der Fehlerpfad wird nicht übersprungen; es wird die
andere originale Verzweigung mit geänderter Dienstantwort geprüft. Ein vollständiger
DOS-FindFirst-Dienst samt DTA-Seiteneffekten ist damit weiterhin nicht angeschlossen.
Nachweis: STARTUP_MAIN_FOUND_ISHAR1_2026-10-18.json (ein Startzustand).

## Opcode 69 und Cache

`original-dos-module-load-prefix.ts` rekonstruiert 2DBD–2DD9 und 78F9/8106:
Keyboard-Sonderfall bleibt eine Grenze, die unmittelbare Modulnummer wird gelesen,
bei positiver Nummer B04 gesetzt und die sortierte Far-Pointer-Tabelle BC2/BCE
durchlaufen. LDS geschieht vor dem Bereichsvergleich, auch bei leerer Tabelle.
Bei Treffer wird der Dateiname bis Null überlesen und nach 26F7 zurückgekehrt.
Der physische Skriptinterpreter verbindet ausschließlich diesen vollständigen
Cache-Treffer. Ein Miss stoppt vor CALL1F97 bei 7917; Nummer 0 stoppt vor dem
originalen Austauschpfad 69B8/765C. Es wird kein Modul als geladen vorgetäuscht.

`check-native-dos-module-load-prefix.py` prüft 36 Fälle je Spiel, insgesamt 72:
leere/ein-/zweielementige Tabellen, Treffer/Miss, Modul 0 und eine mit B04
aliasierende Tabelle. Sechs ALIS-Register, SP und ganzer Speicher außer
FEC0–FF0F werden verglichen. Die Vektoren prüfen zusätzlich die Verbindung des
Cache-Treffers zum physischen Skriptschritt und Eingabeerhalt bei Fehlergrenzen.
Segmentübergreifende Wortzugriffe und unbegrenzte Zyklen bleiben Hostgrenzen.
Nachweis: MODULE_LOAD_PREFIX_NATIVE_2026-10-18.json.

Der tatsächliche Ishar-1-Miss wurde separat vom unveränderten 69-Dispatch bis
7917 verglichen und als privater CPU-/Speichercheckpoint gesichert.
Nachweis: STARTUP_LOGO_OPEN_ISHAR1_2026-10-18.json.

## Öffnen und sechs Byte langer Modulheader

`original-dos-module-header.ts` verbindet den erfolgreichen 7917-Pfad mit den
vorhandenen Originalhelfern `openOriginalDosFile` und `runOriginalDosFileIo`.
DOS-Handle und sechs gelesene Bytes sind explizite Eingaben. Die echten
Open-/Read-Requests, Laufwerksauswahl, Register, SP und Speicherwirkungen werden
verglichen; es wird keine Hostdatei zum Schreiben geöffnet. Fehler-/Kurzlese-
Semantik der allgemeinen Dateihelfer ist separat geprüft, kein Erfolgsbeweis
dieses ausdrücklich auf sechs Bytes beschränkten Anschlusses.

Für `LOGO.IO` (14420 Bytes, SHA-256
`8d1dad784ed7e8733d6f80ccade4ad2cafee5bc5c4df1e9af5fb078db10e4969`)
stimmen Headerlesen nach SS:2480 und die folgende Maskierung/Verzweigung bis
7959 vor CALL79E9 mit dem Original überein. Allocation, weitere Payload-Reads,
Dekompression, Registrieren und Abschluss sind noch offen. Der private
Checkpoint enthält die echten Callerframes, den erhaltenen Handle und den
erreichten Registersatz, keine manuell vorbereitete Logo-Grafik.
Nachweis: STARTUP_LOGO_HEADER_ISHAR1_2026-10-18.json.

Zwölf ausdrücklich synthetische Headerantworten auf demselben Ishar-1-Zustand
prüfen außerdem den Hauptmodulheader-Zweig 76CF, den Allokationszweig vor 7968
und den komprimierten Zweig vor 7959. Sie beweisen die Dispatchwirkungen, keine
Gültigkeit zugehöriger Payloads und keinen Ishar-2-Gesamt-Ladepfad.
Nachweis: MODULE_HEADER_BRANCHES_ISHAR1_2026-10-18.json.

## Reproduzierbarer nächster Anschluss

Private Zustände unter dem Geschwisterordner `analysis-output`:
`startup-main-found-ishar1-2026-10-18`,
`startup-logo-open-boundary-ishar1-2026-10-18`,
`startup-logo-decode-boundary-ishar1-2026-10-18`.
Die Prüfer `check-native-dos-module-load-checkpoint.py` und
`check-native-dos-module-header-checkpoint.py` authentifizieren Profile und
Speicherhashes. Exporte sind exklusiv und bleiben außerhalb des Repositorys.
Originaldateien bleiben unverändert; öffentliche Nachweise enthalten keine
Speicher-/Header-/Payloadbytes.

Nächster Schritt: tatsächlichen 79E9-Pfad mit Original-Speicherverwaltung,
Read- und A1-Bausteinen verbinden. Vollständiger FindFirst/DTA-/Dateisystemadapter
und originaler Ressourcenabschluss bleiben eigene Abnahmen. Kein neuer
Browser-Toolkit-Stand und kein kompletter Spielstart werden behauptet.
