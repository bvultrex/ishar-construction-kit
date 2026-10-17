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
