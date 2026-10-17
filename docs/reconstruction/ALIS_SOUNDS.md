# Statische DOS-ALIS-Soundverzeichnisse

Stand 2026-10-17. Implementierung: `src/lib/ishar/original-alis-sounds.ts`.

Die Tabellenauflösung folgt der separaten ALIS-C-Referenz `alis.c:adresmus` und `script.c:script_init`. Das ist kein dekompilierter Silmarils-EXE-Quelltext und kein nativer Ausführungsnachweis. Geprüft sind die lokalen DOS-Profile aus der bestehenden Hashinventur; keine Plattformübertragung.

Im entpackten Modulimage steht bei +0x0E der Ressourcenwurzeloffset R. Bei R+0x10 steht die u16LE-Anzahl; bei R+0x0C der u32LE-relative Soundtabellenoffset. Eintrag i liegt bei T=R+relativ+4*i. Sein Ziel ist T+u32LE(T), ohne zusätzlichen Grafikheader-Versatz. Einträge und Aliase behalten ihre Reihenfolge. Ressourcenwurzel null oder Anzahl null ergeben ein leeres Verzeichnis. Alle gelesenen Bereiche werden geprüft; ungültige Offsets scheitern.

Jedes Ziel liefert zunächst nur ein Typbyte. Für Typ 1/2 lesen wir den vollständigen 16-Byte-Headerbereich: +1 Geschwindigkeit (u8), +2 deklarierte Länge (u32LE), +6 Packungsmarkierung (u8), +0x0C Schleifenfeld (u32LE). Die übrigen Bytes werden nicht interpretiert oder verändert. Diese Werte beschreiben den Dateizustand vor Importnormalisierung. Unbekannte Typen werden weder verworfen noch als Samples ausgegeben. Der Reader liefert Metadaten, keine auf Grundlage der deklarierten Länge zugeschnittenen Audiodaten.

Wichtig: Die Referenz expandiert unter bestimmten Bedingungen markierte Samples mit einer Differenztabelle und bearbeitet anschließend Typ-2-Länge/Schleifenbereich sowie Endmarkierungen. Deshalb ist ein direktes Kopieren des Dateibereichs als abspielbares PCM noch nicht gerechtfertigt. Der genaue Zusammenhang zu Modulhülle, Importmodus und nativer Engine muss weiter rekonstruiert werden. Kein Decoder, Mixer, WAV-Export oder Writer wird durch diesen Reader behauptet.

## Lokaler Audit

`node scripts/check-original-alis-sounds.mjs` prüft synthetische relative Adressen, Feldwerte, unbekannte Typen, Bereichsfehler und unveränderte Eingaben. Mit `ISHAR1_DIR` und `ISHAR2_DIR` liest es alle lokalen IO-Module und gleicht Anzahl und Zieladressen zusätzlich unmittelbar gegen die Rohfelder ab. Dieser direkte Feldvergleich ist kein unabhängiger Enginevergleich. Der Bericht enthält Modulnamen, Original-SHA256 und Eintragszahlen, keine Samplebytes.

Ergebnis: Ishar 1, 98 Module, 55 Einträge (Typ 1: 42, Typ 2: 10, Typ 4: 3). Unter Typ 1/2: 36 mit Packungsfeld 0, 16 mit Feld 1. Ishar 2, 142 Module, 149 Einträge (Typ 1: 94, Typ 2: 19, Typ 4: 9, Typ 6: 27). Unter Typ 1/2: 66 mit Feld 0, 47 mit Feld 1. Keine Tabellenfehler. Typ 4/6 sind hier nur Rohwerte, keine vollständig analysierten Musikformate.

Der lokale Bericht liegt außerhalb Git unter `../sound-directory-audit-2026-10-17.jsonl`. Originaldateien bleiben unverändert. Nächster Schritt: Packungs-/Importpfad und Datenlängen gegen native Ressourcen prüfen, erst danach Sampledecoder und Wiedergabe anbinden.
