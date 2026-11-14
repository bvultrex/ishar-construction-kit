# Opcode 75 (cerasen): Grafikdatensatz entfernen – Originaltests und Fixtures

Hoth, 14.11.2026. Ein Verdikt steht je Punkt; es gibt kein Gesamt-Grün. Evidenzstufen: bekannt = known, vermutet = suspected, offen = open (entspricht unknown). Die Vektoren liegen in `opcode75-graphic-record-fixtures/`.

## 0. Korrektur und Abgrenzung

Opcode 75 ist das Byte `0x4B` (`cerasen`) und hat nichts mit Audio zu tun. `csound` ist `0x9D` = 157; sein Dispatch zeigt auf `1000:62BB`. Audio-Fixtures für Opcode 75 wurden nicht angelegt, und keine Audio-Beobachtung dient hier als Beleg.

Hinweis zur Zählung: Die ALIS-C-Referenz nennt `cerasen` „Codopname no. 076“, weil sie ab 1 zählt. Die Dispatch-Tabelle des Originals zählt ab 0 und hat daher Index 75.

## 1. Werkzeuge und Reproduktion

- **Speicheraufnahmen:**
  - Je `start.exe` mit dem Kit-Skript `capture-dos-first-interrupt.py` (Unicorn 2.1.4, Laden bei Segment 1000).
  - Die Präfixe stimmen mit den bekannten Hashes überein:
    - Ishar 1: Exe `3ea63234c97b`, Speicher `5ce2bfdfc836`
    - Ishar 2: Exe `5e35e58d2d13`, Speicher `f8ab017849e5`
  - Die Aufnahmen liegen nur privat.
- **Native Ausführung:**
  - Einstieg `1000:3A84`; der Lauf endet beim RET auf eine Rücksprungmarke.
  - Keine Stubs: Operandenauswertung, Suche, Aushängen und Link-Kette laufen original.
  - Die Datensatzliste, der Kontext und die Globals sind synthetisch belegt, das Skript liefert nur den Operanden.
  - Die Speicherbereiche bekommen eigene, synthetische Segmente.
  - Danach wird auf Änderungen außerhalb der Modellfelder geprüft: Kontextsegment, Datensatzsegment, Skript und SS-Globals ohne Stack.
- **Laufbeleg LOGO:**
  - DOSBox-X 2025.02.01 (Debian-Paket), eigene conf-Kopie, `cycles=fixed 25000`.
  - Eigenes Xvfb: `:98` für Ishar 1, `:96` für Ishar 2. Eine Instanz pro Lauf, danach beendet.
  - Fenstergrab mit 10 fps. Bei Ishar 2 wird nach 9 s die Sprache per xdotool gewählt (KP_3, ca. 150 ms gehalten).
  - Varianten liefen nur an Kopien der Installation. Die Patch-Kopie (**mit Patch**) ändert das LOGO-Bildbyte 0x00F2 (Operand) von 5 auf 7, neu gepackt mit dem Kit-A1-Writer (Readback geprüft).
  - Die sha256 der Arbeitskopien und Originale sind vorher und nachher gleich; die Originale sind unverändert (alle 311 Einträge der bestehenden Hashliste geprüft).
- **Debugger:** Das installierte DOSBox-X hat keinen Debugger. Breakpoints auf `1000:3A84` und Speicherdumps im Lauf waren daher nicht möglich (siehe §6).

## 2. Befund: Dispatch und Ablauf

| Punkt | Befund | Verdikt |
|---|---|---|
| Dispatch | `CS:0024 + 2*75` → `1000:3A84` in Ishar 1 und Ishar 2 | bekannt |
| Ishar-2-Vergleich | Handler 3A84..3AA3, Suche 35CF..35FF, Aushängen 3AFA..3B91, Operand 69A6..69CB und Operandentabelle CS:01F2 sind bytegleich; alle 30 Listenvektoren liefern in beiden Profilen identische Ergebnisse | bekannt |
| Operand | Ein Ausdrucksoperand; gespeichert wird nur DL (Lowbyte) in SS:0C0E, verglichen wird es signed. `oimmw(0x0105)` wirkt wie 5 (E23), `0xFF` wie −1 (E24/E25) | bekannt |
| Suche (35CF) | Start am Kontextkopf BP-0x18. Die Suche setzt eine absteigende Sortierung voraus, erst nach Bildschirm-ID (signed16, Kontextwort BP-0x16), dann nach num (signed8). Bei kleinerer ID oder kleinerer num bricht die Suche ab | bekannt (E19–E22, E26) |
| Schleife | Nach jedem Treffer wird erneut ab dem Kopf gesucht. Ein Aufruf entfernt alle Datensätze mit gleicher (ID, num) | bekannt (E10, E11) |
| Aushängen, Normalpfad | Bei `ferase`=0 und state ≥ 0 wird state auf 1 gesetzt und der Datensatz aus der Kontextliste ausgehängt. Eigenes `next`/`link` bleibt stehen, keine Freiliste, die +6-Kette bleibt unverändert | bekannt (E01–E03, E08, E15, E16) |
| Aushängen, Freilistenpfad | Bei state < 0 oder `ferase` ≠ 0 wird der Datensatz ausgehängt, kommt an den Kopf der Freiliste (SS:0BEC) und wird aus der +6-Kette seiner Bildschirm-ID entfernt (Kopf in Tabelle SS:0BF6 + ID + 2) | bekannt (E12–E14, E17, E27) |
| Flag `ferase` (SS:0BF3) | Wird am Ende jedes Aufrufs auf 0 gesetzt, auch wenn nichts gefunden wurde | bekannt (E17, E18, E30) |
| Fehlender Datensatz / leere Liste | Kein Schreibzugriff außer num-Byte und `ferase`=0 | bekannt (E04–E07, E18, E20–E22) |
| Doppeltes Entfernen | Der zweite Aufruf ist ein No-op | bekannt (E09) |
| Register | SI rückt um die Operandenlänge vor (2 oder 3); DS, SP, ES und BP sind nach RET wie vorher | bekannt |
| Inkonsistente Liste | Liegt ein Datensatz mit state < 0 nicht in seiner +6-Kette, kehrt das Original nicht zurück (Schleife 3B75..3B7B). Aushängen und Freiliste sind dann schon geschrieben | bekannt im Isolat (E28); ob das im Spiel erreichbar ist, ist offen |

## 3. Vektoren

38 Vektoren. Der Checker meldet grün 38, rot 0. Ein Negativtest mit zwei verfälschten Erwartungen ergibt rot 2, Exit 1.

| ID | Fall | Beschreibung | Eingabe | Label |
|---|---|---|---|---|
| E01 | vorhanden-mitte | Vorhandener Datensatz (num 5) in der Mitte, state 0 | oimmb(5) | known |
| E02 | erster | Erster Eintrag (Kopf, num 9), state 0 | oimmb(9) | known |
| E03 | letzter | Letzter Eintrag (num 2), state 0 | oimmb(2) | known |
| E04 | fehlend | Fehlender Datensatz: num 7 liegt zwischen 9 und 5 | oimmb(7) | known |
| E05 | fehlend | Fehlender Datensatz: num 1 kleiner als alle | oimmb(1) | known |
| E06 | fehlend | Fehlender Datensatz: num 12 groesser als alle | oimmb(12) | known |
| E07 | leer | Leere Liste (Kopf 0) | oimmb(5) | known |
| E08 | einzeln | Einziger Eintrag wird entfernt | oimmb(5) | known |
| E09 | doppelt | Doppeltes Entfernen: zweimal num 5 nacheinander | oimmb(5), oimmb(5) | known |
| E10 | duplikat | Zwei Datensaetze mit gleicher num 5: ein Aufruf entfernt beide | oimmb(5) | known |
| E11 | duplikat | Drei gleiche num 5: Liste danach leer | oimmb(5) | known |
| E12 | state-negativ | state 0x80 (negativ): Datensatz wandert in die Freiliste, Link-Kette wird angepasst | oimmb(5) | known |
| E13 | state-negativ | state -1 am Kopf, zugleich Kopf der Link-Kette | oimmb(9) | known |
| E14 | state-negativ | state -1 am Ende, letzter der Link-Kette | oimmb(2) | known |
| E15 | state-positiv | state 1 (bereits markiert): wird erneut nur ausgehaengt | oimmb(5) | known |
| E16 | state-positiv | state 127: Markierung auf 1, keine Freiliste | oimmb(5) | known |
| E17 | ferase | Flag ferase=1 vor dem Aufruf: Freilistenpfad trotz state 0, Flag danach 0 | oimmb(5) | known |
| E18 | ferase | Flag ferase=1, num fehlt: nur Flag wird 0 | oimmb(7) | known |
| E19 | fremder-screen | Gleiche num auf drei Bildschirm-IDs: nur die eigene wird entfernt | oimmb(5) | known |
| E20 | fremder-screen | Nur kleinere Bildschirm-ID vorhanden: Suche bricht ab, nichts entfernt | oimmb(5) | known |
| E21 | fremder-screen | Nur groessere Bildschirm-ID vorhanden: Ende der Liste, nichts entfernt | oimmb(5) | known |
| E22 | unsortiert | Unsortierte Liste: num 2 vor num 5 -> Suche bricht bei 2 ab, num 5 bleibt | oimmb(5) | known |
| E23 | operand | oimmw 0x0105: nur das Lowbyte (5) zaehlt | oimmw(0x105) | known |
| E24 | operand | Vorzeichenbehaftete num: oimmb(-1) findet num -1 hinter num 5 | oimmb(-1) | known |
| E25 | operand | oimmw 0x00FF ergibt dl=0xFF = -1 | oimmw(0xff) | known |
| E26 | screen-vorzeichen | Bildschirm-ID >= 0x8000 (signed negativ), eigener Kontext gleich | oimmb(5) | known |
| E27 | link-mitte | state negativ, Datensatz ist drittes Glied der Link-Kette | oimmb(5) | known |
| E28 | inkonsistent | state negativ, Datensatz fehlt in der Link-Kette (Kette: nur 0x30, link 0): Original haengt in 3B75..3B7B | oimmb(5) | known |
| E29 | folge | Folge: num 5, dann 9, dann 2 -> Liste leer | oimmb(5), oimmb(9), oimmb(2) | known |
| E30 | folge | Folge mit negativem state nach ferase: erst ferase-Pfad, danach Normalpfad | oimmb(9), oimmb(2) | known |
| D01 | dispatch | Dispatch-Tabelle CS:0024, Eintrag 75 (Byte 0x4B) zeigt in beiden Profilen auf 1000:3A84; Eintrag 157 (0x9D, csound) auf 1000:62BB | – | known |
| D02 | ishar2-vergleich | Handler 3A84..3AA3 und Helfer 35CF..35FF, 3AFA..3B91, 69A6..69CB sowie Operandentabelle CS:01F2 sind in Ishar 1 und Ishar 2 bytegleich | – | known |
| L01 | logo-00F0-statisch | LOGO-Modul (entpackt) traegt an Bildoffset 0x00F0 Opcode 75 mit Operand oimmb(5), danach cstop; in Ishar 1 und Ishar 2 gleich | – | known |
| L02 | logo-vorhanden | Im Lauf entfernt Opcode 75 bei 00F0 eine sichtbare Grafik: mit Operand 5 verschwindet sie, in der Kopie mit Operand 7 (mit Patch) bleibt sie dauerhaft stehen | – | known |
| L03 | logo-fehlend | Fehlender Datensatz im Lauf: Operand 7 (mit Patch; keine num 7 vorhanden) fuehrt zu keinem Absturz oder Haenger; LOGO laeuft bis zur Funkelphase weiter | – | known |
| L04 | logo-welcher-datensatz | Der entfernte Datensatz ist die num-5-Grafik aus den drei Zeichenbefehlen bei 0x0081/0x008D/0x0099 (Ressource 11) | – | suspected |
| L05 | logo-wiederholung | Opcode 75 bei 00F0 liegt in der Schleife 0x00BC..0x010C und wird mehrfach ausgefuehrt; ab dem zweiten Aufruf ist kein num-5-Datensatz mehr da (No-op wie E04/E09) | – | suspected |
| L06 | logo-breakpoint | Datensatzliste am Breakpoint 1000:3A84 im echten LOGO-Lauf (vor/nach) | – | open |

Zählung je Fall:
- Datensatzliste (30):
  - vorhanden: Mitte 1, erster 1, letzter 1, einziger 1
  - fehlend 3, leer 1, doppelt 1, Duplikat 2
  - state negativ 3, state positiv 2, ferase 2
  - fremde Bildschirm-ID 3, unsortiert 1, Operand 3, ID-Vorzeichen 1
  - Link-Mitte 1, inkonsistent 1, Folgen 2
- Dispatch/Vergleich: 2
- LOGO-Pfad: 6

Labels: bekannt 35, vermutet 2, offen 1.

## 4. LOGO-Pfad bis 00F0

| Punkt | Befund | Verdikt |
|---|---|---|
| L01 | Das entpackte LOGO-Modul (Ishar 1 und 2) hat an Bildoffset 0x00F0 Opcode 75 mit `oimmb(5)`, danach `cstop` | bekannt |
| L02 | Mit Operand 5 verschwindet eine Funkelgrafik links unten im Schriftzug. In der Kopie mit Operand 7 (mit Patch) bleibt sie dauerhaft stehen: 208 Pixel weichen in allen Frames 200..440 ab (Fenster-Box 146,375–195,412). Gleiche Variante gegen gleiche Variante: 0 Pixel. Je Spiel 2 Läufe pro Variante, Ishar 1 und Ishar 2 identisch | bekannt |
| L03 | Fehlender Datensatz im echten Lauf (mit Patch): Operand 7 führt zu keinem Hänger, das LOGO läuft bis in die Funkelphase weiter | bekannt |
| L04 | Der entfernte Datensatz ist die num-5-Grafik der drei Zeichenbefehle 0x0081/0x008D/0x0099 (Ressource 11) | vermutet (statisch) |
| L05 | 00F0 liegt in der Schleife 0x00BC..0x010C. Ab dem zweiten Aufruf ist vermutlich kein num-5-Datensatz mehr vorhanden, der Aufruf also ein No-op wie in E09 | vermutet (Aufrufzahl nicht gemessen) |
| L06 | Datensatzliste vor und nach `1000:3A84` im echten LOGO-Lauf | offen |

## 5. Kit-Abgleich

Im lokalen Clone (Kit-Stand `319819c`) gibt es keine Implementierung von `cerasen`/Opcode 75. Eine Kit-Probe gegen diese Vektoren ist daher nicht anwendbar; erst eine Kit-Implementierung kann sich am Checker-Modell messen. Die bestehenden 250 Vektoren sind unverändert.

## 6. Offen und Grund

- **L06:** DOSBox-X ohne Debugger, daher kein Breakpoint und kein Speicherauszug im Lauf. Möglich wäre ein Debug-Build von DOSBox-X oder die Weiterführung der nativen LOGO-Ausführung im Kit (bisher Stopp ab LOGO00A5).
- **L04/L05:** Welcher Datensatz entfernt wird und wie oft der Befehl aufgerufen wird, ist nur statisch abgeleitet.
- **E28:** Ob die inkonsistente Liste im Spiel erreichbar ist, ist offen.
- Weitere Aufrufstellen von Opcode 75 (Ishar 1: 262, Ishar 2: 173 laut Listings) wurden im Lauf nicht geprüft.

## 7. Bereinigung

- Öffentlich sind nur synthetische Adressen und Werte, Hash-Präfixe mit höchstens 12 Zeichen sowie Fensterkoordinaten.
- Es gibt keine Originalbytes, Dumps, Bilder oder Assets, keine Namen, keine Save-Werte und keine Party-Positionen.
- Das Audit `audit-no-original-bytes.py` vergleicht gegen alle Originale, beide Speicheraufnahmen und die Patch-Kopien von LOGO.IO; Ergebnis: 0 Treffer.
- Zusätzlich von Hand durchgesehen: README, Bericht und Vektordatei.
