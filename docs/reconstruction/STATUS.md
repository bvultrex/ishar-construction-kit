# Technischer Iststand

Stand: 2026-10-17. Keine prozentuale Vollständigkeitsbehauptung.

| Bereich | Ishar 1 | Ishar 2 |
|---|---|---|
| Originalbestand | 122 Dateien inventarisiert | 190 Dateien inventarisiert |
| Edition / aktive Sprache | unbestätigt | unbestätigt |
| CONT-Leser/Writer | 6 Originaldateien byteidentisch geprüft | 7 Originaldateien byteidentisch geprüft |
| gezielte Kartenbyteänderung | nur geändertes Byte, Rest unverändert geprüft | ebenso |
| Save-Editor | Kandidatentabellen; keine pauschale Feldbestätigung | einzelne decompile-basierte Teilpfade und ältere Kandidaten koexistieren |
| Grafiken/Packer | vorhandener gemeinsamer Code, Spielabdeckung nicht auditiert | Import/Paletten/Sprites teilweise; keine vollständigen Writer |
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
Emulator installiert ist. Eine Originalausführung wurde in diesem Audit noch
nicht gestartet. ALIS-Referenz nennt CMake/SDL2; deren Build ist noch zu prüfen.

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
