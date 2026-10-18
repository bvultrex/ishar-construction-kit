# Abdeckung und nächste Abnahmen

Stand: 2026-10-18. Bezugsumfang: beide lokalen DOS-Profile aus
[INVENTORY.md](INVENTORY.md), vollständige Rekonstruktion und Content-Toolkit.
Ziel ist überprüfbare Verhaltensgleichheit, kein behaupteter binäridentischer EXE-Neubau.

## Wie der Status gelesen werden muss

Die Tabelle bewertet **keinen Bereich als vollständig**. „Teilweise“ bedeutet
belegte Teilfunktionen, nicht einen entsprechenden Anteil am Gesamtspiel.
Native Einzeltests mit kontrollierten Zuständen, Beobachtung des Originalprogramms,
Browserintegration und ein vollständiger Spielablauf sind verschiedene Belege.
Keine davon ersetzt automatisch die anderen.

Die informelle Schätzung von 10–20 % aus dem Gespräch ist keine Messung und wird
nicht als Projektkennzahl geführt. Weder Dateizahlen noch Testfallzahlen oder
implementierte Opcodes ergeben eine belastbare Gesamtquote. Auch diese Tabelle
hat keine gleichgewichteten Zeilen: Kampf und ein Codec sind unterschiedlich groß.

## Getrennte Abdeckung beider Spiele

| Bereich | Ishar 1: belegter Teil | Ishar 2: belegter Teil | Fehlende Abnahme / Quelle |
|---|---|---|---|
| Zielversionen | Hashinventar, DOS-Bestand | Hashinventar, DOS-Bestand | Edition/aktive Sprache abschließend bestimmen; [Inventur](INVENTORY.md) |
| Kartenformate | 6 CONT-Roundtrips, gezielter Bytepatch | 7 CONT-Roundtrips, gezielter Bytepatch | Vollständige Codesemantik und Original-Ingame-Modvergleich; [Formate](FORMATS.md), [Mod-Ablauf](MOD_WORKFLOW.md) |
| Modulformat/Kompression | 98 IO-Module strukturell geprüft; A1-Writer | 142 IO-Module strukturell geprüft; A1-Writer | Ressourcen-/Skriptsemantik nicht vollständig; [Module](ALIS_MODULES.md), [Writer](A1_WRITER.md) |
| Savegame | MAIN-I/O-Struktur, 5216 Bytes | MAIN-I/O-Writer, gezielte Änderungen, Editor | Feldsemantik und geänderter Zustand im Original laden; [Module](ALIS_MODULES.md), [SAV](ISHAR2_SAVE_MAIN.md) |
| Start/Ressourcenverwaltung | Nativer MAIN-Test bis Root-Kontext und RET | Derselbe abgegrenzte Nachweis | Grafikaufbereitung hostseitig rekonstruieren, echte Initialisierung anbinden; [DOS-Start](DOS_STARTUP.md), [Messdaten](MAIN_ROOT_NATIVE_2026-10-18.json) |
| Dateisystem | Open/Read/Write/Close und Suchgrenzen teilweise rekonstruiert | Dieselben nach Profil geprüften Bausteine | Vollständiger DOS-Zustand/Adapter; FindNext-Zustand nicht allein DTA; [Dateisuche](DOS_FILE_SEARCH.md), [DOS-Start](DOS_STARTUP.md) |
| Skript/Scheduler/Zeit | Native Teilroutinen, kontrollierter PRESTI-Zyklus | Native Teilroutinen, kontrollierter IO-Zyklus | Vollständige VM, Objekt-/Modulverwaltung, aktive Callbacks; [Diagnose](NATIVE_SCRIPT_DIAGNOSTIC.md) |
| Welt/Bewegung/Kollision | Kartenbytes zugänglich | Browserdarstellung und Teilregeln CONT1–7 | Alle Karten, Übergänge, Zustände und Referenzbilder je Profil; [Status](STATUS.md) |
| Grafik/Animation/UI | Paletteneditor, Ressourcen-/Formanalyse | Paletteneditor, Teilrenderer und Figurenanimation | Pixel-/Animationswriter, vollständige Originaldarstellung und UI; [Paletten](PALETTE_EDITOR.md), [Formen](ALIS_FORMS_AND_SELECTION.md) |
| Charaktere/Items/Inventar | Save-/Formbausteine | Teilimplementierung; originale und authored Pfade koexistieren | Durchgängiger originaler Interaktionsablauf statt Ersatzregeln; [Status](STATUS.md), [Gold](NPC_GOLD_AND_OPERANDS.md) |
| NPC/Gegner | Referenzbasierte Entitybausteine | EAFF-Auswahl/Platzierung, Figuren- und Signalteilpfade | Vollständiger Spawn-, Interaktions-, Bewegungs- und Todeszyklus; [Entities](ALIS_ENTITIES.md), [Module-Audit](ACTOR_MODULE_AUDIT.md) |
| Handel/Wirtschaft | Kein vollständiger Ablauf nachgewiesen | Teilpfade und Goldauswahl | Laden betreten, kaufen/verkaufen, Zustand speichern und wieder laden; [Gold](NPC_GOLD_AND_OPERANDS.md) |
| Kampf/Zauber/Effekte | Kein vollständiger Ablauf nachgewiesen | EATT-Signalteilpfad; kein vollständiger Kampf | Sender/Empfänger, Zielwahl, Schaden, Kosten, Tod, Persistenz; [EATT](EATT_SIGNALS.md) |
| Texte/Dialog/Quest/Trigger | Ressourcen vorhanden, keine vollständige Kette | Analysefragmente, keine vollständige Kette | Originale Steuerung plus Editor/Export/Readback; [Status](STATUS.md) |
| Audio | 55 statische Soundeinträge | 149 statische Soundeinträge | Konvertierung, Musikformate, Originalansteuerung, Wiedergabe/Editor; [Audio](ALIS_SOUNDS.md) |
| Projektverwaltung/Export | CLI-Teilwerkzeuge, kein vollständiger Editorpfad | Browserprojekt, CONT-/Paletten-/SAV-Teilpfade | Gemeinsame Ressourcenabhängigkeiten, reproduzierbare Mod-Projekte; [Mod-Ablauf](MOD_WORKFLOW.md) |
| Zusätzliche Inhalte | Keine Original-Ausführungsabnahme | Authored-JSON-Zusätze, keine Original-Ausführungsabnahme | ID-/Speichergrenzen, neue Referenzen, Exportziel und Ausführung; [Plan](PLAN.md) |

## Nächste überprüfbare Lieferstrecke

1. **Geladener MAIN-Kontext → rekonstruierte Ausführung.** Aktuelle native
   MAIN-Kette als Referenz behalten; Grafiknotification `1000:185E` ist inzwischen
   im normalen Modus gegen beide MAIN-Dateien und synthetische Typfälle geprüft
   (Details: DOS_STARTUP.md). Alternative Konvertierung bleibt offen.
   Der erzeugte Root-Slot erreicht inzwischen die erste native Scheduler-
   Dispatchgrenze ohne manuelle Wurzelverknüpfung (CLI, noch kein Browseradapter).
   MAIN-Opcode70 samt Objektpoolzugriffen ist inzwischen gegen beide Profile
   geprüft; beide ursprünglichen Anfangsbefehle laufen im CLI-Nachweis durch.
   Die folgenden117/114 Opcode41 je Spiel sind mit dem erhaltenen physischen
   Zustand nativ verglichen. Auch die ersten7/8 numerischen Zuweisungen samt
   Original-Indexstack laufen durch. Das gemeinsame physische Schritt-API folgt
   jetzt auch Aufrufen, Ausdrücken und Bedingungen. Tatsächliche nächste Grenzen
   sind die DOS-Dateisuche156 (Ishar1) und die noch fehlende originale Video-/
   Pufferinitialisierung vor dem kontrollierten2607-Einstieg sowie weitere
   Pixelverfahren (Ishar2, explizite BIOS-Antwort0).
   Callback, Rückkehr, Frame mit zwei verdeckten Einträgen und Wiedereinstieg
   in MAIN sind nativ geprüft. Auch die folgenden43→66 (Dekrement/Sprung→Yield)
   stimmen in drei gültigen Speicherlayouts mit dem Original überein. Der
   Ablauf bis zum Ende dieser Warteschleife ist ebenfalls verglichen: Nach29
   zusätzlichen vollständigen Schedulerzyklen folgt43→17, dann Opcode78 bei
   SI15009. Aktivierung78 ist inzwischen ebenfalls implementiert und nativ
   verglichen; auch Auswahl71 bei SI15012 stimmt nativ überein. Danach folgt73
   bei SI15015. Dessen Vorbereitung, Ressourcenauflösung und erster rekursiver
   Verbundeintrag sind inzwischen nativ verglichen (Typ1, Grenze3432). Die
   Datensatzübernahme, alle drei Teilgrafiken und die Rückkehr sind inzwischen
   ebenfalls nativ verglichen; der normale/Verbundpfad72/73 ist angebunden.
   Die folgenden186/191 sind ebenfalls angebunden und nativ verglichen; MAIN
   führt nun auch185 aus: Nach elf weiteren Schritten folgt Yield bei SI15129.
   Der anschließende Callback/Frame erreicht nativ identisch das erste sichtbare
   Objekt. Dessen Einstieg3E55, Statusverarbeitung und erste Projektion36E1
   sind inzwischen ebenfalls nativ verglichen, bis zur Rückkehr nach40DC.
   Listenumsortierung und alle31 Einträge dieser Gruppe sind inzwischen bis
   vor dem43FB-Aufruf bei4168 nativ verglichen. Dessen Sichtbarkeits-/Clipprüfung,
   Grafikformatwahl und erster Typ1-RAM-Pixellauf sind inzwischen ebenfalls
   nativ verglichen. Der kontrollierte Start hat aber Ziel0:0 und Pitch0:
   noch kein gueltiger Frame in diesem kontrollierten MAIN-Test.
   Der Originalpfad0787..08FE (nach Timer-Rueckkehr) ist inzwischen durchgehend nativ verglichen:
   Konfiguration, Ressource, BIOS/EMS, Audio-Fallback, Tastatur, VGA, Maus und Timer mit drei originalen IRQ-/IRET-Ausfuehrungen.
   Dieser Pfad erzeugt Pitch320 und VGA-ZielA000:0 selbst (64 kombinierte
   Faelle;32 separate IRQ-/Timer-Abschlussfaelle). Externe Dienste sind explizite Antworten;
   aktive Audiotreiber und IRQ0A sind darin nicht vollstaendig rekonstruiert.
   Naechster Schritt: Joystickinitialisierung08FF, weitere Startpruefungen
   und MAIN-Anschluss. Aktive IRQ-Callbacks/BIOS-Ketten bleiben offen.
   Ein sichtbarer Gesamtframe bleibt unbewiesen.
   FE-Sonderpfad, weitere Operandformen
   und sichtbare Ausgabe bleiben offen. Verwandte Wortänderungen192/193/194 haben separate
   native Befehlsnachweise, noch keinen vollständigen Inhaltsablauf.
   Ohne BIOS-Antwort bleibt der Callback an116 stehen. Aktive Objektliste und
   kontextbezogene Zeichenliste bleiben getrennt;188-Grafikzweige sind separat offen.
   Abnahme:
   Register, Speicher, Zeiger und Stopgrenzen pro Profil stimmen überein.
2. **Erster vollständiger Original-Modnachweis je Spiel.** Bestehenden sicheren
   CONT- oder Palettenexport verwenden, passende Referenzsituation auswählen,
   Baseline und Änderung in getrennten Originalspielkopien laden. Sichtbaren
   Effekt und Quellhashschutz dokumentieren. Export-Readback allein genügt nicht.
3. **Originaler Itemablauf, danach NPC/Shop und Kampf.** Jeweils eine konkrete
   Originalszene mit Originalzustand als Abnahmefall: Darstellung, Interaktion,
   Zustandsänderung, Speichern/Laden. Fehlende Routinen entlang dieses Ablaufs
   erschließen; keine erfundene Spielregel zum Überbrücken. Für Ishar 1 separat
   nachweisen, nicht aus Ishar 2 ableiten.
4. **Editorfähigkeit je nachgewiesenem Inhalt.** Erst den jeweiligen Datenpfad
   lesen/ändern/exportieren und im vorgesehenen Laufzeitziel prüfen; anschließend
   neue Datensätze und Kapazitätsgrenzen testen. Originalkompatible Exporte und
   Erweiterungen bleiben getrennt gekennzeichnet.

## Fortschrittsmessung ab jetzt

Für jede Lieferstrecke einen konkreten Abnahmefall mit Profilhash, Originalstelle,
Quellcode, reproduzierbarem Prüfaufruf, Ergebnis und verbleibenden Grenzen führen.
„Bestanden“ gilt nur für diesen Fall. Eine Gesamtprozentzahl setzt zusätzlich eine
vollständige, gewichtete Anforderungsliste und begründete Restaufwände voraus;
beides ist noch nicht vorhanden. Bis dahin offene/bestandene Abnahmen berichten.

Diese Bestandsaufnahme ist ein Dokumentationsschritt, keine neue Runtimefunktion.
Sie behauptet insbesondere keine aktuell neu getesteten Browser- oder Originalspielabläufe.

2026-10-18: Joystick10CC..1136/13F1..1423 independently verified against both originals (80 cases); includes both timeout phases and partial failures. Contiguous prefix remains08FF until integration. Next0902..0953 and MAIN caller; full boot remains open.

2026-10-18: Contiguous engine0787..0952 now verified for both games through joystick and final checks, stopping atRET0953 or original low-memory0A6F boundary;64 connected cases and640 independent final-check cases. Explicit version minima67C0(I1)/6F80(I2). Next actual caller/MAIN connection and interactive memory-failure branch; not complete boot.

2026-10-18: Actual engine entry25E5 and PSP prefix072D now reconstructed (168 native cases), connected with original SS1C0B/SP0800 and saved register frame through successful RET0953/far8DBE to MAIN caller2604 (64 cases incl. menu/low-memory stops). Next7641/78F9 and resource loader on that state, then2607 without zeroing globals. Full boot remains open.

2026-10-18: Original25E5 startup now connects through7641/78F9 B04-zero branch to actual MAIN header/table/pool initialization77F5, without clearing globals or injected layout;64 connected cases (six reach77F6, other menu/low-memory stops). Native private checkpoints saved outside repo. Next actual-buffer decode/close/registry/root and2607; full boot still unproven.

2026-10-18: Six actual-startup77F6 checkpoints (fourI1/twoI2) now execute native MAIN A1/close/registry/root and true caller returns to2607. Independent parser image, decode registers, end pointer, root range/globals/ES/BX/SP match; original-selected905F/E000 buffers retained. VGA correctly skips185E conversion. Decoder scratch/notification full-memory reconstruction remains open. Next scheduler/MAIN/frame on these initialized states.

2026-10-18: Shared physical scheduler/context replaces blanket overlapping-window rejection;1152 native alias cases pass. Physical expression wrapper preserves alias visibility/atomic failure. Actual-startup MAIN prefix passes145 opcodes perI1 state and134 perI2 state (848 transitions across six checkpoints). Next actual-state I1 DOS FindFirst expression156 and I2 palette fade188->5CF4, then frame; old zero-global path is not equivalent.

2026-10-18: Physical expression156 now connects explicit read-only DOS FindFirst (fourI1 states x success/error,149/148 opcodes); nextI1 tag118. VGA single-pass palette fade0EC9 and opcode188 return reconstructed,140 native color/step cases. BothI2 states now reach139-opcode yield,7-opcode callback and first frame return with pitch320/A000:0000 (two hidden objects, no visible frame claim). Next actual-state context/cycles/visible pixels and IRQ palette processing.

2026-10-18: Expression118 memory/free-pool selectors0..4 and unknown fallback reconstructed (336 native cases); disk A..D remains explicit boundary. I1 actual-startup now162/161 opcodes then opcode106. I2 actual-state context/MAIN/callback/frame cycles match through30 additional cycles to first visible-object3DE4 (BX738/CX154), retaining320/A000. Private checked terminal checkpoints saved. Next actual-state object/projection/pixels and I1 opcode106; no visible frame claim.

2026-10-18: Actual-startup I2 first-visible owner/projection/31-record batch/clip/dispatch/type1 fill verified in both states, whole-memory/register comparisons except079E..07ED CPU scratch. First real320x200 fill makes64000 distinct writes to original-selected E000 render buffer; A000 presentation unproven. Private430A checkpoints saved. Native-only next-format probe sees type1 records230/268 then type16 record306/0553. Next record traversal/type16/presentation, plus I1 opcode106.

2026-10-18: Normal430A/449C/447A record continuation reconstructed; three actual next-record transitions perI2 state match. Normal type16 nibble transparency/palette/parity/stride reconstructed and720 native cases pass (mirrored05AA explicitly open). Actual records230/268/306 match solid/solid/type16 writes15000/14504/15 and full-memory/register checks; private first-glyph checkpoints saved. Next remaining record/end-batch/presentation; no displayed image claim.

2026-10-18: BothI2 startup draw batches now compare all31 records (three surfaces/28 glyphs) and original last-owner/direct present path. VGA0010/0148 word-copy reconstructed;360 native odd-width/stride/wrap/alias cases pass. Actual E000->A000 transfer writes64000 bytes and source/VGA hashes match. Connected scratchmask0798..07ED. Private43D0 checkpoints saved. Next caller/frame completion, MAIN and IRQ palette/DAC; no complete colored/timed screen claim.

2026-10-18: Actual first-rendered I2 frame return43D0..264C verified with original saved CPU frames,31-record clean traversal, full registers/SP and memory. VGA IRQ palette callback/DAC-cache/signed delay reconstructed (288 native cases); real installed IRQ prefix invokes it on both startup states and matches256 RGB uploads through0DC9. Outer IRQ pending, BIOS tail/IRET not claimed. Private pre-IRQ264C checkpoints saved. Next MAIN continuation/IRQ tail and colored verification; I1 opcode106 still open.

2026-10-18: Post-palette0DC9..0E46 reconstructed with active-service boundaries, signed selection/AH detail, countdown and real saved-register IRET or BIOS far handoff;74 native cases pass. Both actual rendered states reach stored7000:1234 target with interrupted registers and pending hardware frame preserved (handler not executed). Pre-IRQ264C MAIN resume matches scheduler/opcode215 then stops at104. NextI2 opcode104/I1 opcode106 and OS dependencies; not full startup.
