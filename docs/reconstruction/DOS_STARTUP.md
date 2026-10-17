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
