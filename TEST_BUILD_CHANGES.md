# Teststand: Originalitems und Inventar

- Steinwächter verwendet bei lokal geladenen Ishar2-Assets GOLEM1.IO Composite38 (127×91).
- Originalinventar aller fünf Figuren mit Rucksack und Handplätzen9/10.
- Objekt9: vom Boden aufnehmen, zwischen Figuren und freien Händen weitergeben, wieder ablegen und als SAV-Kopie exportieren/laden.
- Handpanel schaltet den Empfängerklick um. Geprüfte Nichtstapelcodes9, -89..-60 und -29..-25 lassen sich aus Rucksack/Händen aufnehmen und in belegten unterstützten Handfeldern tauschen. Die unterschiedlichen Original-Rüstungsregeln bleiben erhalten.
- Stapel im Gepäck lassen sich ganz oder stückweise aufnehmen und weitergeben; Überschüsse am Zieldeckel bleiben am Cursor. Teilübergabe, Einzelentnahme und SAV-Reload sind im Browser geprüft.
- Objekt10: Gold gutschreiben, Übertrag berücksichtigen und gehaltenen Beutelbetrag löschen; kein Inventareintrag.
- SAV-Export übernimmt die aktuelle Originalposition, Blickrichtung und Szene.
- Separater hashgeprüfter Ishar1-MAIN/SAV-Feldeditor mit Undo/Redo. Alte unbestätigte Kandidatenmap bleibt schreibgesperrt.

## Begutachten

1. Eigene Projekte vor Tests über den Projektexport sichern. Die Demo-Party ersetzt beim Laden die aktuelle Party.
2. Eigene Originalarchive im Asset Lab laden. Originaldateien sind im Paket nicht enthalten.
3. Im Playtest eine eigene Ishar2-SAV-Arbeitskopie laden. Die passende CONT-Karte und Position müssen im Projekt vorhanden sein.
4. Für ein vorhandenes Objekt9 auf CONT1: aufnehmen, Empfänger wählen, im Originalinventar erneut aufnehmen, an einen freien Handplatz einer anderen Figur geben und wieder ins Gepäck übernehmen.
5. SAV-Kopie exportieren und erneut laden. Ausgangsslot muss leer, Zielslot belegt sein. Mit Objekt am Cursor sind Export, Neustart und Laden gesperrt.
6. Für den Rohfeldeditor im Character Lab Spielprofil wählen, eigene MAIN.IO (Ishar1) beziehungsweise IO.IO (Ishar2) prüfen und eine SAV-Kopie öffnen. Einzelne Feldänderung, Undo/Redo, Export und Reload prüfen.

## Lokale Originalhändler

Der Händlerpfad benötigt zusätzlich die lokal erzeugten Skriptlistings. In PowerShell vor dem Serverstart setzen:

```powershell
$env:ISHAR_MERCHANT_LISTING='D:\eigene-listings\ishar2\MARCHAND.IO.asm'
node scripts/serve-build.mjs
```

Die zugehörigen OBJET.IO.asm-, IO.IO.asm-, EAFF.IO.asm-, MAIN.IO.asm- und Figurenskriptlistings müssen daneben liegen. Dieser optionale Zugang funktioniert ausschließlich über127.0.0.1. Die Quellen werden nicht ins Paket kopiert.

## Grenzen

Dies ist ein Entwicklungsstand. Vollständiger Originalstart, alle NPCs, sämtliche Items, Stapel-Handtausch, Waffen-/Zweihandtausch und weitere Ausrüstungsregeln fehlen. Objekt9 und10 auf CONT1 verwenden die im Original vermessenen Klickrechtecke. Original-Türmechanik und transiente NPC-Zustände werden nicht vollständig gespeichert. Außerhalb des belegten Umfangs keine vollständige Originalspiel-Kompatibilität annehmen.

Originalnachweise, Browserintegration und Dateiroundtrips werden getrennt geführt. Hoths Originalspielbericht bestätigt die positiven Objekt9-/Gold10-Pfade; weitere Grenzen bleiben offen. Die genaue Quellrevision und Dateihashes stehen in BUILD_MANIFEST.json.
