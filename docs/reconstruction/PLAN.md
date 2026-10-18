# Rekonstruktionsplan für Ishar 1 und Ishar 2

## Verbindlicher Umfang und Nachweis

Das Gesamtziel ist die vollständige dokumentierte Rekonstruktion beider lokalen
Zielversionen sowie ein Toolkit zum Bearbeiten und Erweitern aller erschlossenen
Inhaltsarten. Der aktuelle Browserausschnitt ist ein Zwischenstand.
Rekonstruktionsziel ist überprüfbare Verhaltensgleichheit; binäridentischer
Neuaufbau der EXE wird derzeit nicht behauptet. Erweiterungen werden getrennt
von Originalkompatibilität ausgewiesen.

Jede Funktion braucht Spiel/Dateihash, Adresse oder Offset, Ein-/Ausgaben,
Seiteneffekte, Codezuordnung, Testnachweis und offene Fragen. Statische Analyse,
Rekonstruktion, Implementierung und Originalvergleich sind getrennte Statuswerte.
Ein bestandener synthetischer Test beweist keine Original-Verhaltensgleichheit.

## Priorisierte Arbeitspakete

| Priorität | Ergebnis | Abnahmebeleg | Aktueller Stand |
|---|---|---|---|
| P0 | Bestands- und Versionsprofile beider Spiele | Dateimanifeste, Hashes, Herkunft und aktive Sprache | Inventur vorhanden; Edition/Sprache unbestätigt |
| P0 | Sicherer verlustfreier Datenzugriff | No-op-Roundtrip, gezielte Änderung, unbekannte Bytes erhalten, defekte Eingaben abgewiesen | 13 CONT-Dateien geprüft; weitere Formate offen |
| P0 | Vollständiger erster Mod-Ablauf pro Spiel | Import, Änderung, Export in Arbeitskopie, Original startet und zeigt Änderung | Noch nicht nachgewiesen |
| P1 | ALIS-/Packer-Profile beider Spiele | Header-/Opcode-/Adresszuordnung pro Hash, Loader-/Writer-Tests | Ishar-1/2-Images auditiert; Ishar-1-Listings und SAV-I/O abgeleitet; A1-Writer gegen Decoder geprüft, Original-Verhaltensbelege offen |
| P1 | Laufzeit und Originalvergleich | reproduzierbarer Start, kontrollierte Eingaben/Zeit/RNG, Zustands- und Bildvergleich | Browser verfügbar; Original-Testumgebung neu prüfen |
| P1 | Welt und Zustandsverwaltung | alle Karten-/Gebietswechsel und Kollisionen je Spiel vergleichen | Ishar 2 teilweise; Ishar 1 Kartenbytes gelesen |
| P1 | Charaktere, Items und Handel | Save-/Codeherkunft, Export und Original-Readback | Ishar 2 teilweise; Kandidatentabellen nicht pauschal bestätigt |
| P1 | NPCs, Gegner und Kampf | EATT-Sender, Zielwahl, Flags, Schaden, Projektilskripte Ende zu Ende | Eingangsprüfung, positiver Signalpfad als Trace und drei Figurenskripte teilweise; vollständiger Handshake offen |
| P2 | Zauber, Dialoge, Quests, Trigger | tatsächliche Originaltabellen und Codepfade editieren/prüfen | Nicht vollständig erschlossen |
| P2 | Grafik, Animation, Texte und Audio | Decoder/Writer, Editor, Import/Export, Referenztests | Grafikvorschau und DOS-Paletteneditor samt IO-Writer vorhanden; Pixel-/Animationswriter und Audio offen |
| P2 | Integrierte Ressourcen-/Modverwaltung | Abhängigkeiten, Undo/Redo, Sicherung, reproduzierbarer Export | Teilweise Browserprojekt; binäre Mod-Pipeline offen |
| P3 | Neue Inhalte | ID-/Speichergrenzen, neue Referenzen, Ausführung und Exportziel dokumentiert | Authored-JSON-Zusätze existieren, Originalexport nicht belegt |
| P3 | Vollständigkeitsprüfung | alle Bereiche beider Spiele und alle Abnahmekriterien einzeln belegt | Offen |

## Nächster konkreter Schritt

Aktueller Nachtrag 2026-10-18 (Grok-Integration): Beide Kampfverträge sind
übernommen. Die lokale Prüfung der originalen FRISE-Treffer-/Schadensausdrücke
besteht mit je 108 Fällen; native RNG-Aufrufe mit Grenze null sind für beide
Profile geprüft und der Interpreter ist korrigiert. Siehe
COMBAT_EXPRESSION_VERIFICATION.md und COMBAT_ZERO_BOUND_RANDOM.md.
Offen sind vollständige Bytecode-/Routinevergleiche, Zielwahl, HP-/XP-Schreibpfad
und Timeranbindung. Der physische A1-Modullader ist weiterhin ein ungeprüfter
Entwurf; ein vollständiger Originalstart und vollständige Kämpfe werden nicht
behauptet. Frühere nächste Schritte unten sind historische Zwischenstände.

Aktualisierung 2026-10-18: Die native MAIN-Ladekette ist inzwischen bis zur
Kontextanlage und Rückkehr geprüft. Nächste technische Lücke ist die hostseitige
Grafiknotification und die Verbindung dieses Kontexts mit der Skriptausführung.
Nachtrag: Der normale Grafikpfad, die Schedulerübergabe, beide ersten Opcode70
und die folgenden117/114 Opcode41 sind inzwischen nativ verglichen. Nächste
konkrete Lücke ist Opcode30 im erreichten MAIN-Zustand; Einzelheiten in
DOS_STARTUP.md und COVERAGE.md. Der vollständige Spielstart bleibt offen.
Die vollständige Lieferstrecke und getrennte Abdeckung beider Profile stehen in
[COVERAGE.md](COVERAGE.md). Der folgende Original-Modnachweis bleibt ebenfalls offen.

Der vorhandene CONT-Parser trägt jetzt einen reproduzierbaren Patch-Export
mit Eingangs-Hashbindung, Änderungsmanifest und Ausgabe ausschließlich außerhalb
der Originalinstallation (siehe MOD_WORKFLOW.md). Als Nächstes Originalausführung in einer separaten
Kopie einrichten und eine bewusst gewählte Kartenänderung in beiden Spielen
prüfen. Parallel keine neuen Kampfregeln als Ersatz für fehlende Decompilierung
hinzufügen. EATT bleibt offen, bis Sender, Empfänger und Rückmeldeflags zusammen
nachgewiesen sind.

## Dokumentationspaket und Abschlussprüfung

- INVENTORY.md: Versionen, Dateien, Werkzeuge und Herkunft.
- STATUS.md: getrennte Abdeckung beider Spiele, Architektur und Grenzen.
- FORMATS.md: erste Formatspezifikation, weitere Typen explizit offen.
- MOD_WORKFLOW.md: vorhandener Builder-/CLI-Export und noch offene Originalprüfung.
- ALIS_MODULES.md: DOS-Modulprofile, Roundtrips und originales Ishar-1-SAV-I/O.
- A1_WRITER.md: Schreiben geänderter A1-Images, Codec-Tests und Original-Grenzen.
- PALETTE_EDITOR.md: originalbasierte DOS-Farbtabellen, Export und Testgrenzen.
- EATT_SIGNALS.md: positiver EATT-Signalpfad und mehrdimensionale ALIS-Zugriffe.
- NPC_GOLD_AND_OPERANDS.md: FRISE-Goldübergabe, EATT-Bestätigung und korrigierte Operandenregister.
- ISHAR2_SAVE_MAIN.md: binär abgeleitete Save-Abbildung und geschützter MAIN-Patch-Export.
- ALIS_FORMS_AND_SELECTION.md: Formressourcen, referenzbasierte Treffer und originaler Auswahlablauf.
- ALIS_ENTITIES.md: referenzbasierte Live-Entityliste und Originalform-Adapter.
- Dieses Dokument: Plan und Abnahmebelege.
- README.md und bestehende GRID_MODEL/ASSET_PACK/ORIGINAL_GAMEPLAY_DECOMPILE:
  Einrichtung sowie bisherige Analysen; alte Aussagen immer gegen aktuellen Code prüfen.
- Noch zu ergänzen: vollständige Original-Codezuordnung, Benutzerhandbuch,
  Neue-Inhalte-Handbuch und vollständige Kompatibilitäts-/Referenztestmatrix.

Abschluss erst nach vollständiger Prüfung aller zehn Abschnitte der Zielsetzung:
beide Profile, alle relevanten Ressourcen/Subsysteme, Parser/Writer, Toolkit,
neue Inhalte, beide Laufzeiten, Exportnachweise und reproduzierbare Dokumentation.
Die Existenz dieses Plans erfüllt diese Anforderungen nicht.
