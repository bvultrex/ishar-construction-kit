# Teststand: Originalitems und Inventar

- Steinwächter verwendet bei lokal geladenen Ishar2-Assets GOLEM1.IO Composite38 (127×91).
- Originalinventar aller fünf Figuren mit Rucksack und Handplätzen9/10.
- Objekt9: vom Boden aufnehmen, zwischen Figuren und freien Händen weitergeben, wieder ablegen und als SAV-Kopie exportieren/laden.
- Handpanel schaltet den Empfängerklick um. Geprüfte Nichtstapelcodes9, -89..-60 und -29..-25 lassen sich aus Rucksack/Händen aufnehmen und in belegten unterstützten Handfeldern tauschen. Die unterschiedlichen Original-Rüstungsregeln bleiben erhalten.
- Stapel im Gepäck geben bei leerem Cursor wie das Original ein Stück ab. Ein ganzer Stapel gelangt über den Tausch mit einem gehaltenen Nichtstapel an den Cursor; Überschüsse am Zieldeckel bleiben dort erhalten. Teilübergabe, Tausch und SAV-Reload sind im Browser geprüft.
- Stapel lassen sich nun auch in den Handplätzen ergänzen oder tauschen. Teilmengen bis zum Deckel und der verbleibende Cursorrest sowie der alte Stapel beim Tausch werden originalgetreu erhalten; Export und Reload sind bytegenau geprüft.
- Der stat-unabhängige Ausrüstungsplatz12 unterstützt die belegten Codes -89..-82 einschließlich Rüstungswert, Tausch, Entnahme und Rückgabe. Zwei Export-/Reload-Rundläufe sind bytegenau geprüft.
- Waffen -116..-90 lassen sich im Gepäck weitergeben. Für Handablage im Originalinventar die eigene Ishar2-PARAM.IO laden: Zweihandwaffen reservieren die Gegenhand; Entnahme und Handtausch lösen die alte Reservierung. Eine belegte Gegenhand verhindert die Ablage. Browserprüfung mit Zweihandwaffe, Export/Reload und Rückgabe bestanden.
- Objekt10: Gold gutschreiben, Übertrag berücksichtigen und gehaltenen Beutelbetrag löschen; kein Inventareintrag.
- Originale Tavernenfelder öffnen einen getrennten Mahlzeitablauf: Preis500+40·t, Geldmangel ohne Änderung, Bestätigung, Nachrichtenphase, Zwei-Pass-Zahlung über belegte Figuren, Nahrung und DOS-Zeitfortschreibung.
- SAV-Export übernimmt die aktuelle Originalposition, Blickrichtung und Szene.
- Separater hashgeprüfter Ishar1-MAIN/SAV-Feldeditor mit Undo/Redo. Alte unbestätigte Kandidatenmap bleibt schreibgesperrt.

## Begutachten

1. Eigene Projekte vor Tests über den Projektexport sichern. Die Demo-Party ersetzt beim Laden die aktuelle Party.
2. Eigene Originalarchive im Asset Lab laden. Originaldateien sind im Paket nicht enthalten.
3. Im Playtest eine eigene Ishar2-SAV-Arbeitskopie laden. Die passende CONT-Karte und Position müssen im Projekt vorhanden sein.
4. Für ein vorhandenes Objekt9 auf CONT1: aufnehmen, Empfänger wählen, im Originalinventar erneut aufnehmen, an einen freien Handplatz einer anderen Figur geben und wieder ins Gepäck übernehmen.
5. SAV-Kopie exportieren und erneut laden. Ausgangsslot muss leer, Zielslot belegt sein. Mit Objekt am Cursor sind Export, Neustart und Laden gesperrt.
6. Für den Rohfeldeditor im Character Lab Spielprofil wählen, eigene MAIN.IO (Ishar1) beziehungsweise IO.IO (Ishar2) prüfen und eine SAV-Kopie öffnen. Einzelne Feldänderung, Undo/Redo, Export und Reload prüfen.
7. Für Waffen im Originalinventar „Waffenprofile laden (PARAM.IO)“ verwenden. Eine vorhandene Waffe aufnehmen, Handpanel der Zielfigur öffnen und einen verfügbaren Handplatz wählen. Bei Zweihandwaffen zeigt der andere Platz die Reservierung. Export/Reload prüfen; danach die Waffe entnehmen und ins Gepäck zurückgeben. Bei voller Gegenhand bleibt die entsprechende Ablage gesperrt.
8. Für Stapel einen Stapel aus dem Gepäck auf einen belegten Handstapel legen. Bei Erreichen des Deckels muss der Rest am Cursor bleiben. Ein anderer unterstützter Gegenstand tauscht gegen den vollständigen alten Handstapel samt Menge.
9. Für Ausrüstung das Hand-/Ausrüstungspanel öffnen. Einen Code -89..-82 aus dem Rucksack auf Platz12 übernehmen oder gegen vorhandene Ausrüstung tauschen; Rüstungswert, Export/Reload und anschließende Rückgabe prüfen.
10. Auf einer importierten Ishar2-Karte einen Tavernen-Ereigniseingang betreten. „Essen“ wählen, die getrennte Nachricht schließen und danach die Taverne verlassen. Gold, Nahrung und Zeit im Originalinventar beziehungsweise nach SAV-Reload vergleichen. Bei zu wenig Gesamtgold darf sich der Save nicht ändern.

## Lokale Originalhändler

Der Händlerpfad benötigt zusätzlich die lokal erzeugten Skriptlistings. In PowerShell vor dem Serverstart setzen:

```powershell
$env:ISHAR_MERCHANT_LISTING='D:\eigene-listings\ishar2\MARCHAND.IO.asm'
node scripts/serve-build.mjs
```

Die zugehörigen OBJET.IO.asm-, IO.IO.asm-, EAFF.IO.asm-, MAIN.IO.asm- und Figurenskriptlistings müssen daneben liegen. Dieser optionale Zugang funktioniert ausschließlich über127.0.0.1. Die Quellen werden nicht ins Paket kopiert.

## Grenzen

Dies ist ein Entwicklungsstand. Vollständiger Originalstart, alle NPCs, sämtliche Items und weitere Ausrüstungsregeln fehlen. Die zwei Stapel-Handkernfälle sind im Browser samt Export/Reload geprüft und in einem separat berichteten Original-EXE-Lauf bestätigt; Reservierung-125, Effektcode16 und weitere Sonderfälle bleiben nativ offen. Der stat-unabhängige Ausrüstungsplatz12 ist im Browser geprüft, aber noch nicht nativ abgenommen. Waffen-Handablage und Tausch sind anhand der lokalen Skripte und Hosttests angebunden; der Zweihand-Export/Reload ist im Browser geprüft, eine native Waffenabnahme steht aus. Der Tavernenablauf ist im Browser samt bytegleichem Export/Reload geprüft; der Mehrzahlerpfad ist statisch und lokal gebunden, nativ wurde bisher nur der Einzelzahlerfall beobachtet. Objekt9 und10 auf CONT1 verwenden die im Original vermessenen Klickrechtecke. Original-Türmechanik und transiente NPC-Zustände werden nicht vollständig gespeichert. Außerhalb des belegten Umfangs keine vollständige Originalspiel-Kompatibilität annehmen.

Originalnachweise, Browserintegration und Dateiroundtrips werden getrennt geführt. Hoths Originalspielbericht bestätigt die positiven Objekt9-/Gold10-Pfade; weitere Grenzen bleiben offen. Die genaue Quellrevision und Dateihashes stehen in BUILD_MANIFEST.json.
