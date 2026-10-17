# Ishar 2: EATT-Signalpfad und ALIS-Tabellen

Stand 2026-10-17. Statisch rekonstruierter Teilpfad, keine vollständige NPC-, Dialog- oder Kampfimplementierung. Ishar 1 ist hier nicht abgedeckt.

## Herkunft

Lokales DOS-EATT.IO SHA-256 `d5ef72a5b25eabb50e89a9142ef8acf176f9023c82e694bfe8a06290ba7b14ec`. Imageoffsets beziehen sich auf das entpackte Modul, nicht die komprimierte Datei. Lokales Listing wird im Test mit den Instruktionspräfixen des Originals verglichen. Lange Instruktionsbytes sind im Listing teilweise gekürzt; der Vergleich ist ausdrücklich kein vollständiger Disassembler- oder Ausführungsnachweis.

`original-actor-signal.ts` rekonstruiert den Aufrufer 0x00188–0x00206 und die Routine 0x00339–0x00552. Voraussetzungen: Eingangsprüfung aus `original-actor-ai.ts`, Stillstand als expliziter Parameter, Nahbereich/Achse, Byte 0x4964+Slot gleich null, positiver Zustand 0x43ba+Slot und das Original-Prädikat zur Blickrichtung. Bei identischer Position wird zusätzlich die Akteursorientierung 0x35ce+2*Slot geprüft. Richtungsnummern werden unverändert ausgewertet; keine neue Sichtfeldregel.

Die Routine erzeugt Modulstart 0x12 mit Parameterbyte 0x0D und geordnete MAIN-Schreiboperationen. Die Sprachmodule MESSAGE.IO, MESSAGEE.IO und MESSAGED.IO tragen im lokalen Bestand dieselbe Modul-ID 0x12. Welche Variante aktiv ist, entscheidet die Originalinitialisierung; diese Funktion wählt keine Sprache.

## Verzweigungen und Seiteneffekte

- Zustand 99 liest den Signalwert aus der zweidimensionalen Tabelle 0x426E mit Slot und zweitem Index 0.
- Signal 8 prüft fünf Gruppenplätze: positive Werte aus 0x2D5C und Tabellenwert [Platz,11] aus 0x2D8E ungleich -80 setzen 0x43BA+Slot auf -2 und beenden den Pfad.
- 0x48F4+Slot gleich null: Signal starten, Aktivierung auf 1 und Bestätigung 0x442A+Slot auf -1 setzen.
- Bestätigung 1: Zustände 1/20/22 vergleichen vorzeichenbehaftet 0x378A mit 0x3FCE; Zustand 2 zusätzlich 0x3868. Je nach Zweig entstehen negatives Signal oder -1 sowie Statusschreibungen. Typ 61 setzt vier Werte in der Originalreihenfolge zurück.
- Andere Bestätigung gleich aktuellem Zustand: negatives Signal starten und 0x4964+Slot auf 1 setzen. Andernfalls keine Operation.

Neutrale Adressnamen bleiben erhalten, solange die vollständige Feldbedeutung nicht nachgewiesen ist. Die API liefert nur einen Trace. Sie schreibt weder MAIN noch Saves und startet keine Browserinteraktion. Im Playtest ist sie noch nicht verdrahtet. Insbesondere ist dies nicht der negative Kampfzweig 0x00553 und nicht dessen Schadens-/Animationshandshake.

## Mehrdimensionale Tabellen

`original-alis-arrays.ts` liest originale DOS-`cdim`-Instruktionen: Opcode 0x29, signed16 Variablenoffset (LE), Dimensionsanzahl, Elementbreite, unsigned16 Byte-Strides (LE). Referenz: lokale ALIS-C-Implementierung `opcodes.c:cdim` und `alis.c:tabchar/tabint`. Für die vorliegende alte DOS-Variante gilt: Adresse = Basis + letzter Index * Zugriffsbreite + Summe(Stride * vom Operandenstapel genommenem Index).

MAIN-Deklaration bei Imageoffset 0x001A5: Basis 0x426E, Bytebreite 1, zusätzlicher Stride 3. Bei 0x0009B: Basis 0x2D8E, Breite 2, Stride 30. Die Strides sind **Bytes**, keine Elementanzahlen. Der vorhandene vereinfachte Animationsinterpreter unterstützt bisher nur seine verwendeten eindimensionalen Zugriffe; dieser neue Helfer ist keine Behauptung einer vollständigen VM. Indirekte/v30-Tabellen werden abgewiesen.

## Tests

```powershell
npm run test:original-actor-signal
$env:ISHAR2_DIR='E:\Spiele\Ishar2'
$env:ISHAR_ACTOR_LISTINGS='<lokaler Pfad zu den Ishar-2-Listings>'
npm run test:original-actor-signal-local
```

Tests prüfen Aktivierung, Bestätigungen, Rücksetzungen/Schreibreihenfolge, signed-Vergleiche, alle fünf Gruppenpositionen, vier Blickrichtungen, identische Position, fehlenden Zustand und Quellschutz. Originaltest prüft EATT-Hash/Instruktionspräfixe sowie zwei cdim-Deklarationen direkt im MAIN-Image. Die isolierte Routine kann für alle 60 START.SAV-Slots ohne Mutation ausgewertet werden; ohne Aufrufvoraussetzungen sind solche Ergebnisse keine vorhergesagten Spielsituationen.

Offen: unabhängiger Originalausführungsvergleich, MESSAGE-Initialparameter/Scheduler/Bestätigung zurück nach EATT, vollständige Sprach-/Textwahl und Dialoginteraktion, negative Kampfzweige samt Zielwahl und Schaden. Diese Lücken werden nicht durch erfundene Spielregeln ersetzt.
