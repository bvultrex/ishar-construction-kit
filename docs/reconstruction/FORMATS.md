# Ressourcenformate: nachgewiesener Teilumfang

Die vollständige lokale Dateiliste mit Größe und SHA-256 steht in den Inventaren.
Gleiche Endung bedeutet nicht automatisch gleicher Aufbau oder Zweck.

## CONTn.FIC

Code: `src/lib/ishar/cont-grid.ts` (`importCont`, `exportCont`, `setGridCell`).

| Profil | Größe | Organisation | Byte-Reihenfolge |
|---|---:|---|---|
| Lokales Ishar 1 | 4860 | 54 Reihen × 90 Spalten, eine Ebene | Einzelbytes, keine Wort-Endianness |
| Lokales Ishar 2 | 10800 | 90 × 60, Ebene A dann B mit je 5400 Bytes | Einzelbytes |

Kein Header im gegenwärtig unterstützten Format. Byteoffset A = r*cols+c,
B (nur Ishar 2) = 5400+r*60+c. `cellA/B` interpretieren Werte vorzeichenbehaftet;
Export erhält die Rohbytes. Import verwirft andere Längen mit Fehlermeldung.
Der Dateiname liefert eine Karten-ID als Hinweis, nicht den Beweis der Version.

Nachweise: 6 Ishar-1- und 7 Ishar-2-Dateien byteidentisch exportiert; Änderung
an A[0] erhält sämtliche anderen Bytes. Die semantische Bedeutung sämtlicher
Ishar-1-Codes ist damit ausdrücklich NICHT erschlossen. Ishar-2-Kollisionen und
Codes sind teilweise in GRID_MODEL/cont-grid dokumentiert.

## Weitere gefundene Ressourcen

- `.IO`: ALIS-Module, Code und Ressourcen. 240 lokale DOS-A1/raw-Module samt
  Headern und unverändertem Roundtrip geprüft; Details: ALIS_MODULES.md.
  Geänderte A1-Dateien und neue Module weiterhin offen.
- `.SAV`: Ishar-2-DOS-Teilpfade für 8359-Byte-Saves auf IO-Lader zurückgeführt.
  Ishar-1-MAIN-Lese-/Schreibsequenzen jetzt getrennt abgeleitet: 107 Felder/Blöcke,
  5216 Bytes, acht Saves byteidentisch aufgeteilt; Blocksemantik noch offen.
- Andere `.FIC`: nicht allein anhand der Endung als Karten behandeln.
- `.STP`, `.AO`, weitere Dateitypen: inventarisiert, Bedeutung nicht vollständig
  bestätigt. PDFs/Bilder/Office/MP3 in Ordnern können Begleit- oder Nutzerdateien
  sein; keine automatische Zuordnung zu Engine-Ressourcen.
- Grafik/Paletten/Animation/Audio/Texte/Objekte/Zauber/Quests:
  eigene vollständige Format- und Referenzspezifikationen noch offen.

Unbekannte Bytes sind zu erhalten. Inkompatible Profile dürfen nicht mit einer
vermuteten Struktur überschrieben werden. Kein generischer IO-Writer gilt als
abgeschlossen, bevor er gegen die lokalen Originale geprüft wurde.
