## Update: skipped context continuation corrected

The prior operand22/opcode188 report came from the replay runner dispatching script bytes after a scheduler `skip` boundary. It was not a demonstrated engine opcode failure. Added instruction-order shared-memory next-slot selection at 2632 and verified its actual full-memory/register transition. The runner now follows skip -> next slot -> frame, including one explicit original IRQ with the controlled DOSBox BIOS adapter, instead of dispatching a skipped context. After the next MAIN polling/callback pass, actual LOGO:0081 executes commands73/66 and reaches record processing3DE4; its saved next opcode is167 at008D. Typecheck passed. Pixel processing of this resource11 frame and the following mirrored frame remain pending. Private actual checkpoint: `startup-logo-resource11-actual-object-ishar1-2026-10-18`; use its authenticated JSON metadata.

## Update: mirrored type20 graphics

Original 1E97:04BF/02DD mirrored byte rendering is reconstructed; 864 native fixture comparisons across both games and typecheck passed. See `MIRRORED_BYTE_RENDER.md`. Actual LOGO continuation exposed a separate scheduler boundary: after MAIN polling/callback, the selected context is skipped and the runner encounters operand22/opcode188. Actual mirrored LOGO pixels are therefore still unverified; investigate selection/timing before continuing, without forcing state.

## Update: original mirrored command 167

Reconstructed engine 1000:33B7: context flip XOR 1 followed by the shared five-operand resource draw. Native full record construction passed 216 fixtures per game (432 total); typecheck and resource regression checks passed. See `MIRRORED_RESOURCE_COMMAND.md`. Mirrored type-20 pixel output and actual LOGO:008D replay are still pending; no browser feature or complete boot is claimed.

# Handoff für Grok, Quesh, Alderaan und Hoth

**An Grok, vorhandene Sprites aktualisieren:** CHANGED_RECORD_ANIMATION.md
weist die Originalfortsetzung LOGO006F→0081 und das nächste farbige S-Stadium
nach. Status2-Update inklusive alter/neuer Grenzen, Clip-Early-Returns und
6816-Byte-VGA-Teilkopie sind nativ verglichen;480 Batch-Fixtures über beide
Engines bestehen. Next:0081/resource11, danach der statisch bekannte167-
Spiegelpfad008D. Keine vollständige Wortanimation/Browserintegration behauptet.

**An Grok, erstes farbiges Silmarils-Stadium:** LOGO_PALETTE_TRANSITION.md
weist190/ctopalet6,50 im Originalkontext nach,640 positive Transition-Fälle
über beide Engines sowie414104/106-Regressionen. Nach Originalpalette zeigt
die private VGA/DAC-Diagnose das goldene Emblem und den ersten Buchstaben S.
Kein fertiges Boot/Browserbild behauptet. Next: LOGO006F und weitere Animation;
negative190-Ressourcen sind bewusst offen. Originalbilder bleiben privat.

**An Grok, Eingabeanschluss:** ORIGINAL_SCRIPT_INPUT.md weist cmouse134
(48 native Varianten) und ojoy110 (128 Varianten) über beide Engines nach.
Actual MAIN nach dem LOGO-Frame erreicht mit expliziten neutralen Portantworten
wieder seine originale Warteschleife. Keine Tasteneingabe erfunden. Pending
LOGO0069 ist190/ctopalet6,50; dessen Paletteanschluss übernimmt Codex als Nächstes.

**An Grok, Typ20 erledigt für Normalansicht:** TYPE20_BYTE_RENDER.md weist
transparentes8-Bit-Rendering bei0482 nach,216 synthetische native Fälle über
beide Engines und die komplette aktuelle Ishar1-LOGO-Pixelkette inklusive
VGA-Kopie und Frame-Rückkehr. VGA-Hash80564ae8…19d4c. Kein Farbbild behauptet:
DAC-Shadow-Voraussetzung ist noch nicht erfüllt. Codex verfolgt jetzt den
nächsten MAIN-Befehl134 bei05CC; Spiegelpfad04BF und Ishar2-Laufzeitbeleg offen.

**An Grok, Grafikfortsetzung:** FRAME_GRAPHICS_NOTIFICATION.md weist3D55
inklusive Kopie und Restore nach (Original und zwei synthetische Varianten).
Die native/host Fortsetzung erreicht owner738/3DE4; erster320×200-Solidfill
ist ebenfalls geprüft. Nächste offene Grenze ist Grafiktyp20 bei1E97:0482.
Codex übernimmt dessen Pixeldekodierung. Noch kein vollständiges LOGO-Bild.

**Neuester Stand an Grok:** LOGO_CONTEXT_EXECUTION.md weist die tatsächliche
Ausführung des neuen Ishar1-LOGO-Kontexts nach:3009 Befehle inklusive1000
originaler Schleifendurchläufe und drei Draw-Aufträgen. Native Speicher-/
Registervergleiche bestehen. Nächste Grenze3D55 (Grafiknotification), noch
kein gerendertes LOGO-Bild. Scalar cadd/csub und kurze lokale Zahlenoperanden
sind nun implementiert und für beide Engine-Captures separat geprüft.

**Neuester Nachweis für Grok:** PHYSICAL_CLIVE.md schließt Opcode64 an die
physische VM an. Der echte post-LOGO-Befehl legt Kontextslot6 an, speichert
das Ergebnis4268 und erreicht MAIN05AE. Sechs native Vergleiche (Original,
fehlendes Modul, geerbte Felder, Ergebnisbreiten) bestehen. Next: MAIN05AE,
explizite Tastaturantworten und Scheduler; Ishar2/weitere Module bleiben offen.

**Neuester Anschluss für Grok:** COMPRESSED_MODULE_COMPOSITION.md weist die
zusammengesetzte Originalkette7917→26F7 für Ishar1 LOGO nach, einschließlich
Open/Header und aller DOS-Ereignisse. Native Rückkehr-Checkpoint privat
exportiert. Nächster Originalbefehl ist64/clive bei MAIN05A8 mit Modul64 und
Ziel4268. Codex übernimmt dessen Rekonstruktion; keine erfundenen Kontext-
oder Stackframes als Ersatz für den Originalpfad.

**An Grok: neuester Dekodiernachweis** — EMPTY_MODULE_RETURN.md dokumentiert
den echten Ishar1-LOGO-Pfad von7959 bis zur Skriptschleife26F7. Decoder,
DOS-Abschluss, Registry und leere16CE-Benachrichtigung stimmen in Registern
und Speicher außer temporärem Stack mit dem Original überein.185E wird in
diesem Fall originalseitig übersprungen. Nichtleere185E/16CE-Tabellen bleiben
offen; keine pauschale Ressourcenbenachrichtigung behauptet. Codex übernimmt
als Nächstes die Zusammensetzung an Opcode69 und die nächste Skriptgrenze.
Für Groks Analysen nützlich: aktive Uhr-/Menüflag- und GERDEP-Schedulertraces
bleiben getrennt davon offen. Erkenntnisse sind über den gemeinsamen Repo-
Branch bereitgestellt; private Originaldaten bleiben außerhalb des Repos.

**Neuester Laufzeitstand:** PHYSICAL_A1_LOGO.md weist CALL79E9 bis795C am echten
Ishar-1-LOGO-Checkpoint nach: Register, DOS-Reads und physischer Speicher außer
temporärem Stack stimmen überein. Damit ist dieser Decoderfall kein ungeprüfter
Entwurf mehr. Dateiabschluss und Registrierung sowie weitere Profile sind offen.

**Grok-Nachtrag übernommen:** Die 21 Berichte von `be14a6b` sind unverändert
integriert, einschließlich beider Kampfverträge. Erste geprüfte Umsetzung:
zwei veraltete Diagnose-Erwartungen korrigiert und als npm-Prüfer registriert;
beide Prüfer und Typecheck sind grün. Beleggrenzen und nächste Schritte stehen
in `grok-reports/CODEX_INTEGRATION.md`. Kampfregeln sind damit noch nicht in
die Laufzeit eingebaut. Der physische A1-Decoder bleibt ein ungeprüfter Entwurf.

**Modulanschluss:** MODULE_LOAD_STARTUP.md weist nach erfolgreicher MAIN.IO-
Suchantwort Opcode69/Modul64/logo.IO nach. Cachepfad (beide Spiele) und echter
Ishar-1-Open-/Headerpfad bis vor CALL79E9 sind verglichen. Codex übernimmt
Speicherverwaltung/Read/A1-Anschluss. DISK A gehörte zum kontrollierten Such-
fehlerprofil; die lokale MAIN.IO fehlt nicht. DTA/kompletter DOS-Adapter bleiben offen.

**Typ-0-Fortsetzung:** TYPE0_NIBBLE_RENDER.md korrigiert die frühere Byte-
Einordnung: Typ 0 ist ein 4-Bit-Pfad mit 6-Byte-Header. Erste Ishar-1-Kette,
VGA-Kopie, Frame-Rückkehr und kontrollierte Palette sind verglichen; private
Diagnose zeigt DISK A. Codex übernimmt nun Eingabe-/Dateizugriff nach diesem
kontrollierten Prompt. Kein vollständiger Start und keine Browserintegration.

**Ishar-1-Pixelnachweis:** Nach der getakteten Fortsetzung ist die erste
320×200-Typ-1-Füllung in 905F:0000 verglichen. Codex übernimmt als Nächstes
Typ-0-Byteblitting ab 1E97:0531. Kein kompletter Frame und keine Browseränderung;
siehe WAIT_FRAME_RESUME.md für die getrennten vier VM-/ein Grafikzustand-Nachweise.

**Framefortsetzung:** WAIT_FRAME_RESUME.md weist in vier Ishar-1-Startzuständen
30 weitere Schedulerzyklen mit echten Ishar-IRQs und explizitem BIOS-Adapter
nach. Danach steht die nichtleere Zeichengruppe BX=738/CX=154 bei 3DE4 bereit.
Codex übernimmt deren Record-/Pixelpipeline. Noch kein gerendertes Ishar-1-Bild.

**Plattformanbindung:** BIOS_TIMER_ADAPTER.md dokumentiert den expliziten
DOSBox-EGA/unhooked-Timeradapter. Damit verlässt der native Ishar-1-Code die
Wartebedingung bis 3D6B. Plattformantwort ist ausdrücklich kein Firmware-
Decompile-Nachweis; ohne Profil bleibt der BIOS-Sprung eine Grenze. Codex
übernimmt die folgende Framefortsetzung, Helferaufteilung unverändert.

**IRQ-Fortsetzung:** RUNTIME_TIMER_IRQ.md verbindet Originalentry, Palette und
Tail. Der unveränderte erste Tick erhöht C9A auf 1 und erreicht BIOS 7000:1234;
der BIOS-Körper ist noch offen. Separate Countdown-Fixtures prüfen IRET und
sind kein Beweis der unveränderten Fortsetzung. Codex übernimmt diesen Anschluss.

**Neueste Fortsetzung:** EMPTY_OWNER_FRAMES.md weist die erste vollständige
Ishar-1-Frame-Rückkehr mit zwei leeren Gruppen nach. Der nächste Frame wartet
bei 3D64 auf den Timer. Codex bearbeitet den echten Timer-/IRQ-Anschluss;
die Helferaufteilung unten bleibt gültig. Noch kein gerendertes Ishar-1-Bild.

**Korrektur nach weiterer Originalanalyse:** 1000:8ADB/8AE4 ist kein
Laufwerksdialog, sondern Audio-Stopp vor DOS-Zugriffen. Die unten genannte
Dialog-Deutung beschreibt den inzwischen widerlegten Stand des Basiscommits.
Aktuell gelten AUDIO_QUIESCE.md und STARTUP_AUDIO_QUIESCE_NATIVE_2026-10-18.json:
Ishar 1 erreicht 202 MAIN-Befehle, Yield, Callback und Objektgrenze 3DE4.
Codex bearbeitet diese originale Start-/Audio-/Grafikverbindung weiter;
die vorgeschlagenen Helferaufgaben und Dateigrenzen bleiben gültig.

Stand: 2026-10-18. Technische Ausgangsbasis:
`319819c83d8dfe30675bba3ad8a51b43c3afc871`.
Dieses Dokument wird anschließend als eigener Dokumentationscommit gepusht.
Die SHA oben bezeichnet den geprüften Code, nicht den nachfolgenden Handoff-Commit.

## Zugriff und Arbeitsverzeichnisse

- Repository: https://github.com/bvultrex/ishar-construction-kit
- Aktiver Branch: `workbench/playable-slice` (nicht ungeprüft `main` verwenden).
- Aktueller Checkout auf dem Nutzer-PC:
  `D:\Downloads\ishar-construction-kit-playable-slice (2)\repository`
- Private Analyseausgaben:
  `D:\Downloads\ishar-construction-kit-playable-slice (2)\analysis-output`
- Originale, ausschließlich lesen: `E:\Spiele\Ishar1` und `E:\Spiele\Ishar2`.
- Die im Gespräch sichtbare Browseradresse ist derzeit
  `http://127.0.0.1:4180/author`. Das ist keine verifizierte Buildkennung:
  Ein alter Dev-Server oder Browserzustand kann vom Git-Stand abweichen.

Auf einem anderen Rechner sind diese Windows-Pfade nicht erreichbar. Dort den
Branch klonen und eigene rechtmäßig vorhandene Originaldaten verwenden. Fehlende
Captures ausdrücklich melden; keine passenden Speicherzustände erfinden.

```powershell
git fetch origin
git log -1 origin/workbench/playable-slice
git status --short
```

Vor Checkout/Pull vorhandene eigene Änderungen sichern. Keinen Reset/Clean im
gemeinsamen Arbeitsverzeichnis ausführen. Für Helfer einen getrennten Clone oder
eigenen Branch verwenden. Ohne Rücksprache keine Änderungen in Codex' Checkout,
keine Portwechsel und keine Originaldateien überschreiben.

## Gesamtziel und Nachweismaßstab

Vollständige dokumentierte Rekonstruktion von Ishar 1 UND 2 samt originalgetreuem
Runtime- und Modding-/Content-Toolkit. Das Projekt ist nicht fertig; keine
belastbare Gesamtprozentzahl. Vorrang hat Decompile/Reverse Engineering.
Neue Regeln, Ersatzdialoge oder erfundene NPC-Systeme sind kein Originalnachweis.
Ziel ist überprüfbare Verhaltensgleichheit, keine behauptete Binäridentität.

Unbedingt unterscheiden:

1. Statische Analyse des Originalcodes.
2. Einzelroutine mit synthetischen Dienstantworten gegen Originalcode geprüft.
3. Zusammenhängender Startpfad mit erhaltenem Speicher verglichen.
4. Integration und sichtbares Verhalten im Browser-Toolkit.
5. Vollständiger Ablauf im Originalspiel einschließlich Export/Readback.

Ein Nachweis auf einer Stufe ersetzt die übrigen nicht. Originaldaten, Speicher-
dumps, extrahierte Pixel und Originalbilder bleiben außerhalb öffentlicher Git-
Artefakte. Öffentliche Berichte enthalten Adressen, Semantik, Hashes, Testbefehle
und synthetische Fixtures; private Referenzen werden separat abgelegt.

## Was Codex derzeit bearbeitet — bitte nicht parallel implementieren

Codex übernimmt die zusammenhängende DOS-Initialisierung, physische ALIS-VM,
Scheduler-/IRQ-Verbindung und Grafikpipeline. Aktueller nächster Bereich ist der
Original-Laufwerksdialog ab `1000:8AE4`, aufgerufen über `15A1 -> 8ADB` durch
Ausdruckstag 160. Bei CS:E940=0 ist 8ADB nur RETF; im echten Ishar-1-Start ist
das Gate aktiv. Codex wird dessen Grafik-/Eingabeabhängigkeiten rekonstruieren.

Bitte insbesondere diese aktiven Dateien nicht gleichzeitig ändern:

- `src/lib/ishar/original-dos-drive-query.ts`
- `src/lib/ishar/original-dos-script-expression.ts`
- `src/lib/ishar/original-dos-physical-script.ts`
- `src/lib/ishar/original-dos-indexed-assignment.ts`
- `scripts/check-native-dos-startup-main-script.py`
- `scripts/dos-physical-script-prefix-vector.mjs`
- zugehörige `original-dos-*` Start-/Renderer-/Schedulerbausteine.

Neue Analyseberichte und unabhängige Testvorschläge sind ausdrücklich willkommen.
Diese Aufgabenverteilung ist ein Vorschlag für Groks Team; es wurden von Codex
keine externen Bots gestartet oder Nachrichten an Grok gesendet.

## Aktuelle verifizierte Ergebnisse

- Beide lokalen DOS-Profile sind inventarisiert; Edition und aktive Sprache sind
  noch nicht abschließend bestimmt. Referenz: `INVENTORY.md`.
- CONT-Lesen/Schreiben: 6 Ishar-1- und 7 Ishar-2-Roundtrips sowie gezielte Byte-
  änderungen. Das beweist noch keine vollständige Kartensemantik.
- A1-/ALIS-Ressourcen, Paletten-, Save- und Mod-Werkzeuge existieren teilweise.
  NPCs, Handel, Inventar und Kampf haben ältere Teilpfade; originale und authored
  Browserpfade koexistieren. Nicht als vollständig originalgleich behandeln.
- Der echte DOS-Startpfad ist abschnittsweise mit Originalcode verglichen:
  Initialisierung, MAIN-Dekodierung, Root-Kontext, Scheduler und erste Grafik.
  Externe DOS-/BIOS-Antworten sind kontrollierte Eingaben, kein vollständiges DOS.
- Ishar 2: erster vollständiger 31-Record-Zeichenlauf, 320×200-Puffer, VGA-Kopie,
  Palettenübernahme und Sprachmenü als farbige Diagnoseausgabe nachgewiesen.
  Das Bild stammt aus verglichenem A000-/DAC-Speicher, nicht aus einer behaupteten
  fertigen Browserengine oder einem vollständigen Hardware-Videomitschnitt.
- Ishar 1: vier Länder-/Mauskombinationen erreichen 183 verglichene MAIN-Befehle.
  Danach aktiviert Ausdruck 160 den offenen Laufwerksdialog. Dieses Gate wird
  nicht abgeschaltet, um künstlich weiterzulaufen.
- Kontext-/Initialisierungsbefehle: 646 native Vergleichsfälle.
- Numerische/indexierte und Stringzuweisung: 252 native Vergleichsfälle.
- Laufwerksausdruck ohne Dialog: 660 native Vergleichsfälle, einschließlich
  BIOS-Sektorpuffer, Fehler/Wiederholung und Dienstreihenfolge.
- TypeScript-Prüfung und bestehender physischer Skripttest bestanden im letzten
  Codecommit. Testzahlen beziehen sich jeweils auf abgegrenzte Teilpfade.

Weitere Grenzen: aktiver Audiozweig, vollständige BIOS-IRQ-Kette, gespiegelte
Grafikpfade, vollständige VM, kompletter Spielstart, Gameplay und Editor-/Export-
Abnahme. Der letzte Arbeitsschritt verändert noch keine Browseroberfläche.

## Konfliktfreie Aufgaben für Groks Helfer

### Quesh — NPC-/Gegner-/Item-Datenfluss analysieren

Leseanalyse außerhalb des aktiven DOS-Startbereichs. Ausgangspunkte:
`ALIS_ENTITIES.md`, `ACTOR_MODULE_AUDIT.md`, `EATT_SIGNALS.md`,
`NPC_GOLD_AND_OPERANDS.md`, `src/lib/ishar` und Actor-/Inventarprüfer in `scripts`.

Lieferung: pro Spiel eine Datenflussmatrix von Originalressource/Adresse über
Spawn/Platzierung, Sichtbarkeit, Interaktion, Inventar/Gold, Kampf-/Todessignal
bis Persistenz. Pro Zeile Belegart, Originalhash, vorhandene Funktion/Test und
offene Lücke nennen. Besonders Browser-Eigenkreationen von tatsächlich belegten
Originalpfaden trennen. Keine Ersatz-KI und keine neuen Runtime-Regeln einbauen.
Priorität: kleinsten echten, durchgängigen NPC-/Item-Ablauf mit noch fehlenden
Originalroutinen identifizieren, damit die nächste Gameplay-Lieferstrecke klar ist.

### Alderaan — reproduzierbare Originalreferenzen

Originalspiel auf Arbeitskopie untersuchen. Je Referenz Spiel/EXE-Hash,
Save-Hash, Karte, Koordinaten, Blickrichtung, Eingabefolge und Ergebnis festhalten.
Gesucht: NPC erreichbar/interagierbar, Item aufnehmen/ablegen/Inventartransfer,
Shop betreten/kaufen/verkaufen und eine Gegnerbegegnung. Wenn ein Zustand nicht
reproduziert werden kann, offen melden statt einen Save ungeprüft zu patchen.

Lieferung: Referenzmanifest und private Bilder/Saves, getrennt vom öffentlichen
Bericht. Keine visuellen Änderungen an Stadt/CONT2 auf Verdacht: Der Nutzer
hatte deren Darstellung zuletzt positiv bestätigt. CONT2-Geländer wurden im
Original an den gemeldeten Stellen offenbar nicht gezeichnet; nicht hinzufügen.
Die früheren Sumpfprobleme sind Hintergrund, kein Auftrag für neue Assets.

### Hoth — unabhängige Test-/Export-Abnahme

Auf getrenntem Clone prüfen, welche existierenden Tests die jeweiligen Aussagen
tatsächlich abdecken. Besonderes Ziel: reproduzierbarer Import -> eine kleine
Originaldatenänderung -> Export -> Laden im Original -> Zustandsnachweis.
Unbekannte Bytes müssen erhalten bleiben. Geeignete Einstiege:
`MOD_WORKFLOW.md`, `FORMATS.md`, `ALIS_MODULES.md`, `PALETTE_EDITOR.md`,
`ISHAR2_SAVE_MAIN.md` und vorhandene Roundtrip-/Mod-/Save-Prüfer.

Lieferung: genaue Befehle, Exitcodes, Eingabe-/Ausgabehashes, Versionszuordnung,
Vergleichsumfang und offene Abnahmestellen. Zusätzlich die Stringprüfungen auf
fehlende Langtext-/Aliastests auditieren; diese Lücke ist bereits dokumentiert.
Neue Tests als Vorschlag oder separater Commit liefern, nicht aktiv bearbeitete
Codex-Prüfer umschreiben. Keine grüne Gesamtabnahme aus wenigen Einzeltests ableiten.

## Format für Rücklieferungen

Jeder Helfer liefert ein eigenständiges Markdown-Dokument mit:

1. Basiscommit und genaues Spielprofil/Originalhash.
2. Fragestellung und untersuchter Bereich.
3. Reproduzierbare Befehle beziehungsweise Eingabesequenz.
4. Adressen, Register-/Datenvertrag, beobachtete Seiteneffekte.
5. Ergebnis: bewiesen, Hypothese, offen oder widersprochen.
6. Grenzen des Tests und erwarteter nächster Implementierungsschritt.
7. Falls Code vorgeschlagen wird: eigener Branch/Commit, betroffene Dateien,
   Tests und explizite Kennzeichnung als noch nicht integriert.

Öffentliche Berichte beispielsweise unter `docs/reconstruction/grok-reports/`
auf eigenem Branch ablegen. Private Bilder/Saves/Dumps unter einem getrennten
Ausgabeordner. Codex prüft und integriert anschließend die Ergebnisse.

## Lokale Diagnoseumgebung

Node 24 mit TypeScript-Stripping; `npm run typecheck`.
Python auf diesem PC:
`C:\Users\Hoffmann\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`.
Unicorn/Capstone über `$env:PYTHONPATH='../analysis-tools/python'` (relativ zum Repo).
Auf anderen Rechnern eine eigene passende Umgebung einrichten, nicht diese
absoluten Pfade voraussetzen. Beispiel aus dem Repository:

```powershell
npm run typecheck
node scripts/check-dos-physical-script.mjs
$env:PYTHONPATH='../analysis-tools/python'
& 'C:\Users\Hoffmann\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/check-native-dos-drive-query.py ../analysis-output/dos-first-interrupt-ishar1-2026-10-17/memory.bin
```

Captures (je 1 MiB), ausschließlich lokal:

- `analysis-output/dos-first-interrupt-ishar1-2026-10-17/memory.bin`
  SHA-256 `5ce2bfdfc8365185eaa71d5c98fe5180db30b29181c610e416ec50ed782ed9b7`
- `analysis-output/dos-first-interrupt-ishar2-2026-10-17/memory.bin`
  SHA-256 `f8ab017849e50102a1c6d01e01439e153eb7d13c949d35a88c880561b3b12b04`

Dabei ist `analysis-output` ein Geschwisterordner des Repositorys, kein Repo-Unterordner.
Startcheckpoints: `startup-main-root-ishar1-2026-10-18` im selben privaten Ordner;
die JSON-Sidecars enthalten Speicherhash, Profil, Register und Grenze 2607.
Engine-CS=1000, SS=1C0B; Segmentfenster können physisch überlappen.
Stackmasken sind testabhängig und dokumentiert: nicht pauschal ausweiten.

Private farbige Diagnose:
`analysis-output/native-colour-preview-ishar2-2026-10-18.png`.
Repo-Nachweise: `STARTUP_LANGUAGE_PREVIEW_2026-10-18.json`,
`CONTEXT_SEED.md`, `PHYSICAL_STRING_ASSIGNMENT.md`, `DOS_DRIVE_QUERY.md`
und die jeweils verlinkten nativen JSON-Ergebnisse.

## Einstieg in die Gesamtdokumentation

`STATUS.md`, `COVERAGE.md`, `PLAN.md`, `INVENTORY.md`, `FORMATS.md`,
`MOD_WORKFLOW.md`, `DOS_STARTUP.md`, `NATIVE_SCRIPT_DIAGNOSTIC.md`.
Ältere Absätze beschreiben historische Zwischenstände; bei widersprüchlichen
Startgrenzen die neueren spezifischen Nachweise und den aktuellen Code prüfen.
Der aktuelle schmale Fokus auf den DOS-Start ersetzt nicht das Gesamtziel:
vollständige Spiele, Originalsysteme, editierbare Ressourcen und neue Inhalte.
