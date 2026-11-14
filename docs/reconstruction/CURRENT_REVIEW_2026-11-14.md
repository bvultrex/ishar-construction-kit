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

## Arbeitsnachtrag: Objekt10 ist ein Goldfund

Grok meldete im laufenden Austausch eine konkrete Widerlegung des bisherigen Adapters: FRISE0032b prüft abs(gehaltenes Objekt)==10 und verarbeitet dieses vor der Rucksackplatzsuche über04825/06865. Lokal gegen die vorhandene FRISE.IO und das IO.IO-Savelayout geprüft: Die gehaltene Goldmenge steht in MAIN4c94/4c96 (SAV14/16); signed16-Addition an das Empfängergold MAIN2d68/2d80 (SAV1006/1026), Übertrag bei Einheiten>999, anschließend beide gehaltenen Goldwörter löschen. Es wird kein Inventarwort geschrieben. Positive Objekt10-Aufnahme selbst erfindet keine zusätzliche Menge; vorhandene gehaltene Goldwörter werden verwendet.

Empfang und Statusmeldung sind korrigiert; voller Rucksack blockiert Gold nicht. Der Dateiroundtrip-Prüfer erwartet für10 nun Gold-/Löschwrites statt Inventarcode10. Zusätzlich ist `--controlled-placement --controlled-gold` ein ausdrücklich privater, dokumentierter Input mit Objekt10 und gesetzter Goldmenge. Beide kontrollierten Item-Dateiroundtrips bestanden. Synthetische Regressionen prüfen Übertrag, signed Überlauf, unverändertes Inventar und Ablehnung nicht handlungsfähiger Empfänger. Der lokale Gateprüfer bindet die zusätzlichen Goldfelder an IO.IO und vergleicht300 Goldempfänge mit den FRISE-Arithmetikausdrücken, einschließlich aller fünf Empfänger und voller Rucksäcke. Typecheck und Produktionsbuild bestanden. Noch keine Browserabnahme dieser Korrektur.

Cupero meldet außerdem einen abgeschlossenen Hoth-Original-EXE-Reload für Objekt9 und zweifach beobachteten Verbrauch von10 ohne Inventareintrag. Der Bericht ist zum Zeitpunkt dieses Nachtrags noch nicht im gefetchten Reports-Branch5016e17 vorhanden. Diese Gesprächsmeldung wird bis zum Quellen-/Diffabgleich nicht als endgültige Abnahme gewertet; tatsächliche Goldgutschrift im Original bleibt laut Meldung offen.

Browserabnahme des korrigierten Goldpfads: private kontrollierte SAV mit Objekt10 geladen, aufgenommen, Exportsperre im gehaltenen Zustand geprüft, an Charakter1 übergeben. Gold40200→42100; alle Rucksackplätze bleiben leer. Export und erneutes Laden erhalten den Goldstand und das entfernte Weltobjekt. Der gesamte Browserexport stimmt bytegenau mit dem getrennten Datei-/IO-Prüfer überein. Private Metadaten: `analysis-output/original-gold-browser-2026-11-14.json`. Dies ist weiterhin kontrollierter Browsernachweis, kein Original-EXE-Goldnachweis. CI für6a3632f erfolgreich.

Weitere lokale SOURIS-Prüfung00904..009f0: Bodenablage schreibt auch die aktuelle Blickrichtung in T50c8[id]/SAV8039+id. Die bisherige Rückgabe durch vollständiges Wiederherstellen des alten SAV-Snapshots erhielt fälschlich die alte Objektblickrichtung. Rückgabe nutzt jetzt einen begrenzten Writer für die vier Weltfelder; fremde zwischenzeitliche SAV-Writes werden erhalten. Die unterstützte CONT1-Ablage erfolgt auf dem Feld vor der Gruppe, Koordinaten wie original als Byte. Der Aufrufer verwaltet gehaltenen Zustand und Kollisionsgate. Acht synthetische Objekt-/Richtungsfälle, Byteerhalt, Doppelablage-Abweisung und Randüberlauf bestanden; Typecheck bestanden. Die genaue native Mauskollision und weitere Karten bleiben separate offene Aufgaben.

## Abgleich Nachträge32–34 und verbleibende Itemlücken

Die neuen öffentlichen Berichte aus7995883 sind übernommen: `item-pickup-original-acceptance.md`, `pickup-contract-check-ishar2.md` und die korrigierten beiden Pickup-Verträge. Ursache der zuvor scheinbar fehlenden Berichte war der auf den Arbeitsbranch eingeschränkte Fetch-Refspec: explizites Fetch aktualisierte FETCH_HEAD, aber nicht die Grok-Remote-Referenz. Für diesen Branch künftig das vollständige Quell-/Zielrefspec verwenden. Keine Historie umgeschrieben.

Hoths dokumentierte Original-EXE-Läufe bestätigen9 über Porträt, Export und neue Originalsession sowie Weitergabe an Figur1; zusätzlich Handplatz10, volle Rucksäcke und Bodenrückgabe. Der Nachtrag bestätigt10 mit gefülltem Goldbeutel inklusive Übertrag, Löschen14–17, unverändertem Inventar und neuer Originalsession. Die sieben angegebenen Profile (EXE, START.SAV und fünf Module) stimmen lokal überein. Codex' lokale und Browserexporte entsprechen dem beschriebenen begrenzten Schreibvertrag. Die privaten Hoth-Rohsaves liegen nicht in dieser Arbeitsumgebung; dies bleibt ein separat berichteter Originalnachweis, kein hier erneut ausgeführter EXE-Lauf. Privater Profilvergleich: `analysis-output/item-original-report-profile-check-2026-11-14.json`.

Gold-A1 und Ablageblick-A2 sind korrigiert und browsergeprüft. Bei der Bodenrückgabe änderte sich im kontrollierten Fall ausschließlich SAV8048 auf die aktuelle Blickrichtung; alle anderen Bytes stimmen zur Eingabe. Privater Nachweis: `analysis-output/original-ground-drop-browser-2026-11-14.json`. Der Produktionsbuild1f96371 enthält diese Korrektur.

Offen aus dem Bericht: A3 Handfelder, A4 belegte Slots/Tausch, A5 Aufnahme aus Inventarslots und Weitergabe zwischen Figuren, A6 spezielle PP11-Nutzung außerhalbCONT1. Ferner bleibt die aktuelle Browser-Klickfläche bildbasiert; originale Formkollision, Ablage bei blockierter Geometrie und genaue Klickkanten sind noch nicht integriert. T4bbc-Freigabebedingung bei komplexen Stapeln, negative Empfängerfälle im Original und Tastaturspeichersperre fehlen als Originalabnahme. Daher ist A als gesamter Itemablauf weiterhin offen; die positiven9/10-Porträt-/Persistenzfälle haben nun getrennte Browser- und berichtete Originalnachweise.

Grok-Folgeauftrag (Ishar2-Shop-Originalreload, exakte9-Klickkanten und PriorisierungA2–A6) wurde als Entwurf vorbereitet. Die Bedienung wurde vor bestätigtem Senden durch Nutzereingabe im Grok-Fenster unterbrochen; nicht als beauftragte laufende Arbeit behandeln. Bestehende Berichte sind abgeschlossen. Keine weitere UI-Bedienung in dieser Arbeitsetappe.

## Arbeitsnachtrag: Objekt9 aus Inventar und Hand weitergeben

A3/A5 für Code9 sind jetzt im Browser angebunden: Originalinventar zeigt Rucksack0–8 und Handplätze9/10. Objekt9 lässt sich aus diesen Slots aufnehmen, an eine andere Figur übergeben, in deren freien Handplatz legen und wieder aufnehmen. FRISE02c0f/02dbb löscht den Ausgangsslot; für9 sind weder Stapelkonversion noch Rüstungsänderung erforderlich. Der Empfängerpfad bleibt anwesend/HP>0; die Slotentnahme bekommt kein erfundenes Porträt-Empfängergate. Andere Codes, belegte Handplätze/TauschA4 und weitere Ausrüstungsplätze bleiben offen. Eine explizite Bodenablage ist auch für ein aus dem Inventar gehaltenes Objekt verfügbar; Export/Neuladen/Bewegung bleiben während des Haltens gesperrt.

`test:original-inventory-transfer` prüft825 Quellen-/Slot-/Empfänger-/Handkombinationen, genau ein erhaltenes Objekt, sämtliche nicht betroffenen Bytes, blockierte belegte Hände, tote Empfänger und unveränderte Eingaben; läuft in CI. Bodenobjektregressionen, lokaler100-Fälle-Gatevergleich,300 Goldarithmetikfälle, Typecheck und Produktionsbuild bestanden.

Browserabnahme: private erhaltene Objekt9-SAV geladen, Figur0/Rucksack0→Figur1/Hand10→Figur2/Rucksack0. Exportsperre während des Haltens und gesperrter belegter Handplatz geprüft. Export/Reload erhalten genau den Zielslot; die Ausgangsslots sind leer. Der ganze Export entspricht bytegenau dem getrennt ausgeführten Operationspfad. Zur Eingabe ändern sich nur die beiden betroffenen Inventar-Nutzbytes. Private Metadaten: `analysis-output/original-inventory-transfer-browser-2026-11-14.json`. Hoths Originalbericht belegt dieselben Slotlösch-/Empfangsoperationen, ohne hier eine neue Original-EXE-Ausführung zu behaupten. Der gesamte Itemumfang bleibt offen.

## Testpaket b6dae48

Reproduzierbarer Paketbefehl `npm run package:test`: verlangt sauberen committeten Stand, baut mit passender Git-Buildkennung und schreibt ausschließlich erlaubte Build-/Start-/Hinweisdateien in einen neuen Ordner außerhalb des Repos plus ZIP. Kein Überschreiben früherer Pakete. BUILD_MANIFEST.json enthält vollständigen Commit und SHA256 jeder Nutzdatei; TEST_BUILD_CHANGES.md erklärt Testschritte, Originalquellen und Grenzen und wird auch im CI-Artefakt ausgeliefert.

Aktuelles lokales Paket: `../testbuild-b6dae48.zip`, SHA256 `afa52c900b114b3fd94538f3d09412e52139ee538ae4dde80e92c67c7f5027f4`, Quellcommit `b6dae48081c5e085269bf35681b75803805f5a09`. Alle62 Nutzdateien zwischen ZIP, Manifest und entpacktem Paket hash-/bytegleich geprüft; keine SAV/IO/ASM/EXE/BAT/CMD-Dateien enthalten. Paketserver auf4183 und4181 laufen nun aus dieser unveränderlichen Buildkopie statt aus dem bei weiteren Builds ersetzten Repo-dist. Acht Routen, Buildkennung, sechs Root-Assetreferenzen und der optional konfigurierte lokale Händlerzugang liefern erfolgreich. Push-/PR-CI fürb6dae48 erfolgreich (Runs43637343634/43637347563; zusätzlicher CI-Run43637347544).

Quesh-Nachtrag35 ausbfa1de5 übernommen: unabhängiger statischer Abgleich bestätigt GoldA1 und AblagewritesA2 in6a3632f/1f96371. Seine dort noch offene A3-Slotwrite-Lücke wurde danach mit7b2a075 umgesetzt und browsergeprüft; das originale transiente Handpanel mit umgeschaltetem Porträtklick bleibt als UI-Verhalten offen. A4 belegter Handtausch und SzenenA6 bleiben offen. Die neue Lieferung zeigt bereits die Priorisierung aus unserem Grok-Entwurf; dessen tatsächlicher Versand war lokal beim unterbrochenen Klick nicht bestätigt. Deshalb weder einen erneuten Auftrag senden noch laufende Folgeabnahmen ohne Zustandsprüfung behaupten.

## Arbeitsnachtrag: transientes Originalhandpanel

Für jeden der fünf Originalempfänger lässt sich das Handpanel jetzt öffnen/schließen. Bei offenem Panel gibt der Porträt-/Empfängerklick Objekt9 nicht automatisch ins Gepäck: Ein freier Handplatz muss explizit gewählt werden. Bei geschlossenem Panel gilt weiter der Rucksackpfad. Gold10 hat wie in FRISE0032b Vorrang und wird auch bei offenem Handpanel gutgeschrieben. Die Umschaltung entspricht dem Blattzweig007e3/0080c, ohne ein vollständiges pixelgleiches Original-HUD zu behaupten.

Der Zustand ist transient, wird bei jedem SAV-Laden zurückgesetzt und bekommt keine erfundenen SAV-Felder. Der lokale FRISE-Prüfer vergleicht die9-Porträtroute mit dem Originalausdruck007e3;100 Empfängergates und300 Goldfälle bleiben grün. Typecheck,825 Transferfälle und Produktionsbuild bestanden.

Browser: Figur1-Panel öffnen,9 aus Figur0 aufnehmen, Empfängerklick schreibt keinen Slot und behält Exportsperre; expliziter Handplatz10 empfängt. Export entspricht bytegenau ausschließlich der Slotentnahme/-ablage. Reload erhält Handinhalt, setzt aber das Panel zurück. Separat Gold10 bei offenem Panel erfolgreich übernommen. Private Metadaten: `analysis-output/original-handpanel-browser-2026-11-14.json`. Testserver4181 zeigt diesen Entwicklungsstand aus Repo-dist; der für Nutzer ausgelieferte4183-Server bleibt auf dem unveränderlichen Paketb6dae48.

## Arbeitsnachtrag: belegter Nichtstapel-Handtausch und Rüstung

Der Inventaradapter unterstützt zusätzlich9 die Codes-89..-60 und-29..-25. Das sind hier Nichtstapelcodes ohne FRISEs separaten Zweihandwaffenzweig. Aufnahme aus Rucksack/Hand, Weitergabe an erste freie Rucksackstelle und Ablage/Tausch in Hand9/10 sind angebunden; ausgetauschtes Objekt bleibt am Cursor, daher bleibt der Export gesperrt. Die Cursorvorschau nutzt bei negativen Codes die lokal geladene OBJET-Ressourcenzuordnung. Ungeklärte Waffen, Stapel und Sentinel-125 bleiben gesperrt.

FRISE03f22 liefert18 Rüstungswerte. Plain Aufnahme/Ablage verändert bei Handplätzen das Rüstungsbyte1336+c um diesen Wert, mit Byteüberlauf und ohne Clamp. Tausch032d8/03313 verwendet die originale engere AND-Bedingung: nur-29..-26 zählen. Deshalb bleibt beim Tausch9 gegen-25 der bisherige Rüstungswert stehen; diese Originalbesonderheit wird nicht stillschweigend korrigiert. Originalinventar zeigt das gespeicherte Rüstungsbyte zur Kontrolle.

`test:original-inventory-armour-local` bindet FRISE an den Profilhash, dekodiert alle18 Switch-Ziele und vollständigen cstore-Blätter direkt aus dem Modul und prüft IO-Mapping, Aufnahme-/Ablage-Roundtrips und54 unterstützte Tausche. Quelle bleibt unverändert. Quellenfreie Transferregressionen vergleichen den neuen9-Empfängeradapter mit825 bisherigen Pfaden, dazu unabhängige Tauschbeispiele, -25-Sonderfall und Byteüberlauf. Typecheck, Originalhandelregression und Build bestanden.

Browser mit privater kontrollierter SAV:9 aus Figur0 tauscht-25 in Figur1/Hand10; -25 bleibt gehalten und Figur1-Rüstung bleibt4. Ablage in Figur2/Hand10 erhöht dort Rüstung auf4; erneute Aufnahme senkt sie auf0, anschließende Gepäckablage erhält sie0. Export/Reload erhalten beide Gegenstände, Slots und Rüstungsbytes. Der gesamte Browserexport entspricht bytegenau dem getrennten Operationspfad. Private Belege: `analysis-output/original-inventory-swap-browser-2026-11-14/`. Dies ist Browser-/Hostnachweis gegen den statischen Originalvertrag, keine neue Original-EXE-Tauschausführung. A4 bleibt für Stapel, Zweihandwaffen und die übrigen Ausrüstungsplätze offen.

## Nachträge36/37: native9-Klickkanten und Ishar2-Shop-Reload

Berichte `code9-hitbox-edges.md` (b0a3cef) und `i2-shop-original-roundtrip.md` (35ce192) übernommen. Hoth bestätigt26 Originalproben: Code9/CONT1 mittig in Entfernung1 trifft einschließlich x116..141/y104..123; transparente Ecken treffen, opaker Pixel(128,124) trifft nicht. Die vorherige y103..122-Behauptung ist widerlegt. Der Browser nutzt für exakt diesen Fall nun ein unabhängiges transparentes26×20-Klickrechteck; Bild-pointerevents sind aus. Umrechnung berücksichtigt den ursprünglichen Viewportausschnitt aby13. Für10, seitliche Positionen und andere Tiefen werden daraus keine ungeprüften Grenzen übernommen;10 behält vorerst die alte Bildfläche.

Quellenfreie Tests vergleichen das Rechteck mit den gemeldeten Innen-/Außen-/Eckproben. Browser-DOM bestätigt Bounds und Skalierung sowie ausgeschaltete Bildpointerevents; Klick in die transparente Rechteckmitte nimmt auf, Empfängerpfad funktioniert. Keine tatsächlichen Browser-Randklicks behauptet. Private Metadaten: `analysis-output/original-code9-hitbox-browser-2026-11-14.json`. Dies ist die belegte begrenzte Formfläche, noch keine allgemeine native Entitäts-/Formliste.

Alderaan erreicht den vorhandenen CONT1-Eingang selector6 ab ungepatchter START.SAV zu Fuß, kauft-61 für1800 und lädt den Kauf-SAV in einer neuen Originalsession. Die Commerce-Bytes stimmen laut vollständigem privaten Diff mit dem Kit-Schreibvertrag überein. MARCHAND.IO, CONT1.FIC und START.SAV passen lokal zu den drei Berichtshashes. Original-Reload erhält Ware und Gold; sonstige Änderungen schließen ein unbekanntes Byte7577 ein, das hier nicht als allgemeines toleriertes Rauschen freigegeben wird. Stapelkauf und negative Fälle sind von diesem Originallauf nicht abgedeckt.

Der lokale Shopprüfer bietet jetzt `--source-save=START.SAV`, damit der Originalfall ohne Ausdünnen des Installationsordners reproduzierbar gewählt wird. Der Bericht zeigte außerdem eine Browserabweichung: MAIN0346f dreht nach Shopaustritt1↔3 und2↔4. Verlassen-Button und Escape verwenden jetzt diese Umkehr. Browser mit der neu erzeugten privaten START-Kamera-Kopie: Eingang→Kauf→Empfänger0→Verlassen→Export→Reload; Gold38400, Ware-61 im Slot0, umgekehrtes Facing4 erhalten. Der gesamte Export entspricht bytegenau dem getrennten Kaufprüfer plus belegter Kameraumkehr. Private Belege: `analysis-output/shop-roundtrip-MguEBC/`. Typecheck, Bodenobjekttests und Produktionsbuild bestanden. B hat damit für diesen einen Kaufpfad Browser-, Persistenz- und separat berichteten Originalnachweis; vollständige NPC-/Handelsimplementierung bleibt offen.

## Arbeitsnachtrag: Stapelanzeige und nächstes Originalpaket

Originalinventar zeigt für-59..-49 jetzt den tatsächlich gespeicherten Stapelzähler. Der lokale Händlerprüfer unterstützt zusätzlich `--stock-index=0..5`; `--source-save=START.SAV --stock-index=2` liefert reproduzierbar den vorhandenen selector6/-50/qty5/300-Fall ohne Änderungen an der Originalinstallation. Typecheck und Build bestanden.

Browser: zwei Fünferbündel übernommen, Anzeige5→10. Dritter Kauf scheitert mit vollem Stapel und bleibt bis zum Zurücklegen gehalten; Export bleibt währenddessen gesperrt. Nach Zurücklegen, Verlassen, Export und Reload: Stapel10 und Gold39600, nur zwei Preise berechnet. Der gesamte Export stimmt bytegenau mit zwei getrennten Hostkäufen plus originaler Austrittsumkehr überein. Private Belege: `analysis-output/shop-roundtrip-oTJ5XC/`. Dies ersetzt noch keine native Stapelabnahme.

Cupero erhielt den neuen Folgeauftrag nach bestätigtem UI-Versand und quittierte die Verteilung an Hoth, Alderaan und Quesh. Hoth: ausschließlich10-Klickkanten; Alderaan: vorhandener I2-Shop/-50 normal, Teilbündel, voller Stapel und zu wenig Gold mit Reload; Quesh: gezielter Codeabgleichcb511ba/de424b7. Keine weiteren breiten Forschungspakete. Konkreter offener Widerspruch: lokale OBJET-Form16 hat X-Ursprung-6 und X-Ausdehnung13; nach inklusiver Regel ergäbe das122..135 statt der bislang nur abgeleiteten122..134. Hoth soll insbesondere134/135/136 prüfen. Bis zu dieser Originalmessung wird der10-Klickbereich nicht geraten.

## VorbereitungD: ALIS-Modkopien beider Originalprofile

Während die eng abgegrenzten A/B-Originalprüfungen bei Grok laufen, ist die Lücke zwischen ALIS-Imageexport und kompletter überprüfter Spielkopie geschlossen. `mod:alis` rekodiert eine gleich große Imageänderung in einer einzelnen Root-IO-Ressource und exportiert eine neue vollständige Installation. Gemeinsamer Kopierer für CONT/ALIS erhält alle anderen Dateien, prüft jedes Output und abschließend erneut den gesamten Quellprofilhash. Kein Merge vorhandener Ziele, keine Originalwrites und kein Erfolgsmanifest bei Fehlern. Spielprofil bleibt ausdrücklich aufrufergewählt, nicht aus dem Namen als bewiesen behandelt.

Synthetische Dateitests für beide deklarierten Spiele und raw/A1-Container prüfen Änderung/No-op, unbekannte Dateien, Quellschutz, falsche Pfade/Images und bestehende Ziele. Bestehende CONT-Modregressionen beider Kartenprofile bestehen nach der Umstellung weiterhin. Beide Prüfungen sind in CI aufgenommen.

Konkrete private Vorbereitung: je lokale LOGO.IO-Palette6 eine Kanaländerung, genau ein dekodiertes Imagebyte pro Spiel. Rekodierung, ganze Spielkopie, alle Datei-Readbacks und Quellprofile bestanden. Belege und Kopien: `analysis-output/alis-original-mod-VcTK4z/`, Metadaten `cases.json`; keine Originaldaten in Git. Beide Manifeste bleiben `prepared-not-tested-in-original`: Start, tatsächliche Sichtbarkeit der Änderung und erneuter Originallauf fehlen. D ist damit vorbereitet, nicht abgenommen; das Gesamtziel bleibt unverändert.
