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
