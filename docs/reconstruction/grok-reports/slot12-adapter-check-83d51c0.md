# Ausrüstungsplatz 12 Ishar 2: Kit 83d51c0/17245f4 gegen FRISE

Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit. Selektiv aus Grok-Nachtrag46 (`317fc60`) übernommen.

- Geprüft: `original-equipment-runtime.ts`, Wiring in `playtest.tsx` und die Plausibilität des Fixture-Generators.
- Original: FRISE.IO `27117c124caf`, vollständige Dekodierung `0x026cf–0x02a66` und `L_03f22`.
- Ergebnis: Keine konkrete Abweichung im unterstützten Umfang.

## Bestätigte Regeln

- Gehaltene Codes `-89..-82` gehören zu Slot12; andere eingehende Kategorien werden abgewiesen.
- Beim Speichern wird `Code + 1`, beim Lesen `gespeichert - 1` verwendet. Ishar1 verwendet dagegen eine andere Transformation.
- Die Rüstungswerte aus `originalItemArmour` stimmen für den ganzen Bereich. Entnahme subtrahiert den alten Wert, Ablage addiert den neuen Wert, Tausch führt modulo256 zu `alt + neu - vorherig`.
- Das Original erzeugt beim Tausch zuerst den alten Cursorcode, schreibt danach den neuen Slot und aktualisiert die Rüstung. Der gespeicherte Endzustand und der Kit-Cursor stimmen überein; die Original-Zwischenstände sind nicht persistent.

## Grenzen

- Das Original prüft bei der Entnahme nur auf einen nichtleeren Slot. Das Kit lehnt fremde gespeicherte Werte konservativ ab.
- Andere Zielkategorien werden im Original in ihre jeweils eigenen Slots umgeleitet; Slots11/13/14 bleiben im Kit geschlossen, bis deren eigene Bedingungen belegt sind.
- Sonderwirkung `-31` und Anzeigezweige liegen außerhalb dieses Prüfumfangs.
- Statischer Abgleich; kein neuer Originallauf und keine privaten Roh-SAVs.
