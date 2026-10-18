# DOS-A1-Writer: Datenformat, Nachweise und Grenzen

Stand: 2026-10-17. `src/lib/ishar/silm-write.ts` ist ein eigener Encoder für das
rekonstruierte Originalformat, NICHT die Wiederherstellung des originalen
Kompressionsprogramms. Die resultierenden komprimierten Bytes müssen nicht mit
denen des Originalpackers übereinstimmen. Die vollständig entpackten Images
werden verglichen; ein Originalspiel-Test der neuen Streams ist noch offen.

## Formatbelege

Grundlage: bestehender bounded Decoder `silm-pack.ts`, lokaler separater
Python-Decoder `alis_unpack.py` und ALIS-Referenz `src/unpack.c`, Funktionen
`decode`, `unpack_new` und `unpack_script`. Referenzdecoder-Profil siehe
ALIS_MODULES.md. Diese Quellen teilen Formatwissen und sind kein Ersatz für
Originalausführungsnachweise.

Bitreihenfolge MSB-first. Ein Tokenblock beginnt mit einem Literalflag. Bei 1:
Zähler aus 2-Bit-Werten aufsummieren (3 setzt fort), plus 1 Literalbytes. Danach,
sofern die deklarierte Imagegröße nicht erreicht ist, folgt eine Rückreferenz:
3-Bit-Selektor, Distanzminus1 mit der Breite aus dem 8-Byte-Dictionary und Länge.
Selektor 1/2/3 schreibt 2/3/4 Bytes; Selektor 0 verwendet einen Zähler aus
3-Bit-Werten (7 setzt fort), plus 5. Rückreferenzen dürfen überlappen.

Der neue Encoder verwendet deterministisch die jüngste passende Zweierfolge,
ein 32768-Byte-Fenster und höchstens 1024 Bytes pro Kopie. Alle Dictionarybreiten
sind 15; nur Selektoren 0..3 werden erzeugt. Diese Suchstrategie ist eine
Editor-Implementierung, keine behauptete Originalheuristik. Umschlag, MAIN-
VM-Spezifikationen und Packmodus bleiben erhalten; Länge bleibt im 24-Bit-Feld.

## Datenerhalt

- Unveränderte Module: vollständiger Originalstream byteidentisch, kein Repack.
- Geänderte Module: entpacktes Image erhält exakt die gewünschten Änderungen.
  `writeAlisModule` erlaubt aktuell keine Vergrößerung und prüft den Header.
- Unbekannte Imagebytes und unveränderte Header-/VM-Spezifikationsbytes bleiben
  erhalten. Vollständige Bytes hinter dem verbrauchten komprimierten Stream
  werden als undurchsichtiger Trailer kopiert. Dessen Dateioffset verschiebt
  sich bei anderer Kompressionslänge. Unverbrauchte Füllbits des letzten
  Streambytes werden nicht als eigenständige Ressourcendaten interpretiert.
- Erzeugte Streams werden durch den TypeScript-Leser vollständig zurückgelesen.
- Originalinstallationen werden von den Exportwerkzeugen nicht beschrieben.

## Grenzen

Diese Encoderstrategie braucht spätestens nach 65536 Literalbytes eine
repräsentierbare Rückreferenz oder das Imageende. Ein absichtlich erzeugtes
De-Bruijn-Gegenbeispiel ohne passende Folge im Fenster wird ausdrücklich
abgewiesen. Das ist eine Grenze dieses Encoders, keine behauptete Grenze aller
möglichen A1-Encoder. Keine stille Ausgabe in einem anderen Packformat.

Alle 238 gepackten lokalen Originalmodule und beide raw-Module bestehen den
Änderungstest. Unbekannte Plattformen, Packmodi, Original-Lader-/Speichergrenzen,
beliebige Vergrößerungen und neue Ressourcenreferenzen bleiben ungeprüft.
Ein gültiger Bitstream bestätigt weder gültige Spiellogik nach einer Byteänderung
noch passende Referenzen oder Originalkompatibilität der konkreten Änderung.

## Nachweise

- Synthetisch: Literale, kurze/lange Kopien, Überlappung, Zufallsdaten, MAIN-
  VM-Spezifikationen, deterministische Ausgabe, Größen-/Modusfehler.
- Grenzen: 65536 Literale sowie maximale emittierte Distanz 32768; expliziter
  Fehler statt Beschädigung beim De-Bruijn-Gegenbeispiel.
- Externer Python-Decoder bestätigt auch den 65536-Literal-Test separat.
- Für jedes der 240 lokalen IO-Module wurde ein Bit des letzten Imagebytes
  geändert, neu geschrieben und mit beiden Decodern identisch zurückgelesen.
  Dies ist ein Codec-Test, KEIN spielerisch sinnvoller Mod.
- No-op-Ausgabe aller Module bleibt byteidentisch. Quelldateien unverändert.
- Private Änderungsdateien und Hashberichte:
  `../analysis-output/a1-writer-2026-10-17-tail-preserved/`.

## Werkzeuge

```powershell
npm run test:a1-writer
npm run test:alis-module
npm run test:alis-cli
$env:ISHAR1_DIR='E:/Spiele/Ishar1'
$env:ISHAR2_DIR='E:/Spiele/Ishar2'
npm run test:a1-writer-local -- ../analysis-output/new-a1-writer-check
python scripts/compare-alis-reference.py ../grok-handoff-research-2026-10-11/decompile/alis ../analysis-output/new-a1-writer-check ../analysis-output/new-a1-writer-check/ishar1 ../analysis-output/new-a1-writer-check/ishar2
```

Der Referenzdecoder muss separat lokal vorhanden sein. Python-Interpreter wie
in STATUS.md auswählen. Ausgaben verwenden einen neuen Ordner außerhalb der
Originalinstallationen; Testmodule gehören nicht ins öffentliche Repository.

Inspect/Extract/Replace ohne GUI:

```powershell
npm run alis:module -- inspect E:/Spiele/Ishar1/MAIN.IO
npm run alis:module -- extract E:/Spiele/Ishar1/MAIN.IO ../mods/main-image.bin
npm run alis:module -- replace-image E:/Spiele/Ishar1/MAIN.IO ../mods/edited-main-image.bin ../mods/MAIN.IO
```

Der dritte Befehl erwartet ein gleichlanges bearbeitetes Image und schreibt in
eine neue Datei außerhalb des Originalordners. Bestehende Dateien werden nicht
überschrieben. Quelle und Ziel werden kanonisch aufgelöst; ein Dateilink darf
Quellschutz nicht umgehen. Ausgabe erhält einen Hash-/Readback-Bericht auf stdout
mit `decoded-readback-only`; Originalausführung wird nicht behauptet.

Nächster Schritt: gezielte und semantisch belegte Originaländerung über einen
Editor erzeugen, nachweislich in einer Original-Spielkopie ausführen und die
Lader-/Speichergrenzen am Original prüfen. Noch kein vollständiger Sprite-,
Skript- oder Neue-Inhalte-Editor durch diesen Codec allein.
