# Projektprüfung und verbindlicher nächster Arbeitsmodus

Stand: 14.11.2026. Lokaler Code auf Basis155b22d plus uncommittete Arbeiten dieser Sitzung. Dies ist der aktuelle Einstieg; ältere nächste Schritte in PLAN/COVERAGE sind Historie. Kein vollständiger Originalspielablauf wird behauptet.

## Ziel und Kurs

Endziel bleibt die vollständige nachvollziehbare Rekonstruktion beider lokalen DOS-Spiele und ein Toolkit zum Bearbeiten und Erweitern der erschlossenen Inhalte, einschließlich überprüfbarer Export-/Ausführungspfade. Die Browserdemo und die physische DOS-Rekonstruktion sind Zwischenstände.

Bewertung: technische Richtung richtig, Lieferreihenfolge korrigieren. Native Opcode-, Grafik-, Scheduler- und Loadernachweise sind wertvolle Grundlagen. Der aktuelle LOGO-Fokus liefert jedoch noch keinen vollständigen NPC-/Itemablauf. Mehr LOGO-Stadien sind keine Voraussetzung für jeden Browser-Inhaltsadapter. Der sichtbare Steinwächter ist eine authored Begegnung mit festem Schaden; die Wahl von GOLEM1 Composite38 ersetzt keine originale KI oder Kampfsteuerung.

## Tatsächlicher Stand

| Bereich | Im Code vorhanden | Wesentliche Grenze |
|---|---|---|
| Eigene Items | Definitionen, stabile Platzierungsinstanzen, Nah/Mittel/Fern-Assets, Aufnahme/Charakterzuordnung und Schlüsselbezug | Kein vollständiger Original-Itemexport; Projektinhalt und laufender Spielzustand getrennt prüfen |
| Originalitems Ishar2 | SAV-basierte Bodenpositionen, Darstellung/Aufheben von Codes9/10 auf CONT1, Übergabe in neun Rucksackplätze, Rückgabe vor Übernahme, SAV-Kopie exportierbar | Andere Karten/Codes und Benutzen/Ausrüsten/Ablegen/Effekte nicht als Gesamtablauf belegt |
| Eigene NPCs | Im Builder platzierbar, Grafik, ansprechbar, einfacher Dialogtext und Kaufbestand; Gold-/Bestands-/Gepäckprüfung | Kein vollständiger Dialogbaum, Original-NPC-Lebenszyklus oder Originalexport |
| Originalfiguren Ishar2 | EAFF/Crowd-Auswahl, Save-Actor-Daten, Figurenskripte und Animation; GOLEM1/WIZARD1/AVEUGLE5/MARIN/GEANT als begrenzter CONT1-Pfad | Vorschau setzt transiente Session/Seed beim Ansichtswechsel neu auf; keine persistente vollständige KI, Wegefindung, Kampf-/Todes-/Respawnsteuerung oder allgemeine NPC-Interaktion |
| Originalhandel Ishar2 | Händlerdaten und Shopteilpfade, Empfängerwahl, Goldabzug, Stapel-/Rucksackgrenzen, SAV-Arbeitskopie | Vollständiger Ladenbesuch, Kaufen/Verkaufen und Original-Reload als zusammenhängende Abnahme offen |
| Ishar1 | Format-/SAV-/Enginebausteine und neue externe Verträge | Produktanschluss deutlich hinter Ishar2; alte Save-Kandidaten dürfen nicht allein aufgrund ihrer Existenz als bestätigte Map gelten |
| Aktuelle Enginearbeit | Physische Grafikaufträge mit Ausdrücken, Opcode75-Grafikabbau; tatsächlicher LOGO-Pfad73→75→66 bis Objektverarbeitung3DE4 verglichen | Folgendes Gesamtframe/Boot und Browseranschluss offen.75 ist kein Audio; csound ist157 |

Frisch ausgeführte lokale Checks: check-items-scenes, check-npc-trading, check-original-commerce, check-original-ground, check-save-world-items, check-original-inventory und check-save-actors bestehen. Sie prüfen begrenzte Komponenten/Synthesefälle; daraus folgt keine vollständige Original- oder Browserabnahme. check-original-inventory prüft Dateiinventarisierung, nicht das gesamte Charakterinventar. Typecheck/Produktionsbuild waren beim letzten Grafikupdate erfolgreich.

## Arbeitsmodus ab jetzt

1. Nur ein aktiver Produktablauf gleichzeitig. Primär jetzt Ishar2-Itemaufnahme→Charakterinventar→Export→Reload; danach ein konkreter NPC-/Shopablauf. Physische VM nur weiter bearbeiten, wenn sie diesen Ablauf blockiert oder als klar begrenzter separater Forschungsauftrag.
2. Je Ablauf vier getrennte Stufen führen: Originalvertrag, lokaler Original-/nativer Nachweis, Browserintegration, gespeicherter/exportierter Zustand mit Reload. Kein Sammellabel wie „NPC fertig“ und keine Gesamtprozentzahl.
3. Original- und authored Zustände ausdrücklich trennen. Keine Demo-Kampfwerte als Ersatz für originale Regeln; transiente Vorschauzustände nicht als gespeicherte Originalzustände ausweisen.
4. Jeder checkpoint enthält Code, relevanten Prüfer, aktuelle Grenzen und kurze Testanleitung. Zusammengehörige Änderungen nach Prüfung als kleine Git-Commits sichern. Lokale Arbeitskopie ist derzeit noch uncommittet; nicht als veröffentlicht bezeichnen.
5. Grok liefert abgegrenzte Verträge/Fixtures mit jeweils einem Abschlussbericht. Codex integriert nach Quellen-/Hash-/Verhaltenprüfung. Keine gegenseitigen Dauer-Weckschleifen. Quesh: tatsächlicher Opcode75-Grafikvertrag; Hoth: passende Listenfixtures; Alderaan: separate csound157-Geräteanalyse. Vor weiteren Forschungsaufträgen bestehende Reports/250 gemeldete Fixtures inventarisieren, Duplikate und bereits integrierte Fälle markieren.
6. PLAN verweist auf diesen aktuellen Einstieg. Keine neuen „Next“-Absätze vor veraltete Absätze stapeln. Alte Nachweise bleiben als datierte Historie erhalten; aktive Aufgaben zentral hier pflegen.

## Nächste Abnahmen in Reihenfolge

A. Vorhandenen Ishar2-Itempfad reproduzierbar im Browser ausführen: konkretes Originalprofil/Arbeits-SAV, CONT1 und Code9 oder10; Quelle vor/nach identisch, Aufnahme und Empfänger, voller Rucksack, kein Empfänger, keine Duplikation, Export und erneutes Laden. Danach geänderte SAV in separater Originalspielkopie prüfen. Fehlende Eingaben als fehlend ausweisen, nicht synthetisch als Originalbeleg ersetzen.

B. Einen passenden originalen Händler/NPC festlegen. Darstellung→Ansprache/Shop→Ware auswählen→Empfänger→Gold/Stapel→Export/Reload. Separat festhalten, ob Dialog/Verkauf/Bewegung fehlen. Keine neue KI beginnen, bevor dieser Teilpfad geschlossen ist.

C. Ishar1-Save-Map aus c786e0f/neueren Grok-Verträgen mit lokalen Original-I/O-Belegen gegenprüfen. Widerlegte Kandidaten im Character Lab sperren/ersetzen, bevor weitere Schreibfunktionen darauf bauen. Die Widerlegung stammt bislang aus dem Remote-Handoff und ist hier noch kein neu reproduzierter Nachweis.

D. Ersten vollständigen Modablauf je Spiel abschließen: minimale CONT-/Palettenänderung, sicherer Export, Originalstart und sichtbare Änderung in Arbeitskopie. Danach Erweiterungsgrenzen/neue Inhalte.

A/B sind vorrangige Produktarbeit, C ist ein paralleler eng begrenzter Datenintegritätscheck. Vollständige KI, Kampf, Magie, Dialoge, Quests, Audio und flächendeckende Kartenunterstützung bleiben eigenständige offene Meilensteine.

## Arbeitsnachtrag: Itemabnahme begonnen

Offizielles aktives Ziel: PROJECT_GOAL.md und Zielverwaltung dieses Chats. Für den Itempfad ist nun ein separates Originalinventar aller fünf Save-Charakterplätze im Playtest vorhanden. Damit können Empfänger und Inhalte unabhängig von der authored Demo-Party geprüft werden; zuvor waren leere Demo-Partyplätze nach Aufnahme nicht regulär zum Nachsehen erreichbar.

Neuer lokaler Prüfer: `ISHAR2_DIR=... node scripts/check-original-ground-roundtrip-local.mjs`. Der vorhandene Installationsbestand ergab keinen unmittelbar geeigneten Code9/10-Fall mit freiem Empfänger. Deshalb ist der Fallback ausdrücklich opt-in: `--controlled-placement` verändert ausschließlich eine private START.SAV-Arbeitskopie (Bodenobjekt und Kameraposition). Alle Inputpatches und Ausgabediffs werden privat protokolliert. Ein solcher Fall besteht für Aufnahme, Empfängerwrite, Dateiexport/readback und unabhängig binär abgeleitete IO-Layout-Rücklesung (Inventarbasis MAIN2D8E). Die Originalinstallation bleibt unverändert. Dies ist noch keine Original-EXE-/Browserabnahme; A bleibt offen. Private Dateien liegen unter analysis-output/ground-roundtrip-* außerhalb Git.

Browsernachweis A (kontrolliert): Auf unveränderter CONT1-Geometrie eine begehbare Testposition ausgelesen; START.SAV-Kopie mit protokolliertem Objekt-/Positionspatch geladen. Objekt9 sichtbar/anklickbar, Aufnahme, Empfänger1, Verschwinden vom Boden, Anzeige im separaten Originalinventar, Browser-SAV-Export und erneutes Laden bestanden. Browserexport ist byteidentisch zum separat geprüften Datei-/IO-Layout-Ergebnis. Privater Nachweis: analysis-output/ground-roundtrip-qo3juL/browser-check.json. Kein Original-EXE-Reload behauptet; dieser bleibt die nächste Abnahmegrenze. Die vorherige nicht begehbare kontrollierte Position wurde verworfen, nicht durch Aufweichen des Positionsimports unterstützt.

Datenintegrität C: lokale Ishar1-MAIN-Lese-/Schreibsequenzen erneut geprüft (107 Felder,8 SAV-Dateien byteidentisch rekonstruiert). MAIN1542 liegt in der Datei bei468; die alte Character-Lab-Kandidatentabelle zeigt dagegen auf02D5. Deshalb ist deren Patch-Export sowohl in der Oberfläche als auch im Codec atomar gesperrt, numerische Bearbeitung deaktiviert und die historische Ansicht gekennzeichnet. `check-legacy-ishar1-write-guard.mjs` prüft die Sperre, unveränderte Quelle, erhaltenen Ishar2-Pfad und mit ISHAR1_DIR den konkreten lokalen Layoutwiderspruch. Noch keine pauschale Übernahme sämtlicher externer Semantik; vollständige Engine-Map-Umstellung bleibt offen.

Grok-Koordination aktualisiert: Nach dem abgeschlossenen Opcode75-Paket (Report623e9ed, Fixtures40f1d47 laut Cupero) Hoth auf Original-Itemreload, Quesh auf vorhandenen Pickupvertrag/zusätzliche Writes und Alderaan auf einen konkreten NPC-/Shopabnahmefall ausgerichtet. Kein neuer Audio-Forschungsauftrag. Die neue Nachricht wurde in Cuperos Chat gesendet; Ergebnisse aus diesen Folgeaufträgen stehen noch aus.

## Arbeitsnachtrag: erster konkreter Originalhändler im Browser

`check-original-shop-roundtrip-local.mjs` benötigt ISHAR2_DIR und ISHAR_MERCHANT_LISTING. Der Prüfer bindet alle vorhandenen Listing-Bytepräfixe unmittelbar an die lokale MARCHAND.IO, sucht auf unveränderten CONT1/2/3 eine tatsächlich erreichbare Händlerereigniszelle und passenden Originalbestand/Empfänger mit ausreichendem Guthaben. Ausschließlich die Kameraposition einer SAV-Arbeitskopie wird geändert, jede Inputänderung privat dokumentiert. Empfang, erlaubte Gold-/Inventar-/Stapelwrites, Dateiexport/readback und Inventar-Rücklesung durch das hashgebundene IO-Layout bestanden.

Browserabnahme: mit explizit lokal konfiguriertem Listingbundle INPUT.SAV geladen, originalen Eingang durch Vorwärtsschritt ausgelöst, Sortiment angezeigt, Ware ausgewählt, Empfänger1 gewählt, Laden verlassen, SAV exportiert und erneut geladen. Kaufobjekt im Originalinventar sichtbar. Browserexport ist byteidentisch zu EXPECTED.SAV des separaten Prüfers. Private Belege: analysis-output/shop-roundtrip-xI5KVy/report.json und browser-check.json. Dies ist ein abgegrenzter Kaufpfad mit kontrollierter Kamera, keine vollständige NPC-/Verkaufs-/Original-EXE-Abnahme. Original-Reload und Quesh/Hoth-Vertragsabgleich bleiben offen; B wird nicht abgeschlossen markiert.

Lokaler Server auf4181 ist nun mit ISHAR_MERCHANT_LISTING für die vorhandenen lokalen Ishar2-Listings konfiguriert. Dieser optionale Nur-Loopback-Zugang liefert vorhandene Händler-/Objekt-/Figurenskripte; sie werden nicht in Git oder Testpakete eingebettet.

CI-Prozess angepasst: Die reguläre Pipeline prüft nun zusätzlich Iteminstanzen, NPC-Käufe, Original-Bodenobjekte, Originalhandel, gespeicherte Weltobjekte und die Ishar1-Schreibsperre; physische Frame-/Skriptdiagnose läuft ebenfalls vor dem Build. Diese quellenfreien Regressionen benötigen keine Originaldaten. Die Ishar1-Sperre gilt auch für den direkten Feldwriter, nicht nur für den Party-Export. Native/Original- und Browserabnahmen bleiben ergänzende separate Belege.

## Arbeitsnachtrag: belegter Ishar1-SAV-Feldeditor

Die separate Original-Save-Werkzeugansicht unterstützt jetzt beide Profile: Ishar1 nach Hashprüfung der lokalen MAIN.IO, Ishar2 wie bisher nach IO.IO. Der neue Ishar1-Writer adressiert ausschließlich die107 aus übereinstimmenden Lese-/Schreibsequenzen abgeleiteten Speicherbereiche. Byte-Scalarwerte liegen als BE16 vor; nur bei geänderter Nutzbyte wird das hohe Byte vorzeichenerweitert. Unveränderte Felder einschließlich abweichender hoher Bytes bleiben byteidentisch. Blockdaten bleiben rohe Bytes ohne erfundene Semantik.

`check-ishar1-save-writer.mjs`: synthetische Byte-/Wort-/Block-/Fehlerfälle und mit ISHAR1_DIR alle8 lokalen Saves bestanden; vollständiger gemappter No-op byteidentisch und856 gezielte Feldänderungen erhalten sämtliche anderen Bytes. Der alte Kandidateneditor bleibt gesperrt. Der neue Editor bietet Feld-/Bytewahl, Undo/Redo, SAV-Kopie und Änderungsbericht mit Profil-/Quell-/Zielhash; dies ist struktureller I/O-Nachweis, noch kein Ingame-Nachweis und keine vollständige benannte Charaktermap.

Ishar1-Browserabnahme: lokale MAIN.IO hashgeprüft, FINALE.SAV als Arbeitskopie geladen, alle107 Bereiche angeboten. Byte MAIN1543/SAV469 gezielt geändert, Undo/Redo geprüft, exportiert und erneut im Editor geladen. Genau das erwartete Byte ist geändert; alle anderen Bytes der Exportdatei entsprechen der Quelle. Alter Kandidatenexport bleibt gesperrt. Private Metadaten: analysis-output/ishar1-save-editor-browser-2026-11-14.json. Original-EXE-Ausführung bleibt offen.

## Arbeitsnachtrag: Original-Empfängergate korrigiert

Beim Abgleich mit dem vorhandenen Ishar2-Pickupvertrag wurde eine konkrete Lücke gefunden: FRISE007C9 verlangt neben vorhandenem Charakter signed16-Vitalität>0. Der bisherige Bodenobjektadapter prüfte nur die Anwesenheit. Empfang und Empfängerbuttons prüfen jetzt die tatsächliche Original-SAV-Vitalität statt Demo-HP; nicht handlungsfähige Figuren übernehmen kein Bodenobjekt. Der Handelspfad bleibt separat, ohne dort ungeprüft dieselbe Bedingung einzuführen.

`check-original-ground-recipient-local.mjs` bindet FRISE an das lokale Profil, vergleicht das vollständige numerische Gate mit einer unabhängig aus dem Vertrag kodierten Operandensequenz und bindet HP/Klasse/Inventar an die binär abgeleitete IO-Savemap.100 Fälle (fünf Empfänger, signed HP-Grenzen, Klassenbytes einschließlich FF) stimmen mit der Listingauswertung überein; Quellen und nicht betroffene Bytes bleiben erhalten. Das ist vollständiger Gatebyte-/Ausdrucksnachweis, kein nativer Gesamt-FRISE- oder Original-EXE-Nachweis. Synthetische Bodenobjekttests prüfen zusätzlich Abweisung bei HP0/negativ und Subarray-Eingaben; kontrollierter lokaler Item-Dateiroundtrip erneut bestanden.

Computerbedienung wurde zwischenzeitlich vom Nutzer mit Esc beendet und nach seinem ausdrücklichen „fahre fort“ wieder aufgenommen. Die ausstehenden Original-EXE-Abnahmen werden nicht durch neue Browser- oder Hosttests ersetzt.

## Arbeitsnachtrag: Standort im Original-SAV-Export

Der Playtest exportierte bisher Inventar-/Weltobjektänderungen mit der ursprünglichen Kameraposition. Der Export übernimmt jetzt die aktuelle Originalkarte, Zeile/Spalte, Blickrichtung und Szene. Auf authored Karten ohne Ishar2-Grid ist dieser Originalexport gesperrt. Weitere Vorschauzustände wie Türmechanik und transiente NPC-KI werden damit weiterhin nicht vollständig gespeichert.

Die fünf Felder sind Byte-Scalarwerte in signed BE16, keine frei interpretierbaren Wörter. `patchOriginalSaveView` erhält unveränderte hohe Bytes und sämtliche anderen SAV-Bytes; `readActorSave` liest die zugehörigen Nutzbytes. `test:original-save-view` prüft Grenzen, ungültige Positionen, Subarrays, No-op und unveränderte Daten und läuft in CI. Lokal wurden 42 Exporte aus 21 vorhandenen SAVs bytegenau mit dem hashgebundenen IO.IO-Writer verglichen; Originaldateien bleiben unverändert. Typecheck und Produktionsbuild bestanden.

Browser: kontrollierte private Item-Arbeitskopie geladen, Objekt9 an Charakter1 übergeben, Standort gewechselt und Blickrichtung isoliert geändert, exportiert und erneut geladen. Standort CONT1 2/2, Blick O, Inventarobjekt9 bleiben erhalten. Der endgültige Browserexport stimmt vollständig mit dem separat errechneten erwarteten Item-/Kameraexport überein. Private Metadaten: `analysis-output/original-save-view-browser-2026-11-14.json`. Dies schließt keine Original-EXE-Abnahme ab. Grok-Berichtbranch erneut geprüft; bis Stand5016e17 kein neuer Ishar2-Original-Reload-Bericht.
