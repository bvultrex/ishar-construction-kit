# CONT-Mod-Workflow

Stand: 2026-10-17. Dies ist ein CK-Patchformat für originale Kartenbytes, kein
angebliches Originalskriptformat. Die Prüfung bestätigt Datenintegrität, nicht
automatisch die spielerische Gültigkeit oder eine vollständige Laufzeitrekonstruktion.

## Builder → Patch

1. Original-CONT importieren und im vorhandenen Editor bearbeiten.
2. „Patch: Originaldatei wählen“ anklicken und die unveränderte Ausgangs-CONT
   wählen. Ihre SHA-256 muss mit der gespeicherten Importquelle übereinstimmen.
3. Der Browser exportiert `CONTn.FIC.patch.json`. Das Format enthält Spielprofil,
   Ausgangs-/Zielhash und pro Änderung Ebene, Reihe, Spalte, Vorher-/Nachherbyte.
4. Nur A/B-Kartenbytes sind enthalten. Eigene Items/NPCs/Quests, edgeExtras,
   Türschlüssel, Start-/Szenenmetadaten und andere CK-Projektzusätze sind KEINE
   Original-CONT-Daten und werden damit nicht übertragen.

Alternativ eine bereits exportierte CONT mit ihrer Originaldatei vergleichen:

```powershell
node scripts/cont-mod.mjs diff E:/Spiele/Ishar2/CONT1.FIC ../mods/CONT1.FIC ../mods/cont1.patch.json
```

Der Patch muss außerhalb des Originalordners geschrieben werden. Vorhandene
Dateien werden nicht überschrieben. Beide Kartenprofile (Ishar 1 und 2) werden
unterschieden; ein Wechsel des Layouts wird zurückgewiesen.

## Patch → getrennte ausführbare Kopie

```powershell
node scripts/cont-mod.mjs apply E:/Spiele/Ishar2 ../mods/cont1.patch.json ../analysis-output/my-ishar2-mod
```

Der Zielordner darf nicht existieren und muss außerhalb der Originalinstallation
liegen; Elternordner der Originalinstallation sind ebenfalls ausgeschlossen.
Links werden aufgelöst, die Installation wird inventarisiert, verlinkte oder
spezielle Quelldateien werden abgewiesen. Der vollständige Patch wird vor dem
Anlegen des Zielordners validiert: Hashes, Profil, Koordinaten, Bytewerte,
doppelte Änderungen, Vorherbytes und Ergebnis-Hash.

Danach wird jede reguläre Datei mit geprüftem Eingangshash kopiert. Nur die
angegebene CONT erhält die Änderungen. Ein vollständiger Readback vergleicht
jeden Output mit dem erwarteten Hash. Erst danach wird das Abschlussmanifest
`ishar-ck-mod-manifest.json` geschrieben. Bei einem Abbruch kann eine unvollständige
neue Kopie zurückbleiben; sie wird nicht als erfolgreicher Export markiert und
nicht automatisch gelöscht. Ein neuer Versuch verwendet einen neuen Zielordner.
Originaldateien werden nie beschrieben. Rückkehr zum Original = unveränderte
Originalinstallation verwenden; keine Rückpatches an ihr ausführen.

Das Manifest bleibt `prepared-not-tested-in-original`, bis ein separater
Referenztest nachgewiesen ist. `original-layout` bedeutet nur, dass die
Original-Dateistruktur erhalten bleibt, keine Freigabe für beliebige Kartenbytes.

## Bisheriger Nachweis

- Unit-/Dateitests beider Formate: deterministische Ausgabe, No-op, gezielte
  Änderungen, Ablehnung beschädigter Patches und Schutz vor Überschreiben.
- Produktions-Browserprüfung: Exportbedienung bei Desktop und 390×844 geprüft;
  Seitenüberlauf bei schmalem Fenster behoben, keine Browser-Konsolenfehler.
- Echter Browserlauf: abweichende Ishar-2-CONT2 als Quelle für CONT1 abgewiesen;
  passende CONT1 exportiert den vorhandenen Builderstand mit neun B-Änderungen.
- Dieser Browserdownload wurde auf eine vollständige neue Ishar-2-Kopie
  angewendet; alle 190 Quelldateien beim Export und Readback geprüft.
- Originalhash CONT1: b3f48f1856b79fda6dec61838c6bd00810db0b30f568dab82732230689a39717.
- Ergebnis-Hash des getesteten Builderexports:
  ec71a8e91cefcbf35cc6a3d816a9b9d156601cbee2accbaab8c637d659fa546b.
- Keine Änderungen am Nutzerprojekt durch den Exporttest; vorhandene Änderungen
  wurden lediglich exportiert. Ein erfolgreicher Ingame-Test dieser neun
  Änderungen ist ausdrücklich noch NICHT nachgewiesen.
- Ishar-1-Patchlogik ist mit dem 4860-Byte-Profil getestet; ein vollständiger
  Ishar-1-Editor-/Originalspiel-Modnachweis ist noch offen.

## Originalreferenz

Vorhanden: `E:/Programme/Dosbox/DOSBox.exe`, Fenster meldet DOSBox 0.74.
Separate baseline-Kopien beider Spiele sind vor Ausführung byteweise geprüft.
Ishar 2 startet dort bis zur Sprach-/Musikauswahl; Englisch/Französisch/Deutsch
sind im Menü sichtbar, Deutsch wurde für diesen Lauf gewählt. Damit ist keine
bestimmte Verkaufsedition oder vollständige Spielausführung bestätigt.
Die Fenstersteuerung wurde anschließend vom Nutzer mit Escape gestoppt; der
Ingame-Modvergleich ist weiterhin offen. Keine neue Fenstersteuerung in diesem
Arbeitsschritt. Die lokalen Kopien/Manifeste liegen außerhalb Git unter
`../analysis-output/reference-2026-10-17/`.

## Nächste Abnahme

Einen bewusst gewählten Testpatch samt passendem Referenzspielstand in beiden
Originalprogrammen laden, sichtbaren Effekt und Zustandsänderung dokumentieren,
vorher/nachher sämtliche Originalhashes erneut vergleichen. Ein bloßer Start bis
zum Menü oder ein erfolgreicher Export-Readback genügt dafür nicht.
