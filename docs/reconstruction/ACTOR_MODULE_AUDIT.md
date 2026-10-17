# Audit weiterer Ishar-2-Figurenmodule

Stand 2026-10-17. `npm run audit:original-actor-modules` benötigt ISHAR2_DIR und ISHAR_ACTOR_LISTINGS. Optional ein neuer getrennter Berichtordner als Argument. Die Originale werden nur gelesen. Bericht außerhalb Git: `analysis-output/actor-modules-2026-10-17-recursive/actor-module-audit.json`.

## Umfang und Methode

EAFFs vorhandene Dispatchzuordnungen ergeben 47 eindeutige Modul-IDs. Für jedes Modul werden Originaldatei und Listing lokal gelesen; die SHA256 der Originaldatei steht im Bericht. Kontrollierte Eingaben: Actorparameter 53, zwei explizit gesetzte Zustandsbytes (0/255) in einer privaten START-MAIN-Kopie, fünf Tiefenwerte und zwei RNG-Seeds. Pro Kombination maximal 100 Yields. Diese Eingaben sind Testfälle, keine Behauptung originaler Platzierung oder kanonischer Initialisierung aller Modularten.

Jede ausgegebene Grafik muss im nativen Modul als dekodiertes Bild oder rekursiv auflösbares Composite vorhanden sein. Compositezyklen und fehlende Kinder gelten nicht als gültige Darstellung. Aktivierte Formindizes müssen in der nativen Formtabelle existieren. Geprüft werden Ressourcenzuordnung und der begrenzte Interpreter, nicht Palette-/Bildgleichheit gegen das Originalspiel.

43 Module zeigen in diesen Fällen keine Interpreter-/Ressourcenfehler. Einige geben dabei keine Grafik aus; „ohne Fehler“ bedeutet deshalb ausdrücklich nicht vollständig unterstützt. Vier Module zeigen konkrete Grenzen:

- LEZARD1.IO: benötigt nicht gespeicherten MAIN-Zustand 0x51A1.
- DJFONT.IO: stößt auf nicht unterstütztes cscreen.
- DRUIDE4.IO: stößt in mehreren Fällen auf cputnat; einige Szenarien liefern keinen Draw.
- TROUBA3.IO: stößt in mehreren Fällen auf csound.

Fehlender transienter Zustand wird nicht mit einer geratenen Null ergänzt, und unbekannte Befehle werden nicht als NOP behandelt. Scan-/Angriffs-/Todesereignisse und andere Zustände sind mit diesem Audit nicht vollständig abgedeckt. Die bestehenden Adapter-Ausnahmen für Palette/Kontext gelten weiterhin; keine vollständige VM oder native Ausführung behauptet.

## Zwei weitere Module angebunden

ORIGINAL_ACTOR_MODULES und der optionale lokale Serverbundle enthalten zusätzlich MARIN.IO (Modul 38, EAFF-Typ 12) und GEANT.IO (Modul 70, EAFF-Typ 39). Beide bestehen alle 20 Auditfälle mit je 2000 Ausgabeframes ohne frühzeitiges Ende und mit gültigen Grafik-/Formreferenzen. Die automatische Assetaufnahme verwendet dieselbe Liste, sodass die Originalressourcen statt Platzhaltern importiert werden.

Ein separater Integrationstest erzeugt aus einer SAV-Kopie je eine kontrollierte passende Actor-Konfiguration, folgt der tatsächlichen EAFF-Auswahl und führt das Originalskript über 100 weitere Schritte aus. MARIN beginnt in dieser Distanz mit Ressource 7, GEANT mit 16. Die SAV-Eingabe bleibt unverändert. Dieser Test belegt die Verbindung der vorhandenen Bausteine, nicht das Auftreten dieser Figuren an frei erfundenen Produktpositionen.

Der Produktpfad bleibt auf CONT1 begrenzt; andere Karten sind durch zusätzliche Sicht-/Höhen-/Verdeckungsregeln noch nicht vollständig freigegeben. Andere positiv auditierte Module werden nicht allein aufgrund der Testfälle automatisch aktiviert. Vollständiger Kampf, Dialog, Audio und Originalvergleich bleiben offen.

## LEZARD-Palettenzustand weiter erschlossen

Die im Audit fehlende Variable 0x51A1 ist im geprüften MAIN eine Palettenüberblendungsfreigabe. MAIN initialisiert sie zunächst bei 0x03ED mit null; der DOS-Einstellungszweig setzt sie bei 0x04BB auf eins. 0x04AE schreibt Wortliteral 300 in Byteziel 0x51A2, somit 44. Die Original-MAIN.IO ist hashgebunden: `bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95`. Beide vollständigen Storesequenzen wurden gegen Originalbytes geprüft.

`readIshar2DosPaletteSettings` liest genau diese beiden Werte aus dem bereitgestellten Originalimage. Es ist kein Plattformdetektor und führt nicht die komplette Initialisierung inklusive Laufwerks-/Speicherprüfungen aus. Der Aufrufer muss belegen, dass dieser Einstellungszweig für seine Ausführung gilt. Die separate C-Referenz liefert für PC Modell 2000, enthält jedoch auch unvollständige Hardware-/Laufwerksoperanden; daraus wird kein vollständiger Bootnachweis abgeleitet.

Die Lichtphase 0x519F und ihr Vorwert 0x51A0 sind entgegen einer möglichen Vermutung bereits im SAV gespeichert (IO schreibt bei 0x0B51/0x0B55, liest bei 0x0EA8/0x0EAC). Es wird keine neue Phase aus der Uhrzeit geraten. Nur die nicht gespeicherten Überblendungseinstellungen müssen aus dem zutreffenden Startpfad kommen.

Der Figureninterpreter besitzt jetzt einen expliziten `palette`-Callback für cpalette/ctopalet. Er meldet Palettenindex und bei Übergängen den Daueroperand; dessen D6/D7-Übergabe folgt `readexec_opername_saveD6`. Ohne Adapter wird ein tatsächlich ausgeführtes ctopalet abgewiesen, nicht als NOP behandelt. Die ältere optionale Vorschauausnahme für ausschließlich cpalette enthaltende Unterroutinen bleibt ohne Callback bestehen; mit Callback werden auch diese Routinen ausgeführt. Das ist weiterhin keine pixel-/zeitgetreue Palettenüberblendung.

Kontrollierte LEZARD-Tests mit Originalskript und den nachgewiesenen Einstellungen ergeben bei Lichtphase 1/2/3 die Palettenressourcen 34/35/36 mit Dauer 44; alle drei Paletten sind im Originalmodul vorhanden. Fehlender Callback wird abgewiesen. MAIN-/SAV-Eingaben werden nicht verändert. `npm run test:original-actor-palette`, mit ISHAR2_DIR und ISHAR_ACTOR_LISTINGS für diese Originalprüfung. Bisherige Figurentests bestehen ebenfalls.

LEZARD wird noch nicht automatisch im Produkt freigeschaltet: Hardware-/Lichtzustand, echter Palettenrenderer, weitere Scan-/Soundpfade und native Ausführung bleiben zu verbinden. Der ursprüngliche Vier-Lücken-Audit bleibt ein Bericht über seine damaligen ausdrücklich begrenzten Eingaben, keine dauerhafte Aussage, dass 0x51A1 prinzipiell unbekannt sei.
