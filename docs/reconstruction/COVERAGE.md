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
   sind die DOS-Dateisuche156 (Ishar1) und nach dem188-Rückkehrpfad der erste
   erste Framegrenze nach MAIN-Rückkehr-Callback (Ishar2, explizite BIOS-Antwort0).
   Callback, Rückkehr, Frame mit zwei verdeckten Einträgen und Wiedereinstieg
   in MAIN sind nativ geprüft. Auch die folgenden43→66 (Dekrement/Sprung→Yield)
   stimmen in drei gültigen Speicherlayouts mit dem Original überein. Der
   Ablauf bis zum Ende dieser Warteschleife ist ebenfalls verglichen: Nach29
   zusätzlichen vollständigen Schedulerzyklen folgt43→17, dann Opcode78 bei
   SI15009. Aktivierung78 ist inzwischen ebenfalls implementiert und nativ
   verglichen; danach folgt71 bei SI15012. Dieser nächste Objektbefehl und die
   folgende sichtbare Ausgabe bleiben offen.
   Ohne BIOS-Antwort bleibt der Callback an116 stehen. Aktive Objektliste und
   leere Kontextobjektkette bleiben getrennt;188-Grafikzweige sind separat offen.
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
