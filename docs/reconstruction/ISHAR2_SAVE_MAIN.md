# Ishar 2: belegte MAIN-Felder in Spielstandkopien schreiben

Stand 2026-10-17. DOS-Profil, keine pauschale Unterstützung anderer Versionen.

## Originalbelege

IO.IO SHA-256 `0df1f34cf2519341ef20825d49c7f1e7ff204878814db744f7e5cb58ce6b5918`.
`deriveIshar2SaveLayout` dekodiert unmittelbar aus diesem Modul die geradlinigen I/O-Folgen: Schreiber bei Image 0x00A9D–0x00DEB, Leser 0x00DF4–0x01142. Die Endadressen sind jeweils `cfclose`. 141 Felder ergeben 8359 Savebytes. Die Felder nach dem Header müssen in beiden Folgen vollständig übereinstimmen, sonst wird die Ableitung verworfen.

Der Header ist eine belegte Ausnahme: Schreiber liest MAIN-Byte 0x4EF7; Leser speichert den ersten BE16-Wert in IO-lokal 0x06F6. Er wird deshalb nicht als normales lesbares MAIN-Feld abgebildet. Das Werkzeug akzeptiert hier nur Saves mit Header 0x0002 und Länge 8359. Der lokale IMP2.SAV mit 5216 Bytes ist kein Ishar-2-Save dieses Layouts und wird abgewiesen.

Scalar-Opcode 0x74/0x75 liest/schreibt zwei Dateibytes in Big Endian, auch für Byteoperanden; 0x77/0x78 beschreibt Blöcke mit MAIN-Markierung null, Adresse und Länge. Die Blockbytes bleiben erhalten. Die API stellt gespeicherte Worte als normalisierte BE-Bytefolge bereit, passend zu `savedMainMemory`; das ist ausdrücklich keine Aussage über die rohen little-endian Bytes der DOS-VM im Arbeitsspeicher. Referenz: ALIS `cfreadv/cfwritev/cfreadb` und vorhandene Listing-basierte Loaderabbildung.

## Bibliothek und Schutz

`src/lib/ishar/ishar2-save-layout.ts` bietet Ableitung, Lesen und gezieltes Patchen. Nur per Save-I/O abgebildete MAIN-Adressen lassen sich schreiben. Fehlende/transiente Adressen, ungültige Werte, unbekannte IO-Profile und beschädigte Eingaben werden abgewiesen. Bytewerte akzeptieren -128 bis 255, Wortwerte -32768 bis 65535, jeweils als Bitmuster gespeichert. Mehrere Operationen werden geordnet in einer Kopie angewendet. Ein Fehler verändert die Quelle nicht.

Keine Änderung: sämtliche Savebytes einschließlich nichtkanonischer hoher Bytes von Byte-Scalarfeldern bleiben identisch. Bei tatsächlicher Änderung eines solchen Scalars wird dessen BE16-Slot mit der originalen Byte-Vorzeichenerweiterung geschrieben. Andere Slots, Blockbytes, Header und unbekannte Daten bleiben erhalten. Keine neuen Felder oder Speicheradressen werden hinzugefügt.

## CLI

```powershell
npm run save:main -- inspect 'E:\Spiele\Ishar2\IO.IO' 'E:\Spiele\Ishar2\START.SAV'
npm run save:main -- patch 'E:\Spiele\Ishar2\IO.IO' 'E:\Spiele\Ishar2\START.SAV' 'D:\Mods\writes.json' 'D:\Mods\new-copy.SAV'
```

`writes.json` ist ein **Toolkit-Austauschformat**, kein originales Ishar-Skript:

```json
[{"address": 10932, "width": 1, "value": 27}]
```

Dies ist MAIN 0x2AB4 als Beispiel für ein belegtes Bytefeld. Für NPC-Gold kann der Operations-Trace aus `originalNpcGoldTransfer` unverändert verwendet werden. Andere Traceeinträge wie Modulstarts sind keine Save-Schreiboperationen und werden nicht automatisch als solche behandelt.

CLI schützt die physisch aufgelösten Quellverzeichnisse von IO und SAV, schreibt nur neue Ausgaben mit exklusivem Anlegen und vergleicht deren SHA-256 beim Zurücklesen. Der Bericht enthält Quell-/Zielhash und geänderte Dateioffsets. Ausgaben dürfen weder in der Originalinstallation noch neben einem als Quelle geöffneten Save liegen; hierfür eine getrennte Mod-Ausgabe wählen. Bestehende Ausgaben werden nicht überschrieben. Native Saves/JSON-Traces werden nicht mit dem Repository verteilt.

## Reproduktion und Grenzen

```powershell
npm run test:ishar2-save-layout
$env:ISHAR2_DIR='E:\Spiele\Ishar2'
$env:ISHAR_ACTOR_LISTINGS='<lokaler Ishar-2-Listingordner>'
npm run test:ishar2-save-layout-local
npm run test:save-main-cli-local
```

21 lokale Saves: binär abgeleitete MAIN-Zuordnung stimmt vollständig mit dem bisherigen Listing-Loader überein. No-op für alle abgebildeten Bytes bleibt byteidentisch. 2940 gezielte Änderungen (ein Anfangsbyte pro MAIN-Feld/Save) erhalten alle anderen Dateibytes. Ein fremder Save wird abgewiesen. Synthetische Tests prüfen zusätzlich Vorzeichenerweiterung, BE-Worte, ungewöhnliche Scalar-Hochbytes, ungültige und nicht gespeicherte Adressen sowie Quellschutz.

Eine rekonstruierte NPC-Goldübergabe wurde per CLI als neue SAV-Datei exportiert und über das abgeleitete Layout gelesen. Überschreib- und Originalverzeichnisschutz sind geprüft. Die CLI-Testdateien bleiben im lokalen temporären Testordner. Originalinventur wird separat überprüft.

Nicht belegt: Laden dieser Änderung im Originalspiel und sichtbare erfolgreiche NPC-Interaktion. Die vollständige Bedeutung aller 141 Felder ist weiterhin unbekannt. Die Dateiabbildung darf nicht als vollständige Semantik, vollständiger Spielzustand oder vollständige Decompilierung ausgegeben werden. Vollständiger NPC-Eingabeablauf bleibt offen; die zunächst einfache Rohwert-UI ist unten beschrieben.

## Integrierter Editor im Character Lab

Unter „Original-Save: belegte MAIN-Felder“ zuerst das lokale IO.IO prüfen und einen Ishar-2-Save öffnen (Reihenfolge austauschbar). Der Quellhash und Profilstatus werden angezeigt. 140 gespeicherte MAIN-Bereiche stehen zur Wahl; der 141. I/O-Eintrag ist der getrennt erhaltene Header. Bereich und Byteindex wählen, den aktuellen Wert kontrollieren, einen neuen Wert 0–255 eingeben und ausdrücklich übernehmen. Wortfelder werden hier als zwei normalisierte BE-Bytes gezeigt, ohne ungeklärte Bedeutungen zu erfinden. Die Original-I/O-Adressen bleiben sichtbar.

Undo/Redo hält bis zu 32 Änderungen. „MAIN-SAV exportieren“ lädt eine neue SAV-Kopie herunter; „MAIN-Bericht exportieren“ enthält Quell-/Zielhash, IO-Profilhash und tatsächliche geänderte Dateibytes. Nicht übernommene Eingaben werden nicht exportiert. Der Zustand bleibt nur in der aktuellen Browseransicht; Neuladen verwirft die Arbeitskopie. Die Datei wird unabhängig von der älteren Kandidaten-Charakteransicht geladen und verändert deren Projektzustand nicht.

Browserprüfung am Produktionsbuild: Original IO.IO und START.SAV importiert, MAIN 0x2AB4 von 11 auf 28 geändert, Undo auf 11 und Redo auf 28 kontrolliert. Export unterscheidet sich ausschließlich an Saveoffset 3 (11→28); Bericht stimmt bytegenau überein. Bytewert 256 und Index außerhalb des gewählten Bereichs abgewiesen. Desktop und 390×844 visuell kontrolliert, kein horizontaler Überlauf und keine Konsolenfehler beobachtet. Lokale Belege liegen außerhalb des Repositorys. Keine Originalspielausführung und keine automatische NPC-Interaktion dadurch nachgewiesen.
