# Technischer Iststand

Stand: 2026-10-17. Keine prozentuale Vollständigkeitsbehauptung.

| Bereich | Ishar 1 | Ishar 2 |
|---|---|---|
| Originalbestand | 122 Dateien inventarisiert | 190 Dateien inventarisiert |
| Edition / aktive Sprache | unbestätigt | unbestätigt |
| CONT-Leser/Writer | 6 Originaldateien byteidentisch geprüft | 7 Originaldateien byteidentisch geprüft |
| gezielte Kartenbyteänderung | nur geändertes Byte, Rest unverändert geprüft | ebenso |
| Save-Editor | Original-I/O-Aufteilung für 5216 Bytes nachgewiesen; UI-Feldnamen weiter Kandidaten | einzelne decompile-basierte Teilpfade und ältere Kandidaten koexistieren |
| Grafiken/Packer | 98 IO-Hüllen/Images auditiert; Grafiksemantik offen; A1-Writer gegen Decoder geprüft | 142 IO-Hüllen/Images auditiert; Import/Paletten/Sprites teilweise; A1-Writer gegen Decoder geprüft |
| Kartenlaufzeit | nicht als originalgleich nachgewiesen | CONT1–7 teilweise dargestellt, Originalvergleich lückenhaft |
| NPCs/Kampf | offen | EAFF/EATT teilweise; Leerlauf für drei Module, kein vollständiger Kampf |
| Dialog/Quest/Zauber/Audio | offen | offen bzw. Analysefragmente; nicht vollständig integriert |
| Neue Inhalte | Browser-JSON kein Originalexportnachweis | ebenso |
| Originalspiel-Mod-Readback | offen | offen |

## Architektur, die weiterverwendet wird

- `src/lib/ishar`: Binär-/Packer-/Asset-Code, CONT-Codec, Save-Felder,
  decompile-basierte Gameplay-Teile und authored Zusatzsysteme. Diese sind noch
  nicht vollständig nach Spiel/Plattform geschichtet.
- `src/builder`, `src/components/builder`, `src/routes`: React-Editor und Labore.
- `src/lib/store.ts`, `src/lib/asset-store.ts`: Projekt-/Assetzustand.
- `src/routes/playtest.tsx`: Browserlaufzeit; kein Ersatznachweis für Originaltest.
- `scripts`: Node-CLI und Prüfungen, teilweise optional mit lokalen Ressourcen.
- Lokale `grok-handoff-research-2026-10-11/decompile` enthält Ishar-2-Listings,
  Analyse und Render-Tabellen; Originalmaterial wird nicht ins Repo übernommen.
- Lokale `alis-reference`: vorhandene ALIS-C-Implementierung als Referenz,
  mit eigenem LICENSE. Noch kein in diesem Audit erfolgreicher Build/Start.

## Verfügbare Werkzeuge und Voraussetzungen

Node und Git sind ausführbar. Die vorhandenen Node-Tests importieren TypeScript
per nativer Type-Stripping-Unterstützung. Ein gebündelter Python-Interpreter ist
vorhanden; `python` im PATH ist dagegen ein WindowsApps-Alias.
DOSBox/dosbox-x/gh wurden nicht im PATH gefunden. Das beweist nicht, dass kein
Emulator installiert ist. Später über die Desktop-Verknüpfung gefunden:
`E:/Programme/Dosbox/DOSBox.exe` (Fenster: 0.74). Ishar 2 startet aus separater
Kopie bis zur Sprach-/Musikauswahl; Original-Ingame-Modvergleich noch offen. ALIS-Referenz nennt CMake/SDL2; deren Build ist noch zu prüfen.

Originalinstallationen und Analyseausgaben bleiben getrennt. Keine Originaldatei
wird bearbeitet. Repository enthält eigene Werkzeuge und Dokumentation; keine
EXE, Grafik-, Karten-, Script- oder Save-Kopien aus den Spielen. Lizenz/Herkunft
von Drittcode vor Übernahme prüfen; keine generelle Freigabe von Spielressourcen
aus einer lokal vorhandenen Datei ableiten.

## Tests dieses Meilensteins

- `test:inventory`: deterministische Hashinventur, Quellschutz, Überschreibschutz.
- `test:original-resources`: alle 13 lokalen CONT-Dateien lesen/schreiben,
  gezielte A-Änderung, Erhalt aller übrigen Bytes, unveränderter Quellpuffer.
- Keine Originalspielausführung, keine Grafikgleichheit und kein vollständiger
  Mod-Workflow durch diese Tests nachgewiesen.


## Export-Integration (weiterer Zwischenstand)

`cont-patch.ts` und `scripts/cont-mod.mjs` binden Änderungen an ihren Quellhash
und erstellen ausschließlich neue Spielkopien mit vollständigem Hash-Readback.
Builder exportiert diesen Patch nach Auswahl der passenden Originaldatei.
`test:cont-mod` prüft beide Profile, Fehlereingaben, Quellschutz und Daten-Erhalt.
Browser-Ishar-2-Export und Anwendung auf 190-Dateien-Kopie nachgewiesen;
Originalspiel-Modprüfung bleibt offen. Ablauf und Grenzen: MOD_WORKFLOW.md.


## ALIS-/Ishar-1-Analyse

Alle 240 lokalen IO-Module wurden strukturell geprüft, per No-op byteidentisch
zurückgegeben und gegen den separaten Python-Decoder verglichen. Für Ishar 1
liegen neue lokale Listings vor (FRISE-Abbruch offen). Der originale MAIN-SAV-
Reader und Writer stimmen bei 107 Feldern/5216 Bytes überein; alle acht lokalen
Saves sind mit dieser Struktur byteidentisch rekonstruierbar. Keine Aussage über
vollständige Feldsemantik oder erfolgreichen Originalspiel-Modtest.
Details, Profilhashes und Reproduktion: ALIS_MODULES.md.


## A1-Schreiben

Deterministischer Writer und Inspect/Extract/Replace-CLI vorhanden. 240 geänderte
lokale Module gegen TypeScript und Python zurückgelesen; No-op byteidentisch,
VM-Spezifikationen und unbekannte vollständige Trailer erhalten. Original-
Ausführung, Größen-/Referenzerweiterungen und vollständige Editoren bleiben offen.
Keine Originaldateien verändert. Details: A1_WRITER.md.

## DOS-Paletteneditor

Asset Lab bietet jetzt lokale IO-Palettenbearbeitung, Undo/Redo, IO-Kopie und Änderungsbericht. 60 Paletten aus Ishar 1 und 161 aus Ishar 2 wurden gezielt geändert und zurückgelesen; übrige Imagebytes erhalten. Browserexport mit FOND1.IO byteweise kontrolliert. Skriptzuordnung und Originalspielprüfung bleiben offen. Format, Bedienung und Testgrenzen: [PALETTE_EDITOR.md](PALETTE_EDITOR.md).

## EATT-Signalroutine

Originaler positiver EATT-Zustands-/Signalpfad samt Aufrufprädikat als unverändernder Trace rekonstruiert. DOS-cdim-Byte-Strides für zwei mehrdimensionale Tabellen direkt im lokalen MAIN verifiziert. Noch keine Playtest-Verdrahtung, MESSAGE-Rückmeldung oder Originalausführung. Siehe [EATT_SIGNALS.md](EATT_SIGNALS.md).

## NPC-Gold und Operandenregister

FRISE-Goldübergabe und EATT-Bestätigung als komponierter Trace rekonstruiert; bisherige Annahme einer direkten MESSAGE-Bestätigung korrigiert. Registertausch bei opile, signed16-Arithmetik und native Vergleichswerte im Figurenskriptinterpreter berichtigt. Lokale Figurenskripttests weiter bestanden. Originalausführung und vollständige Interaktionsverdrahtung offen. Siehe [NPC_GOLD_AND_OPERANDS.md](NPC_GOLD_AND_OPERANDS.md).

## Ursprüngliche Goldauswahl

FRISE-Betragsänderung mit Guthabenprüfung und Wiederholungsbeschleunigung rekonstruiert. 90 Fälle gegen begrenzte Auswertung der ursprünglichen Listing-Rechenzweige verglichen, 118 Instruktionspräfixe am Original geprüft. Gesamtes Goldfenster, Ziele, Scheduler und Originalausführung weiterhin offen; keine neue Playtest-Bedienung aktiviert. Details: NPC_GOLD_AND_OPERANDS.md.

## Ishar-2-MAIN-Save-Writer

141 I/O-Felder direkt aus dem hashgebundenen IO.IO abgeleitet; 21 Saves mit Listing-Loader verglichen und 2940 gezielte Änderungen geprüft. CLI schreibt explizite MAIN-Operationen in neue SAV-Kopien; NPC-Gold-Trace exportiert/zurückgelesen. Header-Sonderfall und Byte-Scalar-Vorzeichenerweiterung berücksichtigt. Originalausführung und vollständige Feldsemantik offen. Siehe [ISHAR2_SAVE_MAIN.md](ISHAR2_SAVE_MAIN.md).
