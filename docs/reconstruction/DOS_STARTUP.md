# DOS-Startprogramme: erste native Speicheraufnahme

Stand 2026-10-17. Originalinstallationen nur gelesen. Die vorhandene ALIS-C-Referenz wird hier nicht zur Ausführung verwendet: Unicorn 2.1.4 führt die lokal bereitgestellten x86-Originalbytes in emuliertem RAM aus.

| Profil | start.exe Bytes | SHA256 |
|---|---:|---|
| Ishar 1 | 43265 | 3ea63234c97b77d88e3c18aa5d88ac10dede1f10daf2854225b88b7d948d588b |
| Ishar 2 | 43462 | 5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9 |

Beide Dateien sind MZ mit 32 Headerbytes, einem Relokationseintrag und initial CS:IP relativ zum Lademodul 0000:0003. Der sichtbare Startcode kopiert mit REP MOVSW abschnittsweise in höhere Segmente, verändert Segmentwerte und übergibt per Far-Jump. Dies ist eine vorgeschaltete Kopier-/Entpackschicht; der genaue Packer wird bislang nicht benannt. Eine lineare Disassemblierung der Datei ab MZ-Einstieg würde deshalb nicht einfach den fertigen Enginecode liefern.

## Reproduktion und Grenzen

`python scripts/capture-dos-first-interrupt.py <Original-start.exe> <neuer-Analyseordner>` benötigt unicorn==2.1.4, lokal unter ../analysis-tools/python installiert. Der Prüfer akzeptiert ausschließlich die beiden bekannten Hashes, prüft MZ-Dateigröße und Relokationstabelle, lädt bei Segment 1000 und wendet die Relokation an. PSP liegt bei 0FF0; nur das Endsegmentwort 9000 ist ausdrücklich gesetzt. Dies ist ein kontrollierter, unvollständiger PSP, keine Behauptung einer vollständigen DOS-Ladeumgebung.

Alle Speicherzugriffe bleiben in emuliertem 1-MiB-RAM. Interrupts und OUT werden abgefangen und beenden den Lauf ohne Host-I/O oder erfundene DOS-Rückgabewerte. Budget: zwei Millionen Instruktionen bzw. fünf Sekunden. Ein Budgetende ohne Ereignis gilt als Fehler. Ausgabe nur in einen neuen Ordner außerhalb der Quellinstallation; Original wird anschließend erneut verglichen. memory.bin ist originalabgeleitet und bleibt außerhalb veröffentlichter Projektartefakte. Dies ist kein exportiertes, lauffähiges entpacktes EXE.

## Beobachtete erste Stopps

Beide Profile erreichen INT 21h. Ishar 1: CS:IP 23D7:1A38 (IP nach INT), AX=3800, DS=23D7, ES=0FF0, SS:SP=1C0B:07E4. Ishar 2: 23D7:1C40, AX=19D7, DS=23D7, ES=0FF0, SS:SP=1C0B:07D4. Bedeutung der DOS-Funktionen wird vor Fortsetzung gesondert geprüft; bislang wurden keine Antworten simuliert.

1-MiB-Aufnahmehashes: Ishar 1 5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7, Ishar 2 f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04. Lokale Ordner: ../analysis-output/dos-first-interrupt-ishar1-2026-10-17 und dos-first-interrupt-ishar2-2026-10-17. Kein nativer Hardwarelauf oder vollständiger Bootnachweis.

Nächste Schritte: Speicherzustand und Kontrollfluss um diese Stopps analysieren, tatsächlichen Übergang zum Enginecode verifizieren, DOS-/PSP-Abhängigkeiten erfassen und den BLANCPC-Lade-/Installationspfad darin verfolgen. Den Speicherzustand nicht ohne Relokations-/Segmentnachweis als positionsunabhängigen Code behandeln.

## BLANCPC-Lader im ursprünglichen DOS-Code gefunden

In beiden Speicheraufnahmen liegt bei physisch 106A7 (CS=1000, Offset 06A7) der Name blancpc.io. Die Routine 1000:06B2..072C referenziert ihn direkt, ruft drei Helfer bei 1F97/212D/20B5 auf, verlangt dabei CX=09C4 und berechnet aus SS:[0E1C] einen Zeiger mit Offset +36h. Die Helfer sind anhand des Kontexts Kandidaten für Öffnen/Lesen/Schließen; ihre vollständige Semantik und Short-Read-Behandlung bleiben noch zu prüfen. Der Routineblock ist in beiden Spielen bytegleich: 123 Bytes, SHA256 d031882b006baf6b472f7ad030b92ff9651f73c6ba0155e4db34e4d233b960db.

Danach wird ein zweiter Zeiger mit Segment +A0h (physisch +2560 Bytes bei unverändertem Offset) vorbereitet. 1000:0709..0722 kopiert 74h=116 Bytes unverändert und behandelt anschließend 98Ch=2444 Bytes: Null bleibt Null; sonst 8-Bit-SUB 20h, zweimal arithmetisches SAR um eins, ADD 20h. Das bildet `original-blancpc-load-transform.ts` auf einer expliziten 2560-Byte-Speicherfenstereingabe ab. Kein Auffüllen aus der 2100-Byte-Datei: Der Dateizeiger +54 und der 2560-Byte-Lesebereich reichen über die Dateinutzlast hinaus, und deren initialer Speicherinhalt ist ungeklärt. Ein Datei-zu-Sample-Decoder wird dadurch nicht behauptet.

`node scripts/check-original-blancpc-load-transform.mjs` prüft alle 256 Bytewerte, Zero-Sentinel, signed Verschiebung, unveränderte 116-Byte-Präfixe und Quellschutz auch bei Node-Buffer. Unvollständige oder längere Fenster werden abgewiesen. Optional ISHAR_DOS_CAPTURE_ROOT auf den gemeinsamen Analyseordner setzen: beide Capture-Loaderhashes und die referenzierte Zeichenfolge werden geprüft. Typprüfung bestanden. Direkter CPUvergleich dieses neuen Transformationsmodells und die Installationsroutine folgen; der native Interruptblock allein ist bereits separat CPU-geprüft.

## Dateihelfer und Short-Read-Verhalten im Original

Der BLANCPC-Lader ruft bei 1000:06C5 den Helfer 1F97 auf. Dessen Pfad speichert DS:DX bei SS:28A4/28A6 und benutzt bei 1FE4..1FE9 AX=3D02 / INT21. Weitere Modus-/Laufwerkspfade bestehen; deren Vollständigkeit wird nicht behauptet. Helfer 20B5 lädt den gespeicherten Handle aus SS:0BBE, setzt AH=3E und ruft INT21; Fehler gehen mit AX=14 an 8468. Der Lesehelfer 212D lädt denselben Handle, setzt AH=3F, ruft INT21 und prüft allein Carry. Bei Carry klar folgt direkt RET, ohne Vergleich von AX mit CX und ohne Auffüllen oder Wiederholung. Bei Carry gesetzt schreibt er AX=13 und springt nach 8468. Die Funktion bei 8468 wird damit nur als gemeinsames Fehlerziel bezeichnet, noch nicht vollständig rekonstruiert.

`python scripts/check-native-dos-read-helper.py <memory.bin>` führt die Originalbefehle dieses Lesehelfers in Unicorn 2.1.4 aus. Erwartete Captures sind an ihre vollständigen Hashes gebunden. DOS wird explizit gemockt: Handle 5, angefordert 2500 Bytes, Rückgaben 0/1/2099/2100/2500 mit Carry klar sowie Fehler 5 mit Carry gesetzt. Der Mock schreibt nur die als gelesen gemeldeten Bytes; der Originalhelfer belässt den übrigen mit A5 kontrolliert vorbelegten Speicher unverändert. Alle sechs Fälle bestehen für beide Spiele. Der Fehlerfall erreicht 8468 mit AX=13; der Erfolgsfall erreicht RET mit unverändert zurückgelieferter DOS-Bytezahl. Kein Host-Dateizugriff durch emulierte Befehle.

Damit ist die Short-Read-Frage im Helfer entschieden: Der 2100-Byte-BLANCPC-Datei wird bei angeforderten 2500 Bytes kein Nullpadding durch diese Routine hinzugefügt. Der spätere Transformationsbereich reicht bis Dateipuffer+2614; die Bytes jenseits der Datei sind folglich weiterhin vom Allocations-/Initialisierungszustand abhängig. Dessen Analyse sowie konkrete Verwendung der zweiten abgeschwächten Kopie und Interruptinstallation bleiben offen. Die bestehenden Decoder ergänzen weiterhin keine geratenen Bytes.

## Direkter CPUvergleich der Puffertransformation

`python scripts/check-blancpc-load-unicorn.py <memory.bin>` (unicorn==2.1.4, Node mit TS-Unterstützung; optional --node) führt die tatsächlichen Originalbefehle 1000:0709 bis vor 0723 aus. Die erwarteten Ausgaben entstehen durch Import des produktiven TypeScript-Modells in `blancpc-load-vectors.mjs`, nicht durch einen zweiten Python-Nachbau derselben Formel. Captures sind an die bekannten vollständigen Speicherhashes gebunden.

Drei kontrollierte Fenster: alle null, zyklisch alle 256 Bytewerte und ein weiteres permutiertes Bytewertmuster. Quell- und Zielpuffer liegen wie im Originalsegmentaufbau physisch 2560 Bytes auseinander. Für beide Spiele stimmen jeweils alle 7680 Ausgabebytes überein. Quelle unverändert, SI/DI enden bei 0B00, CX endet null, das erste Byte hinter dem Ziel bleibt unverändert. Instruktionsbudget 100000; überraschende Interrupts scheitern. Dateien werden nur gelesen und nachher erneut verglichen.

Dies schließt die bisher offene CPUvergleichslücke für diesen Transformationskern bei DF=0 und nicht umbrechenden Offsets. Unbekannter Pufferinhalt nach Short-Reads, vollständiger Dateilader, andere Flags/Segmentgrenzen und Interruptinstallation sind dadurch nicht nachgewiesen. Keine automatische Wiedergabe oder Bootfortsetzung ergänzt.

## Nativer Sample-Parameterblock: Abweichung von der C-Referenz

Der Originalpfad 1000:6302..633E setzt aus DS:DI die späteren Sampleparameter. Zuvor wird bei 62F7 ein Abschaltflag SS:0CA2 geprüft; danach verzweigt der Code bei 633F anhand eines Geräteflags SS:288E. Nur der mittlere Parameterblock ist hier rekonstruiert und CPU-geprüft; kein pauschaler Audiogerätepfad wird daraus abgeleitet.

`original-dos-sample-prepare.ts` bildet direkt diesen Originalblock ab: Geschwindigkeit ist das bereits gelesene Befehlsbyte SS:0E0D; nur null ersetzt es durch Headerbyte +1. Die Länge wird aus dem LITTLE-ENDIAN-WORT bei Header+2 gelesen, um 16 vermindert und als u16 nach SS:0E14 geschrieben. Sampleoffset ist DI+16 als u16, Segment bleibt DS (SS:0E10/12). Geschwindigkeit wird mit 1000 multipliziert, nur das niedrige Wort geht nach SS:0E18. Es gibt hier weder signed8-Geschwindigkeitsprüfung noch 1..20-Clamp. Der zuvor gelesene Ressourcentyp in CL wird durch das Längenwort überschrieben; dieser Block selbst filtert nicht nach Typ.

Das ist ein belegter Unterschied zur separaten ALIS-C-Referenz (32-Bit-Länge und 1..20/10-kHz-Fallback). Die bisherigen reference-Module behalten ihre Herkunftskennzeichnung und sind nicht als originalgleiche Audiolaufzeit freigegeben. Beispielsweise ergibt Geschwindigkeit 66 hier das Wort 464, während die Referenz auf 10000 fällt. Welche weitere Skalierung ein Gerätepfad anwendet, ist noch offen. Keinen solchen Rohwert ungeprüft als tatsächliche DOS-Ausgaberate bezeichnen.

`python scripts/check-native-dos-sample-prepare.py <memory.bin>` benötigt Unicorn 2.1.4 und Node mit TypeScript-Unterstützung. 768 Fälle je Originalprofil: alle 256 Befehlsbytes kombiniert mit Headerlängen 0/16/65535, Headergeschwindigkeit 13. Erwartung aus dem produktiven TypeScript-Modell, Ausführung der echten Capture-Befehle bis vor 633F, Vergleich der fünf gespeicherten Parameter. Alle Fälle in beiden Spielen stimmen überein; Typprüfung bestanden. Kontrollierte Register-/Speicherzustände sind Testeingaben, kein vollständiger Startzustand. Keine Datei-/Gerätezugriffe und keine Wiedergabe.

Die Pufferzeiger SS:0E20 bzw. 0E24 werden im benachbarten Pfad 5E8F/5E9C ausgewählt. Dort bestimmen Vergleiche des Wortwertes SS:0CD1 mit 80 und 120, ob keine Weitergabe, abgeschwächte oder ursprüngliche Kopie verwendet wird; die vollständige Bedeutung dieses Aufrufpfads ist noch zu prüfen. Die eigentliche Interruptinstallation ist weiterhin offen.
