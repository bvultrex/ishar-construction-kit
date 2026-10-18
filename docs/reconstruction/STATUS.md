# Technischer Iststand

[Typ 0](TYPE0_NIBBLE_RENDER.md) ist als 4-Bit-Pfad rekonstruiert. Die erste
Ishar-1-Recordkette, VGA-Kopie und Frame-Rückkehr bestehen; eine farbige private
DISK-A-Diagnose ist nach kontrollierten IRQs möglich. Noch kein kompletter Start.

Ishar 1: Die [getaktete Framefortsetzung](WAIT_FRAME_RESUME.md) erreicht den
ersten nativen 320×200-Pixelfülllauf (64.000 Adressen). Der nächste Record
stoppt bei Grafiktyp 0, 1E97:0531. Noch kein kompletter Ishar-1-Frame.

[Framefortsetzung](WAIT_FRAME_RESUME.md): Ishar 1 erreicht nach 30 zusätzlichen
Schedulerzyklen und 30 originalen IRQ-Ausführungen die erste nichtleere
Zeichengruppe BX=738. Vier Startzustände verglichen, BIOS-Service explizit gewählt.

[BIOS-Plattformadapter](BIOS_TIMER_ADAPTER.md): Mit ausdrücklich gewähltem
DOSBox-EGA/unhooked-Profil verlässt Ishar 1 die Timerwarteschleife nativ bis
3D6B. Kein ausgeführter Firmwarecode und keine automatische BIOS-Ersatzannahme.

[Laufzeit-IRQ](RUNTIME_TIMER_IRQ.md): Der erste unveränderte Ishar-1-Tick
erhöht den Wartezähler 0 -> 1 und erreicht nativ identisch den gespeicherten
BIOS-Zeiger. Dessen Körper bleibt offen; separate synthetische IRET-Fälle bestehen.

[Leere Objektgruppen](EMPTY_OWNER_FRAMES.md): Der echte erste Ishar-1-Frame
kehrt nach Verarbeitung beider leerer Gruppen zurück. Der folgende Frame
wartet nativ identisch bei 3D64 auf den Timer; noch kein gezeichnetes Ishar-1-Bild.

Neueste Korrektur: [AUDIO_QUIESCE.md](AUDIO_QUIESCE.md) identifiziert 8ADB als
Audio-Stopp. Ishar 1 erreicht nun 202 verglichene MAIN-Befehle, Yield, Callback
und die erste sichtbare Objektgrenze 3DE4; kein fertiges Ishar-1-Bild behauptet.

Laufwerksausdruck 160 (2026-10-18): [DOS_DRIVE_QUERY.md](DOS_DRIVE_QUERY.md).
660 native Fälle für DOS-/BIOS-Pfade; der reale Ishar-1-Start erreicht weiterhin
183 verglichene Befehle und stoppt nun präzise am aktivierten Originaldialog 8AE4.

Fortsetzung (2026-10-18): [Physische Stringzuweisung](PHYSICAL_STRING_ASSIGNMENT.md)
verbindet die Original-Stringquellen und -ziele; Ishar 1 erreicht 183 geprüfte
MAIN-Befehle vor dem noch offenen Ausdruckstag 160.

Neuester Teilnachweis (2026-10-18): [DOS-Kontextsteuerung und Initialisierungswort](CONTEXT_SEED.md),
646 native Vergleichsfälle; Ishar 1 erreicht 176 verglichene MAIN-Befehle vor der
offenen Stringzuweisung. Dies verändert die Browseroberfläche noch nicht.

Stand der zusammengefassten Inventur: 2026-10-17. Keine prozentuale Vollständigkeitsbehauptung.
Aktualisierte subsystemübergreifende Abdeckung und nächste Abnahmen (2026-10-18):
[COVERAGE.md](COVERAGE.md). Die nachfolgenden Einträge dokumentieren Teilmeilensteine;
neuere native Start-/VM-Nachweise stehen in DOS_STARTUP.md und NATIVE_SCRIPT_DIAGNOSTIC.md.

| Bereich | Ishar 1 | Ishar 2 |
|---|---|---|
| Originalbestand | 122 Dateien inventarisiert | 190 Dateien inventarisiert |
| Edition / aktive Sprache | unbestätigt | unbestätigt |
| CONT-Leser/Writer | 6 Originaldateien byteidentisch geprüft | 7 Originaldateien byteidentisch geprüft |
| gezielte Kartenbyteänderung | nur geändertes Byte, Rest unverändert geprüft | ebenso |
| Save-Editor | Original-I/O-Aufteilung für 5216 Bytes nachgewiesen; UI-Feldnamen weiter Kandidaten | einzelne decompile-basierte Teilpfade und ältere Kandidaten koexistieren |
| Grafiken/Packer | 98 IO-Hüllen/Images auditiert; Grafiksemantik offen; A1-Writer gegen Decoder geprüft | 142 IO-Hüllen/Images auditiert; Import/Paletten/Sprites teilweise; A1-Writer gegen Decoder geprüft |
| Kartenlaufzeit | nicht als originalgleich nachgewiesen | CONT1–7 teilweise dargestellt, Originalvergleich lückenhaft |
| NPCs/Kampf | offen | EAFF/EATT teilweise; Leerlauf für drei Module, kein vollständiger Kampf |
| Dialog/Quest/Zauber/Audio | offen | offen bzw. Analysefragmente; nicht vollständig integriert |
| Neue Inhalte | Browser-JSON kein Originalexportnachweis | ebenso |
| Originalspiel-Mod-Readback | offen | offen |

## Architektur, die weiterverwendet wird

- `src/lib/ishar`: Binär-/Packer-/Asset-Code, CONT-Codec, Save-Felder,
  decompile-basierte Gameplay-Teile und authored Zusatzsysteme. Diese sind noch
  nicht vollständig nach Spiel/Plattform geschichtet.
- `src/builder`, `src/components/builder`, `src/routes`: React-Editor und Labore.
- `src/lib/store.ts`, `src/lib/asset-store.ts`: Projekt-/Assetzustand.
- `src/routes/playtest.tsx`: Browserlaufzeit; kein Ersatznachweis für Originaltest.
- `scripts`: Node-CLI und Prüfungen, teilweise optional mit lokalen Ressourcen.
- Lokale `grok-handoff-research-2026-10-11/decompile` enthält Ishar-2-Listings,
  Analyse und Render-Tabellen; Originalmaterial wird nicht ins Repo übernommen.
- Lokale `alis-reference`: vorhandene ALIS-C-Implementierung als Referenz,
  mit eigenem LICENSE. Noch kein in diesem Audit erfolgreicher Build/Start.

## Verfügbare Werkzeuge und Voraussetzungen

Node und Git sind ausführbar. Die vorhandenen Node-Tests importieren TypeScript
per nativer Type-Stripping-Unterstützung. Ein gebündelter Python-Interpreter ist
vorhanden; `python` im PATH ist dagegen ein WindowsApps-Alias.
DOSBox/dosbox-x/gh wurden nicht im PATH gefunden. Das beweist nicht, dass kein
Emulator installiert ist. Später über die Desktop-Verknüpfung gefunden:
`E:/Programme/Dosbox/DOSBox.exe` (Fenster: 0.74). Ishar 2 startet aus separater
Kopie bis zur Sprach-/Musikauswahl; Original-Ingame-Modvergleich noch offen. ALIS-Referenz nennt CMake/SDL2; deren Build ist noch zu prüfen.

Originalinstallationen und Analyseausgaben bleiben getrennt. Keine Originaldatei
wird bearbeitet. Repository enthält eigene Werkzeuge und Dokumentation; keine
EXE, Grafik-, Karten-, Script- oder Save-Kopien aus den Spielen. Lizenz/Herkunft
von Drittcode vor Übernahme prüfen; keine generelle Freigabe von Spielressourcen
aus einer lokal vorhandenen Datei ableiten.

## Tests dieses Meilensteins

- `test:inventory`: deterministische Hashinventur, Quellschutz, Überschreibschutz.
- `test:original-resources`: alle 13 lokalen CONT-Dateien lesen/schreiben,
  gezielte A-Änderung, Erhalt aller übrigen Bytes, unveränderter Quellpuffer.
- Keine Originalspielausführung, keine Grafikgleichheit und kein vollständiger
  Mod-Workflow durch diese Tests nachgewiesen.


## Export-Integration (weiterer Zwischenstand)

`cont-patch.ts` und `scripts/cont-mod.mjs` binden Änderungen an ihren Quellhash
und erstellen ausschließlich neue Spielkopien mit vollständigem Hash-Readback.
Builder exportiert diesen Patch nach Auswahl der passenden Originaldatei.
`test:cont-mod` prüft beide Profile, Fehlereingaben, Quellschutz und Daten-Erhalt.
Browser-Ishar-2-Export und Anwendung auf 190-Dateien-Kopie nachgewiesen;
Originalspiel-Modprüfung bleibt offen. Ablauf und Grenzen: MOD_WORKFLOW.md.


## ALIS-/Ishar-1-Analyse

Alle 240 lokalen IO-Module wurden strukturell geprüft, per No-op byteidentisch
zurückgegeben und gegen den separaten Python-Decoder verglichen. Für Ishar 1
liegen neue lokale Listings vor (FRISE-Abbruch offen). Der originale MAIN-SAV-
Reader und Writer stimmen bei 107 Feldern/5216 Bytes überein; alle acht lokalen
Saves sind mit dieser Struktur byteidentisch rekonstruierbar. Keine Aussage über
vollständige Feldsemantik oder erfolgreichen Originalspiel-Modtest.
Details, Profilhashes und Reproduktion: ALIS_MODULES.md.


## A1-Schreiben

Deterministischer Writer und Inspect/Extract/Replace-CLI vorhanden. 240 geänderte
lokale Module gegen TypeScript und Python zurückgelesen; No-op byteidentisch,
VM-Spezifikationen und unbekannte vollständige Trailer erhalten. Original-
Ausführung, Größen-/Referenzerweiterungen und vollständige Editoren bleiben offen.
Keine Originaldateien verändert. Details: A1_WRITER.md.

## DOS-Paletteneditor

Asset Lab bietet jetzt lokale IO-Palettenbearbeitung, Undo/Redo, IO-Kopie und Änderungsbericht. 60 Paletten aus Ishar 1 und 161 aus Ishar 2 wurden gezielt geändert und zurückgelesen; übrige Imagebytes erhalten. Browserexport mit FOND1.IO byteweise kontrolliert. Skriptzuordnung und Originalspielprüfung bleiben offen. Format, Bedienung und Testgrenzen: [PALETTE_EDITOR.md](PALETTE_EDITOR.md).

## EATT-Signalroutine

Originaler positiver EATT-Zustands-/Signalpfad samt Aufrufprädikat als unverändernder Trace rekonstruiert. DOS-cdim-Byte-Strides für zwei mehrdimensionale Tabellen direkt im lokalen MAIN verifiziert. Noch keine Playtest-Verdrahtung, MESSAGE-Rückmeldung oder Originalausführung. Siehe [EATT_SIGNALS.md](EATT_SIGNALS.md).

## NPC-Gold und Operandenregister

FRISE-Goldübergabe und EATT-Bestätigung als komponierter Trace rekonstruiert; bisherige Annahme einer direkten MESSAGE-Bestätigung korrigiert. Registertausch bei opile, signed16-Arithmetik und native Vergleichswerte im Figurenskriptinterpreter berichtigt. Lokale Figurenskripttests weiter bestanden. Originalausführung und vollständige Interaktionsverdrahtung offen. Siehe [NPC_GOLD_AND_OPERANDS.md](NPC_GOLD_AND_OPERANDS.md).

## Ursprüngliche Goldauswahl

FRISE-Betragsänderung mit Guthabenprüfung und Wiederholungsbeschleunigung rekonstruiert. 90 Fälle gegen begrenzte Auswertung der ursprünglichen Listing-Rechenzweige verglichen, 118 Instruktionspräfixe am Original geprüft. Gesamtes Goldfenster, Ziele, Scheduler und Originalausführung weiterhin offen; keine neue Playtest-Bedienung aktiviert. Details: NPC_GOLD_AND_OPERANDS.md.

## Ishar-2-MAIN-Save-Writer

141 I/O-Felder direkt aus dem hashgebundenen IO.IO abgeleitet; 21 Saves mit Listing-Loader verglichen und 2940 gezielte Änderungen geprüft. CLI schreibt explizite MAIN-Operationen in neue SAV-Kopien; NPC-Gold-Trace exportiert/zurückgelesen. Header-Sonderfall und Byte-Scalar-Vorzeichenerweiterung berücksichtigt. Originalausführung und vollständige Feldsemantik offen. Siehe [ISHAR2_SAVE_MAIN.md](ISHAR2_SAVE_MAIN.md).

## Belegter Save-Editor im Toolkit

Character Lab bindet den binär abgeleiteten Ishar-2-MAIN-Writer jetzt separat von den Kandidatenfeldern ein: Profilprüfung, Bereich/Byteindex, aktueller Rohwert, Undo/Redo, neue SAV-Kopie und Hash-/Bytebericht. Browserexport am Originalsave byteweise geprüft; Desktop/Mobil ohne beobachtete Konsolenfehler. Originalspielprüfung und vollständige NPC-Bedienung bleiben offen.

## Formen und Zielauswahl

667 DOS-ALIS-Formen beider Spiele erschlossen; 660 Boxen mit gezielter Änderung und Modul-Readback geprüft. Referenzbasierter erster Formtreffer, aktive cforme-Snapshots und Ishar-2-SOURIS/FRISE-Auswahlphasen rekonstruiert. Komponententest bis zur NPC-Gold-SAV-Kopie; kein nativer Ausführungsnachweis. ALIS-C-Referenz ist kein dekompilierter DOS-EXE-Quelltext. Details: [ALIS_FORMS_AND_SELECTION.md](ALIS_FORMS_AND_SELECTION.md).

## Entity-Laufzeitbaustein

Referenzbasierte alte DOS-Entityverkettung, elf Byte Vererbung, Handles, Typ-/Klassensuche und Formadapter vorhanden. Beide MAIN-Header liefern 50 Entityplätze. Originales GOLEM1-Listing mit kontrolliertem negativem Testzustand bis zum Formtreffer geprüft; START-Grundzustand aktiviert keine Form. Kein vollständiger VM-/Originalausführungsnachweis und keine pauschale Playtest-Aktivierung. Siehe [ALIS_ENTITIES.md](ALIS_ENTITIES.md).

## Entity-Lebenszyklus: struktureller Teil

`removeStructure` rekonstruiert das Ausketten und die Freilisten-Wiederverwendung aus der separaten ALIS-C-Referenz. Scheduler-Neustart wird als explizites Ergebnis geliefert; Audio, Renderbereinigung und Heap-Kompaktion bleiben offen. Tests prüfen unter anderem erhaltene Nachfolger, zurückgesetzte wiederverwendete Einträge und verschwundene Formtreffer. Kein vollständiges `killent`, keine neue Playtest-Integration und kein nativer Nachweis. Details: ALIS_ENTITIES.md.

## Ishar-2-EAFF-Bindung

Der strukturelle Entity-Abbau ist nun mit EAFF 0x3A..0x5F verbunden: vorab erfasste Live-Liste, Entfernung aller Klasse-35-Einträge, Erhalt anderer Klassen. Der gesamte Skriptblock ist direkt gegen die lokale EAFF.IO geprüft; Opcode-Semantik bleibt referenzbasiert. Vollständige killent-Nebenwirkungen und Browserintegration weiter offen. Test: `node scripts/check-original-eaff-cleanup.mjs` (Originalvergleich mit ISHAR2_DIR).

## EAFF-Erzeugung: sechs Initialstores

EAFF 0x99A..0x9E8 ist als Initialisierungsadapter rekonstruiert und vollständig byteweise gegen die lokale Originaldatei geprüft. Koordinaten verwenden die vorhandene signed16-Operandenrekonstruktion; Actor-ID und Klasse werden aus dem Skript gesetzt. Komposition mit Figurenskript-Frame, Aufräumen und Handle-Wiederverwendung getestet. Keine automatische Spawn-Auswahl oder Browseraktivierung. Siehe ALIS_ENTITIES.md.

## EAFF-Modulauswahl

Begrenzte Ausführung von EAFF 0x61D..0x985 liefert konkrete Modulauswahl, laterale Overrides und geordnete MAIN-Schreibtraces. Alle 128 nichtnegativen Typwerte und drei Sonderplätze geprüft; Typ-43-Inventargate einschließlich mehrdimensionaler MAIN-Adressierung enthalten. 154 Instruktionspräfixe gegen hashgebundene Original-EAFF geprüft, Arraydeklarationen gegen MAIN. Keine native Ausführungsprüfung, kein vollständiger Spawn-/Sichtbarkeitsablauf und keine Browseraktivierung. Dokumentation: ALIS_ENTITIES.md.

## EAFF-Vorauswahl und bestehender Filter korrigiert

Geometrische Vorauswahl und Orientierungshelfer aus dem Original-EAFF rekonstruiert. Der bisherige Actorfilter verglich die gespeicherte Blickrichtung zu früh; er verwendet nun den vorher vom Original berechneten Wert und die konkreten Kartenfälle 2..7. signed8-Koordinatendifferenzen berücksichtigt. 432 Helferfälle gegen bounded Listingausführung, 110 Instruktionspräfixe gegen Originalbytes geprüft; Save-Actor- und Figurenframe-Tests bestanden. Terrain/Verdeckung und vollständige Erzeugung bleiben offen. Details: ALIS_ENTITIES.md.

## EAFF-Perspektive in Figurenpfad integriert

Der CONT1-Figurenpfad liest seine Perspektivstaffel jetzt aus EAFF statt einer fest eingetragenen Tabelle. Begrenzte Listingausführung rekonstruiert zudem die Karten- und Höhenkorrekturen (Karte 4 verlangt explizite originale Geländedifferenz). 354 Perspektivfälle, 112 Original-Instruktionspräfixe und bestehende lokale Figurenskript-/Animationstests geprüft. Verdeckung, Crowd-Zufall und vollständige andere Kartenpfade bleiben offen. Siehe ALIS_ENTITIES.md.

## EAFF-Crowd-Verteilung

EAFF 0x4C8..0x985 zusammenhängend ausführbar: bestehende/neu belegte Dreierplätze, laterale Zufallswerte und anschließende Modulauswahl. oprnd als deterministischer Stackseed-Operator aus der C-Referenz ergänzt; 65536 Seedmuster geprüft. 180 Actor-/Kartenkombinationen und Crowd-RNG-Reihenfolge getestet, weitere 40 Instruktionspräfixe gegen Originaldatei geprüft. Kein vollständiger Slot-Lebenszyklus, keine Browseraktivierung und kein DOS-Ausführungsnachweis. Details: ALIS_ENTITIES.md.

## Crowd-Lebenszyklus belegt

GERDEP-Resetblock, EDPLT-Reservierung und bedingte FRISE-Todesfreigabe rekonstruiert. Direkte Originalbyte-/Listingprüfungen und Komposition mit einer SAV-Arbeitskopie bestanden; gespeicherte Crowdplätze bleiben damit über den Save-Codec erhalten. Kein pauschaler Redrawreset, keine vollständige Kampf-/Bewegungsintegration. Details und konkrete Auslösergrenzen: ALIS_ENTITIES.md.

## EAFF-Crowd/Dispatch im CONT1-Ansichtsadapter verbunden

Figurenpfad verwendet nun Crowd- und Dispatchausführung statt Kandidaten-/Konstantensuche. Arraydeklarationen aus lokalem MAIN-Listing, geordnete Writes nur in privater MAIN-Kopie. Tests mit echten Skripten sowie ausdrücklich synthetischem Drei-Figuren-Renderer bestanden. Runtime bleibt Teiladapter: Save-Crowdzustand wird je neuem Ansichtsaufbau übernommen; persistente Bewegungs-/Kampfzustandsmaschine und vollständiger Scheduler offen. Neuer Testserver auf 4180 liefert MAIN-Listing, Playtest-HTTP 200 geprüft.

## Vollständige EAFF-Switchtabellen geprüft

Neuer binärer Reader und verlustfreier Zielwort-Writer für DOS cswitch1/cswitch2. Alle zwölf EAFF-Tabellen mit 108 Fällen vollständig gegen Listingzuordnungen geprüft, einschließlich Default/Alignment/Bias. Damit ist die bisherige Präfixprüfung der langen Switchinstruktionen für diese Tabellen ergänzt. 108 gezielte Änderungen/restores erhalten das vollständige Image; keine Originaldatei verändert. Native Ausführung und andere Modulprofile offen. Siehe ALIS_SWITCHES.md.

## CONT4-Geländehöhen an EAFF angebunden

Die zweite CONT-Schicht ist über Original-MAIN-Deklarationen und vollständige Lesesequenz an 0x159C gebunden. EAFFs vollständiger Höhenlookup-/Differenzblock direkt geprüft; neuer Adapter liefert den signed8-Höheneingang. 5340 originale CONT4-Feldpaare und eine gezielte B-Feldänderung mit byteerhaltendem Export geprüft. Keine Freischaltung vollständiger CONT4-Figuren, keine Verdeckungs- oder DOS-Prüfung. Siehe ALIS_ENTITIES.md.

## Switchvergleich Ishar 1 und Ishar 2

Neue strukturelle Integeroperanden-Längenprüfung erlaubt den direkten Tabellenvergleich ohne manuell gesetzte Operandenden. Vorhandene Listings: Ishar 1 284 Tabellen/3098 Fälle in 81 Modulen, Ishar 2 378 Tabellen/3801 Fälle in 118 Modulen, keine Prüfungsfehler. Pro Tabelle gezielte IO-Kopienänderung mit Pack-/Unpack-Readback und byteidentischer Wiederherstellung getestet. Lokaler Hashbericht außerhalb Git. Keine Behauptung vollständiger Codeabdeckung oder nativer Ausführung. Siehe ALIS_SWITCHES.md.

## Direkte Kontrollflussprüfung beider Profile

23964 direkte Sprünge/Aufrufe/Resumeziele mit Opcodeart und Breite gegen jeweilige Originalmodule geprüft: Ishar 1 10616 Stellen in 94 Modulen, Ishar 2 13348 in 140, keine Fehler. Gezielter IO-Kopienpatch und Pack-/Unpack-Readback pro betroffenem Modul. Neue negative 24-Bit-Ziele bleiben mangels Originalfall/DOS-Nachweis abgewiesen; der Referenzreader ist dort fehlerverdächtig. Kein vollständiger CFG-/Ausführungsnachweis. Dokumentation: ALIS_BRANCHES.md.

## ALIS-Zählschleifen

Alle 76 ausgewiesenen cloop-Stellen beider Profile mit skalarem Counter direkt binär geprüft. Separate Sprungbasis vor Counteroperand und Fallthrough dahinter rekonstruiert; Byte-/Wortüberlauf und Zero-Flag geprüft. Figureninterpreter führt vier originale Counterformen aus. Keine vollständige VM-/Originalausführungsbehauptung. Details: ALIS_BRANCHES.md.

## Registerübergänge im Figurenpfad

D6/D7 bleiben jetzt über Befehle und Yields erhalten; sub/div/mod-Nebenwirkungen auf D6 korrigiert. Figurenpfad unterstützt registerabhängige beq/bne und berücksichtigt cstore-/csub-/Switch-Folgezustände. Explizite Registerinitialisierung verfügbar; Default null bleibt Vorschauannahme. Neue Integrationstests und bestehende lokale Figuren-/EAFF-/Goldauswahltests bestanden. Kein vollständiger VM- oder DOS-Zustandsnachweis. Siehe ALIS_BRANCHES.md.

## Zwei weitere Original-Figurenmodule

Alle 47 aus EAFF referenzierten Modul-IDs unter kontrollierten Zuständen auditierbar; lokale Hashberichte und Grafik-/Composite-/Formreferenzprüfung vorhanden. Vier konkrete Interpreter-/Transientzustandslücken dokumentiert. MARIN.IO und GEANT.IO bestehen je 20 Szenarien/2000 Ausgabeframes und sind jetzt in Skriptbundle und Assetaufnahme enthalten. Original-EAFF -> Originalskript -> 100 weitere Schritte separat geprüft; kein Anspruch vollständiger NPC-/Eventunterstützung oder DOS-Bildgleichheit. Siehe ACTOR_MODULE_AUDIT.md.

## LEZARD-Palettenanforderung geklärt

MAIN-DOS-Einstellungsstores für 0x51A1 und 0x51A2 direkt geprüft; keine pauschale Nullauffüllung. Expliziter Palettenauftrag im Figureninterpreter, LEZARD-Originalskript bei drei Lichtphasen mit originalen Paletteindizes/Dauer getestet. Lichtphase wird bereits gespeichert. Native Hardwareinitialisierung und tatsächlicher Überblendungsrenderer offen; LEZARD noch nicht automatisch freigeschaltet. Details: ACTOR_MODULE_AUDIT.md.

## Palettenübergang als Referenzmodell

Separates Modell rekonstruiert ALIS-C-topalette/topalet inklusive Float32-Schritten, Restzähler und finaler Kopie. Originalpalettenziele aller 221 Ressourcen beider Spiele gegen Rohbytes geprüft. LEZARD-Auftrag -> Originalpalette -> 44 kontrollierte Schritte für drei Phasen getestet. Keine DOS-Zeit-/Pixelgleichheit oder globale Framebufferintegration behauptet; LEZARD bleibt im Produkt noch deaktiviert. Siehe REFERENCE_PALETTE_TRANSITIONS.md.

## Audio: statisches Ressourcenverzeichnis

Für beide lokalen DOS-Profile sind jetzt alle 240 IO-Module auf Soundtabellen geprüft: 55 Einträge in Ishar 1, 149 in Ishar 2. Reader mit Bereichsprüfung und unverändertem Quellpuffer vorhanden; Typ-1/2-Header bleiben vor Importnormalisierung. Packungs-/Samplekonvertierung, Musikformate, Audioeditor und echte Wiedergabe sind weiterhin offen. Herkunft, Feldaufbau und Reproduktion: ALIS_SOUNDS.md.
