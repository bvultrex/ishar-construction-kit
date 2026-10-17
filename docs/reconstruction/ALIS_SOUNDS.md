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

## Differenzexpansion vor Importnormalisierung (2026-10-17)

`reference-dos-sample-delta.ts` implementiert ausschließlich den Nibble-Expansionskern aus der separaten C-Referenz `script.c:script_init`. Die Differenztabelle lautet -34,-21,-13,-8,-5,-3,-2,-1,1,2,3,5,8,13,21,34. Das erste Byte ist der Startwert; nachfolgende Bytes liefern erst oberes, dann unteres Nibble. Jede Addition wird auf acht Bit beschränkt. Die Anzahl gelesener Bytes ist floor((deklarierte Länge-16)/2). Aus N Eingabebytes entstehen 2*N-1 Werte, danach schreibt die Referenz zwei Nullmarker. Der zurückgegebene Puffer enthält beide Marker und ist daher 2*N+1 Bytes lang. Er ist ausdrücklich kein fertiges PCM-/WAV-Ergebnis und keine Aussage über die endgültige Abspiellänge.

Der Referenzpfad wählt für PC die Expansion bei Sample-Headerbyte +6=1 und script->type!=0. script->type stammt aus alis.typepack, das beim Laden aus dem hohen Hüllbyte gelesen wird (`script_load`, Zuweisung magic>>24). Die lokalen Tests verwenden entsprechend das ursprüngliche Hüllbyte und vermischen es nicht mit dem Sample-Packungsfeld. Ein Decoder für beliebige Plattformen wird nicht behauptet.

`node scripts/check-reference-dos-sample-delta.mjs` prüft alle 65.536 Startwert/Folgebyte-Kombinationen gegen separat formulierte signed-Akkumulatorrechnung, Überlauf, beide Marker und ungültige Längen. Mit beiden Installationspfaden expandiert es 16 Ishar-1- und 47 Ishar-2-Einträge ohne Fehler oder Änderung des Modulimages. Die Eingabe reicht jeweils bis zum Imageende; dies belegt die Imagegrenzen, noch keine vollständige Trennung benachbarter Ressourcennutzlasten. Keine Gleichheit mit einem unabhängigen nativen Decoder behauptet.

Weiter offen: Typ-2-Marker und Memmove, Längen-/Schleifenfeldkorrekturen in invdigit, die Versionsabhängigkeit des letzten Nullbytes, Klangvergleich und Kanal-/Mixeranbindung. Die Implementierung bleibt deshalb als Referenzkern benannt und wird noch nicht automatisch im Playtest abgespielt.
