# DOS-ALIS-Formen und NPC-Zielauswahl

Stand 2026-10-17. Ressourcenformat und referenzbasierte Geometrie für beide lokalen DOS-Spiele; Zielauswahlpfad nur für Ishar 2. Keine vollständige Kollisions-VM und keine bereits aktivierte NPC-Bedienung.

## Quellen und Nachweisstufen

Die Formdaten stammen aus lokalen IO-Modulen beider Spiele. Ihre Referenzierung erfolgt im originalen Bytecode durch `cforme` und `ctstform`. Die Geometrie-Rekonstruktion orientiert sich an der vorhandenen separaten ALIS-C-Referenzimplementierung (`alis.c:adresform`, `opcodes.c:monoform/monofirm/multiform/multifirm/clipform/ctstform/cmatent`). Diese Implementierung ist **kein dekompilierter Silmarils-DOS-EXE-Quelltext**; Übereinstimmung mit der nativen Engine ist noch durch Ausführung oder weitere EXE-Analyse zu bestätigen.

Ishar-2-Zielauswahl: SOURIS.IO SHA-256 `78df7c73f880466303867b63dd5e20897777802b0595c64935b9f4462354f9d3`, Image 0x00781–0x007AC; FRISE.IO SHA-256 `27117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64`, Image 0x01FA5–0x02035. 8 bzw. 25 Instruktionspräfixe wurden am Original geprüft. Gekürzte Listingpräfixe sind kein vollständiger Bytecodevergleich.

## Format

Entpackter Imageheader +14 zeigt auf den Ressourcenroot. Root+6 enthält einen relativen u32LE-Zeiger zur Formtabelle; Root+10 die u16LE-Anzahl. Jeder Tabelleneintrag ist ein u16LE-Offset relativ zum **Beginn der Formtabelle**, nicht zur einzelnen Zeigerstelle.

Formtyp ist signed8 an Datensatz+0; Byte +1 bleibt bei Einzelboxen erhalten. Typ 0 hat Material-u16LE bei +2 und sechs signed8-Werte ab +4. Typ 1 hat gleiches Material und sechs signed16LE-Werte. Die Werte sind Ursprung x/y/z und Ausdehnung x/y/z, keine zwei absoluten Eckpunkte. Negative Typen sind zusammengesetzte Formen: Byte +1 zählt die folgenden signed16LE-Formindizes; negative Indizes werden ignoriert. Grenzen, ungültige Referenzen sowie beim Auflösen Zyklen und übermäßige Expansion werden abgefangen. Tabellenaliases bleiben erhalten.

`original-alis-forms.ts`: `readDosAlisForms` liest; `editDosAlisBox` schreibt Material und Koordinaten einer vorhandenen Einzelbox in eine Imagekopie gleicher Größe. Kopfbytes, Zeiger und übrige Daten bleiben erhalten. Geteilte/aliasierte Datensätze beeinflussen naturgemäß alle darauf zeigenden Indizes. Zusammengesetzte Formen werden hier gelesen, aber noch nicht umgebaut. Für Modul-Rekodierung `writeAlisModule` beziehungsweise den bestehenden Extract/Replace-CLI verwenden.

## Treffertest und laufende Formen

`originalAlisFormHits` bietet ausschließlich den ersten Treffer in explizit gelieferter Entity-Reihenfolge. Keine Sortierung nach Entfernung. Query und Ziel müssen denselben Kontextwortwert bei VRAM+6 haben; dessen Bedeutung wird neutral als `contextWord6` geführt und nicht ungeprüft als Szene oder Bildschirm interpretiert. Query selbst und inaktive negative Zielformen werden ausgelassen.

Boxen verwenden signed16-Ursprung plus Ausdehnung, jeweils mit Wortüberlauf. X-Spiegelung negiert X-Ursprung und X-Ausdehnung; alle drei Achsen überlappen einschließlich der Randpunkte. Die Materialmaske filtert nur Zielformen. Rückgabe ist die **gesamte** getroffene Materialkennung, nicht nur das Maskenergebnis. Zusammengesetzte Formen werden in Referenzreihenfolge durchlaufen. Die C-Referenz nutzt für zusammengesetzte Query-Längen signed8, für Ziele unsigned8; dieser Unterschied bleibt erhalten.

Die bestehenden drei Figurenskript-Sessions führen `cforme` jetzt aus und behalten den aktiven Index im Frame-Snapshot. `cdelforme` entfernt ihn. Bislang wurde `cforme` im reinen Bildinterpreter ignoriert. Die Frame-Achsen heißen aus Rendergründen x/z/y; zur ALIS-Geometrie gehört entsprechend `[frame.x, frame.z, frame.y]`. Eine Browser-/Originalmaus-Koordinatenumrechnung wird hier nicht erfunden.

## Auswahlphasen zwischen SOURIS und FRISE

`original-target-selection.ts` modelliert den belegten FRISE-Ablauf mit expliziten Scheduler-Phasen und unverändernden Operations-Traces:

1. MAIN 0x49D3 auf 1, Treffervariable 0x4A00 auf -2 setzen. Die lokale letzte Entity wird nicht am Eintritt gelöscht und muss explizit geliefert werden; Material wird 0, Partyplatz -1.
2. Maustasten und Taste loslassen. Auf Auswahl warten.
3. Linksklick bei logischem y<71 wählt signed8(trunc(x/64)) als Partyplatz. Rechtsklick beendet. Die Koordinaten sind originale logische HUD-Koordinaten, keine Browserpixel.
4. Sonst wartet Linksklick auf einen Wert ungleich -2 und erzeugt einen weiteren Yield. Erst danach wird 0x4A00 nochmals gelesen. Wenn ungleich -1, Entity und Material aus 0x4A02 übernehmen; anschließend 0x49D3 auf 0.

SOURIS fragt bei aktivem Auswahlflag Form 0 mit Maske 32767 ab. Bei Treffer schreibt es zuerst Material an 0x4A02 und dann Entity an 0x4A00. Bei Fehltreffer schreibt es nur -1 an 0x4A00; altes Material wird nicht gelöscht. `originalMouseSelectionWrites` erhält deshalb einen expliziten Treffertest und erzeugt genau diese Schreibfolge. Ein Live-Entityhandle ist **nicht** der gespeicherte Akteursoriginalslot; FRISE liest letzteren anschließend aus dem Entity-Parameterbyte 0x0D. Diese Zuordnung muss der Laufzeitadapter liefern.

## Tests

```powershell
npm run test:original-alis-forms
npm run test:original-target-selection
$env:ISHAR1_DIR='E:\Spiele\Ishar1'
$env:ISHAR2_DIR='E:\Spiele\Ishar2'
$env:ISHAR_ACTOR_LISTINGS='<lokaler Ishar-2-Listingordner>'
npm run test:original-alis-forms-local
npm run test:original-target-selection-local
npm run test:original-actor-frame
```

Korpus: Ishar 1 236 Formen (235 Boxen, 1 zusammengesetzt); Ishar 2 431 (425 Boxen, 6 zusammengesetzt). Alle Referenzen aufgelöst. Jede Box unverändert byteidentisch geschrieben, anschließend Material gezielt geändert, übrige Bytes verglichen und das Modul neu gepackt/zurückgelesen. Quellen bleiben unverändert. Synthetische Tests prüfen beide Koordinatenbreiten, unbekannte Kopfbytes, Spiegelung, Grenzen, Masken, Kontext-/Selbst-/Inaktivfilter, Reihenfolge und Fehlerfälle.

Original-SOURIS-Query und GOLEM1-Form treffen am Mittelpunkt und an der Kante; der nächste X-Wert liegt außerhalb. Ein zusammengesetzter Test führt native Ressourcen über SOURIS-Schreibfolge, FRISE-Phasen und explizite Entity→Actor-Zuordnung bis zu rekonstruierter Goldübergabe und SAV-Kopie. Das ist ein Test der rekonstruierten Komponenten, **kein** Eingabe-/Timing-/Originalspielnachweis. Bestehende Figurenskripttests laufen weiter.

Offen: originale Live-Entitylisten und Kontextwort-Initialisierung vollständig übernehmen, Koordinatenadapter und Query-Zeitpunkt vergleichen, alle Treffer-/Bewegungsmodi, Blick-/Verdeckungsintegration sowie tatsächliche NPC-Bedienung im Playtest und Originalausführung. Die Grundformate erweitern auch das Modding beider Spiele; eine Editoroberfläche für Formen fehlt noch.
