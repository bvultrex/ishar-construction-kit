# CONT2-Prüfung und Plan für Items/NPCs

## 2026-10-11: authorbare NPCs und erster Handel

- Der Builder hat einen Bereich „NPCs & Händler“ mit Dialog, Grafikzuordnung, Waren, Preisen, Bestand und Startgold. NPCs werden ausdrücklich auf authored Ortsfeldern platziert; CONT-Bytes werden dabei nicht verändert.
- Der Playtest zeigt und öffnet NPCs des aktuellen Feldes per Klick. Käufe prüfen Gold und die neun Inventarplätze, reduzieren Bestand und erzeugen individuelle Item-Kopien mit Besitzer. Neustart setzt Handel zurück.
- Item-Platzierungen haben persistente IDs; Builder-Änderungen erhalten die Identität verbleibender Kopien auch bei Verschieben oder Entfernen anderer Einträge.
- Noch offen: Originalereignisse für Ladeneintritte, Ladeninnenräume, Verkauf, Übernahme der originalen Waren-/Preislisten und aktiven NPC-Tabellen. Der jetzige NPC-Aufbau auf dem aktuellen Feld ist ein Authoring-Prototyp; originale Distanzprojektion, Verdeckung und Animation sind noch nicht angebunden. Laufzeitzustand wird noch nicht über Reload gespeichert.
- Regression: `test:npc-trading`, `test:items-scenes`, `test:builder`, Typprüfung und Build.

Stand: 11.10.2026. Arbeitsstand, keine Erklärung aller Renderer für fehlerfrei.

## CONT2: bestätigte Ursache

Die im Builder ausgewählte CONT2 hatte 54×90 Felder und 4.860 Bytes. Ihre SHA-256
`35c53a6d1d3faab7017baba9f6f0a35847b2ca3a44c8c24c8fe137316f632653`
stimmt mit der lokalen Ishar-1-CONT2 überein. Sie wurde fälschlich mit Ishar-2-ARBO
dargestellt. Gleiche Dateinamen sind kein Nachweis desselben Spiels.

Ishar 2 CONT2: 90×60 Felder, zwei Ebenen, 10.800 Bytes; SHA-256
`79fd2b816edb91d165216a669d7f53da26a93b101607b61f515193f84facf865`.
Die lokale Originaldatei bleibt außerhalb des Repositorys.

Korrekturen:

- Importmeldung und Builder zeigen die erkannte Spielversion. Ishar-1-Karten bleiben
  exportierbar, erhalten einen Prüfhinweis und werden nicht mehr als Ishar 2 gerendert.
- Ishar-2-Zeichenoperationen und „Ab hier testen“ sind für Ishar 1 gesperrt.
- Importierte Ishar-2-Außenkarten erhalten den passenden Leveltyp und das passende
  Asset-Set statt pauschal Dungeon 1.
- Die Vorschau ermittelt den Szenentyp auch für Außenkarten. Ohne Spielstand oder
  Bewegungshistorie bleibt der nächste erreichbare Szenenauslöser eine Näherung.

## Nachprüfbare Prüfung

`scripts/check-cont2-local.mjs` vergleicht den Renderer mit lokaler Ausführung des
disassemblierten ARBO-Skripts: 26 Positionen × vier Richtungen, einschließlich
25/40 und 28/34. Ergebnis: 104 Ansichten, 1.799 übereinstimmende Draw-Platzierungen
(x, y, Tiefe, Sprite-ID und Spiegelung; z >= 99).

Voraussetzungen: `ISHAR2_DIR`, `ALIS_RESEARCH_DIR` mit `tools/alis_interp.py` und
`ARBO.asm`, sowie `PYTHON_EXE`. Aufruf: `node scripts/check-cont2-local.mjs`.
Das Skript legt Originaldaten nur temporär außerhalb des Repositorys ab.

Grenzen: kein Pixel-/Palettenvergleich, keine Aussage über alle Randzellen,
Overlay-Zustände, NPCs oder die weiterhin ausgeblendeten Draws mit z < 99.
Der Interpreter ist ebenfalls ein Prüfwerkzeug, kein Ersatz für einen DOSBox-Shot.
Der früher gemeldete Geländer-/Nahtfall ist deshalb erst mit gleicher Originalposition,
Blickrichtung und Szenenzustand visuell abschließend prüfbar.

Die bereits ergänzte r14-Prüfung verifiziert außerdem Bewegung, negative Wandzellen,
Außenkarten ohne Dungeon-Kanten, Ereignisfelder und Formattrennung. Originaler
Ereignisablauf, NPC-Kollision und Kartenwechsel sind noch nicht vollständig umgesetzt.

## Zielbild für platzierte Objekte

Definition und konkrete Instanz trennen. Zwei gleiche Schlüssel sind zwei Instanzen;
Aufheben eines Schlüssels darf nicht alle gleichartigen Schlüssel verschwinden lassen.
Jede Instanz bekommt eine stabile ID, Level-ID, Rasterposition r/c, Typreferenz,
Zustand und Herkunft (Builder oder Originalimport). Änderungen gehören in Projekt
und Laufzeit-Snapshot, nicht in die rohen CONT-Bytes.

Bei Originalkarten sind r/c und Originalblickrichtung verbindlich. Die Umrechnung
in CK-Koordinaten erfolgt an genau einer Schnittstelle. Ein Objekt bleibt beim
Drehen und Umlaufen an derselben Weltposition. Bildschirmkoordinaten sind kein
Speicherformat für Platzierungen.

## Umsetzung in überprüfbaren Etappen

### 1. Datenmodell und Builder

- `ItemDefinition`/`ItemInstance` und `ActorDefinition`/`ActorInstance` ergänzen.
  NPC, Händler und Gegner sind Rollen eines Akteurs; eine Begegnung ist Spielverhalten.
- Bestehende `location.itemIds` und `encounterId` deterministisch migrieren, mit
  Sicherung und stabilen Instanz-IDs. Alte Projekte weiterhin laden können.
- Eigene Kartenebenen für Items und Akteure; Platzierung auf ausgewählter Zelle,
  optionaler belegter Unterposition, Blickrichtung, Szenenzugehörigkeit und Verhalten.
- Vorschau, Undo/Redo, Export/Import und Validierung der Instanzen zusammen umsetzen.
  Warnungen für ungültige Koordinaten, fehlende Grafiken und widersprüchliche Belegung.

### 2. Items: Darstellung und bestehende Bedienung erhalten

- Mehrere sichtbare Items pro Zelle darstellen; derzeit wird oft nur das erste gewählt.
  Die bisherige Fernsichtschleife läuft im ursprünglichen Rasterrenderer nicht mit.
- Originale Bodensprites und ihre Distanzstufen getrennt von Inventar-Icons zuordnen.
  Fußpunkt, Palette, Transparenz, Blickabhängigkeit und Sichtweite am Original prüfen.
  Keine unbelegte universelle Größenformel als Originalregel ausgeben.
- Sichtbare Items in dieselbe Tiefensortierung wie Geometrie und NPCs einfügen;
  keine Schlüssel durch geschlossene Türen/Wände anklickbar machen.
- Getroffene Instanz anhand ihrer sichtbaren Fläche auswählen; Reichweite getrennt
  von Sichtbarkeit prüfen. Überlappende Treffer wählen das vorderste erreichbare Item.
- Zustandsfolge: Boden → Hand → Charakterinventar; Hand → ursprünglicher Bodenplatz
  bleibt möglich. Der Gegenstand bleibt am Mauszeiger. Portrait-Linksklick überträgt
  direkt, ohne Inventaröffnung. Kein Ablegen bereits eingelagerter Items auf den Boden
  (bisherige Nutzeranforderung). Keine Duplikation bei Doppelklick oder Neuladen.
- Originale Item-Platzierungstabellen und Item-Skripte sind noch separat zu ermitteln;
  CONT allein liefert keine verlässlich vollständige Item-Belegung.

### 3. NPCs: Originalzustand und Sichtbarkeit

- Die vorhandene lokale EAFF-Analyse zeigt: NPCs/Kreaturen kommen aus separaten
  Spielstandtabellen, nicht aus CONT-Layer B. Import benötigt Position, Richtung,
  HP/Präsenz, Typ und Szenenzugehörigkeit. CONT-Import allein erfindet keine NPCs.
- Tabellenadressen im ALIS-Zustand sind nicht automatisch Dateioffsets. Den Save-Lader
  als Grundlage verwenden; Grenzen, Anzahl und Datentypen gegen echte Saves prüfen.
- Mit einem stationären NPC beginnen. EAFF-Sichtprüfung, Kartensonderregeln,
  Original-Distanzsprites, Fußpunkte und Palette umsetzen, bevor Animation hinzukommt.
- Akteure in die gemeinsame Draw-Liste einfügen. Verdeckung, Geländer, Türen und
  gleiche Tiefen ausdrücklich testen. Original-Zeichenreihenfolge bei Gleichstand
  ist teilweise noch ungeklärt.
- Zufallsversatz/Animation dürfen die Weltposition nicht verändern. Für reproduzierbare
  Tests festen Seed bzw. festen Animationszeitpunkt verwenden.
- Interaktion/Kollision anschließend: reden, handeln oder angreifen anhand der Rolle,
  Reichweite und Sichtbarkeit. Originale Richtungssonderregeln erst nach Referenztest
  übernehmen; nicht jeder NPC wird pauschal aus jeder Richtung zum Kampfblocker.

### 4. Abnahme

| Test | Erwartung |
| --- | --- |
| Einzelobjekt von vier Nachbarfeldern | Feste Weltposition und passende Distanzstufe |
| Zwei gleiche Schlüssel | Nur angeklickte Instanz wechselt Besitzer |
| Tür/Wand zwischen Spieler und Objekt | Keine Darstellung/Interaktion durch die Sperre |
| Boden → Hand → Boden / Portrait | Verlustfrei, keine Inventaröffnung bei Übergabe |
| Speichern/Laden, Undo/Redo | Identische IDs, Positionen, Besitzer und Zustände |
| NPC tot, andere Szene, falsche Karte | Keine unbegründete Darstellung/Kollision |
| CONT2 Brücke, CONT3 Straße, CONT5 Raum | Korrekte Sortierung mit jeweiliger Geometrie |
| Originalsave + Referenzbild | Gleiche Karte, r/c, Richtung, Szenentyp und Animationsphase |

Empfohlene Reihenfolge: Formatabsicherung und korrekte CONT2 → Item-Instanzen mit
einem Schlüssel → stationärer Original-NPC → mehrere Objekte/Verdeckung → Animation
und weiterführende NPC-Interaktion. Das ist ein Implementierungsplan; diese neue
Item-/NPC-Pipeline ist in diesem Arbeitsstand noch nicht implementiert.

## Umsetzungsstand: CONT1 und Item-Instanzen

- Irvans Szenenwechsel aus GERDEP sind als zustandsabhängige Übergänge umgesetzt. Direkte Teststarts leiten einen Szenentyp aus der Position ab; gespeicherter Zustand hat Vorrang.
- Asset-Layout 23 stellt auch gewöhnliche ALIS-Bitmap-Einträge der Außenweltroutinen bereit, inklusive tatsächlich gespiegelter Varianten. Zuvor wurden nur zusammengesetzte Grafiken als Laufzeitsprites gebacken. CONT1 r50/c32, Blick West, zeigt im Builder und Playtest nun Bäume und Pflanzen. Browserkonsole ohne Fehler.
- Platzierte Gegenstände bekommen unabhängige Laufzeit-IDs und behalten ihre Definition für Schlüsselprüfungen. Aufnehmen einer Kopie entfernt keine anderen Kopien. Mausaufnahme, Zurücklegen und Transfer auf das Portrait wurden im Browser geprüft; der Transfer öffnet kein Gepäckfenster.
- Noch offen: persistente Instanz-IDs unabhängig von Listenpositionen, Speicherung des Laufzeitzustands, Original-Objekt-/NPC-Tabellen, deren Sichtbarkeit und Einordnung in die Tiefensortierung. Die derzeitige Itemplatzierung ist eine CK-Anordnung und keine bestätigte Originalplatzierung.
- Kollisionsgrundregeln und Szenenwechsel sind getestet; vollständige Originaltreue aller Baumansichten und Ereignissperren ist damit noch nicht bestätigt.
- Prüfungen: TypeScript, Produktionsbuild, r14, Builder und items-scenes bestanden.

### NPC-Importgrundlage

`save-actors.ts` liest ausschließlich das bestätigte Ishar-2-DOS-v2-Layout (8359 Bytes, Version 2). Dateioffsets: r 2601, c 2821, Blick 3041, HP 3261 (je 110 BE-Wörter), Typ 4911 und Szene 6781 (je 110 Bytes). Die Übersicht im Character Lab zeigt Kandidatenslots 50–109 mit HP > 0. Die aktive EAFF-Tabellenobergrenze ist noch nicht identifiziert; diese Liste darf deshalb nicht ungeprüft als vollständiger Spawnzustand verwendet werden.

Der Szenen-/Entfernungsfilter und die vier Blicktransformationen sind getrennt und getestet. Noch keine Aussage über Verdeckung, Originalzufallsversatz, Höheneinfluss auf Karte 4 oder NPC-Kollision. START.SAV liefert lokal 40 lebende Kandidatenslots; im Browser stimmen die Werte mit der Leseroutine überein. Originaldateien bleiben unverändert und außerhalb des Repositorys. Nächster Schritt: aktive Slotgrenze und stationäre Script-/Sprite-Zuordnung verifizieren, dann gemeinsame Tiefensortierung im Renderer.

### Gemeldete Nahansichten 11.10.

CONT3 Eingang r4/c55, Originalblick N/S: VARCHE #24 mit z=94 wurde durch z<99 pauschal unterdrückt. Für Karten 3/4 bleiben originale Vordergrundwerte 89–98 nun erhalten; die bisherige Karte-1/2-Ausnahme bleibt separat. Synthetischer Regressionstest und Browserprüfung in beiden Richtungen bestanden.

CONT2 r21/c34 West: Original-ARBO-Ausführung und CK-Zeichenliste stimmen überein, inklusive Plattform #88 und seitlichen #102m. Im Plattform-Composite #88 sind sämtliche vier Kinder #24/#25 vorhanden. Ein frontaler Geländersprite wird vom Skript bei A=14 nicht angefordert. Die markierten Anschlussstücke allein klären noch nicht, ob Original-Szenenzustand, anderes Modul oder ein weiterer Darstellungsfehler relevant ist. Vergleichsave CK2134W.SAV lokal erstellt (START-Kopie, Position21/34, F4, Karte2, Szenentyp54 aus nächstem erreichbarem Trigger; Szenenzustand ist damit abgeleitet, nicht per Originalspiel bestätigt). Referenzprüfung durch Nutzer steht aus. Keine CONT- oder Kollisionsänderung für diesen Fall.
