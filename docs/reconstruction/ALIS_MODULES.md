# DOS-ALIS-Module und Ishar-1-Speicherlayout

Stand: 2026-10-17. Dieses Dokument beschreibt Dateizugriff und ausgewählte
rekonstruierte I/O-Strukturen, keine vollständige Decompilierung der Spiele.

## Profile und Herkunft

Lokale Dateien aus den in INVENTORY.md identifizierten Installationen. Keine
Übertragung auf Atari-/Amiga-Dateien. Die aktive Edition bleibt durch Hashes
identifiziert, keine unbelegte Marketing-/Patchversionsnummer.

| Spiel | IO-Module | DOS A1 | Ungepackt | No-op-Roundtrips |
|---|---:|---:|---:|---:|
| Ishar 1 | 98 | 97 | 1 (BLANCPC.IO) | 98 |
| Ishar 2 | 142 | 141 | 1 (BLANCPC.IO) | 142 |

Alle 240 entpackten Images stimmen byteweise per SHA-256 mit dem lokal vorhandenen
Python-Decoder `alis_unpack.py` überein. Referenzdatei-SHA256:
`ec6ebde0cdbd1dc3a7442a2462b16a652ec436a63d583a3758a1206a34f633e6`.
Beide Decoder stammen aus derselben Formatkenntnis; Übereinstimmung zweier
Implementierungen ist kein unabhängiger Original-Ausführungsnachweis.

Metadatenberichte bleiben lokal unter `../analysis-output/alis-2026-10-17/`.
Sie enthalten Quell-/Imagehashes, Größen und Headerwerte, keine Images.
Die eigene Implementierung steht in `src/lib/ishar/alis-module.ts`.
Vorhandene A1-Dekompression aus `silm-pack.ts` wird weiterverwendet.

## Container und Header

DOS: Little-Endian-U32 bei Dateioffset 0: untere 24 Bit sind die deklarierte
entpackte Gesamtlänge, oberes Byte ist der Packmodus. U16 bei 4 bestimmt das
Hauptmodul (null). Danach folgen bei MAIN zusätzlich 16 VM-Spezifikationsbytes.
Das Image beginnt nach dem 6- oder 22-Byte-Umschlag, im A1-Fall nach Dekompression.

| Imageoffset | Größe | Feld / Interpretation |
|---:|---:|---|
| 0 | 2 | Modul-ID |
| 2 | 2 | DOS Code-Location, Einstieg = Wert + 2 |
| 4 | 2 | unbekannte Headerbytes, erhalten |
| 6 | 4 | Rücksprungeinstieg = Wert + 6, null wenn Wert null |
| 10 | 4 | Scan-/Interrupt-Einstieg = Wert + 10, null wenn Wert null |
| 14 | 4 | Ressourcenbereich-Offset im Image |
| 18 | 2 | weiteres unbekanntes Headerfeld, erhalten |
| 20 | 2 | VRAM-/Kontextgröße |
| 22 | 2 | weiteres Headerwort, erhalten |

Adressangaben sind Imageoffsets, keine gepackten Dateioffsets. Beleg:
vorhandene ALIS-Referenz `src/script.c`, `script_load` und `script_init`, sowie
Strukturprüfungen aller lokalen Module. Das neue API akzeptiert explizit nur
DOS-A1 und DOS-raw (Packbyte 0/1). Andere Modi werden abgewiesen.

Grenzen: Header/Entry-Plausibilität beweist nicht, dass alle Opcodepfade oder
Ressourcenreferenzen gültig sind. Ein vollständiger Validator fehlt noch.

## Schreiben und Erhalt unbekannter Daten

`writeAlisModule` gibt unveränderte Dateien einschließlich gepacktem Stream,
Umschlag und VM-Spezifikationen byteidentisch zurück. Für ungepackte Module sind
gleichlange Imageänderungen möglich; übrige Bytes bleiben erhalten.

Geänderte gepackte Images werden ausdrücklich abgewiesen: Ein verifizierter
A1-Writer fehlt. Es erfolgt keine heimliche Umwandlung in einen anderen Packmodus.
Vergrößerungen und neue Modul-IDs/-Referenzen sind ebenfalls noch keine
fertige Content-Pipeline. Unveränderte Roundtrips sind daher kein Beleg für einen
vollständigen Grafik-/Scripteditor.

## Ishar 1: direkt aus dem Original abgeleitetes SAV-Layout

Profilanker MAIN.IO SHA-256:
`27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b`.
Entpacktes Image SHA-256:
`318578ec8e812179689b968d3e11b12a79668df45fec1b6b20952629a43429ab`.

`ishar1-save-layout.ts` dekodiert die tatsächlichen I/O-Opcodebytes dieses
MAIN-Images. Andere Hashes werden abgewiesen. Es wird keine aus Ishar 2
übernommene Feldtabelle verwendet:

- Schreibsequenz 0x04816 bis 0x04a1c (cfclose).
- Lesesequenz 0x04a43 bis 0x04c49 (cfclose).
- 107 identische Zielfeld-/Blockzuordnungen, zusammen 5216 gespeicherte Bytes.
- cfwritev/cfreadv: gespeichertes 16-Bit-Big-Endian-Wort, auch bei einem Byteziel.
  Referenz: `alis-reference/src/opcodes.c` 0x74/0x75.
- Blockfelder bleiben absichtlich undurchsichtige Bytefolgen. Interne Endianness,
  Arrays und Spielbedeutung sind damit noch nicht vollständig geklärt.
- Erste fünf Speicherziele: 0x421f, 0x137c, 0x137d, 0x137e, 0x1508, jeweils als
  gespeicherte BE16-Werte. Ihre vollständige semantische Benennung bleibt offen.

Alle acht lokalen Ishar-1-Saves wurden anhand dieser Aufteilung gelesen und im
Test byteidentisch rekonstruiert. Das belegt die Speicherstruktur, nicht die
Richtigkeit älterer DEBUG-Cheat-Feldnamen im Character Lab. Dessen Kandidaten
werden deshalb nicht stillschweigend als bestätigt hochgestuft.

## Disassemblierung und offene Analyse

Die vorhandenen Python-Werkzeuge wurden auf alle 98 Ishar-1-Module angewendet.
Ergebnis: 33187 erreichte Instruktionen, ein begrenzter Decode-Abbruch in FRISE.IO
bei Imageoffset 0x3fec (`eval runaway`). Listings liegen lokal in
`../analysis-output/alis-2026-10-17/ishar1-listings/` und bleiben außerhalb Git.
Dies sind automatisch erzeugte Listings, keine fertige lesbare Rekonstruktion.

Nächste Aufgaben: Speicherfelder aus ihren Original-Verwendungen semantisch
zuordnen; sichere Editoren daran binden; A1-Writer entwickeln und mit externem
Decoder sowie Originalausführung prüfen; unbekannte FRISE-Daten/Codegrenze
aufklären. Dafür keine Ersatzregeln erfinden.

## Reproduktion

```powershell
$env:ISHAR1_DIR='E:/Spiele/Ishar1'
$env:ISHAR2_DIR='E:/Spiele/Ishar2'
npm run audit:alis -- ../analysis-output/new-alis-audit
npm run test:alis-module
npm run test:ishar1-save-layout
python scripts/compare-alis-reference.py ../grok-handoff-research-2026-10-11/decompile/alis ../analysis-output/new-alis-audit E:/Spiele/Ishar1 E:/Spiele/Ishar2
```

Für Python den tatsächlich verfügbaren Interpreter verwenden (siehe STATUS.md).
Der externe Referenzdecoder wird nicht mitgeliefert und muss lokal vorhanden
sein. Auditberichte verwenden neue, getrennte Ausgabeordner; Originaldateien
werden weder geändert noch extrahiert ins Repo kopiert.
