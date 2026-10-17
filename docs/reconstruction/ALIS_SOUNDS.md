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

`reference-dos-sample-delta.ts` implementiert ausschließlich den Nibble-Expansionskern aus der separaten C-Referenz `script.c:script_init`. Die Differenztabelle lautet -34,-21,-13,-8,-5,-3,-2,-1,1,2,3,5,8,13,21,34. Das erste Byte ist der Startwert; nachfolgende Bytes liefern erst oberes, dann unteres Nibble. Jede Addition wird auf acht Bit beschränkt. Die Anzahl gelesener Bytes ist floor((deklarierte Länge-16)/2). Aus N Eingabebytes entstehen 2*N-1 Werte. Der Zeiger smpptr2 bleibt am Beginn des letzten dekodierten Paars; die anschließenden zwei Nullmarker überschreiben dieses Paar. Der zurückgegebene Puffer ist daher 2*N-1 Bytes lang. Die erste Implementierung hatte diese Marker fälschlich angehängt; diese Aussage und der Decoder wurden nach erneutem Zeigervergleich korrigiert. Er ist ausdrücklich kein fertiges PCM-/WAV-Ergebnis und keine Aussage über die endgültige Abspiellänge.

Der Referenzpfad wählt für PC die Expansion bei Sample-Headerbyte +6=1 und script->type!=0. script->type stammt aus alis.typepack, das beim Laden aus dem hohen Hüllbyte gelesen wird (`script_load`, Zuweisung magic>>24). Die lokalen Tests verwenden entsprechend das ursprüngliche Hüllbyte und vermischen es nicht mit dem Sample-Packungsfeld. Ein Decoder für beliebige Plattformen wird nicht behauptet.

`node scripts/check-reference-dos-sample-delta.mjs` prüft alle 65.536 Startwert/Folgebyte-Kombinationen gegen separat formulierte signed-Akkumulatorrechnung, Überlauf, beide Marker und ungültige Längen. Mit beiden Installationspfaden expandiert es 16 Ishar-1- und 47 Ishar-2-Einträge ohne Fehler oder Änderung des Modulimages. Die Eingabe reicht jeweils bis zum Imageende; dies belegt die Imagegrenzen, noch keine vollständige Trennung benachbarter Ressourcennutzlasten. Keine Gleichheit mit einem unabhängigen nativen Decoder behauptet.

Weiter offen: Typ-2-Marker und Memmove, Längen-/Schleifenfeldkorrekturen in invdigit, die Versionsabhängigkeit des letzten Nullbytes, Klangvergleich und Kanal-/Mixeranbindung. Die Implementierung bleibt deshalb als Referenzkern benannt und wird noch nicht automatisch im Playtest abgespielt.

## PC-invdigit als getrennte Nachbearbeitung

`reference-dos-sample-normalize.ts` rekonstruiert ausschließlich den PC-Pfad von invdigit auf einem bereits vorbereiteten Samplepuffer. Komprimierte Samples benötigen zuvor Deltaexpansion und die acht Byte umfassenden Typ-2-Markerwrites aus script_init; diese Zusammensetzung ist noch nicht enthalten. Version wird ausdrücklich übergeben, nicht aus dem Spielnamen geraten.

Typ 2: Bei nichtnull Schleifenfeld L wird die Verschiebelänge signed16(total-L-33) gebildet. Nur bei nichtnegativem Ergebnis werden genau diese Bytes von 16+L+8 nach 16+L verschoben (überlappungssicher). Danach wird L um 16 vermindert (u32), unabhängig davon, ob verschoben wurde. Die deklarierte Länge wird bei Typ 2 ebenfalls um 16 vermindert. Abspiellänge ist anschließend deklarierte Länge minus 16. Ab Referenzversion 20 wird das letzte Samplebyte null. Auf PC erfolgt hier keine Atari-/Mac-Vorzeichenkonvertierung. Bereichsfehler und leere Markerziele werden als Toolkit-Grenzen abgewiesen statt native Speicherfehler nachzubilden. Originalpuffer bleiben unverändert.

Test: `node scripts/check-reference-dos-sample-normalize.mjs`; synthetisch überlappende Verschiebung, Nullschleife, Typ 1/2, Versionsschwelle, Restbytes und Isolation. Mit beiden Installationspfaden: 35 direkt normalisierbare Einträge in Ishar 1 und 65 in Ishar 2; je ein explizit erwarteter Fehler bei BLANCPC.IO. Die Datei ist in beiden Installationen identisch (SHA256 fa35da163339385cc8fb95b5469bc5fb52e8d31a803f84854da5c89d7196c229). Imagegröße 2094, Sampleoffset 48, Typ 1, Geschwindigkeit 10, Länge u32LE 4261871616. Diese Angabe passt nicht in das Image. Sonderkodierung oder ungenutzter Platzhalter sind noch ungeklärt; keine Ersatzlänge und keine Audiowiedergabe dafür. Tests binden den bekannten Fehler an den Dateihash; zusätzliche Fehler bleiben Testfehler. Andere Ressourcengrenzen innerhalb des Images bleiben weiter zu prüfen. Keine native Klanggleichheit behauptet.

## Zusammengesetzter PC-Sampleimport

`reference-dos-sample-import.ts` verbindet jetzt den Delta-Kern mit invdigit. Es kopiert den vom Aufrufer begrenzten Ressourcenpuffer. Nur bei Headerbyte +6=1 und nichtnull Original-Modulpackbyte wird expandiert, anschließend die deklarierte Länge um zwei vermindert. Für komprimierten Typ 2 werden vor invdigit acht 0xFF-Bytes bei 16+Schleifenfeld (falls nichtnull) und weitere acht bei adjustedLength-8 mit Schleife bzw. adjustedLength-16 ohne Schleife geschrieben. Alle Schreibbereiche sind geprüft. Danach folgt die getrennt geprüfte PC-Normalisierung. Der Pufferrest bleibt erhalten; es wird keine vollständige Modulinitialisierung oder aliasabhängige Mehrfachkonvertierung simuliert.

`node scripts/check-reference-dos-sample-import.mjs` prüft synthetisch Packbyte-Gate, Markerwrites, Längen-/Schleifenänderungen und Quellschutz. Mit beiden Installationspfaden verarbeitet es sämtliche Typ-1/2-Einträge: 51 erfolgreich in Ishar 1 und 112 in Ishar 2, jeweils ausschließlich die hashgebundene bekannte BLANCPC.IO-Anomalie abgewiesen. Diese Integrationsprüfung benutzt als Eingabe den Bereich ab Sampleoffset bis Imageende; vollständige Ressourcengrenzen und überlappende Ressourcen sind noch nicht bewiesen. Version 20 ist ein expliziter Testparameter, keine neu nachgewiesene Versionsidentifikation beider Originalprogramme. Keine native Audioausführung oder Klanggleichheit. Nächster Schritt: Ressourcenabgrenzung, Audiokanal-/Frequenzsemantik und kontrollierte Vorschau.

## Referenzbasierte Sample-Kanalauswahl

`reference-sample-channel.ts` bildet den reinen Auswahl-/Frequenzteil von `audio/audio.c:playsample` der separaten ALIS-C-Implementierung ab. Es erzeugt keinen Klang und verändert keine Kanäle. Drei oder vier vorgegebene signed8-Prioritäten, ein rohes Prioritätsbyte, ein Geschwindigkeitsbyte und explizites CHAR_MAX (127 oder 255) sind Eingaben. Diese expliziten Parameter vermeiden eine unbewiesene Übertragung der Host-char-Signedness bzw. der modernen FLI-Kanalreservierung auf Ishar-DOS. Die Referenz begrenzt bei laufendem FLI-Film auf drei Kanäle; das ist hier keine nachgewiesene Ishar-Regel.

Erster Kanal mit gleicher signed8-Priorität gewinnt. Fehlt er, gewinnt der erste strikt kleinste Prioritätswert unter CHAR_MAX. Nichtnegative neue Priorität wird vor einem negativen Nicht-Leerwert geschützt abgewiesen; Leerwert ist -128. Niedrigere neue Priorität wird ebenfalls abgewiesen. Gleiche Minimalwerte behalten die erste Position. speed wird signed8 interpretiert; nur 1..20 gilt, sonst 10. Frequenz ist danach speed*1000. Das ist eine Referenzimplementierungsregel, keine bereits belegte Sound-Blaster-/DOS-Abtastrate. Ressourcenheadergeschwindigkeit bei Operand null wird noch vom Ressourcenadapter aufzulösen sein.

`node scripts/check-reference-sample-channel.mjs` prüft alle 256 Geschwindigkeitsbytes, signed Prioritäten, Gleichprioritätsersatz vor Freikanalwahl, drei-/vierkanalige Grenzen und alle 256 Prioritätsbytes in fünf Kanalzuständen für beide CHAR_MAX-Werte gegen eine separat sortierbasierte Erwartung. Typprüfung bestanden. Offen sind tatsächliche Kanalzustände, Stop-/Endeabläufe, Loopsemantik, Mixer und nativer Vergleich. Die Funktion wird noch nicht automatisch als vollständiges Audio-Subsystem im Playtest verwendet.

## Wiederholungsgrenze im Referenzcallback

`reference-sample-boundary.ts` rekonstruiert ausschließlich den Sample-Endzweig von `sys/sys.c` (Samplecallback, ohne FLI-Queue). Die Referenz stoppt nicht bereits bei Index==length, sondern erst bei Index>=length+1. Bei gespeichertem loop>1 wird loop vermindert und Index/played/accumulator werden auf null gesetzt; Overshoot wird verworfen. Andernfalls setzt sie type=None und curson=-128. Die Funktion liefert diese Zustandsänderungen, keinen Ton. Die Länge 0xFFFFFFFF wird wegen des gesondert ungeklärten Wrap-Grenzfalls kontrolliert abgewiesen.

Wichtige Breitenkorrektur: playsample nimmt loop als u16 entgegen, aber `channel.h:sChannel.loop` ist u8. Der spätere Kanaladapter muss deshalb auf das niedrige Byte beschränken. Der Befehlsadapter darf weiterhin die ursprünglichen u16 melden. Der Grenzhelfer erwartet ausdrücklich bereits gespeicherte u8. Test `node scripts/check-reference-sample-boundary.mjs` prüft alle 256 gespeicherten Zählerwerte, length/length+1, Overshoot und drei Durchläufe mit zwei Neustarts. Typprüfung bestanden.

Dies ist Verhalten des separaten Host-/SDL-Referenzcallbacks, kein nachgewiesener DOS-DMA-/Interruptablauf. Der Callback enthält zusätzlich Interpolationsvarianten und FLI-Erweiterungen. Seine length+1-Regel kann einen Zugriff jenseits des zugeschnittenen Samples erlauben; dafür wird weder stillschweigend Padding erfunden noch unsicherer Zugriff aktiviert. Vor einem Mixer sind vollständige Puffergrenzen, Resampling, versionsabhängige Pfade und native Klang-/Timingprüfung erforderlich.

## Soundauftrag auf importierter Ressource

`reference-sample-play.ts` verbindet den vorbereiteten Typ-1/2-Ressourcenheader mit der Kanalauswahl. Bei Geschwindigkeitsoperand null wird das Headerbyte +1 verwendet; erst anschließend greift playsamples signed8-Prüfung/10-kHz-Fallback. Länge ist importiertes u32LE(+2)-16 und wird gegen den übergebenen Puffer geprüft. Typen außer 1/2 erzeugen wie im Referenz-sound keine Wiedergabe. Erfolgreicher Plan enthält unabhängige Samplekopie, Kanal, signed Priorität, Frequenz, Lautstärke, played=0 und loops&255 entsprechend sChannel.loop. Abgewiesene Priorität ist ein eigenes Ergebnis. Eingaben bleiben unverändert.

Die Auswahl des lokalen/MAIN-Moduls bleibt ausdrücklich beim Aufrufer: Die Referenz kombiniert in sound den von flagmain abhängigen adresmus-Pfad mit einem späteren aktuellen script->data_org-Zugriff. Diese Adressbasis muss vor vollständiger cmsound-Integration geklärt werden; hier wird keine vermutete Korrektur als Originalverhalten verkauft. Auch Stopaufträge, persistente Kanäle und Pufferzugriff am length+1-Ende bleiben getrennt.

`node scripts/check-reference-sample-play.mjs` prüft synthetisch Header-Fallback, Geschwindigkeitsbereich, Prioritätsablehnung, u16-zu-u8-Schleifenbegrenzung, fremde Typen, Längenfehler und Kopierisolation. Mit ISHAR2_DIR wird TROUBA3s Originalressource 0 durch den zusammengesetzten Import und diesen Plan geführt: 8988 Samplebytes, Referenzfrequenz 10000 Hz bei Befehlswerten Priorität 90, Lautstärke 127, Wiederholung 1, Geschwindigkeit 10. Dies verbindet Ressourcen und Befehlsparameter, ist aber weiterhin kein Mixer-/DOS-Klangnachweis. Typprüfung bestanden.

## Original-Aufrufstellen und MAIN-Adressierungsrisiko

`node scripts/audit-original-sound-calls.mjs` benötigt beide Installations- und Listingpfade (ISHAR1_DIR, ISHAR2_DIR, ISHAR1_LISTINGS, ISHAR_ACTOR_LISTINGS). Es inventarisiert sämtliche IO-Dateien, meldet fehlende Listings und bindet jede gefundene Sound-/Stopstelle an Modul-SHA256, Offset und den vollständigen angezeigten Listing-Bytepräfix. Opcodebytes werden zusätzlich direkt geprüft. Operanden hinter gekürzten Präfixen sind damit nicht vollständig byteverifiziert; nicht disassemblierte Codebereiche werden nicht erfasst. Kein Rohbytescan, der zufällige Operanden als Befehle zählt, und kein vollständiger Kontrollfluss-/Ausführungsnachweis.

Lokaler Lauf 2026-10-17: Ishar 1 98 Module/98 Listings, csound 72, cmsound 0, cdelsound 14; Ishar 2 142/142, csound 124, cmsound 0, cdelsound 18. Keine fehlenden Listingdateien, alle gefundenen Präfixe stimmen überein. MAIN-Soundverzeichnisse sind jeweils leer. Der lokale JSONL-Bericht mit Aufrufstellen liegt außerhalb Git: ../sound-calls-audit-2026-10-17.jsonl. Die Listings selbst bleiben unvollständige statische Analyse, insbesondere der bekannte Ishar-1-FRISE-Disassemblyabbruch wird durch eine vorhandene Datei nicht behoben.

Folgerung: Die gemischte MAIN/aktuelle-Skript-Adressierung von cmsound in der separaten C-Referenz ist weiterhin ungeklärt, aber aktuell ist kein betroffener Original-Aufruf nachgewiesen. Weitere lokale Sampleintegration kann unabhängig fortgesetzt werden. Nicht daraus ableiten, dass cmsound prinzipiell unbenutzt oder die komplette Engineaudioanalyse abgeschlossen sei. Neue Inhalte mit cmsound bleiben bis zur Klärung ausdrücklich unbestätigt.

## Verlustfreier Sample-Geschwindigkeitswriter

`original-alis-sounds.ts:editAlisSampleSpeed` ändert ausschließlich Byte +1 eines ausgewählten Typ-1/2-Headers. Werte 0..255 bleiben rohe Dateibytes; insbesondere wird nicht behauptet, jeder Wert ergebe eine eigene Frequenz. Die Laufzeit verwendet dieses Feld nur bei Geschwindigkeitsoperand null. Gemeinsame Ressourcenziele werden als affectedIndices gemeldet; es wird keine künstliche Kopie eines Alias erzeugt. Keine Änderung von Nutzlast, Längen, Packungsfeld oder unbekannten Bytes. Auch der ungeklärte BLANCPC-Header kann auf Byteebene bearbeitet werden, ohne dadurch abspielbar zu werden.

Der Test `node scripts/check-original-sample-speed.mjs` prüft Aliasbericht, ungültige Eingaben und Buffer-Kopierisolation. Mit beiden Installationspfaden werden 52 Header in 25 Ishar-1-Modulen und 113 in 51 Ishar-2-Modulen jeweils um genau ein Imagebyte verändert, mit dem bestehenden Hüllen-/A1-Writer geschrieben und eingelesen. Nach Rücksetzen entsteht über das ursprüngliche Modulobjekt wieder exakt die ursprüngliche Datei. Originaldateien werden nicht geschrieben. Native Modausführung ist noch nicht geprüft; GUI/CLI-Anbindung folgt separat.

Dabei wurde ein Node-Buffer-Aliasproblem korrigiert: Buffer.slice teilt Speicher. Der Modulreader kopiert nun rohe Images und Originalhüllen explizit als Uint8Array; Sampleeditor sowie Import-/Normalisierungsfunktionen kopieren ebenfalls unabhängig vom Eingabetyp. Bestehende Modul- und A1-Tests sowie Typprüfung bestehen. Dies ist ein Quellschutzfix, keine Änderung des Dateiformats.

## Kommandozeilen-Anbindung

Das bestehende Werkzeug unterstützt jetzt zusätzlich:

```powershell
node scripts/alis-module.mjs sounds <Original.IO>
node scripts/alis-module.mjs sample-speed <Original.IO> <Index> <Rohwert-0-bis-255> <neue-Ausgabe.IO>
```

`sounds` zeigt alle Tabellenplätze einschließlich unbekannter Typen und der belegten Headerfelder als JSON, zusammen mit Quell-/Imagehash und Hüllenmetadaten. `sample-speed` schreibt eine neue Datei über den bestehenden Hüllen-/A1-Writer. Index und Wert müssen dezimale Ganzzahlen sein. Der Bericht nennt geänderten Imageoffset und alle betroffenen Aliasindizes. Quellordner als Ausgabeziel und Überschreiben bestehender Dateien bleiben verboten. Die neue Datei wird vollständig eingelesen und per Hash verglichen; der Writer prüft bereits vor Ausgabe den dekodierten Inhalt. Status nennt ausdrücklich, dass Originalausführung noch nicht geprüft ist.

`npm run test:alis-cli` deckt die neuen Befehle mit einer gepackten synthetischen Ressource ab: angezeigtes Headerfeld, genau ein geändertes Imagebyte nach Export/Readback, Quellschutz, vorhandenes Ziel, Quellordnerziel und ungültige Werte ohne Ausgabedatei. Alle bisherigen CLI-Prüfungen sowie Typprüfung bestehen. Dies ist eine CLI-Erweiterung; die grafische Toolkit-Anbindung und native Modprüfung bleiben offen.
