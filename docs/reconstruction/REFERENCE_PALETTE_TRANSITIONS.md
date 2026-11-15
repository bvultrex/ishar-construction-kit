# Referenzmodell für DOS-Palettenübergänge

Stand 2026-10-17. Implementierung `reference-dos-palette-transition.ts`. Der Name kennzeichnet ausdrücklich eine Rekonstruktion der separaten ALIS-C-Referenz (`image.c:topalette/topalet`, Interruptabschnitt um 2664). Kein dekompilierter Original-DOS-Rendertreiber und kein Originalausführungsnachweis.

## Zielpalette

`referenceDosPaletteTarget` liest die vorhandene Originalpalettenressource und aktualisiert eine Kopie explizit übergebener 256 RGBA-Slots. DOS-packed16 schreibt die ersten 16 Farben als Kanalwerte mit Schiebung 5 und Alpha 0. DOS-RGB-Blöcke schreiben nur die deklarierten RGB-Kanäle ab firstColor und erhalten Alpha und nicht betroffene Farben. Diese Bytes sind der Referenz-Palettenzustand, keine CSS-Farben oder zugesagte VGA-DAC-Ausgabe; der vorhandene Assetdecoder hat dafür separate Darstellungsumrechnungen.

Es wird kein schwarzer Ausgangszustand angenommen. Ein Aufrufer muss die tatsächliche vorherige Palette liefern. Palettenbank-Auswahl, Dunkelheitsmultiplikatoren, CGA/Mac/Amiga-Sonderfälle und restore/to-black sind nicht enthalten.

## Übergang

`ReferenceDosPaletteTransition` speichert current, target, float32-delta und remaining. Für Dauer D>0 berechnet die Referenz delta=(current-target)/D, palt=palt0=1 und palc=D. Ein `tick()` entspricht genau einem geeigneten Referenz-Interruptschritt nach dem palt-Test, keinem automatisch angenommenen Browserframe oder Millisekundenwert.

Solange remaining>1, werden noch unterschiedliche Kanäle über target+delta*remaining gesetzt; bei remaining==1 wird die gesamte Zielpalette kopiert. Anschließend fällt der Zähler um eins. Daher entspricht dieser Ablauf nicht einem gewöhnlichen Lerp von t=1/D bis t=1: der erste Schritt reproduziert rechnerisch den Startwert, der letzte kopiert direkt das Ziel. Dauer 0 setzt sofort und beendet den Übergang. Ein neuer Auftrag beginnt beim aktuellen Zwischenzustand. Snapshots und Eingaben bleiben kopiert.

Das Modell rundet Division, Multiplikation und Addition explizit auf Float32 und konvertiert mit trunc/Bytewrap. Das entspricht der beabsichtigten C-float-Rechnung ohne FMA; tatsächliche Compiler-, Prozessor- und DOS-Ausgabearithmetik ist noch nicht vermessen. Die SDL1-spezifische Zeitanpassung ist ausgeschlossen. Unterstützte Dauer 0..255: die Referenz benutzt einen Bytezähler, aber einen breiteren Divisor; größere Werte werden mangels verifizierter Zielsemantik nicht stillschweigend normalisiert.

## Verifikation und Grenzen

`npm run test:reference-dos-palette-transition` prüft Start-/Endschritte, Dauer 0/1, Unterbrechung, Snapshots und Eingabegrenzen. Mit ISHAR1_DIR/ISHAR2_DIR: alle 60 bzw. 161 lokalen Originalpalettenziele gegen direktes Rohbytedekodieren geprüft, einschließlich unberührter Farben/Alpha. Mit ISHAR_ACTOR_LISTINGS zusätzlich echte LEZARD-Startskripte für drei Lichtphasen: Auftrag -> vorhandene Originalpalette -> 44 geeignete Referenzschritte -> byteidentisches Ziel.

Die Startpalette dieser Komposition ist ein ausdrücklich kontrollierter Testzustand. Es werden keine Originaldateien geändert und keine Originalressourcen ins Repo aufgenommen. Palette-/Framebuffer-/Canvas-Verknüpfung, globale Wirkung über mehrere Module, nativer Tick und Original-Bildvergleich sind noch offen. LEZARD bleibt ohne diese Verbindung im Produkt deaktiviert. Das Modell allein ist kein vollständiger Überblendungsrenderer.
