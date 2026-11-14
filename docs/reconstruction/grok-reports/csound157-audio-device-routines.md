# csound (Opcode 0x9D = 157): erreichbare Audio-Gerätepfade in Ishar 1 und Ishar 2 (DOS)

Stand: 14.11.2026. Grundlage sind statische 16-Bit-Disassembly (Capstone 5) des entpackten Engine-Images und CPU-Emulation (Unicorn 2.1.4). Emuliert wurden echte Originalbefehle in einer 1-MiB-Speicheraufnahme. Alle I/O-Zugriffe wurden abgefangen; es gab keine Host-Hardware und keinen Hörtest. Vorhandene CPU-Differentialprüfungen aus dem Toolkit (`scripts/check-native-dos-*.py`, Doku `docs/reconstruction/DOS_STARTUP.md`) wurden wiederverwendet und auf frisch erzeugten Aufnahmen erneut ausgeführt. Dieser Bericht enthält keine Originalbytes, Dumps, Codeauszüge oder Spielwerte.

Evidenzstufen: **belegt statisch/dynamisch** = known; **abgeleitet** = suspected; **offen** bzw. ungeprüft = unknown.

## 0. Abgrenzung und Korrektur

- Opcode 0x4B (dezimal 75) ist `cerasen` (Sprites bzw. Grafikelemente entfernen). Er ist **kein** Audio-Opcode. Die Befunde unten haben mit Opcode 75 nichts zu tun.
- Das echte `csound` ist Opcode **0x9D (157)**. Der Handler liegt in beiden Spielen bei 1000:62BB (Sprungtabelle CS:0024 + 2·0x9D). `cmsound` (0x9E) bei 1000:6370 setzt nur SS:0C15=1 und springt in denselben Rumpf. `cdelsound` (0xA1) bei 1000:6379 ruft den Stop 1000:8ADB.
  - **Evidenz:** belegt statisch.
- Ishar1-LOGO.IO enthält **keine** `csound`-Aufrufstelle (Audit aller Listings gegen die Originalbytes: 0 Treffer in LOGO.IO). Skriptoffset 00F0 ist deshalb **kein** Einstieg für Opcode 157 und wird nicht verwendet.
  - Gezählte Aufrufstellen: Ishar 1 hat 72× `csound` und 14× `cdelsound` in 98 Modulen. Ishar 2 hat 124× `csound` und 18× `cdelsound` in 142 Modulen. `cmsound` kommt in beiden 0× vor.
  - **Evidenz:** belegt statisch (Listing-Präfixe gegen Originalbytes geprüft).

## 1. Profile und Dateien

| Profil | Datei | SHA-256-Präfix |
|---|---|---|
| Ishar 1 | start.exe (43265 B) | 3ea63234c97b |
| Ishar 2 | start.exe (43462 B) | 5e35e58d2d13 |
| beide | START.STP (14 B, identisch) | d4eb29e43511 |
| Ishar 1 | entpacktes Image (Analysekopie, nicht veröffentlicht) | 3374a47e3047 |
| Ishar 2 | entpacktes Image (Analysekopie, nicht veröffentlicht) | e3a929a3916b |
| Ishar 1 / 2 | 1-MiB-Aufnahme beim ersten INT 21h | 5ce2bfdfc836 / f8ab017849e5 |
| beide | Audio-Codebereich 1000:5E00..9500 | 89efca9cb14e (I1 = I2) |
| beide | Treibersegment 1941 (Image 0x9410..0xC0B0) | 77f09f0c1c43 (I1 = I2) |

Es gibt **keine separaten Treiberdateien**: kein .DRV, kein Setup-Programm, keine Soundtreiber-Overlays. Alle Gerätepfade sind in start.exe eingebaut.
- Adressen: Segment 1000 = Engine-Hauptcode. Segment 1941 = eingebautes Treibersegment. 1BAC = Treiberdaten. 1C0B = Engine-DS/SS.
- Ishar 1 und Ishar 2 sind im ganzen Hauptsegment 0000..FFFF bytegleich, bis auf 4 Bytes außerhalb des Audiopfads (0x788/0x789 und 0x949..0x94F).
- **Evidenz:** belegt statisch.

## 2. Profilauswahl (Gerätemodus)

| Größe | Ort | Bedeutung / Herkunft | Evidenz |
|---|---|---|---|
| Gerätemodus | SS:2890 ≡ CS:E940 (physisch gleich) | Kommt aus Tag `S` von START.STP. Werte: I/A/B/N/G → 0/1/2/3/4. C → 4, zusätzlich wird das Konfigurationswort B8E auf 8 gesetzt. Unbekannte Werte → 0. | belegt dynamisch (Konfig-Decode und -Übernahme, CPU-Differentialtest, beide Profile) |
| Interfacewert | CS:E93E ≡ SS:288E | Nur von 1000:8CB0 geschrieben: 1 im Normalfall, 4 bei erkanntem Sound Blaster | belegt statisch |
| Sample-Abschaltung | SS:0CA2 | Befehlszeilenbuchstabe `S` (Groß/Klein egal; PSP-Tail-Parser 1000:0734..0777) setzt 1. Die Buchstaben `M`/`A`/`J` setzen 0CA3/0CA4/0CA1. | belegt statisch |

- Die mitgelieferte START.STP wählt Modus 2 (FM-Pfad).
- Die Gerätenamen unten sind aus den angesprochenen Ports **abgeleitet** und nicht aus Texten belegt:
  - Modus 1/4: PIT-Kanal 2 und Port 61 → PC-Speaker.
  - Modus 2: 388h/389h → AdLib/OPL.
  - Modus 3: 2x6h/2xAh/2xCh/2xEh und DMA-Kanal 1 → Sound Blaster.

## 3. Audio-Start 1000:08EB → 1000:8CB0 (pro Modus)

| Modus | Ablauf | Ports / Vektoren | Evidenz |
|---|---|---|---|
| 0 | Sofort RETF, kein Zustand geändert | keine | belegt statisch + dynamisch |
| ≠0 (alle) | Holt INT 0Fh und sichert ihn nach CS:86E8/86EA. Setzt INT 0Fh auf 1000:8CA9 (Handler macht nur EOI: Port 20h=20h, IRET). Setzt 4 Kanalsätze SS:1DFD/1E0D/1E1D/1E2D (je 16 B) zurück. Setzt CS:86DA/86DC = 1000:0D98 (Engine-Timer als Rückfallziel), CS:86DE=5D2A, Pending-Stapel leer (CS:8909=0, CS:890B=893D). | INT 21h AH=35h/25h, Vektor 0Fh | belegt statisch + dynamisch |
| 1 | CS:E93E=1, Rückkehr. Der Aufruf 1941:1B9B ist wegen der direkt davor gesetzten 1 nicht erreichbar. | keine | belegt statisch + dynamisch |
| 2 | CS:E93E=1, ODER 20h nach CS:CD4D (ZF=0, deshalb wird der folgende JE nie genommen). Dann Far-Call 1941:1C31. | 1C31 schreibt die FM-Register 20/60/80/C0/E0/43/B0/A0 (Testton auf Kanal 0). Wartet auf PIT-Kanal 0 (Latch über Port 43h=00, Lesen Port 40h, bis 0952h Takte vergangen sind). Ton aus. Wählt Register 40h und setzt es auf 3Fh. Setzt das Ausgabeport-Wort 1BAC:0000=0389h und legt den DMA/Mischpuffer 1BAC:05DC..05E0 an. Liest INT 08h über AH=35h nach 1BAC:00D7/00D9. | belegt statisch; Rumpf von 1C31 nicht emuliert (Grenze) |
| 3 | CS:E93E=4, Far-Call 1941:1AAB. Bei AX=1: ODER 80h nach CS:CD4D. Sonst Rückfall auf Modus 1 und Interface 1. | siehe Abschnitt 6 | belegt statisch; Prefix bis 1941:196E dynamisch |
| 4 und andere | Rückfall: CS:E940=1, CS:E93E=1 | keine | belegt statisch + dynamisch |

Damit ist Modus 4 (auch über `C`) nach dem Start nicht mehr vorhanden: Er läuft wie Modus 1. Die Modus-4-Zweige in 87F3 und 8ADB sind so nur noch toter Code. **Evidenz:** abgeleitet aus belegt statisch, denn es gibt außer 8CB0 keinen Schreiber von CS:E940 im Haupt- oder Treibersegment.

## 4. csound-Handler 1000:62BB (beide Spiele identisch)

1. **Operanden lesen.** Fünf Ausdrucksoperanden über 1000:69A6 (Operandenauswerter). Ziel: Ressourcennummer in DX; Priorität SS:0CC9 (signed8); Wert SS:0CD1; Wiederholung SS:0E0E (Wort); Geschwindigkeit SS:0E0D.
   - **Evidenz:** belegt statisch.
2. **Sample-Ressource auflösen.** 1000:60F6 löst die Ressource auf. Ist SS:0C15 gesetzt (`cmsound`), nimmt der Code den anderen Auflösungsweg ab 6189. Dass dieser Weg Ressourcen des Hauptskripts meint, ist nur aus dem m-Präfix abgeleitet.
   - **Evidenz:** belegt statisch (Pfaddetails 60F6..6189 nicht einzeln geprüft).
3. **Gate 1000:62F7.** Bei SS:0CA2≠0 (Befehlszeile `S`) geht es direkt zum Registerrückbau, ohne Gerätezugriff.
   - **Evidenz:** belegt statisch.
4. **Parameterblock 6302..633E.**
   - Geschwindigkeit 0 wird durch Headerbyte +1 ersetzt.
   - Länge = LE-Wort bei Header+2 minus 16 → SS:0E14.
   - Sampleanfang DS:(DI+16) → SS:0E10/0E12.
   - Geschwindigkeit·1000 (Low-Word) → SS:0E18. Hier gibt es noch keinen Clamp.
   - **Evidenz:** belegt dynamisch (768 Fälle je Profil).
5. **Verzweigung 633F.**
   - SS:288E (= CS:E93E) == 1 → Far-Call 1000:87F3.
   - Sonst: SS:0CC7 = Wort aus dem Aufruferkontext, SS:0CCA=80h, dann CALL 1000:5F01. 5F01 vergibt einen der vier Kanalsätze 1DFD..1E2D: zuerst ein gleicher Satz, sonst der Satz mit der niedrigsten Priorität. Bei gesetztem Bit 7 in 0CCA folgt anschließend ebenfalls 87F3, mit Kanalindex in SS:0E1A.
   - **Evidenz:** belegt statisch; 5F01 mit Modus 0/1 dynamisch.

## 5. Gerätedispatcher 1000:87F3

**Eingang.** CS:E940=0 → sofort RETF.

**Prioritätsprüfung** (nur bei Interface ≤1):
- Die neue Priorität CS:CD79 wird signed gegen vier Kanalprioritäten (CS:DEAE/DEBE/DECE/DEDE) und die laufende Priorität CS:CEBB geprüft. Ist sie kleiner, wird verworfen.
- Danach wird das Geschwindigkeitsbyte CS:CEBD signed auf 1..20 begrenzt, sonst 10.
- **Evidenz:** belegt dynamisch (256 Fälle je Profil).

**Verzweigungen danach:**

| Bedingung | Ziel | Gerätewirkung | Evidenz |
|---|---|---|---|
| Modus 3 | Far 1941:2177 | Sound-Blaster-Softwarekanal (Abschnitt 6) | belegt statisch + dynamisch (eigene Emulation) |
| Interface ≠1 und Modus ≠3 | Far 1941:1EDF | Softwaremischer über INT 08h | belegt statisch, nach dem Start **nicht erreichbar** (siehe 7) |
| Modus 2 | 86C1≠0 → verwerfen (CEBB=80h). Sonst Pending-Push 8949 und 1000:91D0. | FM-Sample-Wiedergabe (Abschnitt 6) | belegt statisch + dynamisch (eigene Emulation) |
| Modus 1 (und 4) | Pending-Push 8949, dann 1000:8F49 | PC-Speaker-PWM (Abschnitt 6) | belegt dynamisch (vorhandene Differentialtests sowie eigene Emulation) |

Zur Zeile Modus 2: CS:86C1 wird im Musikstartpfad um 1000:86EC..872D auf 1 gesetzt und von den Stops gelöscht. Daraus ist **abgeleitet**: Im FM-Modus werden Samples verworfen, solange Musik aktiv ist.

## 6. Geräteroutinen im Detail

### 6.1 Modus 1/4: PC-Speaker-PWM (1000:8F49, Stub-Template CS:8EB8)

- **Stub installieren.** 8F22 kopiert einen 106-Byte-Stub an den Anfang des Samplepuffers (DS:DX aus CS:CEC0); die Samples beginnen bei Basis+80h. Der Stub wird relocatiert. Byte +3 kommt aus der Tabelle CS:8E11+(Geschwindigkeit−1). Die Wiederholung kommt aus CX (≤0 → 7D00h). Rücksetzwert ist CS:0BF8 (Engine-Timerteiler).
- **IVT direkt beschreiben.** Vektor 08h wird auf den Stub gesetzt (0000:0020/0022), unter CLI. Der Vorgänger wird nicht gelesen. Rückfallziel ist der Engine-Timer 1000:0D98 aus CS:86DA/86DC.
- **Portfolge:** 43h=B2h; 42h=00,00; 61h=(alt AND FCh) OR 03h; 43h=36h; 40h=Teiler (low), 00; 43h=90h.
  - Teiler 37h (55) oder 42h (66), je nach SS:0C9F und Systemtyp SS:2894 (Helfer 0F1E). Das ergibt rechnerisch etwa 21,7 bzw. 18,1 kHz Abtasttakt.
- **Tick des Stubs.** Sample → Port 42h, EOI Port 20h. Ein Countdown kettet an 1000:0D98.
  - Am Sampleende: 1000:905E → Stop 8E2C. Der Stop setzt 43h=36h, schreibt 40h aus CS:86DE, löscht die Bits 0/1 in Port 61h, stellt Vektor 08h aus CS:86DA/86DC wieder her und holt den nächsten Pending-Auftrag (LIFO, max. 6).
- **Evidenz:** belegt dynamisch (vorhandene Tests: Install 30, Ports 126, Tick 1152, Sequenz 224 Ticks, Stop 72, Pending 144, Resume 24 Fälle je Profil, alle bestanden). Die eigene Emulation von 87F3 und 5F01 liefert für beide Profile dieselbe 8-OUT-Folge.

### 6.2 Modus 2: FM-Sample-Wiedergabe (1000:91D0, IRQ0-Handler 1000:93A6)

- **FM-Initialisierung.** Gleiche Initialisierungsfolge wie 1941:1C31: Testton, Warten auf 0952h PIT-Takte, Ton aus. Danach wird Register 40h gewählt.
- **Vektor 08h** wird direkt auf 1000:93A6 gesetzt.
- **PIT-Kanal 0** bekommt 43h=36h und einen Teiler aus der Wortabelle CS:91A6 + 2·SS:0E0D.
  - Die Tabelle entspricht etwa 1193182/(Geschwindigkeit·1000). Beispiel: Index 10 → 119 ≈ 10 kHz, Index 20 → 59 ≈ 20 kHz.
  - Es wird die **ungeklammerte** Geschwindigkeit SS:0E0D benutzt. Werte über 20 lesen deshalb hinter die 21 Tabelleneinträge (**abgeleitet**).
- **Ausgabe.** Der Handler 93A6 liest ein Sample. Ist es nicht 0, wird (3Fh − Wert) AND 3Fh nach **Port 389h** geschrieben (FM-Total-Level als DAC-Ersatz), dann EOI 20h. Ein Countdown aus CS:0BF8 kettet an 1000:0D98. Ein Nullbyte ist Endemarke (Pfad 93E5).
- **Stop (1000:92E0).** Register 40h=3Fh und B0h=00. PIT-Kanal 0 aus CS:86DE, Vektor 08h aus CS:86DA/86DC. Danach Flags 0 (CEBA/8947) und Priorität 80h.
- **Evidenz:** belegt statisch; Init und Start dynamisch in eigener Emulation (38 OUT, Vektor 08h → 1000:93A6, Teiler 77h bei Geschwindigkeit 10; I1 = I2). Der Tick selbst wurde nicht emuliert.

### 6.3 Modus 3: Sound Blaster (1941:1AAB Erkennung, 1941:2177 Kanalstart, 1941:1F82 IRQ-Handler)

- **Reset-Scan (1941:1A36).** Basis 210h..260h in 10h-Schritten. Reset-Port Basis+6 bekommt 1, kurze Pause, dann 0. Danach bis zu 100 Lesezugriffe auf Basis+Ah, bis AAh kommt. Bei Erfolg wird 1BAC:008A = Basis.
  - **Evidenz:** belegt dynamisch (Prefix vorhandener Startup-Test) und statisch.
- **IRQ-Probe (1941:196E)** mit den Kandidaten IRQ 2, 3, 5, 7, also Vektoren 0Ah/0Bh/0Dh/0Fh:
  - Altvektor über AH=35h nach 1BAC:00D7/00D9 sichern, Testhandler 1941:1914 setzen, PIC-Maske Port 21h sichern (1BAC:008E) und Bit freigeben.
  - DSP-Kommandos: 40h (Zeitkonstante 0), D3h (Lautsprecher aus).
  - Der Handler programmiert DMA-Kanal 1 in Single-Cycle-Lesemodus mit 256 Byte: Ports 0Ah=05, 0Ch, 0Bh=49h, 02h, 83h, 03h, 0Ah=01. Dann DSP 14h, Länge 00FFh, EOI.
  - Erfolg, wenn mindestens 3 IRQs ankommen. Vektor und Maske werden in 1BAC:008D/008C gemerkt. Altvektor und alte Maske werden danach wiederhergestellt.
  - **Evidenz:** belegt statisch; nicht emuliert, weil ein echter IRQ nötig wäre.
- **Danach (1941:1AFC..1B97):**
  - DSP-Init 1941:1A75: DSP-Reset und D1h (Lautsprecher an). Zeitkonstante = 256 − 1000000 / Wort 1BAC:00D3 (statischer Startwert 12000, also 0ADh).
  - Endgültigen Handler 1941:1F82 auf den gefundenen Vektor setzen, PIC-Bit freigeben.
  - Zwei 256-Byte-Puffer (physische Seite und Offset in 1BAC:05DC..05E0).
  - **Evidenz:** belegt statisch.
- **Kanalstart (1941:2177).** Belegt einen von vier Softwarekanälen (je 11h Byte ab 1BAC:008F) mit Zeiger, Länge, Schrittweite (aus SS:0E18 / 12000) und Wiederholung. Gibt das PIC-Bit frei. Ist der Mischer ruhend, wird 1F82 einmal direkt angestoßen.
  - **Evidenz:** belegt statisch und dynamisch in eigener Emulation (Basis 220h angenommen). Ergebnis: Folge DMA ch1 (0Ah/0Ch/0Bh/02h×2/83h/03h×2/0Ah), DSP 2xCh: 40h, ADh, 14h, FFh, 00h, dann EOI 20h. Kein IVT-Schreibzugriff. I1 = I2.
- **IRQ-Handler 1F82.** Bestätigt den DSP (Lesen Basis+Eh), programmiert den nächsten 256-Byte-DMA-Block, startet DSP 14h und mischt die vier Kanäle in den Puffer.
  - **Evidenz:** belegt statisch und dynamisch (ein Durchlauf).
- **Stop pro Kanal (1941:2209).** Wird von `cdelsound` über 8ADB für die Kanäle 0..3 aufgerufen. Setzt Satz +1=80h und +0=0 in 1DFD.. und löscht die Kanalfelder.
  - **Evidenz:** belegt statisch.

## 7. Statisch nicht erreichbare Gerätepfade

| Routine | Wirkung | Warum nicht erreichbar | Evidenz |
|---|---|---|---|
| 1941:1EDF + IRQ0-Mischer 1941:1D3A | PIT ch0 = 1234DCh / 1BAC:00D3; Vektor 08h direkt → 1941:1D3A; Ausgabe auf Port aus 1BAC:0000 | Braucht Interface ≠1 bei Modus ≠3. Interface 4 gibt es aber nur zusammen mit Modus 3. | belegt statisch, abgeleitet |
| 1941:1B9B | Port 61h OR 3, 43h=B2h, Ausgabeport-Wort 42h | Einziger Aufruf 1000:8D42 wird durch die davor gesetzte 1 übersprungen | belegt statisch |
| 1941:1C2A | Ausgabeport-Wort **378h** (LPT1-DAC) | Kein Aufrufer und kein Zeiger im Image gefunden | belegt statisch (Suche nach Near/Far-Calls und Wortreferenzen) |
| 1941:2270 / 1941:2295 | Restore INT 08h bzw. DSP-Reset, PIC-Maske und SB-IRQ-Vektor | Kein Aufrufer und kein Zeiger gefunden | belegt statisch |

## 8. Interrupts und Vektoren (Übersicht)

| Vektor | Gesetzt durch | Gelesen/gesichert | Restauriert | Evidenz |
|---|---|---|---|---|
| 08h (IRQ0) Engine | 1000:0BFA.. (Kalibrierung 0D54, danach Engine-Tick 0D98) | AH=35h → CS:0BF2/0BF4 (BIOS-Handler, Kette über Far-Zeiger) | 1000:0D36 beim Programmende (plus PIT ch0 aus CS:0BF6) | belegt statisch |
| 08h Sample | 8F49 (Speaker-Stub) bzw. 91D0 (FM, → 93A6): direkter IVT-Schreibzugriff, Vorgänger wird nicht gelesen | – | 8E2C bzw. 92E0 auf 1000:0D98 | belegt dynamisch (Speaker); statisch + dynamisch Start (FM) |
| 0Fh (IRQ7) | 8CB0 → 1000:8CA9 (nur EOI), in allen Modi ≠0 | AH=35h → CS:86E8/86EA | 1000:8D7E beim Programmende | belegt statisch + dynamisch |
| 0Ah/0Bh/0Dh/0Fh | SB-Probe (temporär) und danach 1941:1F82 auf dem gefundenen Vektor | AH=35h → 1BAC:00D7/00D9 | Probe: ja. Endgültiger Handler: Restore-Routine 2295 ohne Aufrufer, und 8D7E stellt nur 0Fh wieder her. | belegt statisch; Wirkung zur Laufzeit **offen** |

Programmende 1000:0954 ruft der Reihe nach auf:
- 8D7E: Sample-Stop 8ADB, Musik-Stop 8A4D, Port 61h Bit 0 löschen, INT 0Fh restaurieren.
- 0D36: INT 08h und PIT.
- Danach weitere Vektoren, u. a. INT 24h.

## 9. Pfad bei deaktiviertem Audio

- **Modus 0** (START.STP `S`=I oder ein unbekannter Wert):
  - 8CB0 kehrt sofort zurück: kein INT 0Fh, kein Kanalreset. CS:E93E bleibt beim Imagewert 0.
  - `csound` läuft deshalb über 5F01: Ein Kanalsatz wird belegt (Typ 2, Priorität, Flags 80h) und bleibt im Speicher.
  - Danach kehrt 87F3 sofort zurück. Es gibt **keine** Port-I/O und keine IVT-Änderung.
  - Auch `cdelsound` (8ADB), der Musik-Stop (8A4D) und der Timer-Geräteaufruf 8BBD enden bei Modus 0 sofort.
  - **Evidenz:** belegt dynamisch (eigene Emulation, beide Profile) und statisch.
- **Befehlszeile `S`** (SS:0CA2=1): `csound`/`cmsound` brechen nach dem Lesen der Operanden und dem Auflösen der Ressource bei 62F7 ab. Es wird kein Kanalsatz belegt und kein Gerät angesprochen. Andere Klangopcodes (`cding`, `cnoise`, Musik) werden von 0CA2 **nicht** abgefragt.
  - **Evidenz:** belegt statisch.

## 10. Unterschiede Ishar 1 ↔ Ishar 2

- Der ganze `csound`-Pfad ist in beiden Spielen **bytegleich**: Handler, Dispatcher, alle Gerätepfade, Treibersegment 1941 und Datenstartwerte (z. B. 1BAC:00D3). Die eigenen Emulationsspuren sind identisch.
  - **Evidenz:** belegt statisch (Hashvergleich der Bereiche) und dynamisch.
- Unterschiede gibt es nur im Konfigurationsmodul (Segment 23D7):
  - Einstieg 23D7:1AFA (I1) vs. 1BCE (I2).
  - Decode EC2..1043 vs. F43..10C4.
  - Erkennung E3E..E61 vs. EA4..EC7, mit AdLib-Timerprobe und SB-Scan 21A..26A.
  - Die Feldregeln sind gleich. Ishar 2 wählt zusätzlich gespeicherte Laufwerke.
  - **Evidenz:** belegt dynamisch (vorhandene Konfig-Tests, beide Profile erneut bestanden).

## 11. Offene Grenzen

1. **Keine Hardware, keine physische DOS-VM.** Die physische DOS-VM des Projekts war nicht zugänglich. Es gab keinen Hörtest und keine echte Interruptlieferung. DOSBox-X wurde für diese Frage nicht eingesetzt, weil es keine Port-Protokollierung ohne Debugger-Build gibt. Alle Frequenzen sind rechnerisch.
2. **FM-Treiberrumpf.** 1941:1C31 ab dem PIT-Warten und der Laufzeit-Tick 93A6 sind nicht emuliert. Die Wechselwirkung mit dem FM-Musiktreiber (1941:0322.., 2666) ist nur über das Flag 86C1 belegt.
3. **SB-IRQ-Probe und -Betrieb.** Die Probe 1941:196E..1A1A und der volle Mischer 1F82 sind unter echter IRQ-Lieferung ungeprüft. Ob nach Programmende bei IRQ 2/3/5 ein Engine-Vektor stehen bleibt und der DSP nicht zurückgesetzt wird, ist statisch nahegelegt, zur Laufzeit aber **offen**.
4. **Speaker-Teilerwahl.** Wer SS:0C9F schreibt und welche Systemtypen SS:2894 annimmt, ist nur über die Konfig-Übernahme belegt. Die Messquelle ist offen.
5. **Ressourcenauflösung 60F6** (inklusive `cmsound`-Weg über das Hauptskript) und Operandsemantik: Nur Lage und Abfolge sind belegt, nicht jede Feldbedeutung.
6. **Unerreichbare Pfade (Abschnitt 7).** Sie wären nur durch Selbstmodifikation oder externe Patches erreichbar. Dafür gibt es keinen Beleg.
7. **Gerätenamen** (PC-Speaker, AdLib/OPL, Sound Blaster, LPT-DAC) sind aus Ports abgeleitet und nicht aus Texten des Originals belegt.

## 12. Reproduktion (lokal, ohne Originalbytes im Repo)

- **Aufnahme:** `python scripts/capture-dos-first-interrupt.py <start.exe-Kopie> <neuer Ordner>`. Die Speicherhashes müssen den Präfixen in Abschnitt 1 entsprechen.
- **Vorhandene Prüfungen (je Profil bestanden):** `check-native-dos-{audio-startup, sample-prepare, speed-clamp, timer-install, timer-complete, timer-stop, audio-pending, audio-resume, timer-tick, audio-sequence, fm-register, audio-clock-stop, audio-device-stop, speaker-record, timer-records, configuration-apply, configuration-detection, startup-configuration-file --apply}.py <memory.bin>`.
- **Aufrufstellen:** `node scripts/audit-original-sound-calls.mjs` mit ISHAR1_DIR/ISHAR1_LISTINGS/ISHAR2_DIR/ISHAR_ACTOR_LISTINGS.
- **Eigene Zusatzspuren:** Unicorn-Aufruf von 1000:87F3 (Modi 0/1/2/3/4) und 1000:5F01 (Modi 0/1). Alle IN-Zugriffe liefern kontrollierte Werte (PIT dekrementierend, sonst 0). Die Spuren liegen nur lokal.
