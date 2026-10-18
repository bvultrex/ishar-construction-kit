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

## Spätere native Geschwindigkeitsbegrenzung gefunden

Die Untersuchung der Geräteverzweigung präzisiert den vorherigen Befund: Der erste Parameterblock multipliziert tatsächlich ungeklammert. Der später per Far-Call erreichbare Originalpfad 1000:87F3 enthält jedoch nach Geräte-/Prioritätsprüfungen bei 886D..8885 eine signed8-Begrenzung auf 1..20, sonst 10. `normalizeOriginalDosDeviceSpeed` bildet genau diesen späteren Block ab. Damit ist die 1..20-Regel nicht nur eine Eigenschaft der separaten C-Referenz; sie ist für diesen konkreten nativen Gerätepfad belegt. Sie darf weiterhin nicht rückwirkend in den frühen Parameterblock oder ungeprüft in alle Gerätepfade eingesetzt werden. Dessen gespeichertes Frequenzwort und der später begrenzte Geschwindigkeitswert sind unterschiedliche Zustandsgrößen.

Am Eingang 87F3 führt Gerätewert CS:E940=0 direkt zu RETF. Bei anderem Wert werden Register gesichert. Für Interfacewert CS:E93E<=1 vergleicht die Routine die neue signed8-Priorität CS:CD79 mit vier Kanalprioritäten bei DEAE/DEBE/DECE/DEDE und der bisherigen Gerätepriorität CEBB; ein kleinerer Wert überspringt die spätere Einrichtung. Erst anschließend werden Zustände gesichert und das Geschwindigkeitsbyte CEBD begrenzt. Bei Gerätewert 3 folgt ein Far-Call nach 1941:2177, bei anderem Interfacewert als 1 ein anderer nach 1941:1EDF; weitere Pfade benutzen 8949/91D0/8F49. Hardwarebezeichnungen sind noch nicht belegt; diese Adressen gelten im kontrollierten Lade-/Capturezustand.

`python scripts/check-native-dos-speed-clamp.py <memory.bin>` prüft alle 256 Bytewerte gegen die tatsächlich emulierten Originalbefehle und das produktive TypeScript-Modell. Beide Profile bestehen; Rückschreiben von CEBD und BX-Ergebnis stimmen überein. Frühere Geräte-/Prioritätsguards werden bewusst nicht als mitgeprüft behauptet. Kein Gerät aufgerufen, keine echte I/O. Typprüfung bestanden. Die eigentliche Interruptinstallation und die Auswahl aktiver Gerätezweige bleiben offen.

## Native Timerinstallation bis vor erstes OUT rekonstruiert

1000:8F49 ruft 8F22 auf. Der Helfer kopiert 53 Worte (=106 Bytes) aus der Engine bei CS:8EB8 in den übergebenen DS:DX-Puffer. Der anfangs in BLANCPC enthaltene 77-Byte-Stub wird dadurch vor Benutzung in diesem Pfad ersetzt; dessen eigene vorherige CPUprüfung war ein Test des Dateiinhalts, kein Beweis, dass genau diese unveränderte Fassung installiert bleibt.

Nach signed16-Vergleich von CX wird bei CX<=0 der Wert 7D00 verwendet. Es folgen Activebyte CS:86C3=1, CLI und der emulierte IVT-Schreibzugriff 0000:0020/0022 mit DX/DS (Vektor 8). Der Stub wird anhand seiner tatsächlichen Pufferbasis relocatiert: Opcodeoperanden für Datenzugriffe, Sampleanfang Basis+80h, Zähler sowie gespeicherte Wörter. Byte +3 stammt aus der CS-Tabelle bei 8E11+BX. Das Wort CS:0BF8 wird in den Stub und nach CS:86DE kopiert. Seine vollständige ursprüngliche Bedeutung wird hier nicht aus dem Namen geraten.

`original-dos-timer-install.ts` bereitet genau den Zustand bis vor 9009 vor; es nimmt das originale 106-Byte-Template ausdrücklich als Eingabe. Keine Originalbytes im Repository. Segment-/Wortwerte sind geprüft, Offsetwrap wird vorerst ausdrücklich abgewiesen. Dies ist kein Aufruf echter Hardware oder echter Interruptvektoren.

`python scripts/check-native-dos-timer-install.py <memory.bin>` (Unicorn 2.1.4/Node, optional --node) vergleicht mit den tatsächlichen Originalbefehlen einschließlich des Kopierhelfers. 30 Fälle je Spiel: drei Tabellenindizes, fünf Längen einschließlich Null/negativer Bitmuster und zwei nicht umbrechende Pufferpositionen. Alle 106 Zielbytes, unveränderter Rest bis +128, IVT-Wörter, Samplezeiger DX, Activebyte, kopiertes Kontextwort und Stacktiefe stimmen überein. Emulation stoppt vor erstem OUT bei 9009; unerwartete Portausgabe scheitert. Originalcaptures unverändert, Typprüfung bestanden.

Offen bleibt der restliche Pfad ab 9009: Portprogrammierung, eingelesener Portzustand, zusätzliche Timing-/Messroutine und Wiederherstellung beim Ende. Der Beobachtungsstopp erfolgt vor dieser Wirkung; kein vollständiger Audiogerätenachweis oder Klangtest.

## Timer-Portprogrammierung und Konfigurationshelfer CPU-geprüft

`completeOriginalDosTimerInstall` rekonstruiert 1000:9009..9059 einschließlich des Helfers 0F1E. Die zuvor nur als mögliche Mess-/Timingroutine bezeichnete Funktion liest tatsächlich SS:0C9F und den Systemtyp SS:2894. Bei Typ 2 oder 7 bleibt das Wort unverändert. Sonst: MUL mit 2, anschließend DX explizit null, DIV durch 3; daher zählt nur das niedrige 16-Bit-Produkt. Der spätere Vergleich mit 100 ist signed16. Größere Werte wählen das Wort 0037, sonst 0042. Dies ist eine gespeicherte Konfigurationsentscheidung, keine hier beobachtete Echtzeitmessung.

Die modellierte OUT-Folge: Port43=B2; Port42=00,00; Port61=(eingelesenesByte & FC)|03; Port43=36; Port40=DivisorLow,00; Port43=90. Das Byte von Port61 wird ausdrücklich als Umwelteingabe übergeben. Der Stub erhält bei +5C/+5E den Rückkehrzeiger 905E:CS und bei +64 das gewählte Wort. Vor dem Beobachtungsende ist IF durch STI gesetzt. Die kleinen Aufrufe nach 8E25 sind verschachtelte Calls/Returns und werden im CPUtest tatsächlich ausgeführt.

`python scripts/check-native-dos-timer-complete.py <memory.bin>` (Unicorn 2.1.4, Node; optional --node) vergleicht die echten Originalbefehle mit den TypeScript-Ergebnissen in 126 Fällen pro Profil: Typ 0/2/7, sieben Konfigurationsworte einschließlich signed-/MUL-Überläufen und sechs Port61-Eingabewerte. Alle acht OUT-Werte, genau ein IN an 61, alle 106 Stubbytes, ausgeglichener Stack und gesetztes IF stimmen überein. Sämtliches IN/OUT wird ausschließlich im Emulator abgefangen; keine echte Hardware und keine Host-Interruptvektoren. Stop vor dem Register-Rückbau bei 905A. Capturedateien unverändert, Typprüfung bestanden.

Damit sind Einrichtung vor OUT und Portprogrammierung dieses Pfads getrennt gegen Original-x86 geprüft. Vollständige Komposition mit vorheriger Geräteauswahl, tatsächlicher Rechnerkonfiguration und späteren Interruptticks/Abbau ist noch offen. Physische Audioausgabe und ihr Timing bleiben unbewiesen.

## Native Timerabschaltung einschließlich Pending-Grenze

`original-dos-timer-stop.ts` rekonstruiert 1000:8E2C..8E8D. Activebyte CS:86C3=0 kehrt ohne I/O und ohne IF-Änderung zurück. Andernfalls CLI, Port43=36, Port40 mit Low-/Highbyte des gespeicherten Worts CS:86DE, danach Port61 mit eingelesenem Byte & FC. Der Vektor bei 0000:0020 wird aus CS:86DA/86DC wiederhergestellt. CS:CEBA, 8947 und 86C3 werden null; Priorität CEBB wird 80h. Kein STI in diesem Abschnitt: Aufrufer-/IRET-Kontext muss die spätere IF-Wiederherstellung bestimmen.

Ist CS:8909 null, folgt RET. Sonst führt der Originalcode bei 8E8E noch weitere Arbeit und anschließend eine erneute Timerinstallation aus. Das Modell gibt hierfür ausdrücklich `pending` zurück statt so zu tun, als wäre die gesamte Abschaltung beendet. Diese Fortsetzung ist noch nicht rekonstruiert. Portwerte, Vektor und Clear-Writes werden als Aufträge zurückgegeben; keine echten Hardwarezugriffe.

`python scripts/check-native-dos-timer-stop.py <memory.bin>` prüft 72 Fälle pro Originalprofil in Unicorn 2.1.4 gegen die TypeScript-Ausgabe: aktive Werte 0/1/255, Pending 0/1, drei Portzustände, zwei gespeicherte Timerworte und IF an/aus. Alle Portfolgen, Vektorwerte, Statebytes, IF, Stacktiefe und gewählten Ausstiegspfade stimmen überein. Beim Pendingpfad Stopp vor dem unrekonstruierten Helfer bei 8E8E, sonst vor RET. Der inaktive Pfad erhält Vektor/Priorität unverändert. Originalcaptures bleiben unverändert, Typprüfung bestanden. Kein Hardwaretiming, keine tatsächlich installierten Interrupts und kein vollständiger Boot-/Audiobetrieb bewiesen.

## Nativer Pending-Audiostapel rekonstruiert

Die Helfer CS:8949..89DF und 89E0..8A4C implementieren einen LIFO-Stapel, keine erfundene FIFO-Warteschlange. Zähler CS:8909, Zeiger CS:890B; leerer Zeiger 893D, pro Eintrag acht Bytes abwärts. Satzfolge im Speicher: Prioritätsbyte, Geschwindigkeitsbyte, Wiederholungswort, Segmentwort, Offsetwort. Die Bezeichnung Wiederholungswort folgt der zuvor verfolgten Quelle SS:0E0E; es ist nicht das Samplelängenwort SS:0E14.

Einlagern des bisherigen Auftrags erfolgt nur wenn Activeflag 8947 genau 1 ist, dessen gespeicherte Priorität signed8-negativ ist, die neue Priorität davon abweicht und der signed Zähler kleiner als 6 ist. Bei regulären Zuständen ergibt sich Kapazität sechs. Danach wird der eingehende Auftrag in jedem Fall zum aktuellen gespeicherten Zustand und Activeflag=1. Gleiche Priorität erzeugt keinen zusätzlichen Stapelsatz. Volle Kapazität verhindert nur das Sichern des bisherigen Auftrags, nicht die Aktualisierung des aktuellen Zustands.

Pop bei leerem Stapel setzt ausschließlich Activeflag null. Sonst wird der Zähler vermindert, der oberste Achtbytesatz in aktuelle CS-Felder und ihre DS:1C0B-Spiegel kopiert, der Zeiger um acht erhöht und Activeflag=1 gesetzt. `original-dos-audio-pending.ts` bildet gültige normalisierte Zustände top-first ab; beschädigte negative oder übergroße Zähler werden als Toolkit-Grenze abgewiesen. Keine originalgetreue Speicherverletzung wird nachgebildet.

`python scripts/check-native-dos-audio-pending.py <memory.bin>` vergleicht Original-x86 mit dem tatsächlichen TypeScript-Modell in 144 Fällen je Profil: Stapeltiefen 0/1/5/6, Activeflags 0/1/2, vier alte und drei neue Prioritäten. Einlagern und anschließendes Pop stimmen bei Satzbytes, Zähler, Zeiger, aktuellen CS-Feldern, Activeflag und Stacktiefe überein. Die DS-Spiegelstores werden durch den Originalcode ausgeführt, sind im aktuellen Test aber nicht separat als Assertion abgedeckt. Kein Scheduler oder Playback. Typprüfung bestanden; Originalcaptures unverändert.

Damit ist der Helfer hinter dem zuvor offenen Abschalt-Pendingzweig rekonstruiert. Die Komposition aus Pop, erneuter Installation und laufenden Timerinterrupts muss noch gemeinsam geprüft werden; die gesamte Audiolebensdauer ist weiterhin nicht abgeschlossen.

## Komposition: Stop, Pending-Pop und erneute Installation

`check-native-dos-audio-resume.py` führt den vollständigen Originalpfad von 8E2C bis vor dem abschließenden RET 8EB7 aus, einschließlich 89E0 und 8F49/8F22/0F1E. Erwartungswerte werden durch Komposition der produktiven TypeScript-Teilmodelle erzeugt, nicht durch Auslassen der Originalhelfer. 24 Fälle je Profil: ein oder sechs gespeicherte Aufträge, Geschwindigkeitsbytes 1/10/20, positive bzw. signed-negative Wiederholungsworte und zwei Eingangswerte für Port61. Alle Fälle bestehen.

Verglichen werden die zwölf OUT-Aufträge (vier Stop, acht Install), zwei IN-Aufträge mit fortgeschriebenem emuliertem Portzustand, 106 Stubbytes, unveränderter Pufferrest, neu gesetzter Vektor, Stapelzähler/-zeiger, aktuelle CS-Felder und die fünf DS:1C0B-Spiegelfelder, Activeflags sowie Register-/Stackrückbau (AX und allgemeine Flags nicht als erhalten behauptet). IF ist nach Wiederinstallation gesetzt, während der einfache Stop ohne Pending es gelöscht lässt. Keine asynchronen Interruptticks werden ausgelöst; kein Hardware-I/O.

Eine belegte Pfadbesonderheit: 8E9F übernimmt das gespeicherte Geschwindigkeitsbyte direkt in BL und 8EA6 das gespeicherte Wiederholungswort in CX vor CALL 8F49. Anders als beim früheren Gerätepfad vor 88B9 wird hier kein SUB BX,1 ausgeführt. Das Testmodell bewahrt diesen Unterschied ausdrücklich, statt die Pfade vermeintlich zu vereinheitlichen. Welche inhaltliche Quelle alle Pending-Aufträge haben, bleibt weiter zu verfolgen.

Die zuvor offene Kompositionsprüfung ist damit für diese kontrollierten gültigen Stapelzustände erledigt. Vollständiger Audiobetrieb mit Laufzeit-/Geräteauswahl, Sampletickfolge, realer Rechnerkonfiguration und Original-Klangvergleich bleibt offen.

## Tatsächlich installierter Engine-Interrupttick

`original-dos-timer-tick.ts` rekonstruiert den relocatierten Engine-Stub aus CS:8EB8, nicht den unveränderten 77-Byte-Dateistub. Er verwendet den separat geprüften gemeinsamen Rotate/Sample/Nullmarker-Kern, ersetzt dessen Resetzeiger durch die bei Installation gesetzte Basis+128 und ergänzt den Timerfortschritt. Zustandsworte: selbst verändertes AX-Immediate, Samplezeiger, Samplewiederholungszähler, Timerstep (+64), Countdown (+66), gepatchter Rücksetzwert im Immediate bei +36 und Restartzeiger. Die Inputs sind kontrollierte Zustände, kein Anspruch eines vollständigen VM-/CPU-RAM-Abbilds.

Bei normalem Sample-/Rotate-/Repeatpfad schreibt der Stub zunächst Sampleausgabe Port42 und EOI-Wert Port20. Danach wird das Stepwort unsigned vom Countdown abgezogen. Ohne Borrow folgt IRET; mit Borrow wird der Countdown auf den gepatchten Rücksetzwert gesetzt und per Far-Jump an den Engine-Timerpfad weitergegeben. Dieser Rücksetzwert darf nicht als feste Templatekonstante 5D2A behandelt werden: Der Installer überschreibt ihn mit CS:0BF8. Der erste differentielle Test deckte genau diese Kopplung auf; das Modell verlangt den Wert jetzt ausdrücklich. Bei Sampleende mit dekrementiertem Zähler null geht es vorher zum gepatchten Endziel, ohne EOI und ohne Countdownänderung; AX/BX liegen dabei noch auf dem Stack.

`python scripts/check-native-dos-timer-tick.py <memory.bin>` (Unicorn 2.1.4/Node, optional --node) baut mit den produktiven Installationsmodellen einen Stub aus den echten Originalbytes und führt ihn bei kontrollierter CS-Basis aus. Je 1152 Fälle beider Profile stimmen überein: vier AH-Werte, drei Samplebytes, vier Wiederholungszähler, vier Countdowns, zwei Steps und drei Rücksetzwerte. Verglichen werden sechs Zustands-/Operandworte, Portfolgen, Ausstieg (IRET/Timerchain/Sampleende), Stacktiefe und normale Registerwiederherstellung. Der Test stoppt vor IRET bzw. Far-Ziel; vollständige Ausführung der Zielroutinen und asynchrones Hardwaretiming bleiben offen. Keine echte Portausgabe, Originalcaptures unverändert.
## Fortlaufende Interruptfolge bis zur echten IRET-Rückkehr

`check-native-dos-audio-sequence.py` prüft die produktiven Teilmodelle jetzt gemeinsam gegen fortlaufend ausgeführten Original-x86-Code. Pro Originalprofil bestehen 24 Sequenzen mit insgesamt 224 Ticks: drei aus dem Capture gelesene Geschwindigkeitstabelleneinträge, Wiederholungszähler 1/2, ein sofortiger Nullmarker bzw. zwei Samplebytes vor dem Nullmarker und zwei Port61-Eingangszustände. Ein Unicorn-Prozessor samt selbst verändertem Stub und RAM bleibt über sämtliche Ticks einer Sequenz erhalten.

Jeder kontrolliert injizierte IRQ läuft durch den installierten Stub. Beim letzten Tick wird auch das originale Endziel 1000:905E mit Abschaltung 8E2C ausgeführt; anschließend kehrt das originale IRET zum präparierten Aufrufer zurück. Verglichen werden pro Tick sechs Stubworte, sämtliche OUT-Aufträge, die erhaltenen Aufruferregister, Stack, CS:IP, wiederhergestelltes IF und Activeflag. Nach Sampleende wird außerdem der restaurierte Interruptvektor geprüft. Erwartungswerte stammen aus `dos-audio-sequence-vectors.mjs`, das die produktiven Installations-, Tick- und Stopmodelle kombiniert. Beide Capturedateien bleiben unverändert.

Reproduktion: `python scripts/check-native-dos-audio-sequence.py <memory.bin>` mit Unicorn 2.1.4 und Node im PATH (alternativ `--node <Pfad>`). Der Test akzeptiert ausschließlich die oben identifizierten Capturehashes. Es gibt keine Host-Portzugriffe. Diese kurzen Sequenzen erreichen absichtlich keinen Timerchain-Borrow und enthalten keinen Pending-Auftrag; Timerchain-Zielroutine, durchgängige Pending-Wiedergabe, reale Interruptfrequenz und akustischer Originalvergleich bleiben offen. Die zuvor beschriebene Einzelprüfung bleibt für die übrigen Tickzustände erforderlich.


## Timerchain-Einstieg: belegter Zähler und offene Aufrufe

Der Far-Jump des Audiostubs nach 1000:0D98 führt in eine größere Timer-Interrupt-Routine. Der Einstieg bis vor 0DB6 sichert neun Registerworte (AX/BX/CX/DX/DI/SI/DS/ES/BP), löscht DF, setzt DS=1C0B, schreibt Port20=60h und setzt IF. Das Byte DS:0C9A wird inkrementiert; bei Überlauf wird es wieder dekrementiert. Ergebnis ist somit min(alt+1,255), kein modulo-256-Zähler. `check-native-dos-timer-counter.py <memory.bin>` bestätigt dies in sämtlichen 256 Eingangszuständen je identifiziertem Originalprofil sowie für Portfolge, DS, Stacktiefe, IF und DF. Die Ausführung stoppt vor den nachfolgenden bedingten Aufrufen; keine Hardwarezugriffe.

Die statische Fortsetzung zeigt bedingte Far-Calls bei 0DC4 und 0DD1, einen Aufruf 222A, drei bedingte Aufrufe 224E mit BX=0/1/2 und Datensatzzeigern 1DFD/1E0D/1E1D sowie CALL 670D. Ihre Funktionen sind hier noch nicht nachgewiesen. Danach wird Byte 0C97 dekrementiert; bei null wird aus 0C98 nachgeladen und anhand 0CD8 sowie 0CC5 zwischen Rückkehr per IRET und Übergabe an den gespeicherten Far-Zeiger CS:0BF2 entschieden. Diese statischen Befunde sind eine Arbeitskarte, keine abgeschlossene Rekonstruktion der ganzen Routine. Insbesondere wird noch keine Bedeutung als Spielzeit, Musikkanal oder BIOS-Tick behauptet. Nächster Schritt ist die Analyse dieser Helfer und ihrer Zustandsabhängigkeiten, bevor die Timerchain in eine ausführbare Rekonstruktion integriert wird.

## Auswahlhelfer 222A: signed Vergleich dreier Datensätze

`original-dos-timer-selection.ts` rekonstruiert CS:222A..224D. Die Bytes DS:1DFE, 1E0E und 1E1E (jeweils +1 in drei 16-Byte-Datensätzen) werden signed8 verglichen. DS:0CD7 erhält den Index des größten Werts; bei Gleichstand gewinnt der niedrigste Index. Das Original verwendet JGE und darf daher nicht durch einen unsigned Vergleich ersetzt werden. AH ist Arbeitsregister und am Ende nicht zwingend der größte der drei Werte: Beim Wechsel auf Index 2 wird nur das Ausgabeindexbyte geschrieben. Der rekonstruierte Vertrag enthält ausschließlich den Index, keine Behauptung über erhaltenes AH oder allgemeine Flags.

`check-native-dos-timer-selection.py <memory.bin>` vergleicht die produktive TypeScript-Funktion mit den tatsächlichen Originalinstruktionen bis vor RET. Je 4608 Fälle beider identifizierten Captureprofile bestehen: alle 256 Bytewerte in jeder der drei Positionen, jeweils mit Vergleichswerten 0/1/127/128/129/255 in den anderen Positionen. Dies prüft signed Grenzen und Gleichstände, ist aber keine vollständige Enumeration aller 256^3 Tripel. Ausgabeindex, unverändertes AL und Stacktiefe werden geprüft. Typprüfung bestanden; keine Originaldatei verändert.

Die Feldbedeutung und der Verbraucher von DS:0CD7 sind weiterhin nicht nachgewiesen. Der Helfer wird deshalb als neutrale Datensatzauswahl geführt und noch nicht als Wiedergabepriorität, Kanalzuweisung oder neuer Scheduler in den Spielablauf eingebaut. Die folgenden Updates bei 224E und die Gerätefunktion 8BBD müssen dafür weiter untersucht werden.

## Datensatzfortschritt 224E bis zur Geräteübergabe

`original-dos-timer-record.ts` bildet CS:224E..2299 bis vor dem jeweiligen Far-Call 8BBD ab. Eingabe ist ein 16-Byte-Datensatz; unbekannte Bytes bleiben erhalten. Byte +2 mit gesetztem Vorzeichenbit überspringt jede Änderung und den Geräteaufruf. Sonst wird Wort +4 modulo 65536 dekrementiert. Ergebnis null beendet den Datensatz; ein Eingangswert null wird dagegen FFFF und beendet ihn nicht allein aus diesem Grund. Die Summen (+6)+(+8) und (+A)+(+C) werden jeweils zuerst modulo 65536 gebildet. Ein gesetztes Ergebnis-Vorzeichenbit löst ebenfalls das Ende aus. Der Vergleich mit 7FFF nach der ersten Vorzeichenprüfung begrenzt auf keinem erreichbaren verbleibenden Pfad zusätzlich; eine saturierende Addition wäre daher falsch.

Am Ende werden +6 und +A null, Byte +1=80h, +2=0 und +0=0 gesetzt. Wort +4 und die Deltaworte bleiben dabei erhalten. Beim normalen Pfad werden beide Summen zurückgeschrieben. Beide Pfade rufen danach 1000:8BBD auf; der übersprungene Pfad kehrt direkt zurück. Das Modell meldet diesen Aufruf, führt ihn aber noch nicht aus.

`check-native-dos-timer-record.py <memory.bin>` vergleicht alle 16 Ergebnisbytes, Geräteaufrufentscheidung, BX/DI und Stack gegen die Originalinstruktionen: je 1200 Fälle in beiden Captureprofilen, mit negativen/nichtnegativen Flagbytes, Zählergrenzen, Summanden an signed/unsigned Grenzen und drei zweiten Ausgangswerten. Alle bestehen. Keine vollständige Enumeration des Datensatzraums; keine Gerätewirkungen im Test. Originalcaptures unverändert.

Statisch nachgewiesene Verbindung: 8BBD prüft zunächst CS:E940; bei null sofort RETF. Andernfalls setzt es vorübergehend DS=1C0B und ruft die Helfer 8BF0/8C1C/8C4D nur auf, wenn DS:0E0A null und BL gleich dem gewählten Index DS:0CD7 ist. Der zuvor neutrale Index hat somit einen nachgewiesenen Verbraucher in der Geräteansteuerung. Seine weitergehende fachliche Bedeutung und die vollständigen Gerätepfade bleiben offen.

## Datensatz-Geräteausgabe: native Modi 1 und 4

`original-dos-speaker-record.ts` rekonstruiert die drei Ausgabeschritte 8BF0/8C1C/8C4D einschließlich 8C82 für Gerätemodus 1 oder 4, nachdem die Gates von 8BBD erfüllt sind. Der Aufrufer muss diese Gates (Gerät aktiv, DS:0E0A=0, BL=DS:0CD7) prüfen; die neue Funktion stellt keinen vollständigen Ersatz für 8BBD und keine anderen Gerätemodi dar.

Erster Schritt: Byte +7 null löscht Port61-Bit1; andernfalls wird es nur gesetzt, wenn es noch fehlt. Zweiter Schritt: Port43=B6h immer; Wort (+A)+100 modulo 65536 wird als Low-/Highbyte nach Port42 geschrieben, außer es ist gleich CS:8C1A. Der Originalpfad schreibt diesen Cache nicht zurück. Dritter Schritt: Byte +2 null löscht Port61-Bit0. Sonst wird Bit0 nur gesetzt, wenn es bisher fehlt. Nur bei diesem neuen Setzen und gesetztem Datensatzbit1 folgt 8C82: zwei IN von Port41 (zweiter Wert wird verworfen), Schiebezahl=(erstes Byte &7)+1, Ausgangswert=(Wort +A unsigned >>4)+1. Mindestens eine Linksverschiebung, Abbruch bei gesetztem Ergebnisbit15 oder verbrauchter Schiebezahl; Ergebnis Low/High nach Port42. Bestehendes Port61-Bit0 überspringt auch diese Zusatzberechnung.

`check-native-dos-speaker-record.py <memory.bin>` führt das originale 8BBD samt allen drei Helfern durch die echte RETF-Rückkehr zum kontrollierten Aufrufer aus. Je 960 Fälle beider Captureprofile bestehen: Modi 1/4, vier Flagwerte, vier Ausgangsworte, fünf Port61-Zustände, drei erste Port41-Werte und Cache gleich/ungleich. Verglichen werden alle OUT-Aufträge, Anzahl der Port41-Reads, fortgeschriebener Port61-Zustand, unveränderter Datensatz und wiederhergestellte DS/AX/CX/DX sowie Stack. Gates sind in diesen Fällen absichtlich erfüllt; ihre negativen Fälle bleiben separat zu prüfen. Der Modellaufruf gibt I/O-Aufträge zurück und berührt keine Hosthardware. Keine akustische oder zeitliche Gleichheit behauptet, andere Gerätepfade bleiben offen.

## Komposition der drei Timerdatensätze einschließlich Geräte-Gates

`original-dos-timer-records.ts` verbindet die geprüften Teilmodelle für den Originalabschnitt 1000:0DD6..0E12: zuerst Auswahl 222A, anschließend in Indexreihenfolge drei bedingte Updates 224E samt Geräteübergabe 8BBD. Die Aufruferbedingung ist signed-positive Byte +0 (1..127), unabhängig vom Auswahlbyte +1. Null und negative Aktivbytes werden übersprungen. Die Auswahl wird nach einem Datensatzende nicht neu berechnet; sie bleibt für diesen Timerdurchlauf bestehen.

Gerätemodus 0 unterdrückt Ausgabe vollständig. Bei Modus 1/4 wird die Sprecherfunktion nur ausgeführt, wenn das Update einen Geräteaufruf anfordert, Unterdrückungsbyte DS:0E0A null ist und der laufende Datensatzindex dem zuvor gewählten DS:0CD7 entspricht. Andere Gerätemodi weist dieses Teilmodell ausdrücklich als unrekonstruiert zurück. Alle drei Datensätze werden kopiert; unbekannte Bytes bleiben erhalten. Port61 wird innerhalb der Auftragsfolge fortgeschrieben.

`check-native-dos-timer-records.py <memory.bin>` führt den gesamten Originalabschnitt ohne Ersatz-RET oder ausgelassene Gerätehelfer aus und stoppt vor CALL 670D. Je 540 Fälle beider identifizierten Originalprofile bestehen: Modi 0/1/4, Unterdrückungsbytes 0/1/255, alle drei ausgewählten Indizes, fünf Aktivbytes, normaler und auslaufender Zähler sowie zwei Port61-Zustände. Verglichen werden Auswahlindex, sämtliche 48 Datensatzbytes, alle OUT-Aufträge, Port41-Leseanzahl, Port61-Endzustand sowie DS und balancierter Stack. Diese Kompositionsprüfung ergänzt die breiteren Grenzwerttests der Einzelmodelle. Originalcaptures unverändert; keine Host-Portzugriffe. Timerarbeit außerhalb 0DD6..0E12, andere Gerätepfade, asynchrone Ausführung und Klang bleiben offen.

## Timer-Epilog und Übergabe an gespeicherten Handler

`original-dos-timer-return.ts` rekonstruiert CS:0E15..0E46, nachdem 670D zurückgekehrt ist. DS:0C97 wird als Byte modulo 256 dekrementiert. Ist das Ergebnis nicht null, folgt nach Rückbau der neun gesicherten Register IRET. Nur Ergebnis null lädt DS:0C98 nach; anschließend erfolgt die Übergabe über den gespeicherten Far-Zeiger CS:0BF2 genau dann, wenn DS:0CD8 null und DS:0CC5 unsigned kleiner 2 ist. Sonst IRET. Ein Eingangs-Zähler null wird also 255 und löst weder Reload noch Übergabe aus. Ein Reloadwert null ändert die aktuelle Entscheidung nicht. Das Modell gibt Zähler und Ausstiegsauftrag zurück; die Bedeutung der beiden Gatebytes ist noch nicht benannt.

`check-native-dos-timer-return.py <memory.bin>` führt das Originalepilog bis einschließlich IRET oder Far-Transfer aus. Je 6144 Fälle beider identifizierten Profile bestehen: alle 256 Zählerwerte, Reload 0/1/255, Gate 0/1 und Modus 0/1/2/255. Geprüft werden Zähler, gewähltes Ziel, alle neun wiederhergestellten Register und Stacktiefe. Bei IRET werden IF/DF aus dem kontrollierten Interruptframe wiederhergestellt; beim Far-Transfer bleibt dieser Frame unverändert auf dem Stack. Die gespeicherte Zielroutine selbst wird nicht ausgeführt. Originalcaptures unverändert, keine Host-Portzugriffe.

Diese Prüfung ergänzt die Timer-Einstiegs- und Datensatztests; die gesamte Timerfunktion ist damit noch nicht geschlossen. Insbesondere müssen 670D, die bedingten Far-Callbacks vor 0DD6 und das gespeicherte externe Handlerziel noch im jeweiligen Ausführungskontext untersucht werden.

## Eingabe-Snapshot als Abhängigkeit des Timerhelfers 670D

670D ruft unter seinen Bedingungen 1259 auf und vergleicht dessen AX/BX mit DS:0CA6/0CA8. Bei Abweichung folgen Far-Calls 1E97:001C und 1E97:0020, dazwischen werden AX/BX in den Vergleichszustand geschrieben. Wichtig: Der Aufruf 001C liegt vor den Stores und könnte AX/BX beeinflussen; eine reine Kopie der Snapshotwerte ohne Untersuchung dieses Callbacks wäre noch nicht belegt. Die Bedingungen und das Byte DS:0CB2 sind ebenfalls weiter im Kontext zu verfolgen.

`original-dos-input-snapshot.ts` rekonstruiert zunächst den echten Helfer 1000:1259..129D. DS:0CA3 ungleich null ergibt AX=BX=FFFF und CX=0. Sonst liest er CS:11BD/11BF/11C1 als drei rohe Worte: AX erster Wert, BX zweiter Wert, CX dritter Wert. Bei DS:2896 ungleich 1 wird AX logisch nach rechts geschoben. Nur Modus 0 addiert anschließend zu AX und BX jeweils eins modulo 65536. Eingabequellen und die Bedeutung des dritten Worts sind hier nicht abschließend belegt; die Koordinatenbezeichnungen beschreiben die durch den Aufrufer nahegelegte Rolle, keine vollständige Mausrekonstruktion. DS wird wiederhergestellt; DX ist Arbeitsregister und nicht als erhalten behauptet.

`check-native-dos-input-snapshot.py <memory.bin>` führt den Originalhelfer einschließlich RET aus und vergleicht die produktive TypeScript-Ausgabe. Je 3840 Fälle beider identifizierten Profile bestehen: sämtliche 256 Modusbytes, Sperrbyte 0/1/255, fünf erste Wortwerte an Shift-/Vorzeichengrenzen mit ergänzendem zweiten Wort und variierendem dritten Wort. AX/BX/CX, DS und Stack stimmen überein. Originalcaptures unverändert; keine Host-Eingaben oder Betriebssystemdienste. Die vollständige Routine 670D und ihre Far-Callbacks sind damit noch nicht rekonstruiert.

## Nachgewiesene Quelle: registrierter Maus-Callback

Die Herkunft der Snapshotworte ist nun statisch verbunden: Die Initialisierung 11C3 verwendet INT33, prüft dessen Reset-Rückgabe und registriert im Modus DS:2896=1 über AX=000C, CX=003F und ES:DX=CS:1249 den Callback. Derselbe Zweig setzt per INT33 die Position CX=160/DX=100 und Bereiche 0..319 sowie 0..199. Dies belegt die Einordnung als Maus-Eingabepfad. Die Initialisierung wird hier noch nicht vollständig emuliert; insbesondere fehlen reale Treiber- und Ausfallpfade.

`latchOriginalDosMouseCallback` in `original-dos-input-snapshot.ts` rekonstruiert CS:1249..1258. BX wird in CS:11C1, CX in CS:11BD und DX in CS:11BF gespeichert, danach RETF. AX wird vom Callback ignoriert; keine Verknüpfung oder Akkumulation des Eventmaskenwerts. Das dritte Wort des späteren Lesers stammt somit aus BX des Maustreiber-Callbacks. Eine weitergehende Interpretation einzelner Bits ist noch nicht implementiert. Die Aussage im vorherigen Abschnitt, dass die Quelle offen sei, ist für diesen registrierten Callback damit überholt; andere mögliche Schreiber und alternative Modi bleiben zu untersuchen.

`check-native-dos-mouse-callback.py <memory.bin>` prüft Callback inklusive RETF und anschließend den echten Snapshotleser inklusive RET im selben emulierten RAM. Je 450 Fälle beider identifizierten Originalprofile bestehen: fünf BX-Werte, fünf CX-Werte einschließlich 319/639/FFFF, drei DX-Werte, Modi 0/1/2 und Sperrbyte 0/1. Verglichen werden gespeicherte Worte, erhaltene Callbackregister AX/BX/CX/DX/DS, beide Stackrückbauten und die AX/BX/CX-Leserergebnisse. Originalcaptures bleiben unverändert. Kontrollierte Callbackinputs ersetzen den Treiber; keine Hostmaus, keine tatsächliche INT33-Ausführung und kein Cursorbildvergleich.

## Mausinitialisierung mit kontrollierter Treiberantwort

`original-dos-mouse-init.ts` rekonstruiert CS:11C3..1248 als Folge von INT33-Aufträgen und Zustandsänderungen. Ein bereits gesetztes SS:0CA3 überspringt die Treiberinitialisierung. Sonst wird dieses Byte zunächst 1 und INT33/AX=0 aufgerufen. Antwort AX=0 belässt die Sperre, Cursorzeiger und Flags unverändert. Jede von null verschiedene Antwort führt zu AX=15/CX=16/DX=32 und setzt SS:0CAA/0CAC auf 2780:1C0B. Nur Modus SS:2896=1 fordert danach Position 160/100, horizontale Grenze 0..319, vertikale Grenze 0..199, AX=15 mit 32/32 und Callback AX=12/CX=63/ES:DX=CS:1249 an. Bei Erfolg wird die Sperre null und Bit2 von SS:0C9D gesetzt. Alle Pfade setzen zum Schluss SS:0CB1=FF. Der Modellname hiddenByte ist vorläufig; die vollständige Semantik dieses Bytes bleibt im Kontext zu prüfen.

`check-native-dos-mouse-init.py <memory.bin>` führt die Originalroutine einschließlich RET aus, fängt ausschließlich INT33 ab und liefert kontrolliert die Resetantwort; andere Register werden vom simulierten Treiber nicht verändert. Je 2304 Fälle beider identifizierten Captureprofile bestehen: alle 256 Modusbytes, Sperrbyte 0/1/255 und Resetantwort 0/1/FFFF. Verglichen werden Reihenfolge und explizite Registerargumente jedes Treiberaufrufs, Sperre, Flags, Cursorzeiger, Abschlussbyte sowie DS und Stackrückkehr einschließlich 16-Bit-SP-Wrap. Das Modell verspricht keine unbekannten Seiteneffekte beliebiger Maustreiber. Originalcaptures unverändert, keine Host-Eingaben.

Damit ist die zuvor ausschließlich statisch beschriebene Initialisierungsfolge unter diesem Treibervertrag gegen die CPU-Ausführung geprüft. Reale INT33-Treiberintegration, Cursorzeichnung sowie mögliche alternative Eingabepfade bleiben offen.

## Cursorhintergrund wiederherstellen: Grafiksegment 1E97:105D

Der Far-Einsprung 1E97:001C ruft 105D auf. Diese Routine sichert neun Register und stellt einen rechteckigen Hintergrund aus dem Cursorpuffer wieder her. Engine-DS wird 1C0B; ES stammt aus dem Far-Zeiger DS:0B84. Dessen Offset wird anschließend durch das erste Wort am Engine-DS-Offset DS:0CAA ersetzt. Die weiteren Headerworte sind Breite und Zeilenanzahl. Der Header wird somit in Engine-DS gelesen; erst für die Nutzdaten ab Puffer-Offset+6 wird DS auf den Segmentwert aus 0CAC umgestellt. Zeilenabstand im Ziel kommt aus Engine-DS:1DD5. Diese Segmenttrennung darf nicht stillschweigend zu einem einzigen beliebigen Puffer vereinheitlicht werden.

`original-dos-cursor-restore.ts` rekonstruiert den Kopierauftrag für DF=0, positive Zeilenanzahl und nicht überlaufende Pufferfenster. Ziel ist ein 65536-Byte-Segmentabbild, Quelle die getrennt bereitgestellten dicht gepackten Nutzdaten. Unberührte Zielbytes bleiben erhalten. Null Zeilen und Segmentüberläufe werden als noch nicht unterstützte Toolkitzustände abgewiesen; dies ist eine explizite Grenze des Modells und keine nachgewiesene Originalvalidierung. Die Bytekopie des Originalcodes ist kein Transparenzblit.

`check-native-dos-cursor-restore.py <memory.bin>` führt 105D einschließlich RET auf kontrolliertem RAM aus. Je 136 Fälle beider identifizierten Profile bestehen: Breiten 0/1/8/16, Höhen 1/3/16, Strides 20/320, drei Zieloffsets soweit nicht überlaufend und zwei unterschiedliche Nutzdatensegmente. Der im Far-Zeiger gespeicherte Offset wird absichtlich abweichend gesetzt. Verglichen werden SHA256 über das ganze 64-KiB-Zielsegment, sämtliche neun restaurierten Register und Stackrückkehr. Originalcaptures unverändert, keine Hostgrafik oder Originalgrafik exportiert.

Die zuvor offene Frage nach AX/BX-Veränderung durch 1E97:001C ist für diese unterstützten Pufferzustände beantwortet: Der Helfer stellt beide Register wieder her. 1E97:0020 führt hingegen über 0F2A zuerst 0FFA und dann 0F48 aus; Sichern des neuen Hintergrunds, Cursorformate, Clipping und Zeichnen bleiben getrennt zu rekonstruieren.

## Neuen Cursorhintergrund sichern: 1E97:0FFA

`original-dos-cursor-save.ts` rekonstruiert 0FFA..105C für gültige Koordinaten X=0..319/Y=0..199, DF=0 und nicht überlaufende Segmentfenster. Quelladresse ist das Offset aus DS:0B84 plus Y*Stride plus X; Stride kommt aus DS:1DD5. DS:0CAA/0CAC liefert den Zielpuffer als Far-Zeiger. Die Routine schreibt drei Little-Endian-Worte: berechnetes Bildschirmoffset, Breite und Zeilenanzahl. Danach folgen dicht gepackte Hintergrundbytes. Standard ist 16x16; ab X=304 Breite=320-X, ab Y=184 Zeilen=200-Y. Die Originalvergleiche sind signed; ungültige negative beziehungsweise außerhalb liegende Koordinaten sind keine hier unterstützte Clippingerweiterung und werden vom Toolkit abgewiesen.

`check-native-dos-cursor-save.py <memory.bin>` führt den Originalhelfer einschließlich RET aus und vergleicht Header, kopierte Bytes und unberührten Rest des 262-Byte-Zielpuffers über dessen gesamten Hash. Je 60 Fälle beider identifizierten Profile bestehen: sechs X-Werte vor/an/nach der Clippinggrenze, fünf Y-Werte sowie zwei Bildschirmbasisoffsets. DS und Stackrückkehr stimmen ebenfalls. Teststride=320, synthetische Bilddaten, keine Originalgrafik exportiert; Originalcaptures unverändert. Die übrigen Register sind in diesem inneren Helfer Arbeitsregister, ihre Wiederherstellung erfolgt erst im äußeren 0F2A.

Sichern und Wiederherstellen sind damit getrennt gegen Originalcode geprüft. Die Verbindung mit Cursorzeichnung 0F48 und mehreren Cursorformatzweigen bleibt offen. Ebenso ist die besondere Restore-Headeradressierung aus dem vorigen Abschnitt bei einer Komposition mit abweichendem Puffersegment zu berücksichtigen; keine implizite Gleichheit von Engine-DS und Puffersegment voraussetzen.

## Cursorzeichnung mit drei nativen Formatpfaden

`original-dos-cursor-draw.ts` rekonstruiert Grafiksegment 1E97:0F48..0FF9 für gültige 320x200-Koordinaten, DF=0 und nicht überlaufende Fenster. Ziel ist Bildschirmbasis DS:0B84/0B86 plus Y*Stride+X, Clipping wie beim Sichern auf maximal 16x16. Cursorquelle ist der Far-Zeiger DS:0CB4/0CB6. Formatbyte 0 verwendet einen sechs Byte langen Header und gepackte Nibbles ohne Palettenbasis. Formatbyte 10h verwendet acht Headerbytes und addiert Byte +6 als Palettenbasis. Alle anderen Formatbytes verwenden acht Headerbytes und einen Bytewert je Pixel.

In beiden gepackten Pfaden steht das High-Nibble vor dem Low-Nibble, Quellzeile acht Bytes; der Bytepfad verwendet 16 Bytes je Zeile. Null wird vor einer möglichen Palettenaddition als transparent übersprungen. Andere Werte schreiben (Wert+Basis) modulo 256; auch ein dadurch erzeugtes null wird tatsächlich geschrieben. Bei ungerader geclippter Breite wird das letzte Low-Nibble nicht gezeichnet, die Quellzeilen bleiben dennoch acht Bytes breit. Keine pauschale Alphakanalannahme oder Farbersetzung.

`check-native-dos-cursor-draw.py <memory.bin>` führt die Originalroutine einschließlich RET aus und vergleicht den vollständigen 64-KiB-Zielpuffer, unveränderte synthetische Cursorquelle, DS und Stack. Je 192 Fälle pro identifiziertem Profil: Formatbytes 0/16/1/255, Palettenbasis 0/250, sechs X- und vier Y-Werte an Innen-/Clippingpositionen. Die erzeugten Muster enthalten Null und sämtliche Bytewerte; die gepackten Pfade prüfen beide Nibbles. Die vollständige Bewegungskomposition mit Sichern und Wiederherstellen ist weiterhin offen; ebenso ungültige Koordinaten, Segmentüberlauf und reale Grafik-/Treiberintegration. Originalcaptures bleiben unverändert, keine Originalgrafiken im Repository.

## Zusammenhängende Cursorbewegung über Timerhelfer 670D

`check-native-dos-cursor-movement.py <memory.bin>` prüft jetzt 670D mit tatsächlichen Originalaufrufen 1259, 1E97:001C/105D und 1E97:0020/0F2A/0FFA/0F48, ohne Ersatzhelfer. Ein Unicorn-Prozessor und sein RAM bleiben über die Bewegung einer Sequenz erhalten. Zunächst zeichnet das Original bei 10/10 und erzeugt den Hintergrundpuffer; danach folgen unveränderte Position, überlappende Bewegung nach 11/11, Clipping bei 305/185, Ecke 319/199 und Rückkehr zu 10/10. Erwartungswerte entstehen aus den produktiven Save-/Restore-/Draw-Teilmodellen in `dos-cursor-movement-vectors.mjs`, einschließlich Erhalt des alten unüberschriebenen Hintergrundpufferrests bei kleinerem Rechteck.

Je 24 Sequenzen bzw. 120 Aufrufe beider identifizierten Profile bestehen: drei Cursorformate, Guardbyte 0/FF, Modus 0/1 und Ausblendbyte 0/FF. Nach jedem Aufruf stimmen ganzer 64-KiB-Bildpuffer, kompletter 262-Byte-Hintergrundpuffer, gespeicherte Position, Guardbyte sowie neun wiederhergestellte Register und Stack überein. Der Hintergrundpuffer liegt hierfür wie bei der Initialisierung im Engine-Datensegment. Keine Originalgrafik wird verwendet oder verteilt; Capturedateien unverändert.

Die geprüfte Steuerung: Modusbyte null oder signed-negatives DS:0CB1 kehrt sofort zurück. Sonst wird Guard DS:0CB2 inkrementiert, und nur Überlauf auf null führt zum Snapshotvergleich. Bei nicht verändertem AX/BX wird nicht gezeichnet. Bei Änderung wird zuerst der alte Hintergrund restauriert, dann AX/BX nach 0CA6/0CA8 geschrieben, danach neuer Hintergrund gesichert und der Cursor gezeichnet. Abschließend wird das Guardbyte dekrementiert und die Register werden restauriert. Die Grafikhelfer erhalten AX/BX in dieser Komposition, womit die zuvor offene Frage zu den Koordinatenstores für die geprüften Zustände geschlossen ist.

Grenzen: Diese Kompositionsprüfung betrifft gültige Koordinaten im Modus 1 sowie übersprungene Modus-0-Pfade, DF=0 und Guards 0/FF. Keine echte Interruptverschachtelung, kein Maustreiber und keine ungültigen Koordinaten. Die Herkunft und Lebensdauer der Guard-/Ausblendbytes sowie andere Eingabemodi bleiben weiter zu verfolgen. Die vollständige Timerfunktion mit allen vorherigen Callbacks ist weiterhin offen.

## Produktive Komposition des Cursor-Timerhelfers

`original-dos-cursor-tick.ts` stellt die zuvor im Prüfvektor komponierte 670D-Steuerung nun als zusammenhängende Bibliotheksfunktion bereit. Sie verbindet die produktiven Snapshot-, Restore-, Save- und Draw-Modelle; keine zweite vereinfachte Cursorlogik. Eingaben sind explizite rohe Snapshotfelder und normalisierter Cursorzustand, Ausgaben kopierte Bild-/Hintergrundpuffer, gespeicherte Position und Bewegungsentscheidung. Alte Eingabepuffer und Sprite bleiben unverändert, was der Vektorgenerator über Hashvergleiche prüft. Kein automatischer Anschluss an Browsermaus oder frei gewählter Scheduler.

Der bestehende native Bewegungstest verwendet nun direkt diese Laufzeitfunktion als Erwartungsquelle. Erweiterung: Guardwerte 0/1/127/254/255 und Ausblendbytes 0/127/128/255. Je 120 Sequenzen mit 600 Aufrufen beider Originalprofile stimmen überein, einschließlich unveränderter und überlappender Positionen, Clipping sowie übersprungener Zweige. Die bisherige 24-Sequenz-Prüfung wird dadurch erweitert. Typprüfung separat ausführen: `npm run typecheck`.

Geltungsbereich bleibt DF=0, Bildschirmbasis null, Stride320, Hintergrundpuffer im Engine-DS und gültige nicht überlaufende Koordinaten. Snapshot-Sperre kann im Original FFFF liefern; eine dadurch außerhalb des unterstützten Zeichenbereichs liegende Bewegung wird vom Toolkit als ununterstützt abgewiesen, nicht erfunden auf den Bildschirm geklemmt. Keine Behauptung vollständiger Maus- oder Timerintegration. Nächste offene Verbindung sind die Synchronisierungshelfer 1183/11A5 und die übrigen Timer-Callbacks.

## Cursorzugriff synchronisieren: 1183 und 11A5

`original-dos-cursor-sync.ts` rekonstruiert einen Versuch der Schleife CS:1183..119B sowie Freigabe 11A5..11B3. Bei Modus SS:2896 ungleich null erhöht 1183 das Guardbyte SS:0CB2. Nur Überlauf FF->00 kehrt zurück. Andernfalls dekrementiert es das Byte wieder und springt zum nächsten Versuch; ohne externen Zustandswechsel wartet es unbegrenzt. Das Toolkit meldet deshalb `retry` an dieser Schleifengrenze, keinen erfundenen Erfolg und keinen blockierenden Host-Spin. Freigabe schreibt FF. Beide Zweige verändern IF nicht.

Im Modus 0 führen die alternativen Pfade 119C bzw. 11B4 CLI, gesichertes AX, OUT Port21 mit FE bzw. 00, Wiederherstellung AX und STI aus. Sie lesen oder bewahren keine alte PIC-Maske; ein Modell mit automatischer Maskenwiederherstellung wäre falsch. IF ist nach beiden zurückkehrenden Modus-0-Pfaden gesetzt, unabhängig vom Eingangswert. Guardbyte bleibt dort unverändert.

`check-native-dos-cursor-sync.py <memory.bin>` prüft je 3072 Fälle beider identifizierten Originalprofile: beide Operationen, Modi 0/1/FF, sämtliche 256 Guardbytes und IF an/aus. Verglichen werden Retry/RET, Guardbyte, genaue Portausgabe, IF, AX und Stackrückkehr. Bei wiederholendem Pfad wird vor dem zweiten Schleifenversuch angehalten, nachdem ADD und SUB des ersten vollständig ausgeführt wurden. Originalcaptures unverändert; keine echten IRQs und kein Host-PIC-Zugriff. Die Integration mit verschachtelten Interrupts und die Aufrufer im gesamten Grafikablauf bleiben offen.

## Vollständiger Timerpfad mit deaktivierten frühen Callbacks

`check-native-dos-cursor-movement.py <memory.bin> --full-timer` führt nun das Original ab 1000:0D98 bis einschließlich IRET oder Übergabe an den gespeicherten Handler aus. Die beiden frühen Callback-Gates DS:2898 und CS:9414 sind kontrolliert null, Geräteausgabe CS:E940 ebenfalls null. Keine Callinstruktion wird ersetzt. Die drei Timerdatensätze sind aktiv und entwickeln sich über mehrere Interrupts bis zum Ablauf; gleichzeitig laufen Snapshot, Cursorrestore und Cursorzeichnung. Erwartungswerte verwenden die produktiven Datensatz-, Cursor- und Rückkehrmodelle.

Je 120 Sequenzen mit 600 Interrupts beider identifizierten Profile bestehen. Verglichen werden zusätzlich zu den bisherigen Bild-/Cursorzuständen alle 48 Datensatzbytes, Auswahlindex, saturierender Eingangszähler, persistenter Rückkehrzähler, Port20=60h, neun wiederhergestellte Register und Stack. Die Sequenzen erreichen sowohl IRET mit IF/DF aus dem IRQ-Frame als auch die Far-Übergabe mit erhaltenem IRQ-Frame auf dem Stack. Der gespeicherte externe Handler wird nur als Ziel erreicht, nicht ausgeführt. IRQs werden kontrolliert injiziert, kein Hardwaretiming oder Host-Portzugriff. Originalcaptures unverändert.

Dies ist ein durchgehender Original-Timerpfad unter den genannten Gates, keine vollständige Verifikation aller Timerkonfigurationen. Aktive frühe Far-Callbacks, andere Audiogeräte, externe Handlerimplementierung und tatsächliche Interruptverschachtelung bleiben offen. Die bisherige direkte 670D-Prüfung bleibt ohne `--full-timer` verfügbar und isoliert weiterhin den Cursorablauf.

## Früher Timer-Callback: native Palettenannäherung

Der Far-Call 1E97:0EA8 führt über seinen Countdown zur Routine 0EC9..0F29. Diese bearbeitet 0300h=768 Bytes zwischen Engine-DS:0E43 (aktuell) und 1443 (Ziel), entsprechend 256 Dreiergruppen. `original-dos-palette-step.ts` rekonstruiert diese reine Rechenroutine direkt aus dem Originalcode. Sie ist ausdrücklich getrennt vom früheren `reference-dos-palette-transition.ts`, das nur den ALIS-C-Referenzansatz mit Fließkommadeltas beschreibt.

Alle ungleichen Bytes setzen DS:0CB8 auf 1, auch wenn der aktuelle Schritt bereits das Ziel erreicht. Nur eine vollständig gleiche Eingangspalette erzeugt 0. REPE CMPSB vergleicht Ziel gegen aktuell; die folgenden JL/JG-Zweige sind signed8. Je nach Vergleich wird Schrittbyte DS:0CBE zum aktuellen Byte addiert oder davon subtrahiert (modulo256) und wiederum signed mit dem Ziel verglichen; bei Überschreiten wird das Ziel übernommen. Nullschritt beendet ungleiche Paletten nicht. Im normalen Farbwertebereich entspricht dies einer begrenzten Annäherung, außerhalb davon bleiben die belegten signed-/Wrap-Effekte erhalten. Kein erfundener zeitlicher Interpolator.

`check-native-dos-palette-step.py <memory.bin>` führt 0EC9 einschließlich RETF aus und vergleicht die produktive TypeScript-Funktion. Je 516 volle Palettenfälle beider identifizierten Profile decken für jede Schrittweite 0/1/4/63/128/255 sämtliche 65536 Eingangs-/Zielbytepaare ab (in 768-Byte-Blöcken, letzter Block aufgefüllt). Geprüft werden vollständige Ergebnispalette, Aktivflag, unveränderte Zielpalette, neun wiederhergestellte Register, Stack und vom Original gelöschtes DF. Originalcaptures unverändert; keine Originalpalette exportiert und keine Hardware-I/O.

Der äußere Callback 0EA8 und der vorgeschaltete Helfer 0BDB enthalten zusätzliche Countdown-, Palette-Upload- und gegebenenfalls Retrace-Abhängigkeiten. Diese sind noch nicht durch das neue Rechenmodell abgedeckt. Der frühe Callback darf daher noch nicht als vollständig rekonstruierte oder hardwareverifizierte Überblendung aktiviert werden. Der zweite frühe Far-Callback 1941:262C ruft über einen dort gespeicherten Datensegmentzeiger den Helfer 0767 auf und bleibt getrennt zu untersuchen.

## Native differenzielle Palettenausgabe 0BDB

`original-dos-palette-upload.ts` rekonstruiert 1E97:0BDB..0C3B als I/O-Auftragsfolge. Verglichen werden 256 Dreiergruppen der aktuellen Palette Engine-DS:0E43 mit dem Schattenpuffer 1143. Nur bei mindestens einem abweichenden Kanal folgen OUT 3C8 mit dem Farbindex und drei OUT 3C9 mit den unveränderten rohen Kanalbytes. Die ganze geänderte Dreiergruppe wird im Schattenpuffer aktualisiert; unveränderte Gruppen erzeugen keine Portausgabe. Es findet hier weder Skalierung noch Maskierung auf sechs Bit statt.

SS:0C69 genau 1 aktiviert vor dem Vergleich eine Schleife mit IN Port3DA bis Bit3 gesetzt ist. Andere Bytewerte überspringen die Schleife. Das Modell nimmt deren Bereitschaft explizit an und liefert andernfalls `wait-retrace`, ohne Host-Spin oder vorzeitige Ausgabe. Native Hardwarezeit wird nicht modelliert. Jeder geänderte Farbeintrag hat CLI vor und STI nach der Ausgabe; nach mindestens einem Eintrag ist IF daher gesetzt. Ohne jede Änderung bleibt das eingehende IF erhalten. AX ist Arbeitsregister, die sieben gesicherten Register BX/CX/DX/ES/DI/DS/SI werden wiederhergestellt. DF=0 ist Vorbedingung dieses Modells, da der Helfer selbst kein CLD setzt.

`check-native-dos-palette-upload.py <memory.bin>` prüft jeweils 72 Fälle beider identifizierten Profile: Retracemodi 0/1/2, IF an/aus, gleiche/komplett unterschiedliche Paletten, gezielte Änderungen im ersten/mittleren/letzten Farbkanal und ein verteiltes Muster; Retrace entweder sofort oder nach zwei nicht bereiten Leseergebnissen. Portfolge, Schattenpuffer, unveränderte aktuelle Palette, Leseanzahl, IF, gesicherte Register und Stack stimmen gegen die produktive Funktion überein. Getestet sind damit zurückkehrende Pfade mit kontrolliert irgendwann bereitem Retrace; keine Aussage über reale Bildwiederholfrequenz. Originalcaptures unverändert, keine Hostports und keine Originalpalette exportiert.

Der äußere Fade-Countdown in 0EA8 und die Kombination Upload-vor-Rechenschritt sind weiterhin gemeinsam zu rekonstruieren und zu prüfen.

## Vollständiger Paletten-Callback mit Countdown

`original-dos-palette-tick.ts` komponiert 1E97:0EA8..0EC8 mit dem echten Upload- und Rechenschrittmodell. Modebyte DS:0CB9 genau 1 überspringt den gesamten Callback. Andernfalls wird zuerst 0BDB ausgeführt: Die bisherige aktuelle Palette gelangt gegebenenfalls an den DAC, und erst danach wird Byte DS:0CBD modulo256 dekrementiert. Nichtnegatives Ergebnis 0..127 kehrt ohne Rechenschritt zurück. Signed-negatives Ergebnis 128..255 lädt aus DS:0CBC nach und führt 0EC9 aus. Das neue aktuelle Farbergebnis ist daher noch nicht im soeben aktualisierten Schattenpuffer; es wird erst bei einem folgenden Aufruf ausgegeben. Eine Vertauschung von Berechnung und Upload wäre falsch.

Das Aktivbyte DS:0CB8 bleibt ohne Rechenschritt erhalten. Mit Rechenschritt richtet es sich nach den Eingangsunterschieden zwischen aktuell und Ziel, wie zuvor geprüft. Auch ungewöhnliche Countdownwerte behalten die Originalarithmetik: Eingang 128 ergibt 127 und löst keinen Schritt aus; Eingang 129 ergibt 128 und löst einen aus. Das Modell setzt keinen beliebigen Millisekunden- oder Browserframe-Takt voraus. Bei nicht bereitem Retrace meldet es die Warteposition vor jeder Countdownänderung.

`check-native-dos-palette-tick.py <memory.bin>` führt 0EA8 samt beiden Originalhelfern einschließlich RETF aus. Je 216 Fälle beider identifizierten Profile bestehen: Countdowns 0/1/127/128/129/255, Reload 0/2/255, Mode 0/1/2, gleiche und unterschiedliche Paletten sowie IF an/aus. Geprüft werden alle drei 768-Byte-Puffer, Countdown, Aktivbyte, genaue Portfolge, Retrace-Leseanzahl, IF, acht erhaltene Register und Stack. AX ist im äußeren Callback nicht als erhalten behauptet. Kontrollierter sofort bereiter Retrace; keine Hosthardware und keine Änderung der Capturedateien.

Damit ist die zuvor offene Verbindung aus Upload, Countdown und Berechnung für diesen Treibervertrag geprüft. Die äußeren Gates im Timer (DS:2898 und 0CB8), mehrtaktige Fadefolgen bis zum Ende sowie das tatsächliche Anzeigetiming müssen noch im Gesamtablauf verifiziert werden.

## Palettenfolgen bis zum Ende im Original-Timer

`check-native-dos-palette-sequence.py <memory.bin>` führt vollständige Interrupts ab 1000:0D98 einschließlich des frühen Palette-Callbacks und IRET aus. Ein Prozessor/RAM bleibt pro Sequenz über alle Ticks erhalten. DS:2898 variiert 0/1, und DS:0CB8 bestimmt bei aktiviertem Gate tatsächlich den Aufruf. Erwartungswerte aus `dos-palette-sequence-vectors.mjs` verwenden das produktive Callbackmodell, ergänzt nur um die belegte äußere Gatebedingung. Es wird kein Originalhelfer durch RET ersetzt.

Je 16 Sequenzen mit insgesamt 96 Ticks beider identifizierten Profile bestehen: Auf-/Abblenden zwischen Kanalwerten20 und30, Nachladewerte0/2, Callbackmodus0/1 sowie äußeres Gate0/1. Aktive Folgen laufen bis zur Abschaltung und über zwei weitere inaktive Ticks; deaktivierte Folgen werden nach fünf unveränderten Ticks begrenzt. Nach jedem IRQ stimmen alle drei Palettenpuffer, Countdown, Aktivflag, vollständige Portfolge einschließlich Timer-EOI, Retrace-Leseanzahl, neun Aufruferregister, Stack und IF/DF aus dem IRQ-Frame überein. Originalcaptures bleiben unverändert.

Wichtiger Abschluss: Sobald der aktuelle Puffer den Zielwert erreicht, bleibt das Aktivflag zunächst gesetzt, weil der Rechenschritt noch Unterschiede als Eingang sah. Der nächste Aufruf kann diese finale Palette ausgeben. Erst ein weiterer fälliger Rechenschritt ohne Eingangsunterschiede löscht das Aktivflag, und folgende Timerinterrupts überspringen den Callback. Die Verzögerung durch den Reload bleibt dabei erhalten; keine vorzeitige Beendigung anhand bloßer Zielgleichheit.

Grenzen: Synthetische Farbwerte, kontrolliert sofort bereiter Retrace und injizierte IRQ-Frames. Zweiter früher Callback, Audiogeräte und Cursor sind in diesem Test deaktiviert; ihre separaten Prüfungen bleiben erforderlich. Keine Aussage über reale Bildwiederholfrequenz, Interruptverschachtelung oder vollständigen Grafikbetrieb. Für diese Änderung an Prüfskripten/Dokumentation wurde keine unveränderte TypeScript-Typprüfung erneut ausgeführt.

## Zweiter früher Callback: Audiopfad und rohe Steuerwert-Hüllkurve

1941:262C sichert neun Register, lädt DS aus CS:1406 und ruft 0767 auf. 0767 prüft zunächst CS:0013 (null: Rückkehr) und CS:0014 (nichtnull: Rückkehr), ruft danach 0322 und verarbeitet weitere Zustände und vier Datensatzgruppen. Der Datensegmentzeiger CS:1406 ist im ersten Interruptcapture noch null; aktiver Betrieb benötigt daher noch die Analyse der zugehörigen Initialisierung. Der Callback ist kein belegter generischer NPC-/Spielzeit-Tick.

`original-dos-audio-envelope.ts` rekonstruiert zunächst 1941:0322..03A4. Die Bezeichnung Hüllkurve beschreibt die Struktur und ist keine abschließend belegte musikalische Feldsemantik. Byte CS:0007 ist der Basiswert; Byte0012 steuert das Überspringen der ersten Phase. Wenn diese nicht übersprungen wird, dekrementiert ein nichtnull Wort000C und berechnet Basis minus Lowbyte von (neuer Zähler * Basis / Wort000E), modulo256. Danach folgt bei nichtnull Wort0010 eine Haltephase: signed-negativer Wert kehrt unverändert zurück, positiver Wert wird dekrementiert und Basis übernommen. Sonst folgt ein nichtnull Wort0008 mit Dekrement und Lowbyte von (neuer Zähler * Basis / Wort000A). Sind diese Pfade ausgeschöpft, wird der Far-Aufruf1000:8A97 angefordert.

Jeder berechnete Wert schreibt Byte0006 und (Wert+1) modulo256 in CS:071B, also auch einen im späteren Code verwendeten Operanden. Die exakte Wirkung dieses Operanden und die Hersteller der Zähler bleiben weiter zu verfolgen. Multiplikation und Division sind unsigned16; Nullteiler oder zu großer Quotient lösen im Original eine DIV-Ausnahme aus. Das Toolkit weist diese Zustände ausdrücklich ab und erfindet keinen Ersatzwert.

`check-native-dos-audio-envelope.py <memory.bin>` vergleicht alle genannten CS-Felder, Operand, Stopentscheidung und Stacktiefe mit Originalausführung bis RET oder vor dem Stop-Aufruf. Je432 Fälle beider identifizierten Profile bestehen: vier Basisbytes, zwei Steuerbytes, erste/letzte Zähler0/1/FFFF, Haltewerte0/1/8000 und zwei nichtfaultende Teiler. Die gesamte Rechenroutine wird ausgeführt, kein C-Referenzcode als Ersatz. Originalcaptures unverändert. Nicht bewiesen sind echte Lautstärke-/Klangwirkung, Ausnahmebehandlung, Stop-Zielroutine und der restliche Vierdatensatzpfad.

## Direkter Audio-Steuerwert: Setzen und Lesen

Die Originalzugriffe 1941:01D1..01E1 und 01E2..01E8 sind jetzt in `original-dos-audio-envelope.ts` rekonstruiert. Der Setter nimmt AL, verschiebt es logisch um ein Bit nach rechts und kopiert das Ergebnis nach CS:071B, CS:0006 und CS:0007. AX wird durch PUSH/POP vollständig erhalten. Der Leser lädt CS:0006 in AL und verschiebt links; das Ergebnis ist modulo256, AH bleibt erhalten. Für normale gesetzte Werte bedeutet Lesen nach Setzen daher Eingabe &FEh, keine verlustfreie Rückgabe ungerader Eingaben.

Die Kopplung zum zuvor rekonstruierten Hüllkurvenmodell ist ausdrücklich unterschiedlich: Der direkte Setter schreibt den halbierten Wert unverändert in CS:071B; die Hüllkurve schreibt dort dagegen ihren berechneten Wert plus1 modulo256. Diese zwei Originalpfade dürfen nicht zu einem gemeinsamen vermeintlichen Clamp vereinheitlicht werden. Die API benennt das Feld vorerst als rohen Audio-Level; tatsächliche akustische Verstärkung und Gerätesemantik bleiben offen.

`check-native-dos-audio-level.py <memory.bin>` führt Setter und Getter inklusive RETF aus. Je1024 Setterfälle pro identifiziertem Originalprofil decken alle256 Eingabebytes mit vier alten Zuständen ab; anschließend wird jeweils der Leser ausgeführt. Weitere256 Getterfälle decken sämtliche rohen gespeicherten Werte ab. Die drei geschriebenen Felder, alle übrigen Hüllkurvenfelder, erhaltenes AX beim Setzen, erhaltenes AH beim Lesen und Stackrückkehr stimmen. Der Vektorgenerator prüft außerdem, dass der produktive Setter seine Eingabeobjekte nicht verändert. Originalcaptures unverändert.

Der untersuchte Stop-Aufruf1000:8A97 ist weiterhin nicht als vollständig rekonstruiert auszugeben. Er ruft zunächst1941:019D auf, das anhand CS:0005 entweder2666 oder562/46E aufruft. Danach folgt bei nichtnull DS:28B0 ein weiterer noch nicht rekonstruierter Aufruf und erst anschließend das Löschen mehrerer Engineflags. Das Gesamtverhalten einschließlich Gerätezweigen bleibt zu verfolgen; bloßes Nullsetzen wäre kein gleichwertiger Ersatz.

## Audiotakt beim Stop zurücksetzen: 1941:0562

`original-dos-audio-clock-stop.ts` rekonstruiert 1941:0562..059A einschließlich Helfer05A1. CS:0005 ungleich null kehrt sofort ohne Ausgabe oder IF-Änderung zurück. Andernfalls wird der Interruptvektor0000:0020 mit Offset CS:059D und Segment CS:059B restauriert. Port43 erhält36h, Port40 Low-/Highbyte des Worts Engine-DS:288C. Nach DS-Wiederherstellung folgt STI; Helfer05A1 liest Port21, löscht Bit0 und schreibt die Maske zurück. Andere Maskenbits bleiben erhalten. Das ist ein anderer Originalpfad als der separat rekonstruierte Sampletimer-Stop1000:8E2C und darf nicht gleichgesetzt werden.

`check-native-dos-audio-clock-stop.py <memory.bin>` führt die gesamte Routine bis einschließlich RET aus. Je4608 Fälle beider identifizierten Profile bestehen: Gerätebyte0/1/FF, drei Timerteiler, sämtliche256 Port21-Eingangsbytes und IF an/aus. Die gespeicherten Vektorworte variieren mit dem Portbyte. Geprüft werden Vektor bzw. dessen unveränderter Zustand im übersprungenen Pfad, vollständige Portfolge, Leseanzahl, IF, DS und Stack. Keine Behauptung, dass AX/BX/CX/DX im inneren Helfer erhalten sind. Originalcaptures unverändert; kein Host-PIC oder Hosttimer wird verändert.

Die folgende Routine1941:046E setzt DS=1BAC und wählt über Wort CS:0000 eine Near-Call-Tabelle ab0487 (Index minus1, Wortschritte). Indexnull setzt Carry und kehrt zurück. Die gültigen Geräteindizes und deren Zielroutinen sind weiterhin zu untersuchen; daraus wird kein erfundener universeller Stop abgeleitet. Der andere Stopzweig über2666 enthält Registerausgaben über Ports388/389 und einen Schattenbereich, deren Zusammenspiel noch nicht geprüft ist. Der äußere Stop8A97 bleibt insgesamt offen.

## FM-Registerausgabe und Stopzweig bei nichtnull Gerätebyte

`original-dos-fm-register.ts` rekonstruiert1941:240A..2427 sowie die Stopfolge2666..269E. Registeradresse aus AH geht nach Port388h, danach liest der Originalcode viermal Statusport388h. Datenbyte aus AL geht nach389h, anschließend folgen23 weitere Statusreads. Rückgabewerte der Reads werden verworfen, der Helfer stellt AX und seine gesicherten Register wieder her. Das geschriebene Byte landet zusätzlich im256-Byte-Schattenbereich CS:230A+Register. Diese Reihenfolge bleibt als Read/Write-Aufträge erhalten; daraus wird keine tatsächliche Wartezeit oder Klangerzeugung behauptet.

Die Stopfolge schreibt absteigend Register55h..40h jeweils3Fh (22 Einträge), dann B8h..B0h jeweils0 (9 Einträge), zuletzt BDh=0. Insgesamt32 Registerschreibungen und864 Statusreads. Der äußere1941:019D-Zweig bei CS:0005 ungleich null löscht vor dieser Folge CS:0004. Dieses Byte ist physisch identisch mit1000:9414 und damit dem zuvor nachgewiesenen Gate des zweiten frühen Timer-Callbacks. Der Zusammenhang zwischen diesem Stopzweig und der Deaktivierung weiterer Callbackausführung ist somit direkt belegt.

`check-native-dos-fm-register.py <memory.bin>` vergleicht je768 einzelne Registerschreibungen pro Originalprofil (alle256 Adressen mit Daten0/63/FF) sowie zwei vollständige Stopzweig-Ausführungen ab019D mit verschieden gefüllten Schattenpuffern. Alle I/O-Ereignisse einschließlich Reihenfolge der Statusreads, kompletter Schattenpuffer, gelöschtes Callbackflag, unverändertes Gerätebyte, Register und Stack stimmen. Die Statusantworten variieren synthetisch und beeinflussen das Ergebnis nicht. Originalcaptures unverändert, keine Hostports oder Originalmusik verteilt.

Der Zweig CS:0005=0 über562 und Geräte-Near-Call-Tabelle046E bleibt noch zu vervollständigen. Ebenso sind äußerer Stop1000:8A97, tatsächlich unterstützte Geräteauswahl und akustische FM-Synthese noch nicht vollständig rekonstruiert. Die Prüfungen belegen rohe Registerprotokolle, keinen Klangvergleich.

## Hüllkurvenende einschließlich äußerem FM-Stop

`check-native-dos-audio-envelope.py <memory.bin> --complete-fm-stop` führt nun beim Stopentscheid auch1000:8A97 und1941:019D/2666 samt240A-Registerhelfern aus. Der Gerätebytezweig ist ausdrücklich CS:0005=1, der zusätzliche Handle DS:28B0=0. Keine Originalroutine wird als NOP oder Ersatz-RET übersprungen. Die Erwartungs-I/O und der Schattenpuffer stammen aus dem produktiven FM-Stopmodell; die Hüllkurvenfelder aus deren produktivem Rechenmodell.

Je432 Fälle beider identifizierten Originalprofile bestehen, darunter80 tatsächliche Stops und352 reguläre/nichtbeendende Fälle. Bei Stop stimmen die vollständige32-Registerfolge samt864 Statusreads, gesamter FM-Schattenpuffer, Callbackflag1941:0004 und die nachfolgenden Clear-Writes Engine-DS:0E0A,0CD8 sowie1000:86C1 überein. Nichtbeendende Fälle erhalten diese Flags und den Schattenpuffer. Der Handle bleibt null. Alle neun Eingangsregister werden durch die komplette Verschachtelung restauriert und die Rückkehr zum Aufrufer ist geprüft. Capturedateien bleiben unverändert.

Der bisherige Einzelmodus ohne Option bleibt verfügbar und stoppt weiter vor8A97. Die neue Komposition schließt den äußeren Stop nur für den genannten FM-/Nullhandlepfad; Gerätebyte0, Geräte-Near-Call-Tabelle, nichtnull Handle, reale Hardwarewirkung und vollständiger Musikbetrieb bleiben offen. Für diese reine Prüfskript-/Dokumentationsänderung wurde keine unveränderte TypeScript-Typprüfung wiederholt.

## Nicht-FM-Stop mit erfassten Geräte-Tabellenzielen

`original-dos-audio-device-stop.ts` komponiert1941:019D bei Gerätebyte CS:0005=0 mit0562 und046E. Geprüfter Geltungsbereich sind Tabellenindizes0..7 und die unveränderten Zielbytes der identifizierten ersten Interruptcaptures. Index0 setzt Carry. Index1 führt Ziel1383 aus: IN61, AND FC, OUT61, OUT43=B6h, OUT42=33h, OUT42=05h. Indizes2/3 zeigen auf133B/1273, Indizes4..7 auf13D6; dort steht im Capture jeweils RET. Es wird ausdrücklich noch nicht behauptet, dass alle Targets während späterer Initialisierung unverändert bleiben oder diese Indizes eine vollständige Liste gültiger Gerätekonfigurationen sind. Das Original prüft hier keine obere Indexgrenze; das Toolkit weist außerhalb des untersuchten Bereichs ab.

046E setzt vor der Auswahl DS=1BAC. Dessen Registeränderungen werden erst im äußeren019D wiederhergestellt. Der bereits geprüfte Timerreset0562 läuft davor, mit restauriertem Vektor und PIT/PIC-Ausgaben. Anders als der nichtnull-Gerätebytezweig löscht019D in diesem Zweig das Callbackflag CS:0004 nicht. Die Differenz bleibt erhalten, ohne eine pauschale Deaktivierung zu erfinden.

`check-native-dos-audio-device-stop.py <memory.bin>` führt019D einschließlich aller tatsächlichen Unteraufrufe und RETF aus. Je192 Fälle beider identifizierten Profile bestehen: acht Indizes, zwei Timerteiler, zwei PIC- und drei Lautsprecherportwerte sowie IF an/aus. Verglichen werden vollständige OUT-Folge, IN-Portreihenfolge, Vektor, unverändertes Callbackflag, Carry/IF, neun restaurierte Register und Stack. Originalcaptures unverändert; keine Hosthardware.

Offen bleiben insbesondere spätere Patches der Tabellenziele, die belegte Konfigurationsquelle der Geräteindizes sowie die Komposition mit dem äußeren8A97 und dessen nichtnull Handlepfad. Das neue Modell benennt deshalb seine Bindung an den erfassten Originalzustand ausdrücklich.

## Ressourcenhandle beim Audio-Stop: bedingte Grenzblockfreigabe

Der Near-CALL bei1000:8AB8 hat Bytes E8 95 7F. Eine lineare Disassemblerdarstellung zeigt Ziel10A50; im tatsächlichen16-Bit-IP erfolgt der Wrap nach0A50 im selben Segment1000. Der gesamte Original-Stop wurde nun durch dieses tatsächliche Ziel ausgeführt; keine zusätzliche Codeadresse oder indirekte Ersatzroutine ist nötig.

`original-dos-memory-release.ts` rekonstruiert1000:0A50..0A6E. DX ist ein Segmenthandle; der Helfer vermindert es modulo65536 um1 und vergleicht das Ergebnis mit Engine-DS:0B96. Nur bei Gleichheit wird das erste Wort aus diesem Headersegment gelesen, zum Segmentwert addiert (modulo65536) und als neue Grenze nach0B96 geschrieben. Bei Ungleichheit bleibt die Grenze unverändert. DS/ES/SI werden gesichert, DX und AX sind Arbeitsregister. Dies ist keine nachgewiesene allgemeine Freiliste und keine DOS-Speicherfreigabe. Header-/Allokationsinvarianten und die Zuteilung bleiben separat zu rekonstruieren.

`check-native-dos-memory-release.py <memory.bin>` führt den Helfer einschließlich RET aus. Je24 Fälle beider identifizierten Profile bestehen: Handles0/1/1000h/FFFFh, passende/nichtpassende Grenze und Headerworte0/1/FFFFh. Geprüft werden Grenzupdate, DX, DS/ES/SI und Stack, einschließlich Segmentarithmetik am Wrap. Headerdaten sind kontrolliert; Originalcaptures unverändert.

Zusätzlich erweitert `check-native-dos-audio-envelope.py <memory.bin> --complete-fm-stop --with-resource` die vorhandene Komposition auf Handle4000h, passenden Header3FFFh mit Wort32 und die echte äußere Stoproutine8A97. Je432 Fälle beider Profile bestehen, darunter80 Stops mit tatsächlich ausgeführter Freigabe. Nach Stop ist der Handle null und die Grenze401Fh; reguläre Fälle erhalten Handle/Grenze. FM-I/O, Schattenpuffer, Hüllkurvenfelder, Clear-Writes, neun Register und Stack stimmen weiterhin. Damit ist dieser nichtnull Handlepfad im FM-Stop nachgewiesen; ungültige Header, nichtpassende Grenze innerhalb der äußeren Komposition, andere Gerätezweige sowie der vollständige Allocator bleiben offen.

## Segmentblock zuteilen und wieder freigeben

`original-dos-memory-allocate.ts` rekonstruiert1000:0A14..0A4F. Anfrage ist das16-Bit-Wort AX. Paragraphenanzahl ist (((AX+16) modulo65536) >>4)+1. Dieser Zusatz und das Wrap vor dem Shift sind Bestandteil des Originalcodes, keine gewöhnliche ceil(size/16)-Formel. Kandidat ist (SS:0B96 minus Paragraphen) modulo65536. Ein unsigned Vergleich gegen SS:0BCA entscheidet: kleiner bedeutet Fehlschlag, DX=0 und unveränderte Grenze; sonst wird0B96 zum Kandidaten, das erste Wort dieses Headersegments erhält die Paragraphenanzahl und DX=(Headersegment+1) modulo65536. AX wird in beiden Fällen0. BX/DS/SI werden gesichert.

Das Modell bildet diese rohe Rechnung ab, ohne sie als sicheren Hostallocator zu verwenden. Insbesondere prüft das Original hier den Borrow der Subtraktion nicht gesondert; kontrolliert ungültige Grenzen können deshalb überlaufende Ergebnisse zulassen. Auch Handle0 ist bei künstlichen Randzuständen als erfolgreicher Wrap darstellbar und damit über DX allein nicht von Fehler zu unterscheiden. Der tatsächliche Engine-Speicheraufbau muss solche Zustände einordnen; es wird keine neue Fehlerkonvention eingeführt.

`check-native-dos-memory-allocate.py <memory.bin>` führt Zuteilung und anschließend bei Erfolg die zuvor rekonstruierte Freigabe0A50 im selben CPU/RAM aus. Je192 Fälle beider identifizierten Originalprofile bestehen: zwölf Größen einschließlich16-Byte-Grenzen und FFEF/FFF0/FFFF, vier obere Grenzen und vier Untergrenzen. Geprüft sind Ergebnisregister, Headerwort, Grenze, Fehlschlag sowie BX/DS/SI und Stack.111 erfolgreiche Fälle je Profil stellen durch die echte Freigabe exakt die ursprüngliche Grenze wieder her. Die Tests prüfen damit eine Komposition, nicht nur eine Formel. Originalcaptures unverändert.

Offen bleiben Initialisierung und Anpassung beider Grenzen, weitere Allokationsarten, Blocklebensdauer außerhalb der getesteten LIFO-Freigabe sowie Integration in vollständigen Ressourcenbetrieb. Keine Aussage eines bereits vollständig rekonstruierten Speicherverwalters.

## Obere Speichergrenze beim Start und Bildpufferreservierung

`original-dos-memory-layout.ts` rekonstruiert den Startabschnitt1000:087D..08EA. Vorgelagerte BIOS-/Alternativallokationsaufrufe sind noch Eingaben dieses Modells. Der Abschnitt wählt zunächst64000 Bytes; nur bei SS:2898=0 und SS:2892=1 werden abhängig von SS:2896 null/nichtnull16384 bzw.32000 Bytes gewählt. Ist das vorhandene Bildpuffersegment SS:0B8A null, wird die Größe in Paragraphen vom eingehenden AX abgezogen (modulo65536), SS:0B88=0 und0B8A zum neuen Segment. Bei vorhandenem Segment wird nichts abgezogen und dessen Offset0B88 bleibt unverändert.

SS:0B94 wird0, die Allokationsgrenze0B96 erhält das resultierende obere Segment. Drei weitere Offset/Segmentpaare1DF9/1DFB,0C24/0C26 und0B5A/0B5C werden mit Offset0 und dem Bildpuffersegment initialisiert. Die genaue Nutzung dieser Spiegel ist noch nicht für alle Verbraucher nachgewiesen. Das Modell bewahrt ausdrücklich den bestehenden Bildpufferoffset, statt alle Offsetfelder pauschal nullzusetzen.

`check-native-dos-memory-layout.py <memory.bin>` führt die Originalinstruktionen bis vor dem folgenden Initialisierungsaufruf08EB aus. Je216 Fälle beider identifizierten Profile bestehen: vier obere Segmente einschließlich Wrapgrenzen, kein/vorhandener Bildpuffer, drei Grafik-, drei Konfigurations- und drei Eingabemodusbytes. Verglichen werden sämtliche zehn betroffenen Worte, finales AX und unveränderte Stacktiefe. Originalcaptures unverändert. Damit ist dieser Startabschnitt an die zuvor geprüfte Allokationsgrenze angebunden; BIOS-Abfrage, vorgelagerter Helfer0B1E, untere Grenze0BCA und die folgenden Initialisierungsschritte bleiben offen.

## Vorgelagerter EMS-Pfad für den Bildpuffer

`original-dos-ems-init.ts` rekonstruiert1000:0B1E..0BBB mit expliziten Treiberantworten. Zuerst wird CS:0B1C null und über INT21/AX3567 der Vektor67h abgefragt. Die Signaturprüfung vergleicht acht Bytes aus CS:0B10 mit ES:000A; der gelieferte BX-Offset wird in diesem Vergleich nicht addiert. Bei Nichtübereinstimmung Rückgabe AX0 und restaurierte Register. Bei Übereinstimmung folgen INT67/AH41 (Seitenrahmen in BX), AH43/BX4 (vier Seiten, Handle in DX), dann vier Mappingaufrufe AX4400..4403 mit BX0..3 und diesem Handle.

Seitenrahmen wird nach erfolgreicher Abfrage in CS:0B1A gespeichert, Handle nach erfolgreicher Anforderung in0B18. Ein nichtnull AH nach einem Mapping führt zu AH45 mit gespeichertem Handle und anschließend Fehlerausgang; die Antwort der Freigabe wird nicht geprüft. Bereits gespeicherte Rahmen-/Handleworte bleiben bei späteren Fehlern erhalten. Nur nach vier erfolgreichen Mappings wird0B1C=1 und AX zum Seitenrahmen. Die acht übrigen Register werden restauriert. Ein gültig antwortender Treiber mit Seitenrahmen0 erzeugt so aktiv1 und AX0; der Modellvertrag verändert dies nicht stillschweigend in einen zusätzlichen Originalfehler.

`check-native-dos-ems-init.py <memory.bin>` führt den gesamten Originalhelfer einschließlich RET aus und simuliert ausschließlich die DOS-/EMS-Antworten. Je36 Fälle beider identifizierten Profile bestehen: falsche Signatur, zwei Abfragefehler, Anforderungsfehler, Fehler an jeder der vier Mappingpositionen und Erfolg, jeweils mit zwei Rahmen-/Handlewerten. Verglichen werden angeforderte Interrupts/Registerargumente in Reihenfolge, gespeicherte Felder, Aktivwort, AX, restaurierte Register und Stack. Der simulierte Vektor liefert absichtlich BX1234, während die Vergleichssignatur bei Segmentoffset000A liegt. Freigabeantwort ist absichtlich fehlerhaft, um ihre Nichtauswertung zu prüfen. Originalcaptures unverändert, kein realer Speichermanager und keine Host-EMS-Zugriffe.

Der Startcode0869..087C übernimmt nur ein nichtnull AX dieses Helfers als bestehenden Bildpuffer; die anschließende bereits rekonstruierte Reservierung087D muss daher als nächster Schritt mit diesem Protokoll verbunden werden. EMS-Seiteninhalte, echte Treiber und vollständige Speicherinitialisierung bleiben offen.

## BIOS, EMS und Reservierung als durchgehender Startabschnitt

`planOriginalDosBiosEmsMemory` in `original-dos-memory-layout.ts` verbindet die BIOS-KiB-Antwort mit dem EMS-Rückgabewert und der bereits rekonstruierten Reservierung. Der Originalabschnitt0853..08EA ruft INT12 auf, bildet (KiB*64-1) modulo65536 und sichert diesen oberen Segmentwert. Dann läuft der echte EMS-Helfer0B1E. Nur dessen AX ungleich null setzt den vorhandenen Bildpuffer; anschließend wird der obere Segmentwert wiederhergestellt und087D ausgeführt. Entscheidend ist AX, nicht das gesonderte EMS-Aktivwort. Daher kann die kontrollierte Antwort Rahmen0 trotz aktivem EMS-Wort zur konventionellen Reservierung führen; das Modell bewahrt diesen Originalpfad.

`check-native-dos-ems-init.py <memory.bin> --startup` führt den vollständigen Abschnitt einschließlich BIOS-Interrupt, Signaturvergleich, allen angeforderten EMS-Aufrufen und der Reservierung aus. Je288 Fälle beider identifizierten Profile bestehen: die36 bereits geprüften EMS-Antwortkombinationen, BIOS-Werte0/640 und vier Konfigurationen für64.000/32.000/16.384-Byte-Reservierung bzw. vorhandenen EMS-Bildpuffer. Geprüft werden Interruptreihenfolge/Registerargumente, gespeicherte EMS-Felder und Aktivwort, zehn Layoutworte und ausgeglichene innere Stackbenutzung. BIOS0 ist ein kontrollierter Wrap-Grenzfall, keine Behauptung einer realen Rechnerkonfiguration.

Der bisherige36-Fall-Helfertest bleibt ohne Option verfügbar und prüft weiterhin dessen Registerrückbau; er wurde nach der Erweiterung erneut ausgeführt. Originalcaptures unverändert. Treiberantworten werden simuliert, keine tatsächlichen EMS-Seiten eingeblendet. Der durchgehende Test endet vor08EB: vollständiger Boot, frühere Ressourcen-/BLANCPC-Initialisierung, untere Speichergrenze und weitere Plattformdienste sind weiterhin offen.

## EMS-Freigabe und wiederholter Aufruf nach Initialisierung

`planOriginalDosEmsRelease` in `original-dos-ems-init.ts` rekonstruiert1000:0BBC..0BDF. Der Helfer sichert neun Register. Ist Wort CS:0B1C null, folgt ohne Treiberaufruf die Rückkehr. Andernfalls wird INT67/AH45 mit Handle CS:0B18 angefordert. Weder Statusantwort noch Carry werden als Erfolg geprüft; Aktivwort und Handle werden nicht gelöscht. AX und die übrigen acht Register werden restauriert. Eine automatische Bereinigung dieser Felder wäre eine zusätzliche Änderung, kein Originalverhalten.

`check-native-dos-ems-init.py <memory.bin> --shutdown` führt nach jeder bereits geprüften Initfolge zweimal den echten Freigabehelfer im selben RAM aus. Je36 kombinierte Fälle beider identifizierten Profile bestehen, also zusätzlich72 Freigabeversuche pro Profil. Bei fehlgeschlagenem Init bleibt Aktiv0 und beide Versuche erzeugen keine weitere Freigabe; nach Erfolg werden beide Male dieselben Freigabeargumente angefordert. Der simulierte Treiber meldet dabei ausdrücklich FehlerFF, den das Original ignoriert. Signatur-/Abfrage-/Anforderungs-/Mappingfälle und Rahmen-/Handlegrenzen aus dem Init-Test bleiben enthalten. Felder, Aufrufargumente, neun Register und Stack stimmen nach jedem Versuch überein.

Originalcaptures unverändert. Die Prüfung verwendet kontrollierte Antworten und beweist keine tatsächliche Freigabe durch einen EMS-Treiber. Nach einem Mappingfehler, dessen interne Freigabe ebenfalls fehlschlägt, bleibt das Init-Aktivwort0; dieser Exithelfer versucht dann keine erneute Bereinigung. Auch das wird nicht stillschweigend repariert. Gesamter Programmexit und weitere Speicherarten bleiben offen.

## Untere Ressourcengrenze und bedingte obere Grenzverschiebung

`original-dos-resource-memory.ts` rekonstruiert1000:7778..77BB. Das eingehende Segment AX wird nach DS übernommen und mit Offset0 als untere Grenze SS:0BC8/0BCA gespeichert. Aus den rohen Headerworten SS:248A und248C entsteht eine Paragraphenzahl: ((hohes Wort &000Fh)<<12)+(niedriges Wort>>4). Die unteren vier Größenbits werden verworfen; es erfolgt kein Aufrunden. Bits oberhalb der unteren20 zusammengesetzten Größenbits werden nicht ausgewertet. Welche vollständige Headerstruktur diese Worte liefert, bleibt weiter im Aufrufer nachzuweisen.

Diese Paragraphenzahl wird zum Segment addiert. Bei Carry oder unsigned Ergebnis größer als SS:0B96 bleiben0B94/0B96 unverändert. Andernfalls wird0B96 zum Ergebnis und0B94 null. Die untere Grenze wurde bereits vorher in jedem Fall geschrieben. Das Modell trennt deshalb Grenzinitialisierung von der bedingten Verschiebung, statt einen Fehlschlag als vollständiges Zurückrollen auszugeben.

`check-native-dos-resource-memory.py <memory.bin>` führt den Originalabschnitt bis vor77BC aus. Je360 Fälle beider identifizierten Profile bestehen: drei Basissegmente, vier niedrige und fünf hohe Größenworte, drei bisherige Grenzen und zwei Offsetwerte. Geprüft werden sämtliche vier Grenzworte, AX-Kandidat, BX-Paragraphenzahl, DS und unveränderte Stacktiefe. Originalcaptures unverändert. Damit ist ein tatsächlicher Schreiber der unteren Grenze angebunden; vorherige Tabellen-/Poolberechnungen, Quellen der Headerworte und der folgende Ressourcenladepfad bleiben offen.

## Tabellen-/Pooladressen aus dem Ressourcenheader

`planOriginalDosResourceTables` in `original-dos-resource-memory.ts` rekonstruiert1000:76D8..77BB einschließlich des bereits geprüften Grenzabschnitts. Eingaben sind der rohe16-Byte-Header aus SS:2486, die bestehende Basis0B90/0B92 und obere Grenze0B94/0B96. Das Modell gibt sämtliche18 geschriebenen Worte zurück; Headerfelder werden vorerst über ihre Offsets bezeichnet, solange die Verbrauchersemantik nicht vollständig belegt ist.

Headerwort+0 wird nach0BCC übernommen und bestimmt eine um16-Byte-Schritte gerundete erste Grenze: Basisoffset + ((((Wort>>2)+1)<<4) modulo65536), Ergebnis modulo65536 nach0BD2. Headerwort+2 wird nach0BDA übernommen; sein Produkt mit6 wird auf das niedrige Wort begrenzt und zur ersten Grenze addiert. Ergebnis geht nach0BD4/0BD8, das Basissegment nach0BD6. Aus Wort+8 entsteht ein weiterer Segmentabstand (Wort>>4)+1; Ergebnis wird mit Offset0 nach0BE0/0BE2 geschrieben.

Für den nächsten Pool wird zuerst Wort+12 plus3 modulo65536 gebildet, dann mit38 multipliziert; wiederum wird nur das niedrige Produktwort vierfach rechtsgeschoben und um1 erhöht. Der so ermittelte Segmentabstand führt zu0BE4/0BE6 und0BC4/0BC6. Danach folgt die bereits rekonstruierte untere Grenze und bedingte obere Grenzverschiebung aus den Headerworten+4/+6. Die Worte+10/+14 werden in diesem Abschnitt nicht verwendet. Kein automatisches Interpretieren dieser Rohwerte als beliebige Editorressourcen oder unbeschränkte Größen.

`check-native-dos-resource-tables.py <memory.bin>` führt den gesamten Originalabschnitt aus. Je168 Fälle beider identifizierten Profile bestehen:144 kombinierte Grenzwertfälle mit Segment-/Offsetwrap und Multiplikationsüberlauf sowie24 einzeln variierte Headerworte, einschließlich der hier ungenutzten Worte. Verglichen werden alle18 Ausgabeworte, finales AX/DS, Stacktiefe und unveränderter Header. Originalcaptures unverändert. Die vorgelagerten Dateileser und vollständige Bedeutung/Verbraucher der Tabellen sind weiterhin offen.
## Original-MAIN-Dateien im nativen Headerlesepfad

`check-native-dos-resource-file.py <memory.bin> <MAIN.IO>` verbindet den bestehenden ALIS-Parser und `planOriginalDosResourceTables` mit dem tatsächlichen Abschnitt1000:76C2..77BB. Die Originalinstruktionen lesen über den echten Helfer212D zuerst6 Bytes nach SS:2480 und anschließend16 Bytes nach SS:2486. Nur die DOS-Antworten werden kontrolliert aus der schreibgeschützt eingelesenen Datei geliefert. Dateiposition, Zieladressen, vollständiger22-Byte-Header, alle18 Tabellen-/Grenzworte, AX/DS und Stack werden geprüft. Der vorherige Öffnungshelfer1F97, Dekompression und anschließende Tabellenverbraucher sind nicht Bestandteil dieses Nachweises.

Beide bekannten Profile bestehen je8 Layoutvarianten (zwei Basissegmente, zwei Basisoffsets, zwei obere Grenzen). Ishar1 MAIN.IO:11240 Bytes, SHA256 `27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b`, dekodiertes Bild26384 Bytes. Ishar2 MAIN.IO:11982 Bytes, SHA256 `bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95`, dekodiertes Bild27752 Bytes. Test akzeptiert ausschließlich die zugehörige Kombination aus Capture- und MAIN-Hash; Quelldateien werden vor/nach Ausführung verglichen. Keine Originalbytes werden als Testfixtures veröffentlicht.

Damit ist die22-Byte-Grenze des MAIN-Parsers durch diesen nativen Startabschnitt gestützt. Das belegt weder die vollständige Semantik jedes VM-Headerfeldes noch sämtliche anderen Modulvarianten oder einen vollständigen Programmstart. Nächste Lücke ist der anschließende Ressourcenlade-/Dekompressionspfad und die Verwendung der hier angelegten Tabellen.
## Nativer A1-Dekompressor mit Original- und Toolkit-Exportdaten

`check-native-dos-main-decode.py <memory.bin> <MAIN.IO>` führt1000:79E9 einschließlich des A1-Helfers7B85 und der tatsächlichen Dateileser212D aus. Der Aufrufer setzt das Packbyte auf Dateibyte3 &FEh; A1 wird dadurch A0 und der Zweig für das obere NibbleA0h gewählt. Kontrollierte DOS-Antworten liefern ab Dateioffset22 jeweils bis zu8000 Bytes in einen separaten Puffer. Der letzte erfolgreiche Read kann kürzer sein; der native Leser füllt den verbleibenden Puffer nicht auf. Der Test liefert keine simulierten Dateisystemdienste außer diesen expliziten Read-Antworten.

Je vier Fälle beider bekannten Profile bestehen: Original-MAIN sowie eine längentreue Änderung des letzten Bildbytes mit dem bestehenden Toolkit-Writer, jeweils Zieloffset0 und7. Die gesamte deklarierte Ausgabefolge stimmt per SHA256 mit `readAlisModule` überein. Alle gesicherten Register, Rückkehrstack und die Grenzen des tatsächlich beschriebenen Bereichs werden geprüft. Original-Ishar1 benötigt Reads8000/3218 Bytes, Original-Ishar2 8000/3960. Die neu gepackten Varianten benötigen drei Reads und prüfen damit auch eine weitere Puffernachladung. Die Änderung ist ein Codec-Test, keine als spielbar ausgewiesene Inhaltsmodifikation.

Wichtige Abweichung zur sicheren Host-API: Bei Original-MAIN schreibt die native Routine nach der deklarierten Bildgröße noch zwei Bytes (Ishar1) beziehungsweise ein Byte (Ishar2). Bei den hier neu gepackten Varianten treten keine zusätzlichen Ausgabeschreibzugriffe auf. Der Test misst diese Zugriffe gesondert, statt sie als Decoderabweichung innerhalb des Bildes oder als allgemein sicheres Originalverhalten auszugeben. Die beobachteten Werte beweisen keine allgemeine Obergrenze für beliebige oder beschädigte Streams. Der Toolkit-Decoder besitzt bereits einen begrenzten Lookahead und liefert nur die deklarierte Bildgröße zurück; diese Sicherheitsanpassung wird nicht aufgehoben.

Damit ist die A1-Ausgabe für beide MAIN-Dateien erstmals direkt gegen die ausgeführte DOS-Routine geprüft, einschließlich vom Toolkit erzeugter komprimierter Daten. Ein vollständiger Start mit bearbeitetem MAIN, alle anderen Ressourcen, fehlerhafte Streams und die übrigen Packzweige sind damit weiterhin nicht nachgewiesen. Capture und Originaldatei werden unverändert belassen und vor/nach Prüfung verglichen. Testdaten entstehen nur im Arbeitsspeicher; Originalstreams werden nicht veröffentlicht.
## A1-Bestandsvergleich und vom Pufferrest abhängiges Dateiende

Der gleiche native Decoderprüfer unterstützt jetzt `--all` mit einem Installationsverzeichnis. Er liest jedes IO-Modul über den vorhandenen Parser, wählt ausschließlich A1-Streams und vergleicht die vollständige deklarierte Ausgabe mit der Originalroutine79E9. MAIN benutzt22, andere Module6 Hüllbytes. AX/CX erhalten auch den hohen/niedrigen Größenanteil; dadurch sind Ressourcen über64KiB und native Segmentwechsel enthalten. Getrennter Eingabepuffer bei9000:0000 vermeidet eine Überlappung mit der größten untersuchten Ausgabe. Alle Quelldateien werden unverändert geprüft; Berichte enthalten nur Namen, Größen, Hashes, Read-Längen und Differenzpositionen, keine Originaldaten. Abweichungen erzeugen einen Bericht und Exitcode1, keinen pauschal grünen Test.

Ishar1:97 A1-Module untersucht (98 IO-Dateien insgesamt, eine nicht A1). Davon82 byteidentische Ausgaben und15 Abweichungen ausschließlich im letzten deklarierten Byte. Betroffen: AZAL, BUSTE, DRAGON, GEANT, INTMAIS, KNIGHT, KROG, LOGO, MAP, MOMO, NAIM, PREDATOR, PRESEN, SAUB und VILLAGE. Größte untersuchte Ausgabe143608 Bytes. Zusätzliche native Schreibzugriffe hinter der deklarierten Größe reichen in diesem Bestand bis32 Bytes; das ist keine allgemeine Sicherheitsgrenze.

Der Kontrolllauf `--all --only AZAL.IO,... --zero-read-tail` prüft diese15 Fälle mit ausdrücklich veränderter Host-Pufferpolitik: Vor dem Liefern eines Read-Ergebnisses werden sämtliche8000 Pufferbytes auf null gesetzt. Dann stimmen alle15 vollständigen Ausgaben überein. Der normale native Lauf lässt den Pufferrest nach kurzen Reads unverändert, genauso wie der geprüfte DOS-Read-Helfer. Der Unterschied belegt eine Abhängigkeit von Bytes hinter dem tatsächlich gelesenen Dateiende; die bestehende deterministische Nullerweiterung des Toolkit-Decoders ist folglich eine Host-Anpassung und nicht allgemein exaktes DOS-EOF-Verhalten. Der entsprechende irreführende Quellkommentar wurde korrigiert; Decoderverhalten wurde nicht stillschweigend verändert.

Nicht nachgewiesen ist, ob das letzte Byte in allen betroffenen Modulen nur Padding ist oder von einem Verbraucher gelesen wird. Ebenso wenig ist der Pufferinhalt während einer vollständigen Original-Spielsitzung durch diesen isolierten Lauf festgelegt. Diese Fragen bleiben offen, bevor eine bitgenaue Gesamtlaufzeit behauptet werden kann. Die ursprünglichen MAIN-Vergleiche mit Original- und Toolkit-Repackdaten bestehen weiterhin je vier Fälle pro Spiel.

Ishar2:141 A1-Module untersucht (142 IO-Dateien insgesamt, eine nicht A1). Davon126 vollständige Übereinstimmungen;15 Abweichungen ebenfalls ausschließlich im letzten deklarierten Byte: DWIZARD5, FDJCAT, GEANT, GUARD3, HOMOIS2, LEZARD1, LOGO, MARCHAND, PLAINE1, PPSAC, RHINO4, SAUB, SPAROLES, VOLEUR3 und WITCH5. Größte Ausgabe228160 Bytes, zusätzliche native Schreibzugriffe bis29 Bytes hinter der deklarierten Größe. Auch alle15 Ishar2-Kontrollfälle stimmen mit diagnostischer Nullfüllung vollständig überein. Insgesamt238 native Originalstream-Vergleiche und30 gezielte Kontrollfälle. Die Metadatenberichte sind in `NATIVE_A1_CORPUS_2026-10-18.json` versioniert, einschließlich Profil-/Quellhashes, Abweichungspositionen und explizit getrennter Pufferpolitik; keine komprimierten oder dekodierten Originalbytes sind enthalten. Die A1-Fixture- und Writer-Tests bestehen unverändert.
## Native Registrierung geladener Module

`original-dos-module-registry.ts` rekonstruiert1000:8182 bis vor8205 beziehungsweise zu den Fehlerzweigen8218/821E. Eingang sind DS:DX zum geladenen Modul (ID-Wort am Anfang), CX als Endoffset sowie SS:0B14 als Endsegment. Die neue untere Grenze SS:0BCA wird als Endsegment+(CX>>4)+1 modulo65536 geschrieben. Erst danach erfolgt der unsigned Vergleich mit SS:0B96. Bei Überschreitung wird Fehler11 über8468 erreicht; die bereits geschriebene untere Grenze bleibt bestehen, Tabelle und Zähler dagegen unverändert.

Der reguläre Pfad durchsucht die Far-Pointer-Tabelle ES:[0BC2..0BD0) anhand der ID-Worte an den Zieladressen. IDs werden unsigned verglichen. Ein neuer Eintrag wird vor der ersten größeren oder gleichen ID eingefügt; vorhandene Einträge werden rückwärts verschoben. Gleiche IDs sind in diesem Abschnitt nicht verboten und der neue Eintrag steht vor alten gleichen IDs. Danach steigt der Tabellenendoffset0BD0 um4, der Zähler0BCE um1 modulo65536. Der anschließende Vergleich mit0BCC ist signed. Überschreitung ergibt Fehler4, obwohl Tabelle und Zähler schon geändert sind. Die Rekonstruktion rollt diese Seiteneffekte nicht als vermeintlich sichere Originalfunktion zurück.

Der Hostvertrag unterstützt bereits sortierte, nicht über das16-Bit-Offsetende laufende Tabellen und prüft alle Eingaben als Worte. Diese Grenzen sind ausdrücklich Hostvalidierung, kein Nachweis einer entsprechenden Schutzprüfung im Original. Die folgenden Benachrichtigungshelfer185E/16CE und der globale Fehlerhandler8468 werden hier nicht ausgeführt. Die davon abhängige Modulaktivierung und das Setzen des Skriptkontexts sind weiter offen.

`check-native-dos-module-registry.py <memory.bin>` vergleicht je192 Fälle beider bekannten Profile: leere, sortierte und doppelte ID-Tabellen, ID-Grenzen0/32768/65535, Endoffset0/65535, ausreichende/zu kleine obere Grenze sowie Zählergrenzen einschließlich signed Wrap32767→32768. Je96 Fehler11,64 reguläre Pfade und32 Fehler4 stimmen in Tabellenzeigern, Reihenfolge, Grenzen, Zähler, Error-AX und Stacktiefe überein. Originalcaptures unverändert. TypeScript-Prüfung bestanden.
## Aufbau des nativen Skriptkontexts

`original-dos-script-context.ts` rekonstruiert1000:8268..8370 und den Fehler12-Zweig8377. Der Modulheader liegt in DS:DX, der Kontext-/Variablenpool in ES. Aus0BD8 plus Headerwort12h entsteht0B0C; plus Headerwort16h und34h entsteht der Kontextzeiger0B0E. Dieser wird in ES:[0BD2+0B06] eingetragen. Headerwort14h wird addiert und das neue Poolende0BD8 gespeichert. Erst danach wird geprüft, ob Poolsegment0BD6+(Endoffset>>4)+1 modulo65536 strikt kleiner als0BE2 ist. Bei Gleichheit oder Überschreitung folgt Fehler12; Tabellenzeiger und drei globale Worte wurden bereits verändert.

Im Erfolgsfall werden die Variablenworte rückwärts gelöscht und der34h-Byte-Kontext vor dem Kontextzeiger initialisiert. Das Modell erhält alle nicht beschriebenen Bytes. Der Skripteinstieg ist Moduloffset+2+Headerwort2 modulo65536 und wird als Far-Pointer zusammen mit dem Modulsegment gespeichert. Weitere nachgewiesene Schreibquellen sind Modul-ID-Wort0, Headerbyte5 und Slotwort0B06. Die übrigen Kontextfelder werden anhand ihrer rohen Offsets geführt; vollständige Feldsemantik wird daraus nicht erfunden.

Die native Löschschleife ist kein vorab geprüfter while-Block: Länge0 führt nach der ersten Wortlöschung zu16-Bit-Unterlauf und durchläuft sämtliche32768 Worte des Segments. Dadurch können auch zuvor gesetzte Tabellenwerte gelöscht werden. Dieser Effekt ist im Rohmodell enthalten. Eine ungerade Länge erreicht mit Schritten von2 dagegen nie null; die Host-API lehnt sie ab, statt das Original als terminierend darzustellen. Modul- und Zielsegment werden im Modell als getrennte Speicherbereiche vorausgesetzt; Aliasing zwischen beiden ist nicht abgedeckt.

`check-native-dos-script-context.py <memory.bin>` führt je48 Fälle beider bekannten Profile aus, darunter24 Fehler12. Variiert werden Headergrößen, Länge0/2/8, Pooloffsets einschließlich Wrap und ausreichende/zu kleine Grenzen; der CodeoffsetFFFFh-nahe Wert prüft den Einstiegspunkt-Wrap. Verglichen werden das gesamte64-KiB-Zielsegment per Hash, alle drei globalen Worte, DX/BX/SI auf dem jeweiligen Pfad, Segmentregister und Stacktiefe. Originalcaptures bleiben unverändert. Dies prüft Kontextkonstruktion, noch nicht die Ausführung des initialisierten Skripts oder den globalen Fehlerhandler.
## Kontextaufbau mit sämtlichen Original-Modulheadern

`check-native-dos-script-context.py <memory.bin> --modules <installation>` verwendet jetzt die dekodierten24-Byte-Header sämtlicher IO-Dateien anstelle synthetischer Werte. Die MAIN-Prüfsumme muss zum identifizierten Capture gehören. Alle98 Ishar1- und142 Ishar2-Module bestehen mit kontrolliertem Moduloffset0100h, getrenntem Modul-/Kontextsegment und ausreichend großer Poolgrenze. Es tritt kein Fehler12 auf. Der Vergleich umfasst weiterhin das gesamte64-KiB-Zielsegment, globale Worte, Register und Stack, nicht nur ausgewählte Kontextfelder. Dateihashes werden nach dem Einlesen erneut geprüft.

Zusätzlich wird der berechnete Einstieg mit dem bestehenden `readAlisModule`-Parser verglichen: (Moduloffset+Parser-entry) modulo65536 stimmt mit dem nativen DX überein. Das belegt die Formel Wort2+2 für diese240 Header direkt am Originalcode. Der bisher ausschließlich auf die C-Referenz verweisende Parserkommentar wurde entsprechend präzisiert; andere Headerpointer wie Return-/Scan-Einstiege sind durch diesen Vergleich nicht automatisch belegt.

Die hashbasierten Berichte stehen in `NATIVE_CONTEXT_CORPUS_2026-10-18.json`; sie enthalten keine Originalheader oder Bilddaten. Der Aufbau eines Kontexts für jedes Modul ist hier eine isolierte Prüfanordnung. Daraus folgt nicht, dass das Original jedes Ressourcenmodul im Spiel tatsächlich aktiviert oder dass seine Skripte bereits vollständig ausführbar rekonstruiert sind. Die vorher festgestellten A1-EOF-Abweichungen am letzten Bildbyte beeinflussen diese ersten24 Headerbytes nicht. Als nächste Verbindung bleiben Kontextauswahl, VM-Registerübernahme und erster Opcode-Dispatch zu prüfen.
## Vorbereitung bis zum ersten Scan-/Hauptskript-Dispatch

`original-dos-script-schedule.ts` rekonstruiert1000:264F bis zum ersten Aufruf26EB oder Sprung2632 zum nächsten Kontext. Ein bereits ausgewählter Kontext liegt in ES:BP. Zuerst werden SS:0C96 und0C19 null. Wenn Kontextbyte-24h negativ ist und Bit1 nicht gesetzt ist, lädt der Code den Modulzeiger aus-14h/-12h und liest das niedrige Scan-Offsetwort bei Modul+0Ah. Bei nichtnull Offset wird SI zu Moduloffset+0Ah+Scanoffset,0C56 erhält Kontextwort-0Ah, und der erste Scan-Dispatch folgt. Aktivflag/Countdown wurden dann noch nicht angefasst. Auch ein null Scanoffset lässt DS/SI bereits auf den Modulheader zeigen; diese Seiteneffekte bleiben im Modell beim anschließenden Skip erhalten.

Ohne Scan-Dispatch überspringt Aktivbyte-4h=0 den Kontext. Ein negatives Aktivbyte wird auf1 gesetzt. Countdownbyte-1h wird modulo256 dekrementiert; nur Ergebnis0 führt weiter. Countdown0 läuft deshalb auf255 und startet hier nicht sofort. Vor dem Hauptdispatch wird DS:SI aus Kontext-8h/-6h geladen und0C19 auf1 gesetzt. Beide Dispatchpfade führen den echten Helfer3C76 aus: Vier Kontextworte ab BP werden nach SS:0BFA..0C00 kopiert. Diese Rohworte werden vorerst nicht als VM-Rechenregister oder vollständige Positionsstruktur bezeichnet, solange deren Verbraucher nicht separat belegt sind.

`check-native-dos-script-schedule.py <memory.bin>` führt je160 Fälle beider Profile aus und stoppt direkt vor dem ersten Opcode-Dispatcher beziehungsweise am nächsten Kontext. Je117 Skip-,27 Haupt- und16 Scanpfade bestehen. Geprüft werden vollständiges Kontextsegment, sämtliche modellierten Globals, die vier kopierten Worte (bei Skip unverändert), DS:SI, BP und Stacktiefe. Flagkombinationen, positive/negative Aktivwerte, Countdown0/1/2/255 und vorhandene/fehlende Scanoffsets sind enthalten. Originalcaptures unverändert. Nicht abgedeckt sind Opcode-/Callbackkörper, deren Rückkehr, nachgelagerte Rückrufpfade und Auswahl des nächsten Kontexts. Die hier sichtbare Reihenfolge ist deshalb kein Nachweis eines vollständigen Schedulers.
## Nativer Opcode-Fetch und indirekter Handleraufruf

`original-dos-opcode-dispatch.ts` rekonstruiert1000:26EB..26F2 bis einschließlich des indirekten Near-CALL. AH wird null, LODSB liest den Opcode aus DS:SI, AX wird verdoppelt und nach BX übernommen. Das Handlerziel ist das Wort CS:[0024h+2*Opcode]. Der Near-CALL legt26F7h auf dem Stack ab; nach regulärer Handlerrückkehr würde dort der Sprung zurück nach26EB folgen. Handleradressen werden dem identifizierten Laufzeit-Codebuffer entnommen, nicht aus einer erfundenen gemeinsamen Opcode-Liste. Spätere Laufzeitänderungen der Tabelle sind damit nicht ausgeschlossen.

Der Modelvertrag nimmt zwei vollständige64-KiB-Segmente und SI als Wort. SI verändert sich gemäß dem CPU-Direction-Flag um+1 oder-1 modulo65536. Die normale Startsequenz setzt CLD; die zusätzlichen DF=1-Fälle prüfen das rohe Instruktionsverhalten und behaupten keinen üblichen Spielzustand. Das Modell führt keinen Handler aus und behauptet nicht, dass alle256 möglichen Bytewerte gültige, nutzbare ALIS-Befehle sind.

`check-native-dos-opcode-dispatch.py <memory.bin>` prüft je1536 Fälle beider identifizierten Profile: alle256 Opcodebytes, SI0/1234h/FFFFh und beide DF-Werte. Der Original-CALL wird ausgeführt; die CPU stoppt an der ersten Handlerinstruktion. Verglichen werden tatsächliches Sprungziel, AX/BX, SI, DS, DF, Stacktiefe und das abgelegte Rückkehrwort. Handlerkörper werden nicht ausgeführt. Originalcaptures bleiben unverändert. Der anschließende schrittweise Vergleich der Handler und ihrer Rückkehr-/Yield-Konvention bleibt erforderlich, bevor eine vollständige native VM behauptet werden kann.
## Erste sechs Kontrollfluss-Handler durch echten Dispatch

`original-dos-script-branch.ts` rekonstruiert die Handler26FE..2743, in beiden identifizierten Captures über Opcodes5..10 erreichbar. Opcodes5/6/7 legen einen Skript-Rückkehrzeiger im Kontext ab;8/9/10 verändern nur SI. Die jeweils erste Variante liest ein Byte und erweitert dessen Vorzeichen per CBW. Die zweite liest ein Wort. Die dritte liest ebenfalls ein Wort und erhöht SI zusätzlich um1, ohne dieses dritte Operandbyte hier auszuwerten. Relative Addition und Zeigeränderungen erfolgen modulo65536. Ein vorzeichenbehaftetes Wort und seine rohe16-Bit-Darstellung ergeben dabei dieselbe modulare Addition; der Modellvertrag erfindet keinen zusätzlichen Überlaufcheck.

Bei Aufrufvarianten wird DI aus Kontextwort BP-0Ah geladen und um2 vermindert. Dieses neue Stackoffsetwort wird zurückgeschrieben; der Skriptzeiger nach dem Operand steht anschließend in ES:[BP+DI]. Dieser Skriptstack ist vom x86-CALL-Stack getrennt. Alle sechs Handler enden mit nativem RET zur Dispatch-Rückkehr26F7. Das ist noch keine Rekonstruktion eines ALIS-Return- oder Yield-Befehls.

`check-native-dos-script-branch.py <memory.bin>` führt den tatsächlichen Opcode-Dispatch26EB, den jeweiligen Handler und dessen RET aus. Je1088 Fälle beider Profile bestehen: sämtliche256 Byteoperanden, acht Wortgrenzen einschließlich32767/32768/65535 und zwei Skriptstackoffsets einschließlich0 mit Unterlauf. Verglichen werden das gesamte Kontextsegment, SI, AX, DI bei Aufruf, Segmentregister, BP und wiederhergestellte x86-Stacktiefe. Originalcaptures unverändert. Hostvertrag: DF0 und getrennte64-KiB-Segmente; ein Wortoperand über die Segmentgrenze hinweg ist ausdrücklich nicht unterstützt, CPU-Statusflags werden nicht modelliert. Weitere Kontrollflussbefehle und Skriptrückkehr bleiben offen.
## Skriptrückkehr und nativer Yield-Ausgang

`original-dos-script-return.ts` rekonstruiert Opcode17, Handler2808..2836, einschließlich Yield2D94..2D97. Bei SS:0C19=0 vergleicht der Code das Skriptstackoffsetwort ES:[BP-0Ah] signed mit SS:0C56. Ist es nicht kleiner, wird der Yield-Ausgang erreicht. Dieser entfernt mit ADD SP,2 die Rückkehradresse des Opcode-Handlers und führt RET zum Aufrufer des Dispatchers aus. Der Skriptstack und SI bleiben dabei unverändert. Bei0C19!=0 entfällt dieser Grenzvergleich.

Der reguläre Rückkehrpfad liest SI aus ES:[BP+Stackoffset]. Wenn das Stackoffset dem Kontextmarkerwort BP-0Ch entspricht, wird dieser Marker null. Danach steigt das Stackoffsetwort BP-0Ah um2 modulo65536 und ein normales natives RET führt zurück nach26F7. Das Modell hält den x86-Stack und Skriptstack ausdrücklich auseinander; es enthält noch keine Schedulerfortsetzung und keinen Spezial-Return27BD.

`check-native-dos-script-return.py <memory.bin>` führt den echten Opcode17-Dispatch aus, anschließend entweder den vollständigen Handler-RET oder den vollständigen Yield-Ausgang bis zu einer kontrollierten Aufruferadresse. Je96 Fälle beider Profile bestehen:18 Yield- und78 Returnpfade. Modusbytes0/1/255, vier Stackoffsets, vier signed Grenzwerte und gleicher/anderer Marker sind enthalten. Verglichen werden das gesamte Kontextsegment, SI, BP, Segmentregister, unveränderte Modus-/Grenzglobals und native Stacktiefe (nach Yield zwei Bytes über dem Dispatchereintritt, nach normalem Handler-RET unverändert). Originalcaptures unverändert. Die Aufruferadresse ist eine Testgrenze, kein Nachweis einer vollständigen Spielsitzung.
## Kontextdifferenzen an verkettete Objektwerte weitergeben

`original-dos-context-delta.ts` rekonstruiert1000:3C97..3CEA, den nach Skript-/Callbackausführung aufgerufenen Helfer. Drei Kontextworte ES:[BP+0/2/4] werden jeweils von den zuvor gespeicherten Worten SS:0BFA/0BFC/0BFE subtrahiert, modulo65536. Sind alle Differenzen null, kehrt der Helfer ohne Listenbearbeitung zurück. Das vierte zuvor gesicherte Wort0C00 wird hier nicht verglichen.

Bei einer Änderung lädt LDS DI den Pointer0BE8/0BEA; der geladene Offset wird anschließend durch Kontextwort BP-18h ersetzt. Der Objektsegmentwert bleibt als DS wirksam, auch wenn der Listenanfang null ist. Für jeden über Wort+4 verketteten Datensatz wird Byte+0 nur dann auf2 gesetzt, wenn es zuvor0 war. Die drei Differenzen werden zu den Datensatzworten+16h/+18h/+1Ah addiert, modulo65536. Die Funktion restauriert AX/CX/DX, aber nicht DS/DI. Nach regulärem Listenende ist DI0. Die Rohfeldbezüge sind belegt; eine vollständige Interpretation als Weltkoordinaten oder sämtliche Rendererfolgen wird daraus noch nicht behauptet.

`check-native-dos-context-delta.py <memory.bin>` führt je45 Fälle beider Profile bis einschließlich RET aus: unveränderte und in drei verschiedenen Worten geänderte Kontexte, 16-Bit-Grenzen, Listenlängen0/1/3 und Zustandsbytes0/1/FF. Verglichen werden das gesamte64-KiB-Objektsegment, restaurierte Register, DS/DI und Stacktiefe. Der testweise geladene Pointeroffset7777h unterscheidet sich absichtlich vom tatsächlichen Listenanfang, um dessen Ersetzung zu prüfen. Originalcaptures unverändert. Der Host erkennt Listenzyklen und bricht mit Fehler ab; die native Schleife hat hier keinen solchen Schutz. Dieser Helfer ist Voraussetzung für den zusammenhängenden Scheduler-Rückkehrtest, ersetzt ihn aber nicht.
## Zusammenhängender Yield-Rückweg zur Schedulerfortsetzung

`original-dos-script-resume.ts` verbindet den Hauptskript-Rückkehrabschnitt26B2..26E8 mit `applyOriginalDosContextDelta`. Zuerst wird SI in Kontextwort BP-8 gespeichert. Anschließend lädt DS:SI den Modulheader aus BP-14h/-12h und prüft dessen niedriges Return-Offsetwort+6. Bei nichtnull Offset werden0C19=0 und0C56=Kontextwort BP-0Ah gesetzt; SI wird Moduloffset+6+Returnoffset und der nächste26EB-Dispatch ist der Return-Callback. Die Objektaktualisierung und Countdown-Neuladung erfolgen erst nach dessen Rückkehr und sind in diesem Zwischenzustand noch nicht ausgeführt.

Ohne Return-Callback führt der Originalcode3C97 aus, also die bereits geprüfte Differenzweitergabe an die Objektliste. Danach wird Kontextbyte BP-2 nach BP-1 kopiert (Countdown neu laden) und nach2632 gesprungen. Der Hostvertrag setzt getrennte Modul-/Kontext-/Objektsegmente voraus. Ein nichtnull Return-Callback wird als explizite Ausführungsgrenze zurückgegeben, nicht erfunden oder still übersprungen.

`check-native-dos-script-resume.py <memory.bin>` startet am tatsächlichen Yield-Ausgang2D94 mit einem kontrollierten zweistufigen CALL-Stack: Handler-Rückkehr26F7 und darunter Hauptskript-Rückkehr26B2. ADD SP,2 und RET führen dann wirklich in die Schedulerfortsetzung. Je24 Fälle beider Profile bestehen: geänderte/unveränderte Kontextworte, kein/vorhandener Return-Callback, leere/zwei Einträge umfassende Objektliste sowie Reloadbytes0/1/FF. Auf dem regulären Pfad wird der echte Helfer3C97 vollständig ausgeführt. Verglichen werden vollständiges Kontext- und Objektsegment, DS:SI, Callbackglobals und korrekte Stacktiefe bis2632 oder vor dem ersten Callback-Opcode. Originalcaptures unverändert. Der Test beweist diesen Rückweg, noch nicht den Callbackkörper, dessen nachfolgenden Rückweg oder die Auswahl des nächsten Kontexts.
## Return-Callback bis zur abgeschlossenen Scheduler-Rückkehr

`finishOriginalDosScriptCallback` ergänzt26D5..26E8: Nach Rückkehr aus dem Return-Callback wird das gesicherte Stackoffsetwort SS:0C56 nach Kontext BP-0Ah restauriert. Anschließend laufen der echte Differenzhelfer3C97 und die Countdown-Neuladung wie im callbackfreien Pfad. Der Callback-Skriptzeiger wird hier nicht als neuer Hauptskriptzeiger gespeichert; der vor dem Callback gesicherte Wert BP-8 bleibt erhalten. SI bleibt auf dem Callback-Endstand, sofern die betrachteten Helfer ihn nicht verändern. DS wird nur bei tatsächlichen Kontextdifferenzen vom Objekt-Helfer übernommen.

`check-native-dos-script-resume.py <memory.bin> --complete-callback` führt jetzt den gesamten zuvor unterbrochenen Pfad aus. Der kontrollierte Callback enthält Opcode5 mit relativem Offset0, gefolgt von Opcode66. Der echte Aufrufhandler vermindert das Skriptstackoffset16 auf14 und schreibt seinen Rückkehrzeiger. Opcode66 verweist in beiden identifizierten Captures auf2D94; der Test prüft diese Tabellenzuordnung und führt den tatsächlichen Yield bis26D5 aus. Danach wird das Stackoffset wieder16. Der abgelegte Rückkehrzeiger bleibt als Speicherinhalt erhalten; es wird kein fiktives vollständiges Leeren des Skriptstacks angenommen.

Je24 vollständige Fälle beider Profile bestehen, davon12 mit kontrolliertem Callback. Vollständige Kontext-/Objektsegmente, Skriptzeiger, Globals und native Stacktiefe bis2632 stimmen mit der Komposition der rekonstruierten Aufruf-, Callback-Rückkehr- und Differenzfunktionen überein. Die ursprünglichen je24 Zwischenzustandsfälle ohne diese Option bestehen weiterhin; TypeScript-Prüfung bestanden. Originalcaptures unverändert. Dies belegt den Rückweg mit diesem kontrollierten Callback, nicht sämtliche Callbackbefehle oder die nachfolgende Kontextauswahl.
## Auswahl des nächsten Kontextslots und Frame-Grenze

`original-dos-next-context.ts` rekonstruiert1000:2632..264F. Der aktuelle Slotoffset kommt aus SS:0B02, die Tabellenbasis aus0BD2. BX wird zum Wort ES:[Tabellenbasis+Slotoffset+4], anschließend wird dieser Linkwert nach0B02 gespeichert. Slotwerte sind rohe Byteoffsets, keine laufenden Arrayindizes. Ist der Linkwert nichtnull, wird BP direkt aus ES:[Tabellenbasis+neuer Slotoffset] geladen. Ein dort gespeicherter null Kontextzeiger wird in diesem Abschnitt nicht validiert oder übersprungen.

Bei Linkwert0 wird stattdessen der Frame-Service3D3C aufgerufen. Das Modell gibt diesen Punkt als explizite Grenze zurück und lässt BP bis dahin unverändert. Es tut nicht so, als ob der Frame-Service schon geprüft wäre, und ersetzt ihn nicht durch einen erfundenen Neustart der Liste. Die nachfolgende Frame-Routine enthält unter anderem eine Timervergleichsschleife und weitere Grafik-/Eingabeaufrufe, die gesondert angebunden werden müssen.

`check-native-dos-next-context.py <memory.bin>` prüft je54 Fälle beider Profile: zwei Tabellenbasen einschließlich Offsetwrap, drei aktuelle und drei nächste Slots und Kontextpointer0/1234h/FFFFh. Je18 Frame-Grenzen und36 Kontextübernahmen bestehen. Verglichen werden tatsächlich erreichter Zweig, geschriebenes0B02, BX/SI/BP, Stacktiefe und das vollständig unveränderte Tabellensegment. Originalcaptures unverändert. Wortzugriffe über das Segmentende hinweg lehnt der Hostvertrag ausdrücklich ab; Offsetwrap zu einer gültigen Wortadresse ist enthalten. Vollständiger Frame-Service und ein kompletter Scheduling-Zyklus bleiben offen.
## Vollständiger Frame-Pfad ohne Zeichenaufträge

`original-dos-frame-idle.ts` rekonstruiert den Pfad durch3D3C..3E54, auf dem keine Grafikbenachrichtigung, keine Zeichenliste und kein spezieller Objektauftrag ausgeführt werden muss. Die API ist nach diesem begrenzten Vertrag benannt; sie ersetzt keinen vollständigen Renderer. Bei0C4A!=0 und2898!=0 wird der noch separate Grafikaufruf ausdrücklich abgelehnt. Ist2898=0, bleibt auch ein gesetztes0C4A unverändert, wie im Original.

Der Frame liest Zielbyte0C99 einmal nach AL und wartet bei unsigned AL>0C9A in3D64..3D69. Das Modell gibt `wait` zurück, statt die Hostausführung endlos zu blockieren oder den Zähler künstlich fortzuschalten. Bei erreichtem Zähler läuft der Eingabehelfer1624. Dessen normaler Pfad liest über1424 das rohe Tastaturbyte CS:0318; der Sonderwert73h mit folgenden Prüfungen ist hier ausdrücklich nicht unterstützt.

Nach dem Eingabehelfer wird0C9A null. Sieben Worte werden nach1DBF..1DCB übernommen:0B88,0B8A sowie1DCD,1DCF,1DD1,1DD3,1DD5. Bei leerer Zeichenliste0C16=0 wird0C49 null. Der abschließende Objektpfad entfällt, wenn0C37!=0 oder0CB0=0. Dann werden alle neun gesicherten Register restauriert und RET ausgeführt. Der Host lehnt anstehende Render-/Objektarbeit ausdrücklich ab und überspringt sie nicht stillschweigend.

`check-native-dos-frame-idle.py <memory.bin>` führt je108 Fälle beider Profile aus:72 vollständige Rückkehrpfade und36 weiterhin wartende Fälle. Timerbytes0/1/FF, die beiden Rohkeywerte0/72h, gesetztes/ungesetztes0C4A bei deaktiviertem Grafikaufruf sowie drei zulässige Endpfadkombinationen sind enthalten. Es werden keine Helfer gestubbt:1624 und1424 laufen als Originalinstruktionen. Verglichen werden sämtliche Globals bis Offset2FFFh, Stacktiefe und bei Rückkehr neun restaurierte Register. Wartende Fälle stoppen erst am erneut erreichten Vergleich. Originalcaptures unverändert. Ein tatsächlicher IRQ während des Wartens, Sondertasten, Grafikbenachrichtigung und die Render-/Objektpfade bleiben offen.
## Frame-Warten durch tatsächlichen Timerinterrupt fortsetzen

`check-native-dos-frame-irq.py <memory.bin>` verbindet den wartenden Frame3D3C erstmals mit dem vollständigen Original-Timerhandler0D98 und dessen IRET. CPU und RAM bleiben während jeder Sequenz erhalten. Nach erneut erreichtem Wartevergleich3D64 wird ausschließlich die Interruptzustellung kontrolliert: Flags/CS/IP werden als Interruptframe auf denselben Stack gelegt, IF/TF für den Eintritt gelöscht, anschließend läuft der Originalhandler. Keine Timerinstruktion oder untergeordnete Routine wird ersetzt. IRET führt tatsächlich zurück vor den Vergleich3D64; der unveränderte Frame liest dann den erhöhten Zähler.

Die Erwartungsseite komponiert das bestehende Idle-Frame-Modell mit der zuvor belegten sättigenden Timerzählererhöhung und `planOriginalDosTimerReturn`. Nach jedem IRQ und jeder Framefortsetzung werden sämtliche Globals bis2FFFh verglichen. Zusätzlich werden alle neun Register, Stacktiefe, die vollständigen zurückgegebenen16-Bit-Flags und der tatsächlich ausgegebene PIC-Befehl OUT20h=60h geprüft. Die IRQ-Rückkehr bleibt hier über0CD8=1 im IRET-Pfad; ein externer BIOS-Handler wird nicht als ausgeführt behauptet.

Je sechs persistente Sequenzen mit acht tatsächlich ausgeführten Timerinterrupts beider Profile bestehen. Enthalten sind sofort bereiter Frame, ein und mehrere notwendige IRQs sowie Ziel-/Zählerwerte nahe255. Nach Freigabe laufen der echte normale Tastaturhelfer, Bildpufferübernahme und Frame-RET vollständig durch. Originalcaptures unverändert. Grafikarbeit sowie Audio-/Paletten-/Cursorcallbacks sind in diesem Verbindungstest deaktiviert; einzelne dieser Routinen wurden separat geprüft, ihre gesamte gleichzeitige Integration ist damit noch nicht belegt. Es wird keine reale IRQ-Frequenz oder Hardwarezeit simuliert.
## Grafikaufruf des Frame-Service: Kopie und gesichertes Rechteck

`original-dos-frame-copy.ts` rekonstruiert den im Capture vorhandenen Grafik-Eintritt1E97:0028 über0C9B und109F. Der erste Helfer lädt Ziel ES:DI aus SS:0B88/0B8A und Quelle DS:SI aus0B84/0B86. CX=0FA0h und REP MOVSW kopieren4000 Worte, also8000 Bytes. Das ist die nachgewiesene Länge dieses Capturepfads, keine pauschale Behauptung eines vollständigen320x200-Bildtransfers. Spätere Codeanpassungen sind weiterhin gesondert zu prüfen.

Anschließend restauriert109F ein gesichertes Rechteck im Zielsegment0B8A. Sein Header kommt aus Engine-DS am Offset0CAA: Zieloffset, Breite, Zeilen. Die Payload wird dagegen aus Segment0CAC ab demselben Offset+6 gelesen; der ursprüngliche Zielpointeroffset0B88 wird durch den Headeroffset ersetzt. Zeilenabstand ist1DD5. Alle Payloadbytes einschließlich0 werden opak kopiert. Die Schleife entspricht dem bereits geprüften Cursor-Restore105D; der neue Kopieablauf verwendet daher dessen Hostfunktion für diesen Teil, während der native Test tatsächlich109F ausführt.

`check-native-dos-frame-copy.py <memory.bin>` führt je99 Fälle beider Profile über den echten Far-Eintritt bis RETF aus. Quelle-/Zieloffsets, grenznahe8000-Byte-Fenster, zwei Rechteckoffsets, Breite0/8/16, Zeilen1/3/16 und Strides20/320 sind enthalten, soweit nicht über das Segmentende geschrieben wird. Verglichen werden das komplette64-KiB-Zielsegment, unveränderte Quelle/Payload, neun restaurierte Register und die um4 erhöhte Far-Return-Stackposition. Originalcaptures unverändert; TypeScript-Prüfung bestanden. Hostvertrag: DF0, getrennte Segmente, keine umlaufenden Kopiefenster und positive Zeilenzahl. Der vollständige Frame-Aufrufer mit diesem Grafikzweig sowie andere Präsentationsmodi und Renderaufträge sind noch nicht damit belegt.
## Frame-Aufrufer mit tatsächlich ausgeführtem Grafikzweig

`runOriginalDosFrameCopyService` komponiert den Frame-Aufrufer mit der rekonstruierten Grafikfunktion. Bei gesetztem0C4A und2898 werden Quelle/Ziel und Rechteckheader aus den tatsächlichen Globals ausgewertet, die8000-Byte-Kopie und das opake Restore ausgeführt und anschließend0C4A null gesetzt. Erst danach folgt die Timerprüfung. Ein noch wartender Frame hat deshalb bereits einen geänderten Zielpuffer und gelöschtes Auftragsflag; die Komposition rollt diese Effekte nicht zurück.

`check-native-dos-frame-copy.py <memory.bin> --frame-service` startet jetzt am Original-Frame3D3C, führt den echten Far-CALL1E97:0028 mit beiden Grafikhelfern aus und läuft bis zum Frame-RET oder wiederholten Timervergleich weiter. Je99 Fälle beider Profile bestehen (66 Rückkehr-,33 Wartepfade). Verglichen werden das vollständige Zielsegment, unveränderte Quelle/Payload, sämtliche Globals bis28BFh einschließlich der Auftragsflags und Rechteckheader sowie Stacktiefe und bei Rückkehr neun restaurierte Register. Die Vergleichsgrenze liegt vor dem im selben Realmode-Speicher folgenden Grafikcode, der nicht als Globalsbuffer überschrieben wird. Die ursprünglichen direkten Grafikprüfungen bleiben ebenfalls verfügbar.

Damit ist der zuvor isolierte Grafikhelfer mit seinem echten Frame-Aufrufer verbunden. Der Test enthält keine anstehenden Render-/Objektlisten und keinen IRQ während des Wartens. Ein kompletter Renderer, weitere Präsentationsmodi und die gleichzeitige Integration der Timercallbacks sind weiterhin offen. Originalcaptures unverändert; TypeScript-Prüfung bestanden.
## Opcode41: rohe Kontextblöcke schreiben und im Toolkit ausführen

`original-dos-script-block.ts` rekonstruiert1000:5713..5737, Opcode41 in beiden identifizierten Captures. Die Operanden beginnen mit einem Zieloffsetwort O und Zählerbyte N. N wird nach ES:[BP+O-1] geschrieben, das folgende Byte nach ES:[BP+O-2]. Danach werden N aufeinanderfolgende Quellworte in absteigende Zielwortadressen BP+O-4, BP+O-6 usw. geschrieben. Auch bei N0 werden die beiden Anfangsbytes geschrieben; es folgen dann keine Worte. SI steigt um4+2*N ab Operandenbeginn. AX/CX/DI werden restauriert. Eine darüber hinausgehende Variablentypsemantik wird nicht behauptet.

`check-native-dos-script-block.py <memory.bin>` führt je1536 Fälle beider Profile durch tatsächlichen Opcode-Dispatch, Handler und RET aus: alle256 Zählerwerte, drei Zieloffsets und zwei BP-Werte. Vollständiges Kontextsegment, SI, Stacktiefe und restaurierte Register stimmen überein. DF0 und getrennte Quell-/Zielsegmente werden vorausgesetzt. Wortzugriffe, deren zweite Byteadresse über die Segmentgrenze hinausgeht, lehnt das Hostmodell ausdrücklich ab; ein solcher Randfall wurde während der Prüfung erkannt und nicht durch falsches byteweises Wrap als Originalverhalten ausgegeben. Quelloperanden dürfen das Hostsegment ebenfalls nicht überschreiten.

Die Funktion ist an die native Skript-Diagnose angebunden. Im Browser führt Ishar2 `IO.IO` jetzt13 Blockbefehle vom Einstieg0018h bis005Fh aus. Beim folgenden Opcode106 bleibt SI005Fh und die Schrittzahl13 unverändert. Dieser Ablauf wurde in der Oberfläche geprüft. Adaptertests decken zusätzlich abgeschnittene Blöcke ab; native Vergleiche, Typecheck und Produktionsbuild bestehen. Originaldateien/Captures bleiben unverändert. Die Diagnose ist weiterhin eine begrenzte Hostausführung rekonstruierter Funktionen, keine vollständige ALIS-VM.

## Opcode106 und vier numerische Operandformen

In beiden identifizierten DOS-Captures verweist Opcode106 auf1000:58B3. Der Handler ruft69A6 auf und schreibt anschließend DL nach SS:0C99h. Der Operanddispatcher verwendet das Tagbyte direkt als Byteoffset in der Sprungtabelle1000:01F2. Die rekonstruierten Tags sind0 (69C7: vorzeichenbehaftetes Literalbyte),2 (69CC: Literalwort),6 (69E3: vorzeichenbehaftetes Byte aus ES:[BP+Offset]) und8 (69ED: Wort aus ES:[BP+Offset]). SI steigt um zwei beziehungsweise drei Bytes ab Operandbeginn. Ergebnisse sind16-Bit-Worte; der Handler speichert das niedrige Byte.

`original-dos-numeric-operand.ts` implementiert diese vier Formen. `check-native-dos-numeric-operand.py <memory.bin>` führt je1056 Fälle beider Profile über den tatsächlichen Dispatch26EB, Handler58B3, Operanddispatcher69A6 und RET bis26F7 aus. Enthalten sind alle256 Bytewerte der Tags0/6, acht Wortgrenzwerte für2/8 und zwei Kontextoffsets. Geprüft werden SI, DX, CX=vorheriges DX, BX=277Ch, Stacktiefe, Timerbyte und das vollständig unveränderte Kontextsegment. Die Hostfunktion bildet nicht sämtliche Registerseiteneffekte ab. Strings, indizierte und weitere Ausdrucksformen bleiben offen. Voraussetzung: DF0, getrennte Segmente und begrenzte Operandenfenster. Ein Kontextwort über dem Segmentende wird abgelehnt. Originalcaptures bleiben unverändert.

Die Toolkit-Diagnose bindet Opcode106 an und zeigt das Zielbyte an. Globals werden als kontrollierter Nullkontext angelegt. Ishar2 IO.IO erreicht nach14 Schritten SI0062h und Timerziel1; Opcode71 stoppt unverändert. Adaptertests und native Vergleiche bestehen. Die erneute Browserprüfung steht noch aus. Keine vollständige VM- oder NPC-Ausführung wird daraus abgeleitet.

## Opcode71: wörtliches Kontextwort

`original-dos-script-selection.ts` rekonstruiert1000:2EF3..2EFE in beiden identifizierten Captures. LODSW liest das Operandwort. Falls es vom vorhandenen Wort ES:[BP-16h] abweicht, wird es dort gespeichert; bei Gleichheit erfolgt kein Schreibzugriff. SI steigt bei DF0 um zwei, AX enthält den Wert. Eine höhere Objekt-/Auswahlsemantik dieses Rohfelds wird hier nicht behauptet.

`check-native-dos-script-selection.py <memory.bin>` vergleicht je144 Fälle beider Profile durch tatsächlichen Opcode-Dispatch und RET: acht Literalgrenzwerte, drei Vorwerte, drei BP-Werte und zwei Quellpositionen einschließlich FFFEh. Komplettes Kontextsegment, unverändertes Quellsegment, SI, AX und Stacktiefe stimmen überein. Die Hostfunktion bildet Flag- und vollständige Registerzustände nicht ab; sie setzt DF0, getrennte Segmente und innerhalb des Segmentfensters liegende Wortzugriffe voraus. Originalcaptures bleiben unverändert.

Der Toolkit-Adapter führt nun auch71 aus. Ishar2 IO.IO erreicht nach15 Schritten SI0065h; das Rohfeld enthält66. Der folgende Opcode76 bleibt explizit stehen. Adaptertests prüfen Kontextänderung, unveränderten Vorgängerzustand und abgeschnittene Operanden. Die neue Grenze wurde am echten lokalen Modul per Hostausführung geprüft, noch nicht erneut im Browser.

## Opcode76: drei sequentielle Kontextworte

`original-dos-script-position.ts` rekonstruiert1000:3B86..3B9B in beiden identifizierten Captures. Dreimal wird69A6 aufgerufen und DX sofort nach ES:[BP], ES:[BP+2] beziehungsweise ES:[BP+4] geschrieben. Die Reihenfolge ist wesentlich: Ein späterer Kontextoperand liest bereits die vorherigen Schreibeffekte. Keine zusätzliche Koordinatentransformation oder Objektbewegung ist Bestandteil dieses Handlers.

`check-native-dos-script-position.py <memory.bin>` führt je384 Fälle pro Spiel über tatsächlichen Dispatch, alle drei Operandaufrufe und RET aus. Alle64 Kombinationen der Tags0/2/6/8 werden mit sechs Werten geprüft. Kontextoperanden beziehen sich auch auf zuvor überschriebene Worte. Verglichen werden das komplette Kontextsegment, unveränderte Quelle, SI, finales DX und Stacktiefe. DF0, getrennte Segmente und innerhalb des Segmentfensters liegende Wortzugriffe sind Voraussetzung. Weitere Operandformen und vollständige Register-/Flagsemantik sind nicht abgebildet. Originalcaptures bleiben unverändert.

Der Diagnoseadapter prüft alle drei Operanden vor der Ausführung auf verfügbare Bytes und unterstützte Tags. Ein Hostabbruch verändert den vorherigen Zustand nicht; das ist eine ausdrückliche Diagnoseeigenschaft, keine Behauptung über den nativen Fehlerpfad. Adaptertests decken drei Schreibwerte einschließlich signiertem Byte, Zustandserhalt, unbekannten dritten Tag und abgeschnittenes letztes Wort ab. Ein zunächst zu kurzer Testfall enthielt tatsächlich noch das ganze Wort; er wurde korrigiert und prüft nun eine echte fehlende zweite Wortbyteposition.

Typecheck und Produktionsbuild bestehen. Der Browserlauf mit lokalem Ishar2 IO.IO ist am18.10.2026 geprüft:16 Schritte, SI006Ch, Timerziel1; danach unveränderter Halt auf Opcode156. Damit sind auch die zuvor offenen UI-Prüfungen von106 und71 durch den tatsächlichen Modulablauf abgedeckt. Screenshot außerhalb des Repos: analysis-output/native-script-position-ui-2026-10-18.png. Noch keine vollständige VM-, Scheduler- oder NPC-Ausführung.

## Opcode156: Kontextliste bis zur Ergebnisoperanden-Grenze

`original-dos-context-list.ts` rekonstruiert den Präfix1000:51AF..51DD und die anschließenden Sprünge über4BC4/4B8F bis vor291B. Opcode156 sichert SI, setzt DI=1E7Eh, lädt die Tabellenbasis aus SS:0BD2 und beginnt bei Slot0. Der nächste Slot kommt jeweils aus ES:[Basis+Slot+4]; ausschließlich null beendet den Lauf. Für jeden Slot wird zuerst das Begleitwort SS:[DI+100h] gelöscht und dann der Slot nach SS:[DI] geschrieben. DI steigt um2. Nach dem letzten Eintrag folgt FFFFh als Sentinel. SI wird wiederhergestellt, SS:0C96 gelöscht und SS:0C80 auf1E7Eh gesetzt. DX erhält das erste Listenwort; nur bei nichtnegativem DX wird0C80 um2 erhöht. Auch Slots mit gesetztem Vorzeichenbit werden also aufgenommen, führen bei der ersten Entnahme aber nicht zur Cursorerhöhung.

Der native Ablauf springt danach in den gemeinsamen Ergebnisoperanden-Handler291B. Dieser gehört noch nicht zur neuen Hostfunktion. Deshalb wird Opcode156 ausdrücklich noch nicht im Toolkit ausgeführt oder als vollständig rekonstruiert ausgewiesen. Es gibt keine neue Diagnose-Schrittzahl.

`check-native-dos-context-list.py <memory.bin>` prüft je24 Fälle beider identifizierter Captures durch tatsächlichen Opcode-Dispatch und Listenaufbau bis291B: Längen0/1/2/3/16/127, zwei Tabellenbasen und niedrige/hohe Slotwerte. Verglichen werden sämtliche Globals bis21FFh, unverändertes Kontext-/Quellsegment, DX, DI, BX, SI und die noch ausstehende Dispatcher-Returnadresse auf dem Stack. Der Test ersetzt keinen Handler durch einen Stub und stoppt vor der nächsten Routine. Originalcaptures bleiben unverändert.

Der Hostvertrag verlangt getrennte Segmente, begrenzte Wortzugriffe und eine azyklische Liste mit maximal127 Einträgen, damit Sentinel und Begleitwortbereich getrennt bleiben. Das Original prüft diese Grenze oder Zyklen an dieser Stelle nicht; die Hostabweisung ist eine dokumentierte Diagnosegrenze. Vollständige Register-/Flagsemantik und Ergebnisoperandenausführung bleiben offen. Nächster Schritt:291B samt Zieloperand-Formaten rekonstruieren und erst danach156 in die Diagnose aufnehmen.

## Ergebnisoperanden291B und zusammengesetzter Opcode156

`original-dos-script-result.ts` bildet291B..2932 sowie die direkten Ziel-Tags6/8/18/20 ab. Zuerst tauscht das Original die beiden Worte SS:0C58 und0C5C. Dann liest es das Tagbyte und springt über CS:[029Ch+Tag]. Tags6/8 lesen einen16-Bit-Offset,18/20 einen8-Bit-Offset. Nach ES:[BP+Offset] wird DL (6/18) oder DX (8/20) geschrieben. SI steigt um3 beziehungsweise2. Strings und indizierte Zieloperanden sind noch nicht unterstützt; höhere Semantik der getauschten Globals wird nicht behauptet.

`check-native-dos-script-result.py <memory.bin>` prüft je192 Fälle beider identifizierter Captures ab291B bis zur tatsächlichen Rückkehr: vier Tags, acht Ergebnisgrenzwerte, drei Offsets und zwei BP-Werte. Verglichen werden vollständiges Kontextsegment, Globals bis21FFh, unveränderte Operanden, SI, DX, DI, BX und Stacktiefe. Hostvertrag: DF0, getrennte Segmente, begrenzte Wortzugriffe. Register-/Flagzustände sind nicht vollständig Teil der Host-API. Originalcaptures unverändert.

Der bestehende Listenchecker unterstützt nun `--complete`: je96 Fälle pro Spiel führen den tatsächlichen Opcode156 über Listenaufbau, Ergebnisdispatcher und Zielhandler bis RET aus. Es werden24 Listenfälle mit allen vier direkten Zieltags kombiniert. Die vollständigen Kontext- und begrenzten Globals-Hashes, SI, DX, Quelle und Stack stimmen überein. Der bisherige Präfixtest bleibt separat nutzbar.

Die Toolkit-Diagnose bindet156 für diese vier Zieltypen an. Ihr kontrollierter Globalszustand enthält nun die gewählte Tabellenbasis0100h in0BD2. Es werden keine aktiven Listenverknüpfungen erfunden: Der nur angelegte Kontext besitzt standardmäßig noch keine aktive Tabellenliste, daher liefert156 hier den SentinelFFFFh. Ein Adaptertest mit explizit gesetztem synthetischem Link liefert dagegen Slot6. Dies ist kein rekonstruierter Originalspielzustand oder vollständiger Scheduler. Unbekannte Ziel-Tags halten ohne globale Listenänderungen an. Das lokale Ishar2 IO.IO erreicht in der Hostprüfung17 Schritte, SI0070h und den noch nicht angebundenen Opcode31. Adaptertests und Typecheck bestehen.

Produktionsbuild und erneute Browserprüfung bestehen ebenfalls: Import des lokalen Ishar2 IO.IO,17 Schritte bis SI0070h/Timerziel1 und ein zusätzlicher Klick mit unverändertem Halt auf31. Screenshot außerhalb des Repos: analysis-output/native-script-result-ui-2026-10-18.png. Die Oberfläche läuft auf Port4182 mit dem neuen Build.

## Opcode31: numerische Ausdrucksschleifen und Vergleiche

`original-dos-script-expression.ts` rekonstruiert den Opcode31-Eintritt2937→69A9 und die Teilmenge der Ausdruckstags0/2/6/8,56/58 sowie74/76/78/80/82/84. 69A9 übernimmt zunächst DX nach CX; der Schleifenaufruf69AB tut dies nicht. Tag56 führt wiederholt solche direkten Operandaufrufe aus. Tag58 überspringt eine Rückkehradresse und verlässt die aktuelle Ausdrucksschleife. Diese Stackwirkung wird im strukturierten Hostmodell als Schleifenende abgebildet;58 außerhalb einer Schleife bleibt nicht unterstützt.

Die Vergleichstags rufen69A9 für ihren rechten Operanden auf.74/76 vergleichen auf Gleichheit/Ungleichheit,78/80/82/84 vergleichen das vorzeichenbehaftete CX mit DX auf <=/>=/</>. Wahr ergibtFFFFh, falsch0. Entscheidend: CX ist ein gemeinsames Register. Ein verschachtelter rechter Ausdruck kann es verändern; das Hostmodell verwendet deshalb nicht einfach eine vor dem Aufruf gesicherte linke JavaScript-Variable.

`check-native-dos-script-expression.py <memory.bin>` führt je912 Fälle beider identifizierter Captures durch tatsächlichen Opcode-Dispatch, verschachtelte Operandaufrufe und RET aus. Geprüft werden acht Grenzwerte je Vergleichsseite, einfache/verschachtelte Schleifen, alle16 Kombinationen der vier direkten Zahlenformen und verschachtelte Vergleiche mit erneut verändertem CX. SI, DX, CX und Stacktiefe stimmen überein; Kontextsegment, Globals bis21FFh und Quellbytes bleiben unverändert. DF0, begrenzte Quellen und getrennte Segmente sind Voraussetzung. Weitere Tags, Ausdrucksstackoperationen und sämtliche Register-/Flags sind damit nicht vollständig rekonstruiert. Hostgrenzen von128 Verschachtelungen/4096 Tokens sind zusätzliche Diagnoseschranken.

Der Toolkit-Adapter erhält jetzt DX/CX zwischen unterstützten Befehlen:106 setzt CX auf das vorige DX,76 hinterlässt CX=zweiter/DX=dritter Zahlenwert,156 hinterlässt den ersten Listenwert in DX. Beide Register starten ausdrücklich als kontrollierte Testwerte0. Opcode31 führt nur die genannten Ausdrucksformen aus; unbekannte oder abgeschnittene Formen halten ohne Änderung des vorherigen Zustands an. Das echte lokale Ishar2 IO.IO erreicht nach18 Schritten SI0079h, DX0, CXFFFFh und den noch nicht angebundenen Opcode20. Adaptertests und Typecheck bestehen. Keine vollständige Ausdrucks- oder Spiel-VM wird behauptet.

Produktionsbuild und Browserlauf bestehen ebenfalls. Das lokale Ishar2 IO.IO erreicht18 Schritte, SI0079h, DX0000h, CXFFFFh und Timerziel1; der nächste Klick hält auf20 unverändert an. Screenshot außerhalb des Repos: analysis-output/native-script-expression-ui-2026-10-18.png. Nächste Lücke: Opcode20 und dessen Kontrollfluss.

## Bedingte Sprünge18–29 und fortlaufender nativer Modulvergleich

`original-dos-script-conditional.ts` rekonstruiert2885..2914. Vier Dreiergruppen springen bei DX=0 (18–20), DX!=0 (21–23), DX=CX (24–26) beziehungsweise DX!=CX (27–29). Innerhalb jeder Gruppe gibt es einen signierten Byteoffset, einen Wortoffset und einen Wortoffset mit zusätzlichem verbrauchtem, ungelesenem Byte. Der Offset wird zum SI nach dem Operand addiert, modulo65536. Nicht genommene Zweige verbrauchen nur1/2/3 Bytes und lesen die Offsetbytes im Original nicht. DX/CX bleiben erhalten. Flags werden im Hostmodell nicht abgebildet.

`check-native-dos-script-conditional.py <memory.bin>` vergleicht je8704 Fälle beider identifizierter Captures durch tatsächlichen Dispatch und RET: alle256 Byteoffsets beziehungsweise acht Wortgrenzwerte, vier DX/CX-Kombinationen und zwei Quellpositionen einschließlich Segmentrand. SI, AX, DX, CX, Stacktiefe, unveränderte Quelle und Kontext stimmen überein. Das Hostmodell lehnt nur tatsächlich benötigte Wortzugriffe über dem Segmentende ab; der Toolkit-Adapter verlangt zusätzlich vollständige Operandlängen innerhalb des geladenen Moduls. Diese zusätzliche Begrenzung ist Diagnoseverhalten, keine native Lesebehauptung für nicht genommene Zweige.

`check-native-script-diagnostic-file.py <memory.bin> <module.IO>` vergleicht jetzt komplette unterstützte Befehlsfolgen mit einem fortlaufenden Unicorn-CPU-Zustand. Der Kontext kommt aus dem bereits separat geprüften kontrollierten Kontextaufbau. Zwischen den Befehlen werden keine Register zurückgesetzt; lediglich der Dispatcher26EB wird erneut betreten, wie bei der Host-Einzelschrittausführung. Nach jedem Handler-RET werden SI, DX, CX, Stacktiefe, das vollständige Kontextsegment und Globals bis21FFh verglichen. Die Modulquelle bleibt unverändert. Lokale Originalbytes werden nur zwischen Prüfprozessen übertragen und nicht ins Repo geschrieben. Yield/Scheduler, IRQ und Mehrsegmentmodule sind noch ausgeschlossen.

Ergebnisse: Ishar2 IO.IO (SHA256 0df1f34cf2519341ef20825d49c7f1e7ff204878814db744f7e5cb58ce6b5918) stimmt19 Schritte mit seinem nativen Capture überein; nächster Halt148 an SI0095h. Derselbe Modulpfad stimmt auch mit dem Ishar1-Enginecapture überein, was ausdrücklich kein Ishar1-Spielablauf ist. Zusätzlich wurde Ishar1 FRISE.IO (SHA256 3bd158963fdaf0f88517b03509002100159a7587c8e2486389314b8abc707e15) mit seinem eigenen Capture geprüft:14 übereinstimmende Schritte bis Opcode134. Eine Datei Ishar1/IO.IO existiert lokal nicht; stattdessen wurde nach Prüfung der vorhandenen Module FRISE.IO gewählt. Originaldateien/Captures bleiben unverändert.

Adaptertests für genommenen/nichtgenommenen Sprung, Registererhalt und abgeschnittene Operanden, Typecheck und Produktionsbuild bestehen. Der Toolkit-Adapter bindet18–29 an. Nächste Lücke im kontrollierten Ishar2-Initialpfad:148; die vollständige VM und Originalspielzustände bleiben offen.

Browserprüfung am18.10.2026 bestanden: Ishar2 IO.IO erreicht19 Schritte, SI0095h, DX0000h, CXFFFFh und Timerziel1. Ein weiterer Klick hält auf148 ohne Zustandsfortschritt an. Screenshot außerhalb des Repos: analysis-output/native-script-conditional-ui-2026-10-18.png.

## Opcode148: Kontextsuche nach Modul-ID

`original-dos-context-query.ts` rekonstruiert510F..515C bis zum gemeinsamen Ergebnisdispatcher291B. Das Literalwort nach dem Opcode wird zunächst nach DX gelesen. Der Ablauf prüft zuerst Slot0 der Tabelle SS:0BD2, danach die verknüpften Slots über ES:[Basis+Slot+4]. Der Kontextpointer kommt aus ES:[Basis+Slot], die Modul-ID aus ES:[Pointer-10h]. Der aktuelle Kontext BP wird ausgeschlossen. Insbesondere wird Slot0 nicht pauschal als leer übersprungen; auch ein Nullpointer wird vom Original hier nicht gesondert abgefangen.

Treffer werden ab SS:1E7Eh mit jeweils gelöscht gesetztem Begleitwort+100h gesammelt. Bei SS:0C96=0 endet die Suche nach dem ersten Treffer, bei jedem anderen Bytewert werden weitere Treffer gesucht. Danach folgt FFFFh als Sentinel,0C96 wird gelöscht und der gemeinsame Listenanfang4BC4/4B8F liefert den ersten Slot in DX. Der Cursor0C80 steigt nur bei nichtnegativem Ergebnis. CX bleibt der Listenendpointer. Der bereits rekonstruierte Ergebnisdispatcher übernimmt anschließend den Wert in das direkte Byte-/Wortziel.

`check-native-dos-context-query.py <memory.bin>` vergleicht je2160 Fälle beider identifizierter Captures durch den tatsächlichen Opcode-Dispatch, Suche, Ergebnisdispatcher und RET. Enthalten sind0/1/2/4/16 Folgeknoten zusätzlich zum Wurzelslot, drei IDs, Modusbytes0/1/255, vollständige/abwechselnde/keine Treffer, Selbst-/Fremdkontext, alle vier direkten Ergebnistags und niedrige/hohe Slotwerte. Letztere prüfen auch den nicht fortgeschalteten Cursor bei negativ interpretiertem ersten Slot. Das vollständige Kontextsegment, Globals bis21FFh, SI, DX, CX, Stacktiefe und unveränderte Quelle stimmen überein. Quell-Captures bleiben unverändert.

Hostgrenzen: getrennte Segmente, begrenzte Wortzugriffe, azyklische Liste und maximal127 Treffer zur Trennung der Listen-/Begleitbereiche. Diese Grenzen sind Diagnosebedingungen, keine Originalprüfungen. String-/indizierte Ergebnisziele, sämtliche Register-/Flags und eine aktive Originalspielkontextverwaltung bleiben offen.

Der Toolkit-Adapter bindet148 an; unbekannte/abgeschnittene Ziele halten vor jeder Zustandsänderung. Der fortlaufende Originalvergleich bestätigt nun20 Schritte für Ishar2 IO.IO bis SI009Bh, DXFFFFh und CX1E7Eh; nächster Halt62. Ishar1 FRISE.IO bleibt bei14 geprüften Schritten bis134. Adaptertests, Typecheck und Produktionsbuild bestehen. Die erneute Browserprüfung dieser Erweiterung ist noch offen.

## Opcode62 und erster fortlaufend geprüfter Yield

`original-dos-context-active.ts` rekonstruiert57C1..57D8. Nach69A6 wird DX vorzeichenbehaftet gegen0 geprüft. Negative Worte führen ohne Tabellenzugriff zum RET. Sonst wird der Kontextpointer aus ES:[SS:0BD2+DX] gelesen und ES:[Pointer-4] auf1 gesetzt. Das entspricht dem vom Scheduler ausgewerteten Aktivitätsbyte. Ein Nullpointer wird im Original an dieser Stelle nicht abgefangen; er schreibt bei Pointer0 nachFFFCh. Der Host bildet dies nach und fügt keinen erfundenen Nullpointer-Skip hinzu.

`check-native-dos-context-active.py <memory.bin>` vergleicht je3168 Fälle beider identifizierter Captures durch tatsächlichen Opcode-Dispatch, Zahlenoperand und RET: alle256 Bytewerte bei Tags0/6, acht Wortgrenzwerte bei2/8, drei Kontextpointer einschließlich0/FFFFh und zwei Tabellenbasen. Vollständiges Kontextsegment, unveränderte Globals bis21FFh/Quelle, SI, DX, CX=vorheriges DX und Stacktiefe stimmen überein. Hostvertrag: DF0, getrennte Segmente, begrenzte Wortzugriffe, Zahlenformen0/2/6/8. Weitere Operanden und vollständige Register-/Flagsemantik bleiben offen. Originalcaptures unverändert.

Der Toolkit-Adapter bindet62 an. Tests prüfen positiven Slot, negatives Literal, unveränderten Vorgängerzustand und sicheren Halt bei unbekanntem Operand. Die fortlaufende native Dateiprüfung unterstützt jetzt zusätzlich den tatsächlich ausgeführten Opcode66-Yield bis zur kontrollierten Aufrufergrenze1000:E000. Dafür wird eine synthetische Aufrufer-Rückkehradresse unterhalb des Dispatcheraufrufs gesetzt; die Originalroutine2D94 entfernt ihren Dispatcher-Return mit ADD SP,2 und kehrt zum Aufrufer zurück. Kein Handler ist gestubbt und keine Scheduler-Routine wird dadurch als ausgeführt behauptet. Die Stacktiefe steigt bei dieser Grenze entsprechend vonFF00h aufFF02h.

Ishar2 IO.IO stimmt jetzt22 Schritte einschließlich erstem Yield nach jedem Befehl mit dem fortlaufenden nativen CPU-Zustand überein. Ishar1 FRISE.IO bleibt bei14 bestätigten Schritten bis134. Das Byte186 nach dem Yield ist nur das nächste Modulbyte, kein jetzt ausgeführter nächster Befehl. Scheduler-/Callback-/Delta-Fortsetzung müssen erst angebunden werden. Adaptertests, Typecheck und Produktionsbuild bestehen. Die UI-Prüfung von148/62/Yield steht noch aus.

Browserprüfung am18.10.2026 bestanden: Originales Ishar2 IO.IO importiert,22 Schritte bis Yield ausgeführt. Anzeige: SI00A0h, DXFFFFh, CXFFFFh, Timerziel1; Einzelbefehlsbutton ist deaktiviert. Das deckt zugleich die zuvor offene UI-Prüfung von148 ab. Screenshot außerhalb des Repos: analysis-output/native-script-yield-ui-2026-10-18.png.

## Toolkit: Yield-Abschluss bis zur nächsten Originalgrenze

`finishNativeScriptDiagnosticYield` bindet die bereits separat rekonstruierte Fortsetzung26B2..26E8 an den Diagnosezustand an. Nur nach Yield wird ES:[BP-8] mit SI aktualisiert. Ein vorhandener Rückkehr-Callback führt zum expliziten Status `callback` vor dessen Dispatch. Ohne Callback wird die Kontextdelta-Routine verwendet und das Countdownbyte BP-1 aus BP-2 neu geladen; der Adapter endet als `next-context` vor2632. Keine der beiden Grenzen startet automatisch weitere Befehle.

Die Diagnose hat noch kein importiertes Objektsegment. Eine nichtleere Objektkette ohne vorgezogenen Callback wird deshalb vor jeder Änderung abgelehnt. Bei leerem Kopf erfolgen keine Objektzugriffe; das benötigte leere Hostbufferargument des bestehenden Helfers ist keine Behauptung über vorhandene Originalobjekte. Snapshotworte stammen aus den kontrollierten Globals BFA/BFC/BFE, in diesem Anfangskontext0. Modulheader außerhalb der geladenen Bilddaten und Mehrsegmentmodule werden abgelehnt.

`check-native-script-diagnostic-file.py <capture> <module> --finish-yield` setzt die tatsächliche Aufrufer-Rückkehradresse26B2 unter den Dispatcheraufruf. Nach der nativen66-Abgabe wird zuerst der bisherige22-Schrittzustand verglichen. Anschließend wird26B2 tatsächlich ausgeführt, bis2632 oder bis zum Callback-Dispatch26EB. Vollständiges Kontextsegment, Globals bis21FFh, SI, DX, CX und Stacktiefe stimmen mit der Hostkomposition überein. Ohne Option bleibt die bisherige isolierte Yield-GrenzeE000 erhalten.

Am18.10.2026 bestanden: Ishar2 IO.IO mit22 Schritten und anschließendem Abschluss bis `next-context`; zusätzlich Ishar1 PRESTI.IO (SHA256 c594b1e367990ed5ca6b1d56d68a0ff2b3d7748aa5a6256c79f8c8894132d456) mit einem tatsächlichen Yield und demselben Abschluss. Die früheren24 nativen Resume-Fälle pro Profil bestehen weiterhin. Adaptertests prüfen gespeicherten SI, Countdownreload, Callbackgrenze, Zustandserhalt bei fehlendem Objektsegment und wirkungslose Wiederholung nach erreichter Grenze. Typecheck und Produktionsbuild bestehen. Die Browserprüfung des neuen Buttons steht noch aus.

Die Oberfläche bietet dafür `Yield-Abschluss prüfen`, ausschließlich nach Yield. Die neue Grenze ist kein vollständiger Schedulerzyklus: Kontextauswahl2632, Frame-Service, Auswahl-/Scan-/Main-Vorbereitung und die Ausführung von Rückkehr-Callbacks müssen noch mit dem Diagnosezustand verbunden werden.

Browserprüfung am18.10.2026 bestanden: Nach22 IO.IO-Schritten wird `Yield-Abschluss prüfen` aktiv. Ein Klick speichert00A0h nach ES:[BP-8], setzt SI auf den Modulbasiswert0 und erreicht die ausdrücklich angezeigte Grenze vor2632. Beide Ausführungsbuttons sind danach deaktiviert; die Opcode-Schrittzahl bleibt22. Screenshot außerhalb des Repos: analysis-output/native-script-resume-ui-2026-10-18.png. Das angezeigte Modulbyte bei SI ist an dieser Schedulergrenze kein freigegebener nächster Skriptbefehl.

## Toolkit: Kontextauswahl nach Yield-Abschluss

`selectNextNativeScriptDiagnosticContext` bindet den zuvor geprüften Ablauf2632..264F an die Phase `next-context` an. Tabellenbasis0BD2 und aktueller Slot0B02 kommen aus den kontrollierten Globals. Der nächste rohe Link aktualisiert0B02. Bei Link0 bleibt BP erhalten und die Diagnose endet vor dem Frame-CALL2649 als `frame`; sonst wird BP direkt aus dem Tabelleneintrag geladen und vor264F als `context` angehalten. Ein Nullpointer wird nicht korrigiert. Opcodezahl und Quell-/Kontextbytes bleiben unverändert.

Die fortlaufende Dateiprüfung unterstützt nun `--select-next` (schließt `--finish-yield` ein). Nach tatsächlicher Ausführung von26B2 wird auch2632 nativ ausgeführt und vor2649/264F gehalten. BP, SI, DX, CX, Globals, unverändertes Kontextsegment und Stacktiefe stimmen mit der Adapterkomposition überein. Ishar2 IO.IO erreicht22 Opcode-Schritte plus Yield-Abschluss plus Auswahl zur Frame-Grenze; Ishar1 PRESTI.IO einen Yield mit denselben Übergängen. Es wurden keine aktiven Links erfunden; im kontrollierten Anfangszustand ist deshalb kein weiterer Kontext verknüpft.

Die54 ursprünglichen Auswahlfälle pro Profil (18 Frame-/36 Kontextpfade) bestehen erneut. Adaptertests decken Framegrenze, verknüpften Kontext, rohe Pointer0/0600h/FFFFh, unveränderte Vorgängerzustände und gesperrte weitere Skriptausführung an den Grenzen ab. Typecheck und Produktionsbuild bestehen. Die Oberfläche bietet `Nächsten Kontext prüfen` nur nach abgeschlossenem Yield, zeigt Diagnosephase und aktuellen Slot und unterdrückt eine irreführende Opcodeanzeige an Schedulergrenzen. Noch keine Frame-Ausführung, Scan-/Main-Vorbereitung oder vollständiger Schedulerzyklus.

Browserprüfung am18.10.2026 bestanden:22 IO.IO-Schritte bis Yield, Yield-Abschluss und danach `Nächsten Kontext prüfen`. Ergebnis `frame`, SI0100h, Slot0, gespeicherter Skriptzeiger00A0h, unveränderte22 Opcode-Schritte. Die Opcodeanzeige zeigt eine Schedulergrenze; alle Ausführungsbuttons sind dort gesperrt. Screenshot außerhalb des Repos: analysis-output/native-script-context-ui-2026-10-18.png.

## Toolkit: leerer Frame, kontrollierter Timer-IRQ und Rückkehr

`runNativeScriptDiagnosticFrame` bindet den separat rekonstruierten leeren Frame3D3C an die Phase `frame`/`frame-wait` an. Tastaturbyte CS:0318 wird ausdrücklich als kontrollierter Wert0 verwendet. Ein nicht erreichter Timerwert führt zu `frame-wait`, ohne Zeitfortschritt zu erzeugen. Nach erfülltem Timervergleich werden die nachgewiesenen Frame-Globals aktualisiert und die Diagnose endet als `frame-return` vor264C. Render-/Objekt-/Cursorarbeit und Grafikbenachrichtigungen bleiben durch den vorhandenen Hostvertrag ausgeschlossen.

`original-dos-idle-timer-irq.ts` komponiert die bereits geprüften Teile des IRQ0D98..0E46 für inaktive Callbacks/Records: saturierendes0C9A, signierte Prioritätsauswahl nach0CD7 und Timerende über0C97/0C98/0CD8/0CC5. Der PIC-Ausgabewert ist20h:60h. CS:9414 ist ein ausdrücklicher kontrollierter Audio-Flagwert0. Aktive Paletten-/Cursor-/Recordpfade oder Verkettung zum gespeicherten BIOS-Handler werden vor Änderungen abgelehnt. Diese Komposition ist keine Behauptung einer vollständigen IRQ- oder Echtzeitimplementation. Die bisherige native Frame/IRQ-Prüfung verwendet jetzt diesen Helfer: je6 Sequenzen mit8 tatsächlich ausgeführten IRQs und IRET pro Profil bestehen erneut.

`check-native-script-diagnostic-file.py <capture> <module> --frame-cycle` erweitert den fortlaufenden Vergleich über den tatsächlichen CALL2649 zum Frame. Beim Wartepfad wird am zweiten Vergleich3D64 gehalten, dann eine kontrollierte Interrupt-Stackfolge mit Rückkehr zu3D64 erzeugt und der echte IRQ0D98 ausgeführt. IRET stellt alle neun gesicherten Register, Interruptflags und Stacktiefe wieder her; OUT20h:60h wird beobachtet. Anschließend führt der Originalframe bis zur Rückkehr264C weiter. Direkter Rückkehrpfad und Warte-/IRQ-Pfad vergleichen sämtliche Globals bis28BFh und unverändertes Kontextsegment. Diese neue Grenze enthält die beiden oberen Callbackflags, endet aber vor dem im selben Realmode-Speicher folgenden Grafikcode und überschreibt diesen nicht. CS:9414/0318 werden nur im Emulator als kontrollierte Datenwerte0 gesetzt, nicht in Originaldateien geändert.

Ishar2 IO.IO:22 Opcodes, Yield-Abschluss, Kontextauswahl, wartender leerer Frame, ein tatsächlicher Timer-IRQ und erfolgreiche Frame-Rückkehr stimmen fortlaufend überein. Ishar1 PRESTI.IO:ein Opcode/Yield mit denselben Fortsetzungen und direkter Frame-Rückkehr ohne IRQ stimmt überein. Adaptertests prüfen Warte-/Rückkehrphase, Zähleränderung, erhaltene Vorgängerzustände und Abweisung aktiver Callbacks beziehungsweise BIOS-Verkettung. Typecheck und Produktionsbuild bestehen. Die UI-Prüfung der neuen Frame-/IRQ-Buttons steht noch aus.

Die Schedulerfortsetzung264C mit Kontextpointer-Neuladen, Scan-/Main-Vorbereitung und weiteren Skriptläufen bleibt noch offen. Auch Grafikaufträge und aktive Callbackpfade müssen später mit ihren wirklichen Segmenten angebunden werden; hier werden sie nicht durch leere Ersatzroutinen ersetzt.

Browserprüfung am18.10.2026 bestanden: Nach22 IO.IO-Opcodes, Yield-Abschluss und Kontextauswahl wartet der leere Frame auf den Zähler. Ein Klick auf `Kontrollierten Timer-IRQ prüfen` erhöht0C9A von0 auf1 und den Diagnose-IRQ-Zähler auf1. Erneute Frameprüfung erreicht `frame-return`, setzt0C9A auf0 und hält vor264C. Alle Ausführungsbuttons sind dort gesperrt. Screenshot außerhalb des Repos: analysis-output/native-script-frame-ui-2026-10-18.png.

## Scheduler: Wurzelkontext und anschließende Vorbereitung

Am18.10.2026 erweitert: `original-dos-scheduler-boundary.ts` verbindet den tatsächlichen Pointerzugriff264C nach einer Frame-Rückkehr mit264F..26AF. BP wird aus ES:[BX+SI] geladen; ein Nullpointer bleibt0. Der alternative Einstieg `context` beginnt unmittelbar bei264F. Die vorhandene Scan-/Main-Vorbereitung liefert `scan`, `main` oder `skip`; Opcode- und Callbackkörper werden nicht ausgeführt. Modul-, Kontext- und Globalsegmente sind ausdrückliche Eingaben. Wortzugriffe über die Segmentgrenze bleiben außerhalb des Hostvertrags.

`check-native-dos-scheduler-boundary.py <capture>` prüft216 Kombinationen pro Spiel: zwei Einstiege, Wurzel0/0200h, drei Scanflags, drei Aktivitätswerte, drei Countdowns und zwei Scanpointer. Ergebnis je140 Skip-,40 Main- und36 Scanpfade. BP/DS/SI, unveränderte DX/CX, Stacktiefe, gesamtes Kontextsegment und Globals bis28BFh stimmen mit echter Ausführung264C beziehungsweise264F bis2632/26EB überein. AX/BX/Flags sind nicht Teil des Ausgabe-Registervertrags. Eingabesegmente werden vom Host nicht verändert; Originaldateien bleiben unverändert.

`prepareNativeScriptDiagnosticContext` bindet diesen Ablauf als Diagnose-API an `frame-return` und `context` an. Ein Mainpfad führt zu `ready`, ein Skip zu `next-context`. Nicht geladene Modulsegmente, abgeschnittene Header, Mehrsegmentmodule und Scan-Callbacks halten atomar an. Es wird kein Wurzelkontext und kein aktiver Link ergänzt. Die API ist noch nicht als neuer Oberflächenbutton freigeschaltet.

Die fortlaufende Prüfung unterstützt `--prepare-context` (enthält Frame-/IRQ-, Auswahl- und Yieldprüfung). Ishar2 IO.IO besteht22 Schritte, einen kontrollierten IRQ und die anschließende Wurzel-/Kontextvorbereitung; Ishar1 PRESTI.IO besteht einen Schritt und denselben Übergang ohne IRQ. In beiden kontrollierten Anfangszuständen ist der Wurzelpointer0 und der Folgezustand `next-context`. Dies belegt einen zusätzlichen zusammenhängenden Originalpfad, keine vollständige Spielinitialisierung. Adaptertests prüfen zusätzlich eine vorhandene Wurzel mit Mainfortsetzung sowie unveränderte Abweisung von Scan und Fremdsegmenten. Typecheck und Produktionsbuild bestehen.

Nächste Lücken: vorbereitete Mainfortsetzung über weitere Opcodezyklen vergleichen, Scan-/Rückkehr-Callbacks samt Stackrahmen anbinden, echte Wurzel-/Modulverwaltung importieren und den geprüften Übergang in der Oberfläche zugänglich machen.

## Opcode186 und Mainfortsetzung nach dem Frame

Am18.10.2026: Der echte Dispatchtabelleneintrag186 zeigt in beiden identifizierten Captures auf1000:296B. Bis2993 werden fünf Operanden über69A6 gelesen und nacheinander geschrieben: Wort nach SS:0BA8, Wort nach0BA0, Byte nach0BA2, Byte nach0BA4, Wort nach0BA6. Die jeweils benachbarten Bytes der Byteziele bleiben erhalten. Jeder Zahlenaufruf setzt CX auf den vorherigen DX-Wert; abschließend stehen der fünfte Wert in DX und der vierte in CX. Die Bedeutung der Globalfelder ist noch nicht belegt und wird nicht als vermeintliche Spielregel benannt.

`original-dos-script-opcode186.ts` rekonstruiert diese Zugriffe mit Zahlenformen0/2/6/8, unveränderten Eingabesegmenten und explizitem Registervertrag. `check-native-dos-script-opcode186.py <capture>` führt den Originaldispatcher26EB, alle fünf Zahlenaufrufe und das tatsächliche Handler-RET aus. Je4096 Fälle pro Spiel (alle1024 Kombinationen der vier Tags, vier Grenzwertmuster) vergleichen SI/DX/CX, Stacktiefe und alle Globals bis28BFh. Skript- und Kontextsegmente sowie Originalcapture bleiben unverändert. Hostgrenzen: DF0, getrennte Segmente, keine anderen Zahlenformen und keine segmentübergreifenden Wortzugriffe.

Die Diagnose führt186 nun atomar aus; unbekannte oder abgeschnittene Operanden halten vor jeder Zustandsänderung an. Adaptertests prüfen Wort-/Bytebreite, erhaltene Vorgängerzustände, Register und abgeschnittene Daten. Typecheck und Produktionsbuild bestehen.

`check-native-script-diagnostic-file.py <capture> <module> --resume-main` enthält den bisherigen Framezyklus samt Kontextvorbereitung. Als ausdrücklich kontrollierte TEST-Fixture wird nach dem Frame der bereits vorhandene Kontext am Wurzeltabelleneintrag verknüpft, im Host und Emulator identisch. Dies behauptet keine Originalinitialisierung; die Laufzeit-API setzt diesen Link nicht. Der Original-CALL26AF erzeugt den Dispatchstackrahmen, anschließend laufen die unterstützten Opcodes mit erhaltenen Registern bis Yield oder der nächsten offenen Stelle weiter.

Ishar2 IO.IO:22 Schritte bis Yield, Abschluss, Auswahl, Frame mit einem echten kontrollierten Timer-IRQ, Mainvorbereitung, danach186 bis SI00ABh stimmen nativ überein. Der folgende Opcode31 enthält einen noch nicht unterstützten Ausdruck und hält an. Ishar1 PRESTI.IO:ein Schritt bis Yield, Frame ohne IRQ, Mainvorbereitung und ein weiterer Yield stimmen überein. Auch hier bleiben Ressourcen und Capture unverändert. Diese Tests schließen einen weiteren zusammenhängenden Scheduler-/Dispatchpfad, keine komplette VM.

Nächster Schritt: den bislang offenen Zahlen-/Ausdruckstag bei IO.IO:00ABh anhand des Originaldispatchers erschließen; Scan-/Rückkehr-Callbacks und echte Modul-/Wurzelverwaltung bleiben offen.

## Ausdrucksoperanden30/32 mit globaler Kontextbasis

Am18.10.2026: Der offene Operand in Ishar2 IO.IO:00ABh ist Tag30. Die Operandentabelle1000:01F2 verwendet das Tag als Byteoffset;30 führt in beiden Captures nach6ACD..6ADB,32 nach6ADC..6AE7. Beide lesen ein16-Bit-Literaloffset und addieren es modulo65536 auf SS:0BF6. Tag30 liest aus ES:[Basis+Offset] ein vorzeichenbehaftetes Byte, Tag32 ein Wort. BP ist hierbei nicht die Basis. SI wächst um3 ab Tagbeginn. Die reguläre69A9-Eintrittswirkung CX=vorheriges DX bleibt erhalten.

`original-dos-numeric-operand.ts` unterstützt diese Formen mit einem ausdrücklich übergebenen Globalsegment; fehlt es, wird keine Ersatzbasis angenommen. Die Ausdrucksauswertung und Opcode31-Diagnose reichen die tatsächlichen kontrollierten Globals weiter. Andere Diagnose-Opcodes behalten ihre bisherigen freigeschalteten Operandenteilmengen. Kontextworte am Segmentende, abgeschnittene Operanden und nicht geladene Basisdaten bleiben außerhalb des Hostvertrags und halten unverändert an.

`check-native-dos-expression-base.py <capture>` führt je4752 Fälle pro Spiel über den Originaldispatcher und Opcode31 bis zum Handler-RET aus: alle256 Bytewerte, acht Wortgrenzwerte, drei Basen, zwei Offsets einschließlich Adressüberlauf, direkter Operand, Ausdrucksschleife und Gleichheitsvergleich. SI/DX/CX, Stacktiefe, unverändertes Kontextsegment, Globals bis28BFh und Skriptsegment stimmen überein. Die bisherigen912 Ausdrucks- und1056 Zahlen-/Timerfälle pro Profil bestehen erneut. Adaptertests prüfen zusätzlich fehlendes Globalsegment, signiertes Byte, erhaltene Vorgängerzustände und atomaren Halt am Wort-Segmentrand. Typecheck und Produktionsbuild bestehen.

Der fortlaufende `--resume-main`-Test für Ishar2 IO.IO erreicht nun drei weitere Originalbefehle nach dem Frame:186,31,20; SI endet bei00C5h vor dem offenen Opcode30. Die tatsächliche bedingte Verzweigung und alle geprüften Zustände stimmen überein. Ishar1 PRESTI.IO erreicht weiterhin seinen erneuten Yield. Der Wurzellink bleibt eine ausdrückliche Test-Fixture. SS:0BF6=0 im kontrollierten Anfangszustand ist keine Behauptung über die echte Spielinitialisierung; diese muss separat rekonstruiert/importiert werden.

Nächster offener Originalpfad im kontrollierten Ishar2-Test: Opcode30 bei00C5h. Echte globale Kontextbasis-/Wurzelinitialisierung, String-/Ergebnisoperationen und Callbackausführung bleiben weitere Lücken.

## Opcode30: Ausdruckszuweisung und Literalstrings

Am18.10.2026: Opcode30 verweist in beiden Captures auf1000:2915. Der Handler wertet über69A9 einen Ausdruck aus und geht anschließend durch den Ergebnisdispatcher291B. Die Diagnose komponiert die bereits geprüfte numerische Ausdrucksteilmenge mit direkten Ergebniszielen6/8/18/20.

Der konkrete IO.IO-Pfad verwendet Ausdruckstag4 (69D0..69E2): Ein nullterminierter String aus DS:SI wird einschließlich Nullbyte nach SS:[0C58] kopiert. DX bleibt erhalten, CX übernimmt am69A9-Eintritt den bisherigen DX-Wert. Danach vertauscht291B die Pufferpointer0C58/0C5C. Ergebnisziel34 führt nach724C..726B: ein16-Bit-Literaloffset wird auf SS:0BF6 addiert, und der String aus SS:[0C5C] wird einschließlich Nullbyte nach ES:[Basis+Offset] kopiert. Die temporären DS/ES-Werte werden wiederhergestellt. Keine Stringdekodierung oder zusätzliche Spielsemantik ist Teil dieses Ablaufs.

`original-dos-script-assignment.ts` bildet die Reihenfolge mit getrennten Segmentkopien ab. Auch das Lesen der Pufferpointer nach einer Literalpufferänderung geschieht in Originalreihenfolge. Fehlendes Stringende, abgeschnittene Ziele und Überschreiten der begrenzten Hostfenster halten vor Rückgabe eines geänderten Zustands an. Die native Engine besitzt diese zusätzlichen Hostprüfungen nicht; segmentübergreifende Kopien, weitere String-/Indexformen und überlappende physische Segmente sind nicht abgedeckt.

`check-native-dos-script-assignment.py <capture>` führt je148 Fälle pro Spiel durch den echten Opcode30-Dispatcher bis Handler-RET aus:84 Literalstrings (Längen0/1/2/7/31/127/255, drei Pufferpositionen, zwei Kontextbasen und zwei Offsets) sowie64 numerische Zuweisungen (zwei Literalformen, acht Werte und vier Zieltypen). SI/DX/CX, wiederhergestellte DS/ES, Stacktiefe, Kontextsegment, Globals bis28BFh und der tatsächliche Stringpuffer einschließlich hoch liegender Puffer stimmen überein. Originalcapture und Skriptsegment bleiben unverändert. Die bisherigen192 direkten Ergebnisfälle pro Profil bestehen erneut.

Adaptertests prüfen Pufferwechsel, Kopie samt Nullbyte, erhaltene Vorgängerzustände, fehlenden Terminator und Puffergrenzen. Typecheck und Produktionsbuild bestehen. Der fortlaufende Ishar2-`--resume-main`-Test erreicht jetzt vier weitere Originalbefehle nach dem Frame (186,31,20,30) bis SI00D3h; dort folgt ein offener Ausdruck in Opcode31. Ishar1 PRESTI.IO erreicht weiterhin den erneuten Yield. Die ausdrückliche Test-Wurzelverknüpfung und kontrollierte Globalinitialisierung bleiben als solche gekennzeichnet.

Nächster Schritt: Kontextstring-Leseform des folgenden Ausdrucks bei IO.IO:00D3h rekonstruieren und in den allgemeinen Ausdruckszustand einbinden. Die bisherige Literalstringunterstützung lebt nur im Zuweisungsablauf, nicht als vollständige String-Ausdrucks-VM.

## Ausdrucksstrings4/34 und explizite globale Seiteneffekte

Am18.10.2026: Operandentag34 führt in beiden Captures nach1000:6AE8..6B0A. Das Literalwort hinter dem Tag wird modulo65536 auf SS:0BF6 addiert. Der nullterminierte String aus ES:[Basis+Offset] wird einschließlich Nullbyte nach SS:[0C58] kopiert. Der Skriptzeiger wird hinter dem Offsetwort wiederhergestellt, ebenso DS und ES; DX bleibt unverändert. CX folgt weiterhin dem jeweiligen69A9-/69AB-Aufrufvertrag. Literalstring4 aus69D0 ist nun ebenfalls Teil der allgemeinen Ausdrucksauswertung und kann innerhalb56/58 verwendet werden.

`evaluateOriginalDosScriptExpression` liefert jetzt zusätzlich die geänderten Globals zurück, wenn ein explizites Globalsegment vorliegt. Eingaben bleiben unverändert. Spätere Operanden desselben Ausdrucks lesen den fortgeschriebenen globalen Zustand. Die Diagnose übernimmt diese Globals nur nach erfolgreichem Ausdruck; bei einem folgenden unbekannten Tag wird der gesamte Schritt unverändert angehalten. Die Zuweisung30 nutzt denselben Auswerter; der bisher doppelte Literalstring-Kopiercode wurde entfernt. Ohne Globalsegment werden Stringformen ausdrücklich abgewiesen, keine Puffer angenommen.

`check-native-dos-expression-string.py <capture>` prüft je144 Fälle beider Spiele über den echten Opcode31 bis Handler-RET: vier Stringlängen, drei Pufferpositionen, zwei globale Basen, zwei Offsets und direkte/Schleifen-/gemischte Stringausdrücke. Verglichen werden SI/DX/CX, DS/ES, Stacktiefe, gesamtes Kontextsegment, Globals bis28BFh und Stringpuffer einschließlich hoch liegender Bereiche. Kontextstrings werden nicht in Hosttext umkodiert; alle Bytewerte bleiben roh. Originalcapture und Skriptsegment bleiben unverändert. Hostgrenzen: DF0, disjunkte Segmente, begrenzte Kopierfenster; keine vollständige Stringausdrucks- oder IO-Dienstimplementation.

Je912 frühere Ausdrucks-,4752 globalbasierte Zahlen- und148 Zuweisungsfälle pro Profil bestehen erneut. Adaptertests prüfen rohe Kontextbytes, erhaltene Register/Vorgängerzustände, gemischte Schleifenpuffer und atomaren Halt an einer fehlenden Terminierung am Kontextsegmentende. Typecheck und Produktionsbuild bestehen. Der alte Negativtest für Tag4 wurde auf den tatsächlich noch offenen Tag10 umgestellt, da4 nun unterstützt ist.

Der fortlaufende native Vergleich bleibt für Ishar2 IO.IO bei vier fortgesetzten Befehlen bis SI00D3h und für Ishar1 PRESTI.IO bei einem erneuten Yield erfolgreich. IO.IOs nächster Ausdruck enthält nach34 den noch offenen Ausdruckstag156; deshalb wird kein Teilpufferzustand dieses unvollständigen Ausdrucks übernommen. Der Ausdruckstag156 ist getrennt vom gleich nummerierten Skriptopcode156 zu untersuchen. Echte IO-Operationen, Initialisierung der globalen Basis und vollständige Stringauswertung bleiben offen.

## Ausdruckstag156: DOS-Dateisuche und Laufwerksfallback

Am18.10.2026: Ausdruckstag156 verweist in beiden Captures auf1000:6F55..6F6C, getrennt vom Skriptopcode156. DS wird vorübergehend auf SS gesetzt, DX aus0C58 als Dateinamenspointer geladen und2064 aufgerufen. Anschließend ergibt Carry0 DX=FFFFh, Carry1 DX=0; DS wird wiederhergestellt.2064 ruft2151 auf (in beiden identifizierten Captures ein RET), setzt CX=0 und führt DOS INT21/AH4E FindFirst aus. Nur bei Fehler und SS:289B exakt1 wird auf Laufwerk SS:289D gewechselt und nochmals gesucht. Nach erneutem Fehler wird SS:289C ausgewählt und Carry gesetzt zurückgegeben. Beim Erfolg des zweiten Versuchs bleibt das Ersatzlaufwerk ausgewählt.

`original-dos-file-probe.ts` bildet Suchmuster, Attribut0, Carryergebnis sowie Such-/Laufwerksereignisse mit einem ausdrücklich übergebenen, lesenden Dateisuchdienst ab. null als erstes Laufwerk bedeutet das nicht näher bestimmte aktuelle DOS-Laufwerk, nicht Laufwerk0. Die Dateinamen bleiben rohe Bytes. Es gibt keinen automatischen Host-Dateisystemtest und keinen erfundenen Treffer-/Fehlerstandard. Der Ausdrucksauswerter kann diesen Dienst ausdrücklich erhalten; ohne ihn hält156 unverändert an. Die Toolkitoberfläche besitzt noch keinen angebundenen DOS-Dateidienst.

`check-native-dos-expression-file-probe.py <capture>` prüft je432 Fälle beider Spiele mit echter Ausführung von Opcode31, Tag156,2064 und den vollständigen Retrypfaden. Kontrollierte INT21-Hooks liefern Carry/AX bei FindFirst sowie den Laufwerksanzahlwert bei AH0E; sie ersetzen ausschließlich die externe DOS-Grenze, nicht die Enginehandler. Vier Fallbackflagwerte, alle erreichbaren Antwortfolgen, drei Dateinamenpuffer, vier Namenlängen und direkte/Schleifen-/Vergleichs-/Kontextstring-Suchfolgen werden geprüft. SI/DX/CX, DS/ES, Stacktiefe, Suchparameter, Laufwerksereignisse, unveränderte Globals und Kontext/Skript stimmen überein. Der längste Kopierpfad benötigte mehr als das anfängliche1000-Instruktionslimit des Testtreibers; das kontrollierte Testlimit wurde auf20000 angehoben, danach bestanden beide Profile.

Wichtige Grenze: Dies ist ein Nachweis des Engineablaufs bei kontrollierten DOS-Antworten, keine Rekonstruktion des DOS-Dateisystems. DTA-Schreibeffekte, Wildcards, Attribute im Dateisystem, Pfadauflösung, aktuelles Laufwerk und dessen dauerhafter Zustand sind noch nicht angebunden. CX=0 gehört zum geprüften DOS-Antwortvertrag; andere durch einen DOS-Dienst verursachte Registeränderungen sind nicht modelliert. Originaldateien bleiben unverändert.

Adaptertests prüfen den Dateinamensrequest nach einer Kontextstringkopie, das Erfolgsergebnis und atomaren Halt ohne Dienst.144 String- und912 bestehende Ausdrucksfälle von Ishar2 bestehen erneut; Typecheck und Produktionsbuild bestehen. Der reale IO.IO-Test bleibt ohne DOS-Dienst bei SI00D3h angehalten, statt eine Suchantwort zu erfinden.

Nächster Schritt: DOS-Dateinamens-/DTA- und Suchverhalten weiter erschließen und den lesenden Dienst anhand tatsächlich importierter Ressourcen anbinden; erst dann die vollständige IO.IO-Fortsetzung nativ vergleichen. Die echte globale Basis-/Wurzelinitialisierung und Callbackausführung bleiben ebenfalls offen.

## DOSBox-Referenz für FindFirst und verlustfreier DTA-Zugriff

Am18.10.2026 wurde die externe DOS-Grenze mit einem eigenen COM-Testprogramm in der vorhandenen DOSBox-Installation geprüft, nicht nur mit kontrollierten Unicorn-Antworten. Ausführbare Referenz SHA256 e09f78e60b5be25a6af0381b71a90b8aa625f2ea42ecd427638edf2abb7130f0 (vorhandene Installation zuvor als DOSBox0.74 identifiziert). Der Lauf mountet ausschließlich einen neu erzeugten Testordner mit eigenen COMs und eigenen Beispieldateien. Originalinstallationen werden weder gemountet noch gelesen oder geschrieben. COM-Code, Fixture und Ergebnisprotokolle liegen außerhalb Git; im Repo stehen die eigenen Generator-/Prüfskripte und Metadaten.

`scripts/run-dos-findfirst-oracle.ps1 -Output <neuer-Ordner> -Python <python.exe> [-DosBox <DOSBox.exe>]` erstellt acht Probes, führt sie ohne sichtbare Oberfläche mit SDL-Dummytreibern aus und prüft die102-Byte-Ergebnisdatensätze. Get-DTA INT21/AH2F liefert den Pointer; vor und nach FindFirst werden43 Bytes kopiert, dazu AX/Flags/CX/DX/DS/ES protokolliert. Ergebnisse werden erst nach bestandenen Prüfungen als Bericht ausgegeben. Die COMs sind ausschließlich eigens geschriebene Testprogramme ohne Originalspielcode.

Für den reproduzierbaren Lauf muss der Batch in Autoexec mit `call probes.bat` aufgerufen werden, damit das folgende `exit` erreicht wird. Der erste manuelle Lauf lieferte alle acht Ergebnisse, blieb ohne `call` anschließend am Prompt; dieser ausschließlich eigene Prozess wurde nach Prüfung seiner Ergebnisse beendet. Der korrigierte automatische Lauf beendete DOSBox selbst erfolgreich (runtime.json:processExited=true). Ein laufender Prozess nach Beobachtungs-Timeout gilt im Runner ausdrücklich nicht als abgeschlossen und darf nicht blind neu gestartet werden.

Beobachtungen der konkreten Referenz:

- Default-DTA liegt bei PSP:0080h; DTA-Segment stimmt mit dem COM-Datensegment überein. Dies beweist noch nicht den aktiven DTA-Pointer einer vollständig initialisierten Ishar-Instanz.
- EXIST.AO,exist.ao,*.AO und EXIST.* finden dieselbe eigene40-Byte-Datei; Name im DTA ist EXIST.AO, Attribut32. CX bleibt in diesen geprüften Fällen0.
- Nicht vorhandene nichtleere Namen liefern Carry1/AX18 und ändern trotzdem die ersten21 DTA-Bytes. Eine reine Bool-Antwort bildet diesen Seiteneffekt nicht ab.
- Ein leerer Name liefert Carry1/AX2; der DTA blieb in diesem Fall unverändert.
- *.* liefert einen Treffer, dessen Identität von der Verzeichnisreihenfolge abhängt; im Test war es ein Logdatei-Kurzname. Keine feste Enumerationsreihenfolge wird daraus abgeleitet.

`dos-findfirst-dta.ts` liest und schreibt43-Byte-Datensätze:0..20 bleiben undurchsichtiger Suchzustand;21 Attribut,22/24 rohe Zeit-/Datumsworte,26 Dateigröße als32-Bit-LE,30..42 Name mit Nullterminierung. No-op-Schreiben erhält alle Bytes einschließlich unbekannter Suchdaten und Restbytes hinter dem Dateinamen. Auch nichtterminierte Rohdatensätze lassen sich unverändert zurückschreiben; gezieltes Namensbearbeiten verlangt höchstens12 Nichtnullbytes plus Terminator. Ungültige Größen und abgeschnittene Datensätze werden abgewiesen. Prüfungen laufen auf allen acht echten DOSBox-Ergebnissen und zusätzlichen undurchsichtigen Rohdaten; Typecheck besteht.

Metadaten des erfolgreichen automatischen Laufs: DOS_FINDFIRST_ORACLE_2026-10-18.json. DTA-Prüfsummen können sich durch Dateizeit und Suchzustand zwischen neuen Fixtureläufen ändern; semantische Assertions prüfen die beobachteten Eigenschaften, keine globale Byteidentität verschiedener Läufe.

Noch offen: Suchzustand/FindNext, Attribute außerhalb der geprüften normalen Dateien, umfassende DOS-Pfad-/Wildcardregeln, echtes aktuelles Laufwerk und Ishars aktive DTA-Initialisierung. Der existierende Dateisuchdienst bleibt bewusst nicht automatisch an die Diagnose angebunden, bis dessen Zustandswirkungen korrekt erhalten werden können. Die DTA-Dateiwerkzeuge sind keine Behauptung eines kompletten DOS-Dateisystems.

## FindNext, eigener DTA und Snapshot-Rückspieltest

Die DOSBox-Referenzprüfung wurde um acht Suchfolgen mit jeweils FindFirst und drei FindNext-Aufrufen erweitert, je mit Standard-DTA und per INT21/AH1A gesetztem Puffer. Mit den bisherigen acht Einzelprobes ergeben sich16 eigene COM-Programme und40 Suchaufrufe. Der neue Lauf beendet DOSBox selbst erfolgreich und mountet ausschließlich eigene Fixtures. Vollständige Metadaten stehen in DOS_FINDNEXT_ORACLE_2026-10-18.json; Ablauf, Interpretation und Grenzen sind in DOS_FILE_SEARCH.md dokumentiert.

Wesentliche neue Evidenz: Nach Sicherung des DTA bei TrefferA, FindNext zuB und vollständigem Rückspielen aller43 Snapshotbytes liefert FindNext weiterhinC. Beide Pufferarten zeigen dasselbe Verhalten. Der DTA allein ist damit in dieser Referenz kein vollständiger Suchcursor-Snapshot; zusätzlicher Fortsetzungszustand liegt außerhalb dieses Datensatzes. Erfolgreiche FindNext-Aufrufe ändern hier Ergebnisfelder, aber nicht die ersten21 DTA-Bytes. Erfolgloses FindNext nach Ende beziehungsweise erfolglosem FindFirst liefert AX18 und ließ den Datensatz unverändert. Diese Befunde ersetzen keine vollständige DOS-Spezifikation.

Alle40 Datensatz-No-op-Roundtrips, Treffer-/Fehlerfolgen, Pufferpointer und byteweisen Snapshot-Rückspiele bestehen. Der ursprüngliche Acht-Fälle-Lauf besteht weiterhin. Der Dateidienst bleibt bis zur korrekten Abbildung der Zustandswirkungen ausdrücklich von der Toolkitdiagnose getrennt; es wird keine vollständige Dateisuche behauptet.

## Vollständiger Engine-Öffnungshelfer1F97

Am18.10.2026 wurde der Kontrollfluss1000:1F97..2060 einschließlich der aufgerufenen Suchroutine2064 und Anlageroutine20EA..211D rekonstruiert. `original-dos-file-open.ts` nimmt Originalregister und Globals entgegen und verlangt für jeden DOS-Aufruf eine ausdrückliche Antwort. Er führt selbst keine Dateizugriffe aus. Zweige werden anhand der tatsächlich jeweils vorhandenen AX-Bits ausgewertet, nicht anhand eines getrennt konservierten Hostmodus.

Wesentliche Originaldetails:

- Bit0200h kann eine Suche und bei Fehler anschließend Anlegen auslösen. Die danach erfolgende Prüfung von0400h sieht das durch FindFirst veränderte AX. FindFirst kann dadurch weitere ursprünglich gesetzte Modusbits löschen oder verändern.
- Die normale Öffnung verwendet DOS AX=3D02h. DS:DX wird vor jedem Versuch nach SS:28A6/28A4 gespeichert. Die DOS-Antwort AX wird immer nach0BBE geschrieben, auch bei Fehler; AX selbst wird danach aus dem vor dem Aufruf gesicherten Wert restauriert.
- Nur Fallbackflag289B exakt1 aktiviert Laufwerkswahl und Wiederholung. Die normale Öffnung wählt zunächst289C, bei Fehler289D; nach zweitem Fehler wird289C wieder gewählt. Erfolgreiche Wiederholung belässt das Ersatzlaufwerk aktiv.
- Der Anlegezweig setzt AX zunächst0, wählt gegebenenfalls289D und verwendet DOS3C00h mit CX0. DOS-AX wird nach0BBE geschrieben. Fehler führen mit Enginefehler8 vor8468; der innere CALL20EA liegt dabei noch auf dem Stack.
- Bit0800h nach erfolgreicher Öffnung führt zu DOS4202h. BX/CX/DX werden davor im Original nicht zusätzlich normalisiert oder aus dem Handlefeld geladen; das Hostmodell erfindet keine Ersatzwerte. AX wird nach dem Seek wiederhergestellt, ein zurückgegebenes DX bleibt erhalten. Öffnungs-/Seekfehler führen mit Enginefehler1 vor8468.

Die DOS-Schnittstelle dieser Rekonstruktion ist ausdrücklich kontrolliert: BX/CX/DS bleiben durch DOS erhalten; FindFirst setzt im Enginecode CX0; Seek kann DX zurückgeben. DTA, tatsächliche Dateiinhalte, DOS-internes Laufwerk und der Fehlerhandler8468 sind nicht implementiert. Laufwerkswahlen werden als Ereignisse/Endzustand zurückgegeben. Die Rückgabe dokumentiert auch die relative Stacklage: erfolgreiche Rückkehr+2, Fehler1 unverändert, Fehler8 im aufgerufenen Anlegehelfer−2.

`check-native-dos-file-open.py <capture>` führt je280 Fälle beider Spiele nativ ab1F97 aus: zehn anfängliche AX-Werte, vier Fallbackflagwerte und sieben kontrollierte DOS-Szenarien. Je212 erfolgreiche Rückkehrpfade,48 Fehler1 und20 Fehler8 stimmen überein. Geprüft werden sämtliche DOS-Requests und Laufwerksereignisse, AX/BX/CX/DX/DS, erhaltene SI/BP/ES, Stacklage und Globals bis28BFh. INT21-Antworten sind kontrollierte Eingaben; es werden keine Originaldateien angelegt, überschrieben oder geöffnet. Tests erfassen auch die Wirkung eines kontrollierten FindFirst-AX auf spätere Modusprüfungen.

`scripts/check-original-dos-file-open.mjs` prüft separat unveränderte Eingaben, AX-Modusverlust durch FindFirst, unverändert weitergereichte Seekregister, Anlege-/Fehlerstack und Ablehnung ungültiger DOS-Antworten. Typecheck besteht.

## Zusammenhängender MAIN-Öffnungs-/Headerpfad

Der bestehende `check-native-dos-resource-file.py <capture> <MAIN.IO>` beginnt nun bei76BC (AX2, CALL1F97), nicht erst nach der Öffnung bei76C2. Die DOS-Öffnungsantwort Handle5 ist kontrolliert; Hostkomposition und native Rückkehr vergleichen Register, Handle0BBE und Dateinamenspointer28A4/28A6. Danach folgen im selben CPU-Zustand die beiden Original-Lesehelfer212D für6 und16 Bytes, gespeist aus der identifizierten schreibgeschützt gelesenen MAIN.IO. Alle18 Tabellen-/Grenzworte sowie finale Register/Stacktiefe stimmen weiterhin überein: je8 Fälle für Ishar1 und Ishar2. Datei- und Capturehash bleiben unverändert.

Damit ist die vorherige Lücke „Öffnungshelfer ausgeschlossen“ dieses Headernachweises geschlossen. Dekompression und nachfolgende Tabellenverbraucher sind weiterhin nicht Teil dieser zusammenhängenden Prüfung; die vorhandenen separaten Decoderbelege bleiben eigenständig. Der neue Öffnungshelfer ist noch kein automatisch angebundener Dateidienst der Toolkitdiagnose.

## Engine-Datei-I/O: Lesen, Schreiben, Schließen und Segmentalias

Am18.10.2026 wurden die Enginehelfer1000:212D..213E (Lesen),213F..2150 (Schreiben) und20B5..20E9 (Schließen) als `original-dos-file-io.ts` rekonstruiert. Alle laden BX aus SS:0BBE und setzen nur AH für den jeweiligen DOS-Dienst; AL bleibt aus dem Eingaberegister erhalten. DOS-Antwort und eventuell gelieferte Lesebytes sind ausdrückliche Eingaben. Die Funktion selbst führt keinerlei Host-Dateioperationen aus.

Die Transferhelfer prüfen nach INT21 ausschließlich Carry. Kurze oder null Byte lange erfolgreiche Transfers kehren unmittelbar zurück, ohne Wiederholung, Auffüllen oder Größenvergleich. Kontrolliert gelieferte Speicherwirkungen einer fehlerhaften Leseantwort werden nicht rückgängig gemacht. Fehler setzen die Enginecodes13 (Lesen),7 (Schreiben) oder14 (Schließen) und halten vor8468. Der tatsächliche Fehlerhandler bleibt offen. AX/CX/DX/BX/DS sowie die relative Stacklage werden als geprüfter Vertrag geführt; weitere Register bleiben in den nativen Tests erhalten.

Bei erfolgreichem Schließen wird der Handlewert0BBE nicht gelöscht. Nur Fallbackflag289B exakt1 führt zur Auswahl des ursprünglichen Laufwerks289C. Dabei wird AX samt den übrigen Registern gesichert und wiederhergestellt. Wichtig: Der Vergleich von289B mit1 findet erst nach der DOS-Fehlerprüfung statt. Bei Flag0 kann der erfolgreiche Helfer deshalb mit CF1 zurückkehren. Das Hostmodell führt den Fehlerpfad getrennt vom Rückkehr-Carry. Die Drive-Grenze erhält Flags im kontrollierten DOS-Antwortvertrag; ein vollständiger DOS-Registervertrag wird nicht behauptet.

Globalsegment und Datenpuffer können ausdrücklich dasselbe Segment sein. Dann werden Lesebytes und Globals gemeinsam fortgeschrieben, ohne einen zweiten abweichenden Speicherstand zu erzeugen. Auch Schreibeffekte über dem Handlefeld werden in Originalreihenfolge abgebildet: Der aktuelle Aufruf verwendet noch den zuvor geladenen BX-Wert, spätere Aufrufe lesen den geänderten Handle. Transferfenster über dem Segmentende werden als zusätzliche Hostgrenze abgewiesen; Original-DOS-Segmentüberläufe sind damit nicht rekonstruiert.

`check-native-dos-file-io.py <capture>` führt je2160 Fälle beider Spiele aus: drei Helfer, getrennte/aliasierte Segmente, vier Fallbackflags, drei Handlewerte, null/kurze/größere Transferlängen, zwei Pufferpositionen und fünf kontrollierte Antworten. Verglichen werden DOS-Requests einschließlich Schreibbytes, Lesespeicherwirkungen, Globals bis28BFh, Register, Carry, Stacklage und Laufwerksereignisse. Je1296 Rückkehrpfade,384 Lesefehler13,384 Schreibfehler7 und96 Schließfehler14 stimmen überein. Fehler-Speicherwirkungen und ungewöhnliche Rückgabegrößen sind kontrollierte Testeingaben, keine Behauptung, dass reale DOS-Treiber diese Kombinationen erzeugen. Es werden keine Originaldateien beschrieben.

`check-original-dos-file-io.mjs` prüft zusätzlich unveränderte Vorgängerzustände, einen kurzen Read ohne Auffüllen, explizite Teilbytes beim Fehler, Folgeaufruf nach einem aliasierten Handle-Write, leeren Write als echte externe Anfrage, Schließen ohne Handlelöschung, Rückkehr-Carry und ungültige Hostfenster. Typecheck besteht.

Der zusammenhängende MAIN-Nachweis verwendet jetzt auch die rekonstruierten Host-Lesehelfer. Beide Original-Reads werden mit echten schreibgeschützt eingelesenen MAIN-Dateibytes im gleichen Globalsegment komponiert. Die native Prüfung beginnt mit ausdrücklich kontrollierten Globals, führt ab76BC Öffnen und beide Reads aus und vergleicht bei76D8 sämtliche Globals bis28BFh sowie die I/O-Register, bevor sie die18 Tabellen-/Grenzworte prüft. Je8 Fälle beider Spiele bestehen. Dekompression, Tabellenverbraucher und echte DOS-Dateidienstanbindung bleiben außerhalb dieses Nachweises.

## MAIN-Kontexttabelle und Objektpool im gemeinsamen Real-Mode-Speicher

Am18.10.2026 wurde1000:77BC..77F5 einschließlich der echten Aufrufe813C..8181 und785F..78F8 rekonstruiert. `original-dos-resource-initialize.ts` arbeitet auf einem gemeinsamen1MiB-Speicher statt getrennten64KiB-Segmentkopien. Dadurch wirken sich überlappende ES-/Objektsegmente auf dieselben physischen Bytes aus. SS und ES sind ausdrückliche Eingaben; A20-Wrapping und Wortzugriffe über Segment-/Speicherende bleiben außerhalb des begrenzten Hostvertrags.

77BC setzt die belegten Globals0BCE,0C37,0C99,0C16,0C10,0CB0 zurück,0CB1 aufFF und0BA0 aufFFFF.813C verwendet0BD2 als Tabellenbasis und0BDA als vorzeichenbehaftete Vergleichsgrenze. Die Schleife wird mindestens einmal ausgeführt, auch bei0/1/negativen Grenzwerten. Sie schreibt je6-Byte-Eintrag zwei Nullworte und einen Offsetlink. Anschließend wird der Rootlink bei Tabellenbasis+4 ausdrücklich0 gesetzt,0BDC=1 und0BDE=6. Das Hostmodell ergänzt keine aktiven Kontextlinks.

785F übernimmt DS:SI aus0BE0/0BE2. Die belegten Initialfelder der ersten38-Byte-Records sowie die Globals0BE8/0BEA/0BEE/1DA9/0CAE/0BEC werden in Originalreihenfolge gesetzt. Die Objektlinks verwenden38-Byte-Schritte, die unsigned SchwelleFFD9h und den Paragraphenvergleich mit0BE6. Abschließend wird DI um38 zurückgesetzt und erst dort der Link genullt; dieses Verhalten wird nicht durch eine vermeintlich bessere Listenabschlusslogik ersetzt. Zusätzliche Host-Schrittgrenzen verhindern unbeschränkte Verarbeitung beschädigter Eingaben, sie sind keine Originalprüfungen.

`check-native-dos-resource-initialize.py <capture>` führt je69 Fälle beider Spiele nativ von77BC bis77F6 aus: vorzeichenbehaftete Tabellenzahlen einschließlich32767/32768/65535, verschiedene Tabellenoffsets, Objektbasen, Poolsegmente und Grenzen; zusätzlich echte ES-/Objektsegment-Überlappung. Schleifen-/Linkzahlen, unveränderte neun gesicherte Register und Stacktiefe stimmen überein. Verglichen wird der gesamte physische1MiB-Speicher, ausgenommen ein ausdrücklich maskiertes80-Byte-Stackfenster mit CPU-Rückkehradressen und Registerablagen. Originalcapture und Host-Eingabespeicher bleiben unverändert. Einzeltests prüfen außerdem minimale do-while-Ausführung und atomare Abweisung von Wort-/Adressgrenzüberschreitungen. Typecheck besteht.

Der bestehende MAIN-Nachweis reicht nun im selben CPU-Zustand von76BC über Öffnen, beide echten Headerreads, Tabellen-/Poolberechnung und Initialisierung bis77F6. Die Hostkomposition verwendet ebenfalls einen gemeinsamen physischen Speicher und dieselben tatsächlichen MAIN-Header. Je8 Fälle beider Spiele bestehen einschließlich vollständigem Speichervergleich außerhalb des kontrollierten Stackfensters. Stacktiefe und Initialisierungsregister werden separat geprüft; Dekompression wurde hier noch nicht ausgeführt.

Nächste Originalgrenze:77F6 bereitet den Ressourcen-/Dekompressionsaufruf vor. Die bereits separat geprüften Decoder79A5/79E9 und spätere Modulregistrierung8182/Kontextanlage8268 sind noch mit diesem zusammenhängenden Ladezustand zu verbinden. Der abschließende globale Wurzelpointer0BF6/0BF8 wird erst später bei784C/7851 gesetzt; die jetzige Tabelleninitialisierung ist keine vollständige Wurzel-/Spielinitialisierung.

## Zusammenhängender MAIN-Ladepfad mit echtem A1-Decoder und Dateischluss

Am18.10.2026 wurde `check-native-dos-resource-file.py <capture> <MAIN.IO> --decode` ergänzt. Im selben CPU-Zustand läuft der Originalpfad jetzt von76BC über Öffnen, Headerreads, Tabellen-/Objektinitialisierung,77F6-Decoder-Vorbereitung,79E9 einschließlich A1-Helfer7B85 und Dateischluss20B5 bis7839 vor der Modulregistrierung8182. Die Enginehandler werden nicht übersprungen. DOS-Öffnen/Lesen/Schließen liefern ausdrücklich kontrollierte Antworten aus der schreibgeschützt gelesenen Originaldatei; es gibt kein emuliertes Host-Dateisystem.

`original-dos-main-decode.ts` rekonstruiert die Aufrufervorbereitung77F6..782B. DS:DX kommt aus0BCA/0BC8; das hohe Größen-/Packwort aus2482, das niedrige aus2480. Bit0 des Packbytes wird entfernt und das Ergebnis nach0B57 geschrieben. Ein negatives Packbyte führt nach79E9, mit AX auf das niedrige Byte reduziert; sonst wird79A5 erreicht. CX wird modulo65536 um22 vermindert, ohne erfundenes Borrow in AX. Der direkte Pfad erreicht den Decoder mit einem CALL-Stackwort (−2), der andere nach zwei zusätzlichen Sicherungen (−6). Die Alternative79A5 wird durch diesen neuen Helfer nicht ausgeführt oder als vollständig rekonstruiert bezeichnet.

`check-native-dos-main-decode-prepare.py <capture>` prüft je192 Fälle pro Spiel: acht Packbytes, vier niedrige Größenwerte, drei hohe Größenbytes, zwei Zieloffsets. Register/Globals und tatsächlicher Stack beim Decodereintritt stimmen überein;72 Fälle erreichen79A5 und120 erreichen79E9. Eigene Adapterprüfungen sichern unveränderte Eingaben, Bitentfernung, Größenunterlauf und ungültige Segmentlänge ab. Typecheck besteht.

Die erweiterte Ladeprüfung verwendet den ausdrücklich kontrollierten separaten Eingabepuffer9000:0000 und liefert dem Original jeweils8000 angeforderte Dateibytes, beim letzten Read entsprechend weniger. Nicht gelesene Pufferrestbytes bleiben erhalten; es wird nicht mit0 aufgefüllt. Je8 reale MAIN-Fälle beider Profile bestehen:

- Ishar1:26384 deklarierte Ausgabebytes, SHA256318578ec8e812179689b968d3e11b12a79668df45fec1b6b20952629a43429ab; gepackte Reads8000+3218, beobachtete native Zusatzschreibweite2 Bytes.
- Ishar2:27752 deklarierte Ausgabebytes, SHA2568cae49162991917d695025c0fb1cf0de7e87eeb67f019bccb7d3a3017162f125; gepackte Reads8000+3960, beobachtete native Zusatzschreibweite1 Byte.

Der Write-Hook überwacht während dieser Phase die gesamte kontrollierte Arena zwischen Tabellenbasissegment und Eingabepuffer90000h, nicht nur die deklarierte Ausgabe. Die erste Ausgabeadresse und die letzte Schreibadresse werden geprüft; die beobachteten Zusatzweiten sind keine allgemeine Decodergrenze. Die komplette deklarierte Ausgabe stimmt mit dem bestehenden Parser überein. Normalisierter Endsegmentwert0B14, finales CX und der rekonstruierte Close-Request samt Register-/Carryrückgabe werden ebenfalls verglichen. Der vollständige physische Speichervergleich des Initialisierungsabschnitts bleibt an77F6 erhalten; nach dem Decoder werden Ausgabe, Schreibgrenzen und die genannten Register-/Pointerverträge geprüft, nicht sämtliche Decoder-Scratchbytes als rekonstruiert behauptet.

Ohne `--decode` endet die Prüfung unverändert bei77F6; beide Profile bestehen auch in diesem Modus weiterhin. Originaldateien und Captures bleiben unverändert. Die verwendeten Basis-/Grenzwerte sind kontrollierte Testzustände, keine komplette nachgebildete Spielinitialisierung.

Nächste Grenze7839:8182 registriert das Modul und ruft anschließend185E/16CE für Ressourcenbenachrichtigungen auf. Deren vollständige Körper wurden in diesem durchgehenden Lauf noch nicht ausgeführt oder übersprungen. Erst danach folgen Slot0,8268-Kontextanlage und0BF6/0BF8-Wurzelpointer. Die separat geprüften Registry-/Kontexthelfer sind deshalb noch nicht als vollständige MAIN-Wurzelinitialisierung freigegeben.

## MAIN-Registrierung, Originalbenachrichtigungen und Wurzelkontext bis RET

Am18.10.2026 ergänzt: `check-native-dos-resource-file.py <capture> <MAIN.IO> --root` enthält `--decode` und führt den Originalpfad nach7839 weiter durch8182, beide Benachrichtigungsroutinen185E/16CE, Slot0,8268-Kontextanlage,0BF6/0BF8-Wurzelpointer und den originalen RET bei7856. Ein kontrollierter Rückkehrzeiger1000:E000h liegt am Eingangsstack. Kein Engineaufruf wird durch einen Stub ersetzt. Nur die bereits beschriebenen DOS-Öffnen-/Lesen-/Schließen-Antworten bleiben ausdrücklich kontrolliert.

MAIN enthält echte Ressourcen, daher ist185E kein leerer Helfer: Im untersuchten Ishar1-MAIN stehen76, in Ishar2-MAIN113 Einträge im entsprechenden Ressourcenblock. Die nativen Benachrichtigungsroutinen verändern das geladene Modul. Diese Konvertierung läuft im Test tatsächlich; ihre Ausgabeprüfsummen werden als Beobachtungen erfasst. Eine vollständige Host-Rekonstruktion der Grafikaufbereitung wird dadurch NICHT behauptet. Der unveränderte24-Byte-Modulheader wird separat geprüft, weil die spätere Kontextanlage auf seinen Feldern beruht.

Die bereits rekonstruierten Helfer `registerOriginalDosModule` und `createOriginalDosScriptContext` liefern die unabhängigen erwarteten Registry-/Kontextwerte. Vor den Benachrichtigungen werden der Far-Pointer im Registryeintrag sowie0BCA/0BD0/0BCE verglichen. Nach den echten Benachrichtigungen und der Kontextanlage werden der vollständige zusammenhängende Bereich von Kontext−52 bis zum Variablenende, der Slot0-Pointer, sämtliche vom Kontexthostmodell beschriebenen Globals,0B06=0 und der Wurzelpointer0BF6/0BF8 geprüft. BX/ES stimmen mit dem Wurzelkontext überein. Der gespeicherte Skripteinstieg ist in beiden MAIN-Modulen24. Der tatsächliche Lader-RET stellt die Aufruferstacklage wieder her (SP+2).

Je8 Fälle pro Spiel bestehen: sechs erreichen die Wurzel-/RET-Grenze; zwei mit bewusst zu enger oberer Grenze erreichen den erwarteten Registryfehler11 vor8468. Diese Fehlerfälle werden nicht entfernt oder durch größere Speichergrenzen passend gemacht. Ihre Globalwerte und der noch vorhandene Registry-Call-/Sicherungsrahmen (SP−12) stimmen mit dem Hostmodell überein. Bei ihnen werden die Benachrichtigungen nicht erreicht.

Drei der sechs zurückkehrenden Fälle pro Profil sind außerdem absichtliche Aliasproben mit RegistryoffsetFFF0h. Ihr Registryeintrag liegt physisch im geladenen Modul und darf nicht als gültiges Layout für den Spielbetrieb bezeichnet werden. In Ishar1 überschreibt185E in allen drei Fällen später diesen Eintrag. Der Prüfer bestätigt zuerst den korrekt geschriebenen Pointer bei8205 und beobachtet dann echte Benachrichtigungsschreibzugriffe über dem Eintrag. In Ishar2 bleibt dessen Pointer in den geprüften Fällen erhalten, obwohl die physische Überlappung ebenfalls vorliegt. Das ist kein allgemeiner Schutz gegen ungültige Layouts. Die drei nicht überlappenden Rückkehrfälle pro Profil behalten den korrekten Registryeintrag. Die Fehler-/Aliasbefunde werden ausdrücklich mitberichtet; sie sind keine pauschal freigegebenen Speicherzustände.

Metadaten: MAIN_ROOT_NATIVE_2026-10-18.json. Es enthält nur Version-/Dateihashes, Testparameter, Pointer, Readlängen und Beobachtungsprüfsummen, keine Originalgrafiken oder Skriptbytes. Host- und Native-Ausgabe vergleichen weiterhin die vollständige deklarierte Dekompression vor der Ressourcenkonvertierung. Der Speichervergleich der Initialisierungsphase bleibt getrennt erhalten. Der bisherige Modus ohne Decoder besteht für beide Spiele weiterhin.

Dies ist ein zusammenhängender Nachweis des MAIN-Laderabschnitts ab76BC mit kontrollierter DOS-/Speicherumgebung, kein Start ab Programm-Entry und keine vollständige Spielausführung. Besonders die Ressourcenaufbereitung185E/16CE, tatsächliche Speicherkonfiguration und der anschließende Skriptstart sind noch weiter zu rekonstruieren und anzubinden. Nächster Schritt: die im Originallauf beobachtete Grafikaufbereitung strukturiert nachbilden und gegen die unverändert erfassten Eingabe-/Ausgabebereiche vergleichen; dabei die Alias-Grenzfälle erhalten.

## Ressourcenaufbereitung185E: normales Grafikformat rekonstruiert

`original-dos-resource-graphics.ts` rekonstruiert jetzt185E..1B9D für den
normalen Modus SS:2896=0 mit vorwärts laufenden Stringzugriffen (DF=0).
Eingabe ist eine unveränderte1MiB-Speicherkopie plus SS, CS und Modul-DS:DX;
Ausgabe ist eine neue physische Speicherkopie. Relative Far-Pointer werden mit
den originalen16-Bit-Überträgen und Normalisierung ausgewertet. Ressourcenliste,
Palettenmaskierung, Typ1-Farbzuordnung und die Pixel-/Maskenaufbereitung für
Typ0/2/10h/12h/14h/16h einschließlich12h-Höhenbyte74h sind enthalten.
Unbekannte Typen werden wie im Original übersprungen. Zähler behalten ihre
vorzeichenbehafteten Abbruchbedingungen und die mindestens einmal ausgeführten
Zeilen-/Gruppenschleifen. Globals0B16/0B20/0B1E/0B42 und CS-Scratch1850..1858
werden in derselben physischen Kopie beschrieben; Segmentaliasse bleiben wirksam.

Die Root-Prüfung `check-native-dos-resource-file.py ... --root` vergleicht nun
bei jedem erreichten185E-Aufruf das Hostmodell mit dem vollständigen nativen
Speicher am RET1B9D. Ausgenommen ist ausschließlich das Stackfenster
SS:FEC0..FF0F mit Sicherungsbytes, die das API nicht nachbildet. Je sechs
erreichte Aufrufe beider MAIN-Profile bestehen:76 Ressourcen/1092 Pixelgruppen
für Ishar1 und113/3824 für Ishar2. Die drei absichtlich ungültigen Aliaslayouts
je Profil bleiben enthalten; insbesondere die Ishar1-Registryüberschreibung
wird nun auch durch die rekonstruierte Konvertierung reproduziert.

Zusätzlich prüft `check-native-dos-resource-graphics.py <capture>` je acht
synthetische Ressourcenpakete pro Profil: alle genannten Typen, beide Typ1-
Indexpfade, unbekannter Typ,12h-Sonderfall, Breiten0/3/7/15 sowie Moduloffsets
0/FFF0 mit Pointerübertrag. Je Paket zehn Einträge. Der vollständige Speicher
außer den genannten Stackbytes und alle neun gesicherten Register stimmen
mit der nativen Routine überein. Die Hostprüfung
`node scripts/check-dos-resource-graphics.mjs` prüft leere/negative Zähler,
abgewiesenen alternativen Modus, Speichergrenzen und unveränderte Eingaben.
Typecheck bestanden. Keine Originaldatei oder Capture verändert.

Hashgebundene Ergebnis-Metadaten ohne Originalbytes:
[RESOURCE_GRAPHICS_NATIVE_2026-10-18.json](RESOURCE_GRAPHICS_NATIVE_2026-10-18.json).

Grenzen: Der alternative Modus mit1B9E wird ausdrücklich abgewiesen, ebenso
A20-Überläufe, segmentübergreifende Wortzugriffe und überschrittene Host-
Schrittgrenzen. Flags/Stackbytes sind kein Ausgabevertrag.16CE ist weiterhin
nur im nativen MAIN-Pfad ausgeführt, nicht allgemein hostseitig rekonstruiert.
Keine Hardware-/Framebuffer-, Bildgleichheits- oder vollständige Spielstart-
Behauptung. Nächster Schritt ist die Verbindung der geprüften Lade-/Rootwerte
mit der Skriptausführung samt tatsächlichem Original-Anfangszustand.

## Geladener MAIN-Kontext bis zum ersten Schedulerdispatch

`original-dos-main-scheduler.ts` verbindet den vorhandenen Root-Slot mit der
originalen Eintrittsvorbereitung2607..262F und264C..26AF. Die vier initialen
Worte0C58/0C5A/0C5C/0C80 werden802h/902h/A02h/1E7Eh,0B02 wird0. Anschließend
kommt der Kontextpointer aus ES:[0BD2], nicht aus einer manuell verknüpften
Diagnosewurzel. Der vorhandene Schedulerhelfer prüft Aktivität/Countdown und
übernimmt den gespeicherten Skriptpointer samt Modulsegment. Die vier
Snapshotworte werden durch den originalen3C76-Vertrag übernommen.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --schedule` enthält den
bisherigen Lade-/Grafik-/Rootnachweis. Nach dem kontrollierten Lader-RET wird
die CPU ausdrücklich bei2607 fortgesetzt, mit den vorhandenen Registern und
Speicherwerten. Es wird kein Kontext nachträglich erzeugt oder verknüpft.
Die davorliegenden Plattformaufrufe072D/8DBE und der Loader-Aufrufer7641/78F9
sind damit NICHT nachgewiesen; der kontrollierte Übergang ersetzt keinen Start
ab EXE-Entry. Das API beschreibt diese Grenze ausdrücklich.

Je drei nicht überlappende MAIN-Layouts pro Spiel erreichen den Hauptdispatch
26EB mit BP672,SI24,BX0 und dem tatsächlich geladenen Modulsegment. ES/DS,
BP/SI/BX, erhaltenes DX/CX und CALL-Stackwirkung−2 stimmen mit dem Hostmodell
überein. Der gesamte physische Speicher wird verglichen, ausgenommen wiederum
SS:FEC0..FF0F für Stack-Sicherungsbytes. Registryfehler und absichtlich ungültige
Aliaslayouts bleiben im bisherigen Ladernativtest; ihre weitere Ausführung wird
nicht als spielbarer Zustand freigegeben.

Beide MAIN-Module beginnen dort mit Opcode70 (Handler2DED). Dieser legt anhand
des bisherigen nativen Befunds Daten im MAIN-Kontext an und greift auf den
Objektpool zu. Seine vollständige Rekonstruktion ist der nächste konkrete
Schritt. Der Test hält VOR dessen Fetch an; er behauptet noch keine Ausführung
des MAIN-Skripts und erweitert noch nicht die Browserdiagnose.

Hostprüfung: `node scripts/check-dos-main-scheduler.mjs` prüft gespeicherte
Rootwerte, unverändert belassenen Nullpointer, Snapshots, Stringpufferwerte,
Quellschutz und ausdrücklich abgewiesene Speicherfenster. Überlappende
Globals-/Kontextsegmente und segmentübergreifende Wortzugriffe sind Grenzen
dieses komponierten API, keine behaupteten Originalregeln. Metadaten stehen in
MAIN_SCHEDULER_NATIVE_2026-10-18.json; Originaldateien bleiben unverändert.

## MAIN-Opcode70 einschließlich Objektpool und Listenhelfern

`original-dos-script-object.ts` rekonstruiert Handler2DED..2E90 und seine
Aufrufe3288..32B0 sowie32E4..332C. Eingang sind eine1MiB-Speicherkopie, SS und
DS/ES/SI/BX/DI/DX am Handlereintritt nach Opcodefetch (DF=0). Ergebnis sind neue
Speicherbytes, veränderte Register und die Grenze RET oder Fehler10 vor8468.
Originalquellen bleiben unverändert; Flags und Stack-Sicherungsbytes sind kein
API-Ausgabevertrag.

Der Befehl liest einen16-Bit-Offset, addiert0BF6, setzt dort Bit40h und kopiert
ein Byte plus32 Folgedatenbytes. Der Kopiervorgang erfolgt sequentiell wie
REP MOVSB, einschließlich überlappender Quell-/Zielbereiche. Danach werden
Objektsegment und Basis aus0BE8/0BEA gelesen und0BEC addiert. Ein Ergebnis0
führt zu Fehler10: Die vorherigen Kontextstores sind bereits geschehen und
werden nicht als atomarer Rollback erfunden. Der normale Pfad übernimmt den
Freilisten-Nachfolger, verknüpft den Datensatz mit dem Poolobjekt, initialisiert
die originalen Rohfelder und hängt seinen relativen Offset an die0C16-Liste.
Berechnungen bleiben modulo16Bit; drei signierte8-Bit-Produktdifferenzen werden
wie im Original an den **überlappenden Wortoffsets38/39/40** geschrieben.
Diese ungewöhnlichen Schreibbreiten werden nicht vermeintlich korrigiert.

Das sind interne Laufzeitobjekte. Aus Opcode70 allein folgt noch keine belegte
Zuordnung zu Bodenitems, NPCs oder Gegnern und keine fertige Interaktion.

`check-native-dos-script-object.py <capture>` besteht je32 kontrollierte Fälle
beider Profile: vier Datenmuster, leere/ein-/zweigliedrige aktive Listen,
Fehler10 und jeweils getrennte beziehungsweise überlappende Quell-/Kontextdaten.
Alle vom API beschriebenen Register, erhaltenes BP, SP-Wirkung und der gesamte
physische Speicher außer SS:FEC0..FF0F stimmen mit den Originalinstruktionen
überein. Der Körper des Fehlerhandlers wird nicht ausgeführt. Die Hostprüfung
`node scripts/check-dos-script-object.mjs` prüft zusätzlich Quellschutz,
Teilwirkungen vor Fehler10, Speichergrenzen und einen abgewiesenen Listenzyklus.
Die begrenzte Zyklusprüfung ist ein Hostschutz, keine Originalregel.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --objects` setzt den
vorhandenen Lader-/Grafik-/Root-/Schedulerlauf mit beiden originalen Opcode70
am Stück fort. Die CPU bleibt über die Schritte erhalten, die rekonstruierten
Ergebnisse werden nach jedem Befehl verglichen. Je drei gültige Layouts beider
Spiele bestehen. SI geht24→60→96, der folgende Opcode ist41. Es werden weder
synthetische Objekte statt der Originaloperanden eingesetzt noch Call-Helfer
übersprungen. Ungültige Registry-Aliaslayouts bleiben im Ladervergleich und
werden weiterhin nicht als Spielzustände weitergeführt.

Belegmetadaten ohne Originaldaten: MAIN_OBJECT_NATIVE_2026-10-18.json.
Typecheck bestanden. Noch keine Browserintegration, vollständige VM oder
Ausführung ab EXE-Entry. Nächster Schritt: die anschließenden Originalbefehle
ab Opcode41 mit dem erhaltenen physischen Zustand weiterführen.

## MAIN-Blockpräfix im erhaltenen physischen Zustand

`writeOriginalDosPhysicalScriptBlock` ergänzt den vorhandenen Opcode41-Helfer
um gemeinsame physische Speicheradressierung. Handler5713..5737 liest und
schreibt in Originalreihenfolge: Offsetwort, Countbyte, Countstore, Typbyte,
Typstore und anschließend rückwärts adressierte Zielworte. Bei Segmentaliasen
kann ein Store ein später gelesenes Operandenbyte ändern; eine vorab erstellte
separate Skriptkopie würde diesen Effekt verlieren. Der bisherige Helfer für
getrennte Segmente bleibt erhalten und wird gegen den neuen Pfad verglichen.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --blocks` enthält
Laden, Ressourcenaufbereitung, Rootanlage, kontrollierten Schedulereinstieg
und beide Opcode70. Anschließend werden alle direkt folgenden Opcode41 mit
derselben CPU und den vorherigen Speicherwerten ausgeführt. Nach jedem Befehl
werden SI, erhaltene Register, AX/BX des Dispatchers, SP und der gesamte
physische Speicher außer den beschriebenen Stack-Sicherungsbytes verglichen.
Je drei gültige Layouts pro Profil bestehen: Ishar1 durchläuft117 Blockbefehle
von SI96 bis723; Ishar2 durchläuft114 bis702. Beide erreichen dann Opcode30.
Die Ergebnisse werden pro Befehl geprüft, nicht nur am Ende des Präfixes.

`check-native-dos-physical-block.py <capture>` ergänzt je24 native Fälle pro
Profil mit Counts0/1/2/255, drei Zieloffsets und getrennter beziehungsweise
überlappender Quelle/Ziel. Die Aliasfälle umfassen Stores über noch ungelesenen
Typ-/Datenbytes. Count255 verwendet BP400h, damit kein außerhalb des Hostvertrags
liegendes Wort bei OffsetFFFFh entsteht; diese Grenze wird separat abgewiesen.
Alle gespeicherten Register und SI sowie die Speicherergebnisse stimmen überein.
Hostprüfung: `node scripts/check-dos-physical-block.mjs` vergleicht getrennte
Segmente mit dem bisherigen Helfer und prüft Quellschutz/Speichergrenzen.
Typecheck bestanden; Metadaten: MAIN_BLOCK_NATIVE_2026-10-18.json.

Nächste Lücke ist der originale Opcode30-Zuweisungsablauf an dieser Stelle,
einschließlich der tatsächlich folgenden Ergebnis-/Indexdispatcher. Die
bisherigen einfachen Zuweisungsadapter decken diese Folge nicht vollständig ab.
Kein neuer Browserablauf und kein vollständiger Spielstart werden behauptet.

## Numerische MAIN-Zuweisungen mit Original-Indexstack

`original-dos-indexed-assignment.ts` rekonstruiert einen ausdrücklich begrenzten
Opcode30-Pfad im gemeinsamen physischen Speicher. Enthalten sind die numerischen
Operanden0/2/6/8/30/32, Ausdrucksschleife56/58, Operandenspeicher64 und54,
Ergebnispräfix56 bei739A sowie direkte Ziele6/8/18/20 und indizierte Ziele14/16.
Nicht erschlossene Tags werden vor Rückgabe eines veränderten Zustands abgewiesen;
es gibt kein Überspringen oder erfundenes Ziel. Der separate bisherige
Zuweisungsadapter bleibt erhalten; sein engerer Vertrag wird nicht stillschweigend
als allgemeine MAIN-Unterstützung ausgegeben.

Der Dispatcher tauscht0C58/0C5C in Originalreihenfolge. Ergebnispräfix56 legt
den zuzuweisenden Wert bei SS:277Ah ab und wertet die folgenden Indexoperanden
mit dem originalen BX-Stackpointer aus. Die Helfer6C2E/6C5B lesen die Anzahl
zusätzlicher Dimensionen und die Wortstrides aus dem zuvor durch Opcode41
angelegten Kontext. Wortziele verdoppeln nur den letzten Index wie im Original;
die weiteren Strides sind bereits Bytestrides. Unsigned MUL und Akkumulation
bleiben modulo16Bit;0B0A und sämtliche tatsächlichen Operandenspeicherstores
werden erhalten. Es wird kein JavaScript-Array statt der Originalstruktur benutzt.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --assignments` setzt
Lader, Grafikaufbereitung, Root-/Schedulerübergabe, beide Opcode70 und den
gesamten41-Präfix mit derselben CPU fort. Danach werden die unterstützten
aufeinanderfolgenden30-Befehle einzeln ausgeführt. Je drei gültige Layouts
beider Spiele stimmen in sämtlichen vom Modell beschriebenen Registern,
Stackwirkung und dem vollständigen Speicher außer den festgelegten
Stack-Sicherungsbytes überein. Ishar1 erreicht nach sieben Zuweisungen SI793
und Opcode7; Ishar2 nach acht Zuweisungen Opcode31. Diese Grenze entsteht
durch den nächsten Originalbefehl, nicht durch Weglassen einer fehlgeschlagenen
Zuweisung. Der kontrollierte Eintritt2607 bleibt ausdrücklich eine Testgrenze.

`check-native-dos-indexed-assignment.py <capture>` prüft je108 synthetische
Zuweisungen pro Profil: sechs Quellformen, sechs Ergebnisformen und0/1/2
zusätzliche Dimensionen. Verglichen werden Register, erhaltene Segmentwerte,
Stackrückkehr und der vollständige Speicher einschließlich Operandenspeicher
und0B0A (ausgenommen CPU-Stacksicherungen). Hostprüfung:
`node scripts/check-dos-indexed-assignment.mjs` für Vorzeichen, Puffertausch,
Quellschutz und Abbruch bei unerschlossenen/beschädigten Sequenzen.
Typecheck bestanden. Metadaten ohne Originalbytes:
MAIN_INDEXED_ASSIGNMENT_NATIVE_2026-10-18.json.

Flags, allgemeine Ausdrucksarithmetik, String-/weitere Ergebnisformen,
Fehlerhandler und vollständiger Interpreter sind damit nicht nachgewiesen.
Auch die Browserdiagnose ist noch nicht an diesen physischen MAIN-Zustand
angebunden. Als Nächstes die unterschiedlichen Fortsetzungen beider Profile
(Ishar1-Aufruf7, Ishar2-Ausdruck31) mit diesem Zustand weiterführen.

## Gemischte Skriptausführung auf dem geladenen physischen Zustand

`original-dos-physical-script.ts` verbindet vorhandene Rekonstruktionen zu einem
begrenzten Einzelschritt-API auf1MiB-Speicher. Der Vertrag umfasst DS/ES/SI/BP
und die ALIS-Operandenregister DX/CX sowie neue Speicherbytes und ready/yield.
CPU-Scratchregister AX/BX/DI, Flags und Sicherungsstackbytes sind ausdrücklich
kein nachgebildeter CPU-Zustand. Unterstützt werden die angeschlossenen
Teilformen von5–10,17,18–31,41,66 und70. Nicht unterstützte Befehle/Operanden
werfen einen Grenzfehler ohne Änderung des Eingangsspeichers; keine Funktion
wird pauschal als vollständiger Interpreter ausgegeben.

Aufrufe schreiben den echten relativen Rückkehrpointer in den Kontextstack;
Opcode17 liest ihn wieder. Bedingte Sprünge verwenden die erhaltenen DX/CX.
Die Block-/Objekt-/Zuweisungspfade nutzen den physischen Speicher. Ausdruck31
verwendet den vorhandenen Ausdruckshelfer; überlappende Globals-/Modul- oder
Globals-/Kontextsegmente werden dort ausdrücklich abgewiesen. Eine Objekt-
Fehlergrenze benötigt ein eigenes Fehlerzustands-API und wird hier angehalten,
statt die Teilwirkungen vor Fehler10 als erfolgreiche Ausführung auszugeben.

Ausdruck120 wurde anhand6DF8 und0F49 ergänzt: Er liest SS:2894 und liefert
2000, bei Wert7 hingegen2001, bei3 den Wert2002 und bei5 den Wert2004.
Der semantische Name bleibt unbestätigt. Der native Pfad enthält hier keinen
BIOS-/Portzugriff. Die gemeinsame Funktion `queryOriginalDosModeValue` wird
auch von der numerischen Zuweisung verwendet. Ausdruck64 legt DX auf den
Original-Operandenspeicher;54 übernimmt DX=CX und liest CX vom Stack.
Index-Leseformen14/16 verwenden die gleichen originalen Strides und0B0A wie
die vorherigen Ergebnisziele und lesen Byte mit Vorzeichenerweiterung/Wort.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --execute` enthält den
bisherigen Lade-/Root-/Initialbefehlsnachweis und folgt anschließend der
gemischten Originalfolge. Nach jedem Schritt werden die sechs vertraglichen
Register, SP-Wirkung und der gesamte Speicher außer SS:FEC0..FF0F verglichen.
Je drei gültige Layouts pro Spiel bestehen:

- Ishar1: sechs weitere Schritte mit Aufruf7, Zuweisung30, Ausdruck31 und
  bedingtem Sprung20; danach unveränderter Halt vor einer Zuweisung mit der
  noch offenen Ausdrucksoperation90.
- Ishar2: vier weitere Schritte derselben Befehlsarten; danach unveränderter
  Halt vor einem Ausdruck mit der noch offenen Operation66.

Der Originalkontrollfluss wird verfolgt; es wird kein Ziel manuell übersprungen.
Diese zusätzlichen Schritte sind kein vollständiger MAIN-Lauf. Der frühere
kontrollierte Übergang bei2607 und die fehlenden Plattformdienste bleiben als
Grenzen bestehen. Metadaten: MAIN_PHYSICAL_EXECUTION_NATIVE_2026-10-18.json.

Zusätzliche native Ausdrucksprüfungen pro Profil:18 Modusfälle (neun Rohwerte,
zwei eingehende DX) sowie18 indizierte Leseausdrücke (Byte/Wort,0/1/2 weitere
Dimensionen, drei Indizes). Indexprüfungen vergleichen SI/DX/CX, sämtliche
Globals einschließlich Operandenspeicher und erhaltene Modul-/Kontextdaten;
keine Scratchregister- oder Flaggleichheit wird daraus abgeleitet.
Prüfaufrufe: `check-native-dos-expression-mode.py <capture>` und
`check-native-dos-expression-index.py <capture>`. Ergebnis-Metadaten ohne
Originalbytes: EXPRESSION_MODE_INDEX_NATIVE_2026-10-18.json.

Hostintegration: `node scripts/check-dos-physical-script.mjs` prüft die
Aufruf-/Return-/Yieldkette, Modusabfrage, Quellschutz und unbekannte Befehle.
Bestehende Diagnose-/Zuweisungsregressionen und Typecheck bestanden.
Keine neue Browserfunktion. Nächster Schritt: die beiden tatsächlich erreichten
Ausdrucksoperationen erschließen und den durchgehenden Pfad weiterführen.

## Native Rechenoperationen in beiden MAIN-Fortsetzungen

`original-dos-numeric-binary.ts` rekonstruiert die nach dem rekursiven69A9-Aufruf
ausgeführten Operationen66/68/70/72 (AND/OR/XOR/NOT-XOR) und86/88/90/92/94
(Addition/Subtraktion/Rest/Quotient/Multiplikation). Der gemeinsame Baustein wird
von Ausdruck31 und der numerischen Zuweisung benutzt. Eingaben sind die
tatsächlich zurückgegebenen CX/DX-Worte. Ein vorher in JavaScript gesicherter
linker Operand wäre bei verschachtelten Ausdrücken falsch, weil innere
Operationen CX verändern können.

Native Zuordnung:66..72 bei6CC5..6CDE;86..94 bei6D33..6D70. Subtraktion
verändert CX und DX auf denselben16-Bit-Wert. Rest/Quotient übernehmen den
rechten Operanden nach CX und ersetzen einen Nulldivisor durch1; der linke
Operand wird vorzeichenbehaftet erweitert.90 liefert den Rest,92 den Quotienten.
Der Rest hat wie IDIV das Vorzeichen des Dividenden. Die Multiplikation liefert
das niedrige16-Bit-Wort. Der Überlauf−32768/−1 erreicht im Original INT0 und
wird im Host ausdrücklich als noch nicht angebundene Interruptgrenze abgewiesen.
Es wird weder ein JavaScript-Infinity noch ein stilles Wrap-Ergebnis erzeugt.

`check-native-dos-expression-arithmetic.py <capture>` besteht je81 Fälle pro
Profil: neun Operatoren mit acht Wortpaaren einschließlich Null, negativen
Werten, Vorzeichenrändern und Nulldivisor, dazu je ein verschachtelter rechter
Ausdruck mit CX-verändernder Subtraktion. SI/DX/CX, Stackrückkehr und unveränderte
Globals stimmen mit der originalen rekursiven Ausführung überein. Je zwei
weitere native Proben bestätigen INT0 für90/92 mit−32768 und−1. Interruptkörper,
Flags und Scratchregister sind nicht Teil dieses Nachweises. Hostprüfung:
`node scripts/check-dos-numeric-binary.mjs`; bestehende Diagnose-/Schritt-Tests
und Typecheck bestehen ebenfalls.

Der unveränderte `--execute`-Prüfpfad setzt beide MAIN-Module jetzt weiter fort:
Ishar1 durchläuft14 gemischte Schritte nach dem Initial-Zuweisungspräfix und
erreicht Ausdruck168; Ishar2 durchläuft neun und erreicht Opcode215. Je drei
gültige Speicherlayouts beider Profile bestehen im vollständigen Speicher-
und vertraglichen Registervergleich nach jedem Befehl. Die vorherigen
Prüfungen von Lader/Grafik/Root, Objekt- und Blockbefehlen bleiben enthalten.
Keine unerschlossene Operation wird ausgeführt oder übersprungen.

Metadaten ohne Originaldaten: EXPRESSION_ARITHMETIC_NATIVE_2026-10-18.json.
Die Modus-/Speicherinitialisierung bleibt kontrolliert; vollständiger Start,
Hardwareanbindung und neue Browserbedienung sind weiterhin offen. Nächste
konkrete Grenzen sind168 beziehungsweise215, nicht mehr die Rechenoperationen.

## Globales Wort168 und Steuerbytes von Opcode215

Ausdruck168 führt im Original6FEC→0F44 aus: Wort SS:0C9D wird über AX nach DX
gelesen. Der Aufrufer69A9 setzt CX auf das vorherige DX. Diese Rohfunktion ist
nun im Ausdrucks- und numerischen Zuweisungspfad enthalten; aus dem Offset wird
kein unbestätigter Geräte-/Timername abgeleitet. Es erfolgt hier kein externer
Hardwarezugriff und kein neuer Speicherstore.

Opcode215 bei58D5..58E3 ruft69A6 auf, schreibt DL nach SS:0BF4 und setzt
SS:0BF5 auf1. Das physische Schritt-API verbindet diesen Pfad für die bereits
belegten numerischen Operanden0/2/6/8/30/32. Wortwerte bleiben in DX erhalten,
nur der Store nach0BF4 wird auf ein Byte begrenzt. Komplexere Operanden werden
weiter angehalten, statt einen Null-/Ersatzwert zu verwenden. Die semantische
Bedeutung der beiden Steuerbytes wird nicht aus ihrer Verwendung vermutet.

`check-native-dos-global-control.py <capture>` prüft je35 Fälle pro Profil:
fünf Wortwerte für168 sowie dieselben fünf Werte für jede der sechs numerischen
Quellformen bei215. Nativer Dispatcher,69A6 und der eigentliche Handler werden
ausgeführt; SI/DX/CX/BP/DS/ES, SP-Rückkehr, Globals und Kontextbytes stimmen
überein. Bytevorzeichen, Wortbreite und ursprüngliche SteuerbytesAAh/BBh werden
berücksichtigt. Skriptbytes bleiben erhalten. Hostprüfungen in
`check-dos-physical-script.mjs` decken zusätzlich Quellschutz und unveränderten
Abbruch bei einem nicht unterstützten215-Operanden ab. Diagnose-Regressionen
und Typecheck bestanden.

Der vollständige bisherige `--execute`-Prüfpfad besteht wieder für je drei
gültige MAIN-Layouts beider Spiele. Ishar1 erreicht jetzt nach17 gemischten
Schritten ab dem Initial-Zuweisungspräfix einen Ausdruck156, der einen expliziten
DOS-FindFirst-Dienst verlangt. Die existierende boolesche Dienstgrenze ersetzt
noch kein vollständiges DOS-/DTA-Modell; Details in DOS_FILE_SEARCH.md.
Ishar2 erreicht nach zehn Schritten den nächsten Opcode188. Dieser ruft699E
und prüft anschließend ursprüngliche Konfigurationswerte; sein vollständiger
Pfad ist noch nicht an die physische Ausführung angeschlossen.

Beide Grenzen werden vor Veränderung des ankommenden Hostzustands angehalten;
sie werden weder übersprungen noch durch Erfolg simuliert. Original-Captures
und Spieldateien bleiben unverändert. Metadaten ohne Originaldaten:
GLOBAL_CONTROL_NATIVE_2026-10-18.json. Nächste Arbeit: die explizite Dateisuche
mit nachgewiesenen DOS-Zustandswirkungen verbinden und den tatsächlich
erreichten188-Pfad rekonstruieren. Browseranbindung und voller Start bleiben offen.

## Opcode188 bis zu Original-Grafikgrenzen; MAIN erreicht ersten Yield

`original-dos-palette-control.ts` rekonstruiert188 ab5C08 bis zur Rückkehr5C55,
zum Aufruf5B4A bei5C4C, zum Grafik-Far-Call1E97:0EC9 bei5CF4 oder einer
DIV-Fehlergrenze. Der699E-Aufrufer liest den Zahlenoperanden nach CX und erhält
das eingehende DX. Unterstützt sind die belegten numerischen Formen0/2/6/8/30/32.
Die Funktion liefert den tatsächlichen Grenzzustand mit neuen Speicherbytes;
sie behauptet nicht, die noch offenen Grafikaufrufe ausgeführt zu haben.

Bei SS:2898=0 wird abhängig von2897 und0BF4 entweder0BF4 gelöscht und
zurückgekehrt oder die16 Originalworte von1743h nach0E43h kopiert und vor
5B4A angehalten. Bei2898!=0 werden die ursprünglichen Byteparameter0CBB..0CBE
aus CX gebildet. Der signed Vergleich mit63 und die nachfolgende8-Bit-Division
bleiben erhalten: unter anderem erreichen CX8000h und16128 tatsächlich INT0.
Es wird kein pauschales Clamping eingeführt. Die nativen Fehlerproben bestätigen
den Interrupt; dessen Körper bleibt außerhalb dieses Teilmodells.

Der weitere Grafikzweig löscht genau300h Bytes ab1443h.0F1E liest0C9F;
bei Modi2/7 bleibt der Wert unverändert, sonst wird zuerst das niedrige Wort
der Verdopplung gebildet und dieses durch3 geteilt. Ein Ergebnis<=200 oder
CX0 löscht0CBB/0CBC/0CBD und300h Bytes ab0E43h. Nach Wiederherstellung der
gesicherten Register steht0CB9 auf1; dort endet das Modell vor dem echten
Grafikaufruf. Die nach diesem Aufruf folgenden Stores werden nicht vorgezogen.

`check-native-dos-palette-control.py <capture>` besteht je96 Fälle pro Profil:
16 Rückkehr-,16 Upload-,48 Fade- und16 Divisionsfehlergrenzen. Verschiedene
Byteflags, acht CX-Werte und vier Modus-/Skalierungszustände sind enthalten.
SI/DX/CX/BP/DS/ES, Stacklage und sämtliche Globals bis28BFh stimmen mit dem
Original überein. Anfangsmuster machen erhaltene und gelöschte Bereiche
unterscheidbar. Keine Grafikfunktion wird gestubbt oder übersprungen. Nach
Anhalten vor einer fehlerhaften DIV bestätigt eine separate Instruktionsausführung
INT0. Hostprüfung `node scripts/check-dos-palette-control.mjs` bestätigt unter
anderem Quellschutz, Kopierbereich und die ausdrückliche Ablehnung eines offenen
Grafikaufrufs im physischen Schritt-API. Typecheck und Schrittregressionen bestehen.

Das physische188-API setzt nur den belegten Rückkehrpfad automatisch fort.
In der bisherigen kontrollierten MAIN-Umgebung verwendet Ishar2 genau diesen
Pfad. Der zusammenhängende `--execute`-Test erreicht dadurch in allen drei
gültigen Layouts den ersten Opcode66/Yield: insgesamt139 Skriptbefehle ab
MAIN-Einstieg24 (2 Objekt-,114 Block-,8 Initialzuweisungen und15 gemischte
Schritte). SI ist16103, DX30, CX2; der originale Return erreicht26B2 mit SP+2.
Speicher und vertragliche Register wurden nach jedem Skriptbefehl verglichen.
Das nächste Byte43 ist noch kein ausgeführter Befehl: Zuerst muss der originale
Yield-Abschluss einschließlich der inzwischen vorhandenen Objektkette laufen.

Dies ist der erste zusammenhängend geprüfte MAIN-Yield dieses kontrollierten
Lade-/Rootpfads, kein Start ab EXE-Entry und kein Nachweis aller realen
Grafikkonfigurationen. Die zuvor ausdrücklich auf0 gesetzten Startglobals werden
nicht nachträglich als Original-Startzustand bezeichnet. Ishar1 bleibt im selben
Lauf vor der expliziten DOS-Dateisuche156; kein Erfolg wird simuliert.
Metadaten: PALETTE_CONTROL_NATIVE_2026-10-18.json. Originaldateien und Captures
bleiben unverändert. Nächste Arbeit: echter MAIN-Yield-Abschluss/Scheduler und
DOS-Dienstbindung; die Gerätepfade bleiben gesonderte offene Abnahmen.

## Physischer Yield-Abschluss und tatsächlich erreichter MAIN-Callback

`original-dos-physical-yield.ts` verbindet26B2..26E8 mit2632..264F in derselben
physischen Speicherkopie. Zunächst wird SI nach ES:[BP−8] geschrieben. Der
Modul-Far-Pointer aus BP−20/BP−18 liefert den originalen Rückkehr-Callback.
Ist dessen Offset ungleich0, werden0C19 gelöscht und der aktuelle Kontextstack
nach0C56 gesichert; das Ergebnis endet vor dem echten26EB-Callbackdispatch mit
Stackdelta−2. Countdown-Neuladen, Objektupdates und Kontextauswahl werden in
diesem Zweig nicht vorgezogen.

Ohne Callback werden die drei aktuellen Kontextworte mit0BFA/0BFC/0BFE
verglichen. Nichtnull-Deltas laden das Original-Objektsegment0BEA und aktualisieren
die über BP−24 verketteten Datensätze in Originalreihenfolge. Auch bei leerem
Kopf wird dann DS geladen. Status0 wird2, Wortfelder22/24/26 erhalten die
16-Bit-Deltas. Danach wird der Countdown aus BP−2 übernommen und anhand des
originalen Tabellenslots der nächste Kontext oder die Framegrenze gewählt.
Gemeinsamer physischer Speicher erhält Objekt-/Kontextaliasse; kein kompletter
Segment-Writeback überschreibt zwischenzeitliche Änderungen eines anderen Views.
Zyklen und segmentübergreifende Wortzugriffe werden ausdrücklich als Hostgrenzen
abgewiesen, nicht als vermeintliche Originalvalidierung ausgegeben.

`check-native-dos-physical-yield.py <capture>` besteht je48 Fälle beider Profile:
Callback0/20, drei Deltaausgangswerte, leere/zweigliedrige Kontextobjektketten,
Frame-/Nachbarkontextauswahl und getrennte beziehungsweise identische Objekt-
und Kontextsegmente. Verglichen werden die sechs Skriptregister, Stackwirkung
und sämtliche physischen Bytes außer dem bisherigen Sicherungsstackfenster.
Die Original-Callback- und Framekörper werden an dieser Grenze nicht ausgeführt.
Hostprüfung: `node scripts/check-dos-physical-yield.mjs` für Callbackvorrang,
Objekt-/Countdownwirkungen, Quellschutz und Zyklusgrenze. Typecheck besteht.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --finish-main-yield`
enthält den bisherigen durchgehenden Nachweis und setzt die tatsächlich
erreichte CPU bei26B2 fort. In Ishar2 führen alle drei gültigen Layouts in den
Original-Callback bei SI16277, DX30,CX2,BP672. Modulsegment ist das tatsächlich
geladene Segment,0C19=0 und0C56 enthält den vor dem Callback gesicherten Stack.
Der gespeicherte MAIN-Skriptzeiger bleibt16103. Der vollständige Speicher- und
Registervergleich besteht, ohne den Callback zu überspringen.

Wichtiger Befund: Die globale aktive Liste0C16 hat den relativen Kopf14; der
Kontextobjektkopf BP−24 ist hier dagegen0. Die durch Opcode70 erzeugte aktive
Liste darf nicht mit der an diesen Kontext gebundenen Delta-Kette gleichgesetzt
werden. Im tatsächlichen MAIN-Lauf werden an dieser Stelle keine zwei Objekte
als Kontextkette aktualisiert. Die getrennten synthetischen Fälle prüfen diese
Updates, ohne sie dem beobachteten Startzustand zuzuschreiben.

Ishar1 erreicht weiterhin vor seinem ersten Yield die explizite DOS-Dateisuche;
der neue Modus behauptet dort keinen durchgeführten Yield-Abschluss. Metadaten:
PHYSICAL_MAIN_YIELD_NATIVE_2026-10-18.json. Originaldateien und Captures bleiben
unverändert. Nächster Schritt ist die Ausführung und Rückkehr des echten
MAIN-Callbacks vor dem nächsten Frame; vollständiger Scheduler, Spielstart und
Browserintegration bleiben offen.

## Echter MAIN-Callback bis zur Rückkehr und erster Framegrenze

Ausdruck106 ist anhand6DB4→1424 rekonstruiert: Ein Byte aus Engine-CS:0318
wird nach AX/DX gelesen. Das physische Schritt-API erhält den Engine-CS
explizit als Parameter (für die identifizierten Profile standardmäßig1000h)
und liest die tatsächlich vorhandene Speicherkopie. Es wird weder die
Hosttastatur abgefragt noch stillschweigend ein Tastencode0 gesetzt. Der
separate Ausdruckshelfer verlangt dafür einen expliziten `keyByte`-Snapshot.

Ausdruck116 führt6DC8→1431 aus: DX wird0, BIOS INT16h/AH02h liefert AL,
anschließend werden nur die unteren fünf Bits übernommen. Hier ist ein
expliziter BIOS-Antwortwert nötig. Ohne `shiftFlags` hält der Host vor der
Zustandsänderung an. Die Antwort ist eine kontrollierte Dienstgrenze, keine
behauptete vollständige BIOS-/Tastaturemulation. Im nativen Prüfer bleibt die
vorhandene Engineausführung erhalten; nur der INT16-Aufruf erhält ausdrücklich
den gewählten AL-Wert, andere Register und Speicher bleiben in diesem Vertrag
unverändert. Der tatsächliche Request ist AX0274h und DX0.

`check-native-dos-keyboard-expression.py <capture>` prüft je520 Fälle pro
Profil: acht gespeicherte Tastaturbytefälle sowie512 BIOS-Antwortfälle mit
allen256 möglichen AL-Bytes und je zwei eingehenden DX. SI/DX/CX, AX, Rückkehr-
Stack und unveränderte Globals stimmen überein; bei116 wird zusätzlich der
echte INT16-Request geprüft. Das bestätigt die Verarbeitung kontrollierter
Antworten, nicht das Verhalten eines tatsächlichen BIOS-Treibers.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --callback` folgt dem
erreichten Callback ab SI16277. Ohne BIOS-Antwort stimmen vier Befehle nativ
überein; die nächste116-Abfrage hält unverändert an, ohne Interrupt zu simulieren.
Mit `--callback-return --shift-flags 0` werden unter der ausdrücklich gewählten
Antwort0 sieben Callbackbefehle ausgeführt. Der abschließende Opcode66 kehrt
nach26D5 zurück; es wird nicht irrtümlich der Hauptskriptpfad26B2 verwendet.
Der vorhandene CPU-Stack einschließlich des originalen26D2-CALLs bleibt über
die komplette Folge erhalten. Alle drei gültigen Ishar2-Layouts bestehen.

`finishOriginalDosPhysicalYield(..., 'callback-return')` rekonstruiert anschließend
26D5..26E8 und die Kontextauswahl. Es stellt den Kontextstack aus SS:0C56
wieder her, ohne den gespeicherten MAIN-Zeiger BP−8 mit dem Callback-SI zu
überschreiben. Danach laufen Delta-/Countdownbehandlung und Slotwahl. Der
durchgehende native Ishar2-Test erreicht jetzt vor dem Frame-CALL2649 die
Werte BP672,SI256,DX0,CX0, mit dem tatsächlichen Modulsegment. Die Kontext-
objektkette bleibt0, die aktive Liste hat weiterhin Kopf14. Der Framekörper
selbst wird noch nicht ausgeführt.

`check-native-dos-physical-yield.py <capture> --callback-return` prüft zusätzlich
je24 Rückkehrfälle beider Profile mit Deltas, Objektketten, Segmentaliasen und
Frame-/Kontextwahl. Vollständiger physischer Speicher außer Sicherungsstack,
die sechs Skriptregister und SP-Wirkung stimmen überein. Hosttests sichern
insbesondere den erhaltenen MAIN-Zeiger, die Stackwiederherstellung und den
unveränderten Halt bei fehlender BIOS-Antwort. Diagnose-Regressionen und
Typecheck bestehen. Belegmetadaten: MAIN_CALLBACK_RETURN_NATIVE_2026-10-18.json.

Der erste komplette MAIN-/Callbackabschnitt bis zur Framegrenze ist damit in
der kontrollierten Umgebung geprüft. Keine Aussage über unbeobachtete reale
Eingaben, vollständige Plattforminitialisierung, Frame-/Grafikgeräteausführung
oder Browserintegration. Ishar1 bleibt vor der DOS-Dateisuche. Nächster Schritt:
Frameausführung mit dem nun tatsächlich aufgebauten Objekt-/Globalzustand,
statt einen leeren Diagnoseframe als Spiel-Frame auszugeben.

## Tatsächlicher erster Frame und Wiederaufnahme von MAIN

`original-dos-physical-frame.ts` rekonstruiert den Frame-CALL2649 und den
Körper3D3C..3E54 bis zur Rückkehr oder einer ausdrücklichen offenen Grenze.
Die Funktion verwendet gemeinsamen physischen Speicher und die tatsächlich
vorhandene aktive Liste. Sie verwirft die Liste nicht und ersetzt sie nicht
durch einen leeren Diagnosezustand.

Die Reihenfolge bleibt original: optionale Grafikbenachrichtigung, unsigned
Timervergleich, normale Tastaturprüfung, Rücksetzen des Timerbytes0C9A,
Kopieren der sieben Snapshotworte, Traversierung der0C16-Liste,0C49 und
gegebenenfalls der ursprüngliche Recordpfad. Ein Eintrag mit Bit40h wird
übersprungen, ein anderer setzt0B32/0B34/0B18 und endet vor3E55. Dadurch
können vorhandene, aber noch nicht zeichnungsaktive Objekte korrekt durchlaufen
werden, ohne ihre spätere Sichtbarkeit zu behaupten.

Offene Grenzen: Grafiknotification bei3D55, Timerwait bei3D64, spezielles
Tastaturbyte73h vor3D6B, Objektzeichnen vor3DE4 und Recordtypen1/2/FFh vor3E24.
Bei Wait wird keine Zeit oder IRQ-Ausführung erfunden. Recordtypen0/FEh und
unbehandelte andere Typen folgen der nativen Rückkehr. Kein Grafik-/Gerätecall
wird als erfolgreich gestubbt. Unterbrochene Framepfade haben den originalen
noch aktiven Sicherungsrahmen (SP−20 einschließlich Frame-CALL); vollständige
Rückkehr stellt die sechs Skriptregister und die vorherige Stacklage wieder her.

`check-native-dos-physical-frame.py <capture>` besteht je20 Fälle beider
Profile: leere/verdeckte/sichtbare/gemischte Listen, Globals-/Kontextaliasse,
Benachrichtigung, Wait und Tastaturpriorität, Timer-Gleichheit, Recordtypen und
Offsetüberlauf. Native Eintrittsstellen3DC3 und3DBB zählen zusätzlich die
besuchten beziehungsweise über Bit40h übersprungenen Einträge. Diese Zähler,
die sechs Skriptregister, SP und sämtliche physischen Speicherbytes außer dem
Sicherungsstackfenster stimmen mit dem Modell überein. Zyklen bleiben ein
ausdrücklich abgewiesener Hostfall. Quellschutz wird geprüft.

`original-dos-physical-context.ts` verbindet nach der Frame-Rückkehr264C die
bestehende Root-/Scheduler-Vorbereitung mit dem erhaltenen physischen Zustand.
Es liest den tatsächlichen Slot/Root und den gespeicherten Modul-/Skriptpointer.
Die Initialwerte aus2607 werden nicht erneut gesetzt. Nullpointer bleiben roh;
Globals-/Kontext-/Modulaliasse, die der komponierte Helfer nicht unterstützt,
werden ausdrücklich angehalten. Scan-Callbacks sind eine eigene Grenze.

`check-native-dos-resource-file.py <capture> <MAIN.IO> --next-main --shift-flags 0`
prüft die gesamte bisherige Lade-/Skript-/Callbackfolge plus Frame und264C-
Fortsetzung. In allen drei gültigen Ishar2-Layouts besucht der Frame tatsächlich
zwei Einträge und überspringt beide wegen Bit40h. Er kehrt nach264C zurück.
Anschließend erreicht die CPU26EB mit MAIN-SI16103,BP672,DX0,CX0 und dem
gespeicherten Modulsegment. Der nächste Originalbefehl ist43, noch nicht
ausgeführt. Keine Wurzelverknüpfung, Kontextinitialisierung oder Skriptposition
wird für diesen Wiedereinstieg manuell korrigiert.

Damit ist ein zusammenhängender MAIN→Callback→Frame→MAIN-Zyklus in der
kontrollierten Startumgebung nativ verglichen. Er zeigt noch keine Pixel:
Beide Einträge sind hier zeichnungsinaktiv. Die gewählte BIOS-Antwort0 und
die zuvor kontrollierten Startglobals bleiben ausdrücklich Testbedingungen;
keine vollständige Plattform-/Geräteinitialisierung wird behauptet. Ishar1
bleibt an seiner expliziten DOS-Dateisuche156 stehen.

Hosttests: `node scripts/check-dos-physical-frame.mjs`, Schritt-/Yieldregressionen
und Typecheck bestanden. Metadaten ohne Originalbytes:
PHYSICAL_FRAME_NATIVE_2026-10-18.json. Nächste konkrete Fortsetzung ist Opcode43
am wiederaufgenommenen MAIN; aktive Zeichen-/Record-/Gerätepfade und die
Browseranbindung bleiben offene Abnahmen.

### Dekrement und Rücksprung nach dem ersten MAIN-Zyklus (18.10.2026)

`original-dos-script-decrement.ts` rekonstruiert43/44/45 (2837..2884,
Add-Ergebnisdispatcher2943) für direkte Ziele6/8/18/20. Das typisierte
Byte-/Wortergebnis entscheidet über den Sprung. DX bleibtFFFF, CX bleibt
erhalten. Die drei Varianten überspringen1/2/3 Delta-Bytes; Variante45 liest
dennoch nur die unteren16 Bit. C54 und die C58/C5C-Puffertauschreihenfolge
werden im gemeinsamen physischen Speicher ausgeführt, auch wenn das Ziel
C54 überschreibt. Andere Ergebnisformen werden ausdrücklich abgewiesen.

`check-native-dos-decrement.py` vergleicht pro Originalprofil144 synthetische
Fälle gegen den echten Dispatcher: alle drei Varianten, vier Zieltypen,
sechs Grenzwerte und getrennte/aliasierende Globals. Sechs Skriptregister,
SP und der gesamte1MiB-Speicher stimmen überein; ausschließlich der bekannte
CPU-Stack-Sicherungsbereich wird maskiert. Scratchregister/Flags sind kein
öffentliches API-Versprechen. Beide Originalcaptures bleiben unverändert.

Der Ressourcenchecker mit `--resume-after-frame --shift-flags 0` führt den
bereits geladenen Ishar2-MAIN-Zustand weiter:43 dekrementiert und springt
zurück zu66. Nach zwei Schritten steht SI wieder auf16103, DX=FFFF. Alle
drei gültigen Layouts stimmen mit der fortlaufenden nativen Ausführung
überein. Der Zähler wird dabei nicht manuell verändert. Dies belegt einen
weiteren Yield, noch nicht das Auslaufen der Warteschleife. Die explizite
BIOS-Antwort0 und die kontrollierte Startumgebung bleiben Testbedingungen.
Ishar1 bleibt weiterhin an seiner DOS-Dateisuchegrenze; Browser und aktive
Grafikausgabe sind durch diesen Schritt nicht erweitert.

Reproduktion: `node scripts/check-dos-decrement.mjs`; für jeden lokalen
Capture `check-native-dos-decrement.py <memory.bin>` mit dem dokumentierten
Unicorn-PYTHONPATH. Metadaten: `DECREMENT_BRANCH_NATIVE_2026-10-18.json`.
Schritt-/Yield-/Frame-Regressionen und Typecheck bestanden. Nächste offene
Abnahme ist die wiederholte Scheduler-/Callback-Fortsetzung bis zu einem
neuen Originalpfad, ohne einen Zähler oder Dienst künstlich zu überspringen.

### Vollständiges Auslaufen der ersten MAIN-Warteschleife (18.10.2026)

Der Ressourcenchecker kann mit `--cycles N` den vorhandenen nativen CPU-Zustand
über weitere Yield-/Callback-/Frame-/Kontext-/MAIN-Folgen fortsetzen. Jeder
rekonstruierte Abschnitt wird vor seiner nativen Ausführung berechnet und
danach anhand der sechs Skriptregister, SP und des physischen Speichers geprüft.
Der bekannte CPU-Stack-Sicherungsbereich bleibt wie bisher maskiert. Unbekannte
Operationen werden nicht übersprungen. N ist eine Hostgrenze, keine Spielregel.

Prüfung mit Ishar2-MAIN, `--cycles 40 --shift-flags 0`: Alle drei gültigen
Speicherlayouts verlassen die Schleife nach29 zusätzlichen Zyklen. In den
ersten28 weiteren MAIN-Folgen läuft43→66, in der letzten43→17. Der originale
Unterprogramm-Rücksprung stellt SI15009 her; dort folgt78. Sämtliche bis zu
dieser Grenze ausgeführten Abschnitte stimmen nativ überein. Originalzähler,
Scriptbytes und gespeicherte Rücksprungadressen wurden nicht nachgebessert.
Die Callbacks laufen jedes Mal von ihrem originalen Einstieg und erreichen
jeweils nach sieben Schritten den Yield. Beide Frameeinträge bleiben verborgen.

Statische nächste Stelle: Opcode78 dispatcht nach325F, löscht Flag40, setzt
Flag80 und ruft32B1 (Entfernen aus der aktiven Liste) und3288 (Anhängen an deren
Ende) auf. Diese Analyse ist noch keine implementierte/nativ verglichene
Aktivierungsfunktion. Sie erklärt die nächste Verbindung zur sichtbaren Ausgabe.

Metadaten ohne Originalressourcen: `MAIN_WAIT_LOOP_NATIVE_2026-10-18.json`.
Reproduktion mit lokalem Capture und Original-MAIN über
`check-native-dos-resource-file.py <memory.bin> <MAIN.IO> --cycles 40 --shift-flags 0`.
Die kontrollierte Startumgebung, BIOS-Antwort und fehlenden Plattformpfade
bleiben Grenzen; insbesondere ist dies keine sichtbare Browsererweiterung
und kein Nachweis für den Ishar1-Startablauf mit dessen offener Dateisuche.

### Objektaktivierung78 und Verbergen79 (18.10.2026)

`original-dos-object-visibility.ts` bildet325F/3279 und die Listenroutinen
32B1/3288 in gemeinsamem physischem Speicher ab. Beide Befehle lesen den
relativen Objektzeiger als unmittelbares Wort; BF6 liefert die Basis.
78 löscht Byteflag40 und setzt Wortflag80, entfernt das Objekt aus der
C16-Liste, setzt seinen Folgezeiger(+4) auf0 und hängt es am Listenende an.
79 setzt ausschließlich Byteflag40; Reihenfolge und Verknüpfung bleiben
erhalten. SI steigt um zwei Operandbytes; DX/CX und die übrigen öffentlichen
Skriptregister bleiben erhalten. Fehlerhafte zyklische Listen und Zugriffe
außerhalb des begrenzten Real-Mode-Fensters werden als Hostgrenzen atomar
abgewiesen; sie werden nicht als originales Fehlerverhalten ausgegeben.

Die Dispatcher beider identifizierten Captures zeigen auf dieselben Adressen.
`check-native-dos-object-visibility.py <memory.bin>` prüft je192 Fälle nativ:
beide Befehle, getrenntes/SS-aliasierendes ES, normale/umgebrochene Basis,
leere/eine/mehrere Listenelemente sowie Ziel am Kopf/in der Mitte/am Ende
oder außerhalb der Liste und vier Flagwörter. Sechs Skriptregister, SP und
vollständiger Speicher außer dem bekannten Stack-Sicherungsbereich stimmen
überein. Originalcaptures bleiben unverändert. Eigene Tests prüfen zusätzlich
Listenreihenfolge, Erhalt anderer Flags und unveränderte Eingaben bei Ablehnung.

Die tatsächliche Ishar2-MAIN-Folge wurde erneut ab Original-MAIN mit
`--cycles 40 --shift-flags 0` verglichen. Nach dem bisherigen Zählerablauf
läuft jetzt43→17→78 nativ identisch in allen drei gültigen Layouts. SI erreicht
15012; der nächste nicht angebundene Befehl ist71. Nach78 wurde in dieser
Prüfung noch kein Frame gerendert. Die Aktivierung beweist deshalb weder
Pixelgleichheit noch eine sichtbare Browserfunktion. Ishar1 hat native
synthetische Befehlsnachweise, weiterhin keinen vollständigen MAIN-Start.

Metadaten: `OBJECT_VISIBILITY_NATIVE_2026-10-18.json` (Prüfmatrix und kanonischer
Ergebnisdigest) sowie `MAIN_OBJECT_ACTIVATION_NATIVE_2026-10-18.json`.
Hostprüfung: `node scripts/check-dos-object-visibility.mjs`, vorhandene
Schritt-/Frameregressionen und Typecheck bestanden. Nächste Stelle ist71 im
echten MAIN, anschließend der aktive Zeichenpfad.

### Objektauswahl71 und Wortänderungen192/193/194 (18.10.2026)

`original-dos-object-selection.ts` rekonstruiert71 (2EF3) sowie192 (2EFF),
193 (2F41) und194 (2F21).71 liest einen unmittelbaren Wortzeiger und speichert
ihn bei ES:BP-22, wenn sich die Auswahl geändert hat. DX/CX bleiben erhalten.
Die drei anderen Befehle lesen zwei69A6/699E-Zahlenwerte und hinterlassen sie
in DX/CX; unterstützt sind0/2/6/8/30/32, andere Formen werden atomar abgewiesen.
Eine Nullauswahl unterdrückt nur die Speicheränderung, nicht das Lesen beider
Operanden. Dies ist ausdrücklich kein erfundenes Editor-Auswahlmodell.

Die Originaladressen unterscheiden sich:192 schreibt bei BF6+Auswahl+10/+12,
193 dagegen bei BF6+14/+16 und194 bei BF6+18/+20. Nur192 addiert den ausgewählten
Zeiger. Alle drei setzen Byteflag80 an ihrer jeweiligen Basis, erhalten aber
die übrigen Flagbits. Die zunächst naheliegende einheitliche Adressierung wurde
durch den nativen Vergleich widerlegt und anhand des Codes korrigiert. Eine
weitergehende Bedeutung der Wortfelder wird hier nicht behauptet.

`check-native-dos-object-selection.py <memory.bin>` prüft pro Originalprofil192
Fälle: vier Befehle, zwei ES-Zuordnungen einschließlich SS-Alias, zwei Basen
einschließlich16-Bit-Überlauf, Null-/Nichtnullauswahl und sechs Operandformen.
Sechs Skriptregister, SP und der komplette physische Speicher außer dem
bekannten CPU-Stack-Sicherungsbereich stimmen nativ überein. Unveränderte
Captures werden abschließend geprüft. Metadaten mit Prüfmatrix und kanonischem
Ergebnisdigest: `OBJECT_SELECTION_NATIVE_2026-10-18.json`.

Der tatsächliche Ishar2-MAIN-Pfad läuft nach der Warteschleife nun43→17→78→71,
in allen drei gültigen Layouts nativ verglichen. Danach steht SI auf15015,
Opcode73. Die synthetisch geprüften192/193/194 wurden in dieser MAIN-Folge
noch nicht erreicht. Metadaten: `MAIN_OBJECT_SELECTION_NATIVE_2026-10-18.json`.
Reproduktion des MAIN-Nachweises weiterhin mit `--cycles 40 --shift-flags 0`.
Kontrollierte Startglobals und explizite BIOS-Antwort bleiben Testbedingungen;
nach Aktivierung ist weiterhin keine tatsächliche Grafikausgabe geprüft.

`node scripts/check-dos-object-selection.mjs`, Auswahl-/Sichtbarkeits- und
Schrittregressionen sowie Typecheck bestanden. Nächste konkrete Grenze ist73
(336F), mit seiner Fortsetzung in der Ressourcen-/Grafikvorbereitung3415.

### Ressourcenauflösung72/73 und erster Verbundeintrag (18.10.2026)

`original-dos-resource-draw.ts` bildet die numerische Vorbereitung333F/336F,
den Einstieg3415 und die Auflösung39F5 ab.72 liest eine Ressourcen-ID und setzt
C02/C04/C06/C0E auf0.73 liest drei Koordinaten, eine Ressourcen-ID und einen
Unterindex, den699E in CX liefert. Beide setzen C15/C13 auf0 und übernehmen
das Spiegelungsbyte aus ES:BP-3 nach C12. Numerische Formen0/2/6/8/30/32 sind
implementiert; der neue synthetische Prüfsatz erreicht0/2. Andere Formen werden
explizit abgewiesen. Die originalen sequenziellen Globalzugriffe bleiben erhalten.

39F5 liest den Modulzeiger aus ES:BP-20/-18, folgt Header+14 und dessen relativer
Tabelle und adressiert den vierbytebreiten Eintrag über DX. Der Low-Word-Additions-
übertrag erhöht das Highwort; danach folgen Bytevertauschung, vier Links-Shifts
und Absatznormalisierung. Dies ist keine übliche pauschale32-Bit-Offsetaddition.
Die resultierenden Register und der gesamte Speicher werden nativ verglichen.

Negative Typen außer FE sind Verbünde. Die Routine setzt CX auf Zählerbyte+1,
springt aber vor dem ersten Körper auf LOOP. Tatsächlich ist daher das rohe
Zählerbyte die Anzahl der Teilgrafiken;0 beschreibt einen leeren Verbund. Für
den ersten Eintrag werden C12/C02/C04/C06 gesichert, Koordinaten addiert und bei
negativer Teil-ID das Vorzeichenbit entfernt sowie C12 umgeschaltet. Die
X-Verschiebung wird bei zuvor gesetztem C12 negiert. Rekursion erfolgt nach341B,
ohne C13 erneut zu löschen. Der Host folgt nur bis zur ersten Blattressource,
dem FE-Sonderpfad oder dem Ende eines leeren Verbunds; Geschwister und Rückkehr
sind noch offen. Zyklische erste Kindketten und eine explizite Tiefe32 werden
als Hostgrenzen atomar abgewiesen. Die Tiefe ist keine Originalformatgrenze.

Die API endet bei3432 (Datensatzpfad),342F (FE) oder34AF (leerer Verbund).
Es bleiben fünf Stackwörter, je rekursiver Ebene kommen zehn hinzu. Der
physische Vollschritt ist bewusst noch nicht mit einem scheinbar fertigen73
verbunden. Er weist den Befehl weiterhin ab, bis Rückkehr und alle Seiteneffekte
rekonstruiert sind. Das ist eine offene Implementierung, keine Spielregel.

`check-native-dos-resource-draw.py <memory.bin>` vergleicht je80 synthetische
Fälle beider Captures:72/73, getrenntes/SS-aliasierendes ES, relative Überträge,
Typ0/1/FE/FF, beide Spiegelungen und leere/einelementige Verbünde. Sechs
Skriptregister, SP und vollständiger Speicher außer dem bekannten Stackbereich
stimmen überein. Metadaten: `RESOURCE_DRAW_NATIVE_2026-10-18.json`.

Für die Original-MAIN-Fortsetzung erzeugt der Ressourcenchecker optional mit
`--checkpoint <privates Verzeichnis>` einen vollständigen CPU-/Speicherzustand.
Repository, Originalinstallations- und Captureverzeichnis sind als Ausgabeziele
abgewiesen. Die Binärdateien enthalten Originalcode/-daten und bleiben lokal;
sie dürfen nicht ins Repo. Erzeugung am bisherigen Ende:
`check-native-dos-resource-file.py <memory.bin> <MAIN.IO> --cycles 40 --shift-flags 0 --checkpoint <privates Verzeichnis>`.
`check-native-dos-main-draw.py <privates Verzeichnis>` bindet sie anhand der
vorher dokumentierten Speicherhashes und Register an den geprüften MAIN-Zustand.

In allen drei gültigen Ishar2-Layouts hat Ressource15 TypFF und drei Kinder.
Der erste Eintrag führt zu Ressource12, Typ1; SI15026, CX1232 und die restlichen
Skriptregister sowie Speicher und SP stimmen nativ überein. Der Endpunkt liegt
vor34B7 bei3432; noch kein Datensatz oder Pixel wird ausgegeben. Die vorherige
kontrollierte Startumgebung/BIOS-Antwort bleibt Voraussetzung. Ishar1 hat hier
synthetische Befehlsnachweise, keinen entsprechenden vollständigen MAIN-Pfad.
Metadaten: `MAIN_RESOURCE_DRAW_NATIVE_2026-10-18.json`.

Hosttest `node scripts/check-dos-resource-draw.mjs`, Typecheck und Diffprüfung
bestanden. Nächste zusammenhängende Arbeit ist34B7 mit Datensatzsuche35CF,
gegebenenfalls Allokation3626 und der Rückkehr über verbleibende Verbundkinder.
