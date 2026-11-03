# DOS-Paletteneditor

Stand: 2026-10-17. Implementierung des erschlossenen Ressourcenformats, keine vollständige Grafik- oder Engine-Rekonstruktion.

## Bedienung

Im Asset Lab unter „Originalmodul: Paletten bearbeiten“ eine lokale IO-Datei öffnen. Ressource und Farbindex wählen, drei Komponenten eingeben und „Palettenfarbe übernehmen“ drücken. Rückgängig/Wiederholen hält bis zu 32 Änderungen. „IO-Kopie exportieren“ schreibt eine neue Datei; „Palettenbericht exportieren“ enthält Quell-SHA-256, Ziel-Image-SHA-256 und geänderte Imageoffsets mit Vorher-/Nachherwerten. Die Originalinstallation wird nicht verändert. Nicht übernommene Eingaben werden nicht exportiert. Der Editorzustand ist nur für die laufende Seite gespeichert.

## Formatbelege und Zuordnung

Referenz: lokale ALIS-C-Implementierung `alis-reference/src/image.c`, Funktion `topalette`; vorhandener Decoder in `src/lib/ishar/alis-assets.ts`. Diese Referenz ist kein Nachweis einer vollständigen Decompilierung oder Originalausführung.

DOS-Ressourcenkennung 0xFE steht zwei Bytes vor dem Nutzdatenoffset. Kontrollbyte 0 beschreibt 16 Farben aus je zwei Bytes: R = Byte 0 & 7, G = (Byte 1 >> 4) & 7, B = Byte 1 & 7. Vorschau multipliziert die wirksamen Komponenten mit 32; nicht wirksame Bits werden beim Schreiben erhalten. Das obere Grünbit läuft im vorhandenen 8-Bit-Dekodierpfad über und wird nicht als zusätzlicher editierbarer Farbwert interpretiert.

Bei Kontrollbyte n > 0 folgen Startindex, ein unverändert erhaltenes Kontrollbyte und n+1 RGB-Tripel. Gespeicherte Komponenten sind Bytes 0–255; Vorschau verwendet die bereits vorhandene VGA-DAC-Quantisierung. Struktur, Zeiger, Kontrollbytes und alle übrigen Imagebytes bleiben erhalten. Ungültige oder abgeschnittene Paletten werden nicht zur Bearbeitung angeboten.

`describeAlisPalettes` beschreibt diese Daten, `editAlisPalette` ändert eine Farbe in einer Kopie. `writeAlisModule` schreibt das gleich große Image und liest das Ergebnis zur Kontrolle erneut. Komprimierte Ausgabebytes können sich vom Original unterscheiden; siehe A1_WRITER.md. Es werden weder Ressourcen hinzugefügt noch Referenzen verschoben.

## Reproduktion und Testumfang

```powershell
npm run test:palette-edit
$env:ISHAR1_DIR='E:\Spiele\Ishar1'
$env:ISHAR2_DIR='E:\Spiele\Ishar2'
npm run test:palette-edit-local
```

Synthetische Tests prüfen beide Formate, Teilpaletten, Bit-Erhalt, Fehlerfälle, unveränderte Quellpuffer und Modul-Readback. Lokaler Korpustest: Ishar 1 mit 31 Modulen/60 Paletten (46 RGB, 14 packed16); Ishar 2 mit 75 Modulen/161 Paletten (154 RGB, 7 packed16). Pro Palette wurde eine Farbänderung neu kodiert, zurückgelesen und mit dem vorhandenen Displaydecoder verglichen. Der Korpustest schreibt keine Dateien.

Browserprüfung mit Ishar 2 FOND1.IO: Import, Rotwert 0→255 in Ressource 3/Farbe 0, Undo→0, Redo→255, Zurückweisung von 256, Modul- und Berichtdownload. Das heruntergeladene Modul änderte ausschließlich Imagebyte 1510 von 0 auf 255. Desktop und 390×844 geprüft; keine Konsolenfehler beobachtet. Original-Ressourcen und Screenshots bleiben lokal außerhalb des Repositorys.

## Offene Nachweise

Originalspielausführung bearbeiteter Paletten ist offen, ebenso die skriptgesteuerte Zuordnung und Aktivierungszeit von Paletten. Der Editor zeigt deshalb Farbtabellen und behauptet keine korrekte Szenen- oder Spritezuordnung. Andere Plattformformate sowie Pixel-/Animationsbearbeitung sind hier nicht implementiert. Neue Ressourcen und vergrößerte Module benötigen weitere Analyse.
