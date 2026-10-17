# DOS-ALIS-Entityverwaltung: Referenzrekonstruktion

Stand 2026-10-17. Gemeinsame Komponente für die lokalen alten DOS-ALIS-Profile; keine vollständige Engine und kein nativer Ausführungsnachweis.

## Belege und Grenzen der Herkunft

Grundlage ist die lokale separate ALIS-C-Referenzimplementierung: `alis.h:sScriptLoc`, `alis.c:alis_load_main`, `script.c:script_live`, `opcodes.c:clivin/cfindtyp/cfindcla`. Diese ist kein dekompilierter Silmarils-DOS-EXE-Quelltext. Semantische Gleichheit mit der nativen Engine bleibt zu prüfen. Originale MAIN-Header beider Spiele liefern die unten angegebenen Kapazitäten; die bereits inventarisierten Quellhashes gelten weiterhin.

Implementierung: `original-alis-entities.ts`, `original-alis-vm-specs.ts`, `original-entity-hit.ts` und `original-actor-entity.ts` in `src/lib/ishar`.

## VM-Spezifikationen

Die 16 unkomprimierten MAIN-Hüllbytes ab Dateioffset 6 werden als LE-Werte gelesen: u16 Modultabellenplätze, u16 Entitytabellenplätze, u32 unbekannt, u32 VRAM-Rahmen, u32 rohe Allokationseinheiten. Beide lokalen MAINs enthalten 60 Modulplätze, 50 Entityplätze, unbekannt 4000000 und 500 rohe Einheiten. VRAM-Rahmen: Ishar 1 24000, Ishar 2 31000. Die letzte Größe wird in der C-Referenz weiter verarbeitet; sie wird hier nicht als Zahl sichtbarer Sprites behauptet. Der Reader ändert keine Headerbytes.

## Handles, Verkettung und Vererbung

Der Referenz-Entitytabellensatz hat sechs Bytes: 32-Bit-VRAM-Zeiger und 16-Bit-Nachfolger. Root ist Handle 0; weitere Handles sind 6, 12, 18 usw. `DosAlisEntities` bildet die Verkettung ab und verwaltet VRAM als getrennte normalisierte Bytepuffer, ausdrücklich nicht als native DOS-RAM-Adressen. MAIN beginnt als Root, weitere freie Plätze werden aufsteigend vergeben. `spawn` fügt die neue Entity direkt nach dem Aufrufer ein. Mehrere vom selben Aufrufer erzeugte Entities erscheinen deshalb in umgekehrter Erzeugungsreihenfolge. Verschachtelte Aufrufer behalten ihre Einfügeposition.

Der alte DOS-`clivin`-Pfad kopiert genau die ersten elf positiven VRAM-Bytes des Aufrufers. Neue Form ist -1, Spiegelung aus; Klassenbyte 0x0C und Actorparameter 0x0D werden nicht mitgeerbt. VRAM-Worte sind im Toolkit BE-normalisiert wie die Save-/Operandenschnittstellen; keine Host-Endianness-Behauptung. Snapshots enthalten Kopien statt veränderbarer interner Puffer.

Klassen-/Typensuche schließt den Aufrufer aus und folgt der Live-Reihenfolge. Negative `cfindtyp`-Operanden werden wie in der Referenz auf das niedrige Byte beschränkt; Klassensuche vergleicht Byte-Bitmuster. Erster Treffer oder alle Treffer sind explizit wählbar. Die Kommando-/Ergebnislisten- und Schedulerzustände der vollständigen VM sind damit noch nicht implementiert.

Grenzen werden kontrolliert: ungültige Handles, Größen, Wort-/Bytewerte und VRAM-Zugriffe scheitern. Ein voll belegtes Modell liefert -1. Das ist eine Toolkit-Grenzsicherung, kein Nachweis des nativen Verhaltens bei überlaufender Entitytabelle. Modulgrößen unter 14 Bytes werden in diesem Teilmodell noch nicht unterstützt. Es gibt noch kein `ckill`, keine RAM-Kompaktion, keinen vollständigen Modul-/Heap-/Audio-Lebenszyklus.

## Formtreffer und Figurenskript-Adapter

`originalEntityFormHit` nimmt den Queryhandle und die Originalformressourcen aller aktiven Module. Es nutzt die Live-Liste, niemals die nach Entfernung sortierte Zeichenliste. Kontextwort bei VRAM+6, Koordinaten, Spiegelung und aktive Form werden explizit gelesen. Fehlende aktive Formressourcen scheitern; sie werden nicht übersprungen, um ein dahinter liegendes Ziel auszuwählen. Dies bleibt der dokumentierte referenzbasierte erste Treffermodus.

`applyOriginalActorEntityFrame` verlangt eine vorhandene Klasse-35-Entity mit passendem Actorbyte 0x0D. Erst dann überträgt es die laufenden Originalskriptkoordinaten und Form-/Spiegelzustände. Unterschiedliche Entityhandles und gespeicherte Actor-IDs bleiben getrennt. Ein Frame ohne aktive Form löscht die Trefferform; sichtbar bedeutet nicht automatisch anklickbar.

## Tests und Reproduktion

```powershell
npm run test:original-alis-entities
$env:ISHAR1_DIR='E:\Spiele\Ishar1'
$env:ISHAR2_DIR='E:\Spiele\Ishar2'
$env:ISHAR_ACTOR_LISTINGS='<lokaler Ishar-2-Listingordner>'
npm run test:original-alis-entities-local
```

Synthetisch geprüft: Handles in Sechserschritten, Einfügen nach verschiedenen Aufrufern, Vererbung von exakt elf Bytes, Initialform/Spiegelung, Klassen-/Typensuche, Selbstfilter, Kapazität, atomare fehlerhafte Wortänderung, Snapshot-Isolation und Formtreffer nach Live-Reihenfolge trotz anderer Tiefenreihenfolge.

Lokale MAINs: Headerwerte gelesen, je 49 zusätzliche Entities angelegt, 50er-Kapazität und Listenreihenfolge geprüft, Quelldateien unverändert. SOURIS-/GOLEM-Formressourcen ergeben einen Treffer auf einen Livehandle, dessen Byte 0x0D auf Actor 53 zeigt. Das ist eine ausdrücklich initialisierte Testszene, keine kanonische Originalplatzierung.

Das originale GOLEM1-Listing aktiviert im unveränderten START-Zustand für Actor 53 keine Form. Der Test prüft diese Abwesenheit, setzt nur in einer kopierten MAIN-Abbildung explizit negativen Zustand und erhält dann Form 0 aus dem Skript. Der Frame kann die passend gebundene Entity aktualisieren und von der SOURIS-Query getroffen werden. Falsche Actorbindung wird ohne Änderung abgewiesen; Entfernen der Form entfernt den Treffer.

Offen: vollständige Original-Initialisierung und alle Entityklassen, Heap-/Kontextadressen, Beenden/Neuanlegen, Scheduler und Nachrichten, Original-Mauskoordinatenadapter und Eingabeablauf. Der Browser verwendet dieses Teilmodell noch nicht als vollständige Entity-VM; automatische NPC-Aktionen sind nicht dadurch freigegeben. Gegen eine echte DOS-Ausführung wurde es noch nicht verglichen.

## Strukturelles Entfernen (2026-10-17)

`removeStructure(handle,current)` bildet ausschließlich das Ausketten aus `opcodes.c:killent` (ab Zeile 6833 der lokalen C-Referenz) ab: Vorgänger zeigt auf Nachfolger; nur der gewählte Eintrag wird entfernt; der freie Handle kommt vor alle bisher freien Plätze. Nachfolger, auch vom entfernten Skript angelegte Entities, bleiben erhalten. Beim nächsten `spawn` wird der Handle mit frisch initialisiertem Zustand wiederverwendet. Handles sind daher keine dauerhaften Objektidentitäten; gespeicherte externe Handles müssen beim Lebenszykluswechsel erneut validiert werden.

Wird die laufende Entity entfernt, liefert die Methode den Vorgänger als neuen `current` sowie `restartLoop=true` und `stopCurrent=true`. Dies sind Rückgabedaten für einen künftigen Scheduleradapter, keine bereits ausgeführten Scheduleraktionen. Bei anderen Entities bleibt `current` erhalten. MAIN-Entfernung und ungültige Handles werden ohne Mutation abgewiesen; das sind ausdrücklich Toolkit-Grenzen, kein belegtes natives Fehlerverhalten.

Nicht enthalten: Musikende abwarten, `cerasall`, kompaktierter DOS-Heap, Zeigerkorrekturen, vollständige negative Kontextdaten oder `cstop`-Ausführung. Die Methode heißt deshalb nicht `killent`. Diese Ergänzung bleibt referenzbasiert und noch ohne DOS-Vergleich.

Tests decken Kopf/Mitte/Ende, laufende/nicht laufende Entity, erhaltene Nachfolger, Freiliste vor unbenutzten Plätzen, LIFO-Wiederverwendung, Zustandsreset, abgewiesene Eingaben und das Verschwinden eines alten Formtreffers ab.

## Ishar-2-EAFF-Aufräumroutine

`original-eaff-cleanup.ts` bindet die strukturelle Entfernung an den konkreten Originalpfad EAFF 0x003A..0x005F. Originaldatei EAFF.IO SHA256 `6ab9102e2566617a9e7511ae1503f3302db1e81ea006081f3bb76d08835957ab`, Modul 13. Der Test vergleicht den gesamten 38-Byte-Block direkt mit dem entpackten Original; optional auch mit dem Listing. Damit ist die verwendete Skriptfolge direkt belegt, die Opcodeausführung bleibt aus der C-Referenz rekonstruiert.

Der Originalpfad führt `clistent` aus, prüft bis zum -1-Sentinel das Klassenbyte +0x0C auf 35, ruft gegebenenfalls `ckill` auf und geht über `csuccent` weiter. Referenz `clistent` kopiert vorab alle Nicht-Root-Handles in die Ergebnisliste (einschließlich Aufrufer); es ist keine rekursive Elternsuche. Der Adapter verwendet deshalb eine unveränderliche Handleliste. Alle Klasse-35-Entities werden in dieser Reihenfolge strukturell entfernt, unabhängig von Modul-ID/Actor-ID. Andere Klassen bleiben erhalten. Einen selbst als Klasse 35 markierten EAFF-Aufrufer weist der Adapter vor Änderungen ab, weil dessen Schedulerabbruch hier nicht ausgeführt wird.

Kein vollständiger EAFF-Gebietswechsel: Bildschirm-/Linkzustand, native `ckill`-Nebenwirkungen, erneute Actorauswahl/Erzeugung und Scheduler fehlen. Keine Aktivierung in der Browserlaufzeit und keine Ishar-1-Zuordnung behauptet.

Reproduktion: `node scripts/check-original-eaff-cleanup.mjs`; mit `ISHAR2_DIR` erfolgt der direkte Originalbytevergleich, mit `ISHAR_ACTOR_LISTINGS` zusätzlich der Listingvergleich. Synthetische Tests prüfen Klassenfilter, Wurzel-Ausnahme, erhaltene Nachfolger, Entfernen mehrerer Einträge ohne Überspringen und Freilistenreihenfolge.

## Ishar-2-EAFF-Initialisierung nach clive

`original-eaff-placement.ts:initializeOriginalEaffActor` rekonstruiert EAFF 0x099A..0x09E8 (gleiche EAFF.IO-Prüfsumme wie oben). Ein lokaler Test prüft den vollständigen 79-Byte-Block direkt gegen das entpackte Original. Eingaben sind ausdrücklich EAFF-Lokalwerte, keine frei interpretierten Kartenkoordinaten: +0x10 Basis-X, +0x1A lateraler Wert, +0x1E Divisor, +0x0E Tiefe, +0x12 Höhe und Byte +0x16 Actor-ID.

Bei Handle -1 überspringt der Originalzweig alle Stores. Sonst schreibt er in das Ziel: Wort +0 = Basis-X + trunc(signed16(lateral*10)/divisor) mit signed16-Zwischenschritten; Wort +2 = Tiefe-1; Wort +4 = Höhe; Byte +13 = Actor-ID; Byte +12 = 35; Byte +9 = 38. Der gemeinsame Operandeninterpreter verarbeitet die beiden Rechenausdrücke einschließlich Stack-/Registersemantik. Der Adapter setzt weder Form noch Spiegelung, weil dieser Block dies nicht tut. Die Bedeutung von Byte +9 wird hier nicht weiter behauptet.

Ungültige Eingaben, fehlender Zielhandle oder Division durch null werden vor Schreibzugriffen abgewiesen; diese kontrollierten Fehler sind Toolkit-Grenzen. Die originale Fehlerbehandlung ist nicht belegt. Vorhergehende Soundzustände 0x0986..0x0999, Auswahl des clive-Moduls, Elternkontext und Scheduler sind nicht Teil dieser Funktion. Kein vollständiges EAFF und keine native Ausführungsprüfung.

Test: `node scripts/check-original-eaff-placement.mjs`, mit `ISHAR2_DIR` zusätzlicher Originalbytevergleich. Geprüft sind sechs Stores, negative Division, signed16-Überlauf, fehlgeschlagenes clive und unveränderter Zustand bei ungültigen Eingaben. Komposition: Initialisierung -> passender Actorframe -> EAFF-Entfernung -> wiederverwendeter Handle lehnt den alten Actorframe ab.

## EAFF-Modulauswahl einschließlich Nebenwirkungen

`original-eaff-spawn.ts:chooseOriginalEaffSpawn` führt den begrenzten Listingbereich 0x061D..0x0985 aus und stoppt vor 0x0986. Grundlage: gleiche hashgebundene Ishar-2-EAFF.IO. Der lokale Test prüft 154 Instruktionspräfixe gegen Originalbytes; Switchzeilen enthalten verkürzte Byteanzeigen, deshalb ist dies kein vollständiger Bytevergleich aller Switchtabellen. Separate Handerwartungen prüfen sämtliche 128 nichtnegativen Typwerte einschließlich Default/Leerfälle und die Sonderplätze 50, 51, 52. Kein DOS-Ausführungsnachweis.

Ergebnis: gewählte Modul-ID oder null, der finale laterale Lokalwert, geordnete MAIN-Schreibzugriffe und besuchte Skriptadressen. MAIN wird nicht verändert. `clive` ist ein Erzeugungsauftrag, keine erfolgreiche Allokation. Fehlende MAIN-Daten, Arraydeklarationen, unbekannte Opcodes, ungültige Sprünge oder Budgetüberschreitung führen zu einem Fehler statt Ersatzmodellen. Die unterstützten Befehle bleiben auf diesen Bereich beschränkt; dies ist keine vollständige ALIS-VM.

Sonderplätze 50/51/52 wählen Module 35/136/139 und setzen lateral auf null. Reguläre Typen lesen MAIN-Tabelle 0x3D2E. Mehrere Fälle überschreiben lateral, andere erhalten den vorherigen Wert. Typ 28 schreibt MAIN 0x51CB=0. Typ 43 erzeugt Modul 118 und setzt zuerst Zustand 0x43BA[Actor]=0; findet sich unter den fünf Gruppenplätzen kein lebendes Mitglied (Wort 0x2D5C >0) mit Inventarwort -30 in Spalte 14 der Tabelle 0x2D8E, folgt Zustand -2. Der Byte-Stride 30 und alle verwendeten eindimensionalen Deklarationen werden im Original-MAIN geprüft. Die Bedeutung des Gegenstands -30 wird hier nicht erfunden.

Die Schritte davor (Sichtbarkeits-/Entfernungsselektion und lateraler Eingangswert) sowie Audio ab 0x0986, tatsächliches Laden/Erzeugen und Scheduler sind weiterhin offen. Der Browser verwendet weiterhin seine vorherige Teilintegration; dieser Adapter ersetzt nicht stillschweigend die vollständige Laufzeit. Ishar 1 ist nicht auf diesen Ishar-2-Pfad umgestellt.

Reproduktion: ISHAR2_DIR und ISHAR_ACTOR_LISTINGS setzen, dann `npm run test:original-eaff-spawn-local`. Zusätzlich geprüft: negative/positive laterale Overrides, Typ-43-Inventargate am letzten Gruppenplatz und mit totem Gruppenmitglied, unveränderte MAIN-Daten, fehlende Daten sowie Komposition Modulauswahl -> originale GOLEM1-Modulmetadaten -> Entity-Initialisierung. Aufräumen/Initialisierung sind nun ebenfalls über `test:original-eaff-cleanup` und `test:original-eaff-placement` aufrufbar.

## Geometrische Vorauswahl und Blickrichtungsänderung

`original-eaff-view.ts` rekonstruiert die Einzelkandidaten-Prüfung aus EAFF 0x60..0x2DA und den Helfer 0xBA5..0xC87. Vorbedingungen: derselbe Szenenbytewert und positives signed16-HP-Wort. Die Differenzen zwischen Actor-Wortkoordinaten und Spieler-Bytekoordinaten werden in signed8-Lokalfeldern gespeichert; der Sichtkegel reicht von Distanz 0 bis 5 mit |lateral| <= Distanz. Blickrichtungen 1/2/3/4 entsprechen -Spalte/+Zeile/+Spalte/-Zeile, mit seitlicher Umkehr für 3 und 4. Dieses Ergebnis ist geometrisch, kein Beweis tatsächlicher Sichtbarkeit.

Vor der späteren Platzierungsroutine ruft EAFF den Orientierungshilfspfad auf. Auf Karte 1 ändert er nichts. Auf anderen Karten bestimmt die dominante Koordinatendifferenz die neue Orientierung; bei gleichen Absolutbeträgen wird die Spielerorientierung übernommen. Bei exakt gleicher Position bleibt die gespeicherte Orientierung unverändert. Der Adapter gibt den Wert und einen Schreibindikator zurück, damit die spätere VM den MAIN-Wortzugriff nach 0x35CE[Actor] geordnet ausführen kann. Der reine Filter schreibt nicht in Save oder MAIN.

Korrektur im bestehenden `actorViewCandidate`: Die alte Prüfung verglich auf allen Nicht-1-Karten direkt die gespeicherte Actororientierung. Sie konnte gültige Kandidaten verwerfen. Nun wird die vom Original vorher berechnete Orientierung verwendet. Der anschließende Orientierungscheck und der Distanzversatz +1 gelten entsprechend dem Switch 0x2EA nur für Karten 2..7. Karte 4 benötigt darüber hinaus ihre Höhenprüfung; diese und weitere Verdeckung bleiben separate offene Schritte. Keine vollständige Geländesichtbarkeit behauptet.

`test:original-eaff-view` prüft vier Richtungen, Diagonale, gleiches Feld, Szene/HP/Reichweite und signed8-Trunkierung. Mit ISHAR2_DIR und ISHAR_ACTOR_LISTINGS werden 110 Instruktionspräfixe direkt geprüft. 432 geometrisch gültige Fälle werden mit begrenzter Ausführung des tatsächlichen Helferlistings verglichen; dabei wird der gemeinsame Operandeninterpreter verwendet, es ist kein unabhängiger DOS-Nachweis. Bestehende Save-Actor- und Figurenframe-Tests prüfen die Integration. Kandidatenscans, Aufrufreihenfolge, Terrain, Verdeckung und tatsächliche Entityerzeugung sind damit noch nicht vollständig rekonstruiert.

## Perspektiv- und Höhenstaffeln aus EAFF ausgeführt

`original-eaff-perspective.ts` wertet 0x037C..0x04C7 und die Höhenhelfer 0x09E9..0x0BA4 aus dem bereitgestellten Listing aus. Die zuvor hart eingetragene Fünferstaffel in `original-actor-frame.ts` wurde durch diese Auswertung ersetzt; der bestehende CONT1-Pfad bleibt auf die bisher unterstützten Skripte und expliziten lateralen Overrides begrenzt. Keine Aktivierung unvollständiger anderer Kartenpfade.

Der Aufrufer liefert geometrische Distanz und lateral. Karten 2..7 erhöhen die Distanz vor dem 99er-Schlüssel um eins; alle anderen nicht. Der originale Switch liefert Höhe, lateralen Multiplikator und Divisor. Nicht passender Schlüssel führt ausdrücklich zum Original-Default (Höhe 1, Basis-X 1, Divisor 10), nicht zu einer erfundenen Näherung. Karten außer 3/4 ziehen anschließend fünf von der Tiefe ab. Der bereits rekonstruierte Initialstore zieht später ein weiteres Eins ab.

Karte 4 verlangt zusätzlich die signed8-Höhendifferenz aus der vorherigen Geländetabellenabfrage. Diese Tabelle wird hier noch nicht gelesen; ein fehlender Eingangswert wird abgewiesen. Die Originalhelfer staffeln den vertikalen Zuschlag nach Entfernung und Absolutbetrag dieser Differenz. Werte ohne Switchfall erzeugen keinen Zuschlag. Terrain-/Orientierungsgates vor 0x037C, Verdeckung, Crowd-Zuordnung/Zufall ab 0x04C8 und tatsächliches Laden/Erzeugen bleiben separate Schritte. Eingaben außerhalb des geometrischen Kandidatenbereichs werden als Toolkit-Grenze abgewiesen.

Reproduktion: `npm run test:original-eaff-perspective-local` mit ISHAR_ACTOR_LISTINGS, optional ISHAR2_DIR für direkten Ressourcenvergleich. 354 Erwartungsfälle: Karten 1..7, Distanzen 0..5, Seitenwerte im Sichtkegel, Höhen -8..8 einschließlich Default/fehlender Eingabe. 112 Instruktionspräfixe gegen lokale EAFF.IO geprüft; Switchpräfixe sind weiterhin keine vollständige Binärprüfung ihrer Tabellen. Original-Figurenskripte/Distanzressourcen und vorhandene resumierbare Animationstests bestehen nach der Integration. Keine native DOS-Ausführung oder Bildgleichheit hierdurch nachgewiesen.

## Crowd-Verteilung und oprnd

`chooseOriginalEaffSpawn` kann mit explizitem `EaffCrowdInput` nun bereits bei 0x04C8 beginnen und Crowd-Verteilung und Modulauswahl in einer zusammenhängenden Ausführung verfolgen. Ohne Crowdargument bleibt der bisherige Einstieg 0x061D erhalten. Die spätere VM muss die geordneten MAIN-Schreibtraces selbst anwenden; der Adapter verändert die Eingangsdaten nicht.

Das Original verwendet vorne (Karte 1: Distanz 1/lateral 0; andere Karten: Distanz 0/lateral 0) drei MAIN-Byteplätze 0x4B80..0x4B82. Zuerst wird eine bestehende Actorzuordnung gesucht. Neue Zuordnungen verwenden Mitte, dann links, dann rechts. Links entsteht -90+ornd(20), rechts 90-ornd(20), Mitte 0. Sind alle Plätze belegt und die Figur noch nicht zugeordnet, bleibt der initiale laterale Wert erhalten. Kein erfundener vierter Platz. Random ist explizit einzuspeisen; fehlt die Quelle auf einem tatsächlich ausgeführten ornd-Pfad, wird abgebrochen. Die vollständige Initialisierung/Freigabe dieser drei Plätze außerhalb dieses Blocks ist weiterhin zu rekonstruieren.

Andere Positionen verwenden oprnd mit Actor-ID als Stackseed: Karte 4 -50+2*oprnd(50), sonst -80+4*oprnd(40). `original-alis-expression.ts` bildet den Referenzoperator `opernames.c:oprnd` ab: unsigned16-Seed um zehn Bits rotieren, mixed=unsigned16(rotated*0x7AB7-0x077F), Ergebnis high16(unsigned16(bound)*mixed), signed16-Register. Das verbraucht genau einen Stackwert und keinen transienten RNG-Zustand. Grundlage ist die separate C-Referenz, kein dekompilierter DOS-EXE-Nachweis.

Der gesamte kombinierte Block läuft vor späteren lateralen Overrides. Auch wenn z.B. ein Typ lateral nachträglich auf null setzt, muss der vorherige ornd-Aufruf für die RNG-Reihenfolge erhalten bleiben. Dies ist explizit getestet. MAIN-Array 0x4B80 wurde bei Original-MAIN 0x023B als eindimensionales Bytearray verifiziert; 40 zusätzliche EAFF-Instruktionspräfixe gegen Originalbytes geprüft.

Tests: alle 65536 Seedbitmuster des oprnd-Operators gegen getrennte BigInt-Arithmetik; 180 Actor-/Kartenkombinationen der deterministischen Verteilung; Zentrum/links/rechts, Wiederverwendung, volle Plätze, erforderliche RNG-Quelle und RNG-Verbrauch vor Override. `test:original-alis-expression` und `test:original-eaff-spawn-local`. Dies ist noch keine native Ausführung und noch keine neue Browser-Crowdaktivierung. Scheduler, slot lifecycle und vollständige Sichtbarkeits-/Heapintegration bleiben offen.

## Crowd-Lebenszyklus außerhalb EAFF

`original-crowd-lifecycle.ts` bildet drei explizit abgegrenzte Effektblöcke als caller-angewandte MAIN-Bytewrites ab. Dies ist kein zusätzliches Belegungssystem und kein vollständiger Bewegungs-/Kampfinterpreter.

- GERDEP 0x13D5..0x1410 schreibt sechs Nullen: 0x4B80/81/82 sowie 0x4AA9/AD/B5. Die letzten drei Bytes werden ohne weitere Bedeutungsannahme erhalten. Original-GERDEP.IO SHA256 `58d2c57ff3eb8318ac73512d5a89292477fbcc892a4ceb6d75bf7de58b88da4b`; der komplette 60-Byte-Block ist direkt geprüft. Der Ablauf beginnt zuvor bei 0x13AF mit Aufwecken der Klasse-33-Entities. Aufrufe u.a. 0x682 und 0x6CC folgen im Original einer erfolgreich geprüften Spielerbewegung und Koordinatenänderung. Diese Wrapper sind nicht mitimplementiert. Nicht als pauschalen Redraw-/Drehungsreset verwenden.
- EDPLT 0x290..0x30A reserviert nach seinen vorausgehenden Bewegungs-/Kollisionsgates einen Platz: vorhandene Actor-ID unverändert lassen, sonst Mitte/links/rechts, bei voller Tabelle keine Änderung. 19 Instruktionspräfixe direkt gegen EDPLT.IO geprüft. Der Adapter prüft keine Bewegung oder Kollision und darf diese Vorbedingungen nicht ersetzen.
- FRISE 0x578E..0x57B3 gibt einen Platz frei, wenn signed16-HP <=0, signed8-Slot >=0 und Kontextwort 0x168 ==0. Der vollständige 31-Byte-Block ab 0x579E bis vor 0x57BD ist direkt gegen die hashbekannte Original-FRISE.IO geprüft. Der Originalblock prüft keine Actor-ID des belegten Platzes; der Adapter fügt eine solche Prüfung nicht hinzu. Der erlaubte Slotbereich bis 2 ist eine Toolkit-Grenze. Entitykill, Darstellung, Todesfolge und weitere Kampfzustände sind nicht enthalten.

IO.IO liest und schreibt 0x4B80 als Dreierblock; dieser Zustand ist damit gespeichert, nicht allein temporärer Rendererzustand. Tests verbinden die Effekte mit dem bereits binär abgeleiteten SAV-Writer: Plätze belegen, sechs Bytes zurücksetzen, per EDPLT reservieren, per FRISE freigeben und zurücklesen; andere MAIN-Bytes und ursprünglicher Savepuffer unverändert. Keine Änderung einer Originaldatei und keine native DOS-Ausführung.

Reproduktion: `npm run test:original-crowd-lifecycle`; mit ISHAR2_DIR zusätzlich Originalblöcke und SAV-Komposition, mit ISHAR_ACTOR_LISTINGS zusätzlich EDPLT-Präfixe. Synthetisch geprüft: Reservierung mit existierenden/freien/vollen Plätzen, sechs Resetadressen, 60 Todesfreigabe-Kombinationen und Eingabegrenzen. Weitere Auslöser/Initialisierung, Scheduler-Reihenfolge und vollständige Bewegungsintegration bleiben offen.
