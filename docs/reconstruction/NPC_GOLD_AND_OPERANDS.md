# NPC-Goldübergabe und DOS-Operandenregister

Stand 2026-10-17. Teilrekonstruktion von Ishar 2, keine vollständige Interaktion oder Kampfimplementierung.

## Korrektur der bisherigen Arbeitshypothese

Die EATT-Bestätigung an MAIN 0x442A+Slot wird im untersuchten Pfad durch FRISE nach einer Goldübergabe geschrieben. Eine direkte MESSAGE-Rückmeldung war eine unbestätigte Arbeitshypothese und wurde nicht gefunden. MESSAGE enthält Textauswahl; der positive EATT-Signalpfad ist deshalb kein bereits vollständiger Dialoghandshake. Andere Schreiber und alternative Interaktionen bleiben separat zu untersuchen.

## Nachgewiesene Codezuordnung

Lokales DOS-FRISE.IO SHA-256 `27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64`.

- Image 0x046AC–0x04756: Akteurslot aus Parameterbyte 0x0D der zuvor ausgewählten visuellen Entity lesen. Wenn ausgewählte Tausender oder Restgold positiv sind: Charaktergold subtrahieren, beide Charakterfelder zurückschreiben, Akteursgold addieren, beide Akteursfelder schreiben, dann Bestätigung auf 1 setzen.
- Image 0x06865–0x0689B: Zweiwort-Goldaddition mit Übertrag ab Rest >999.
- Image 0x0689C–0x0693D: Vergleich, Subtraktion und Borgen. Fehlende Deckung setzt lokales Flag 0x41; dieser isolierte NPC-Unterpfad prüft es anschließend nicht und schreibt dennoch das unveränderte Charaktergold sowie die Akteursgutschrift. Das wird im Trace erhalten, nicht durch eine erfundene Transaktionsregel ersetzt. Die vorgeschaltete Auswahl/Begrenzung des Goldbetrags ist noch nicht vollständig portiert.

MAIN: Charakter-Tausender 0x2D68+2*Platz, Charakterrest 0x2D80+2*Platz; Akteurs-Tausender 0x378A+2*Slot, Akteursrest 0x3868+2*Slot; Bestätigung 0x442A+Slot. Zugriffe sind signed16 für Gold und Byte für Bestätigung. Platz 0–4 und Actor 50–109 sind die derzeit unterstützten Toolkitbereiche.

Implementierung: `src/lib/ishar/original-npc-gold.ts`. `originalNpcGoldTransfer` erhält bereits aufgelösten Actor, Gruppenplatz, Betrag und expliziten MAIN-Zustand. Ausgabe sind geordnete Schreiboperationen plus Deckungsflag. Kein Save-/MAIN-Puffer wird verändert, keine Auswahl- oder Interaktionslogik erfunden. Wortüberläufe werden nach jeder gespeicherten Rechenoperation als signed16 erhalten.

## Behobener Fehler im Ausdrucksinterpreter

ALIS-Referenz: `alis.c:readexec_opername_saveD7`, `opernames.c:opile`, `osub`, Vergleiche und die signed16-Felder varD6/varD7 in `alis.h`. Binäre Operationen sichern D7 nach D6 und lesen dann den nächsten Operanden. `opile` setzt D7 auf den bisherigen D6-Wert und D6 auf den Stapelwert. Dadurch ist beispielsweise `a push b osub(opile)` gleich a-b. Unser älterer Interpreter behandelte opile als einfachen Wert-Pop und vertauschte hier die Subtraktion beziehungsweise Vergleichsrichtung. Vergleiche liefern außerdem original -1/0, nicht 1/0.

`original-alis-expression.ts` bildet diese Registerabläufe, signed16-Ergebnisse, Division/Modulo, boolesche Werte und die unterstützten Speicher-/Zufallsoperanden ab. Der bestehende Figurenskriptinterpreter nutzt diesen gemeinsamen Kern. Ressourcen, Strings, vollständige VM und weitere Opcodes sind damit nicht behauptet. Tabellenzugriff ist ein expliziter Callback; die bisherige Figurenskriptintegration verwendet weiterhin ihren eindimensionalen Teilumfang.

## Reproduktion und Grenzen

```powershell
npm run test:original-alis-expression
npm run test:original-npc-gold
$env:ISHAR2_DIR='E:\Spiele\Ishar2'
$env:ISHAR_ACTOR_LISTINGS='<lokaler Ishar-2-Listingordner>'
npm run test:original-npc-gold-local
npm run test:original-actor-frame
```

48 Operandenpaare mit direkter und stapelbasierter Rechnung/Relation, native boolesche Werte, Wortüberläufe und die konkrete FRISE-Borgexpression wurden geprüft. Die lokalen GOLEM1/WIZARD1/AVEUGLE5-Tests einschließlich Leerlauf und Wizard-Nachricht 21 laufen weiter. Goldtests prüfen Übertrag, Borgen, exakte Tausender, unzureichende Deckung, Schreibreihenfolge, Quellschutz und FRISE→EATT als komponierten Trace. 50 Instruktionspräfixe der betreffenden FRISE-Bereiche passen zur per Hash identifizierten Originaldatei. Präfixabgleich ist kein vollständiger Bytecode- oder Verhaltensvergleich.

Originalausführung dieses Ablaufs ist nicht geprüft. Kein neuer NPC-Klickpfad oder Goldtransfer wurde im Playtest aktiviert. Vollständige Goldauswahl, Entityauflösung, Sprach-/Textrouting, Ein-/Ausgabe und Rückwirkungen weiterer NPC-Typen bleiben offen. Ishar 1 ist hier nicht verifiziert.

## Goldauswahl vor Übergabe (weiterer Zwischenstand)

`original-gold-selection.ts` rekonstruiert die Rechenzweige aus FRISE 0x044CD–0x046A4 sowie den expliziten Alles-Auswahlwert aus 0x0426E–0x042A3. Eingaben sind originale logische Mauskoordinaten und ein expliziter transienter Auswahlzustand, keine Browserpixel oder erfundene neue Bedienregeln.

Im Originalpfad gilt für die Pfeilzeile 82 < y <= 98: Erhöhen bei 183 < x < 195, Verringern bei 220 < x < 232, Beenden bei 231 < x < 256. Button 2 beendet; andere Werte als 1/2 setzen Schrittweite auf 1 und Wiederholungszähler auf 0. Ein gedrückter linker Button außerhalb der Rechenbereiche setzt die Wiederholungswerte nicht zurück. Anfangsbetrag ist null, Schrittweite 1; der Zähler 0x010C wird am Eintritt nicht gesetzt und muss deshalb explizit übergeben werden.

Erhöhen nutzt die originale Zweiwortaddition und übernimmt nur Ergebnisse <= Charakterguthaben, ohne Clamp. Verringern nutzt die originale Subtraktion. Bei fehlender Deckung bleibt die Auswahl unverändert, kann aber trotzdem den Wiederholungszähler erhöhen. Vor Erhöhung des Zählers wird bei >=25 die Schrittweite (solange <100) verzehnfacht und der Zähler auf 0 gesetzt. Deshalb addiert Aktion 26 noch den alten Schritt und erhöht erst anschließend die Schrittweite.

Die Funktion bildet noch nicht das gesamte Goldfenster ab: Gruppenaufteilung, Ziele unter dem Mauszeiger, Grafikaufrufe, zusätzliche Scheduler-Yields, Auswahlbereinigung und Ereignisweiterleitung sind nicht integriert. `selectAllOriginalGold` ist die getrennte ursprüngliche Alles-Auswahl; der entsprechende obere Mausbereich wird von der Pfeilfunktion nicht als vollständig implementiert ausgegeben.

```powershell
npm run test:original-gold-selection
# Mit denselben ISHAR2_DIR/ISHAR_ACTOR_LISTINGS wie oben:
npm run test:original-gold-selection-local
```

Der lokale Test bindet FRISE an denselben Quellhash und vergleicht 118 Instruktionspräfixe. Ein begrenzter Listing-Auswerter führt die ursprünglichen Rechenzweige bis zum Scheduler-Yield oder Austritt aus: 90 Kombinationen aus Betrag, Schrittweite, Zähler und Richtung stimmen mit der strukturierten Rekonstruktion überein. Beide Pfade verwenden denselben Operandenregisterkern; dies ist kein unabhängiger VM- oder Originalausführungsbeweis. Zusätzliche synthetische Tests prüfen Mausgrenzen, Loslassen, Beenden, Guthabenlimit, Alles-Auswahl und unveränderten Eingabezustand. Der Operandenregisterkern unterstützt nun auch die hier benötigten `olocb`/`olocw`-Zugriffe.
