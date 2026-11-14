# Aktueller Abnahmestand

Stand: 14.11.2026, veröffentlichter und ausgelieferter Code1210da8, integrierte Nachträge38–40. Gesamtziel: vollständige Rekonstruktion **beider** DOS-Profile und Content-Toolkit; weiterhin offen. Diese Tabelle ist der operative Einstieg. [Projektprüfung](CURRENT_REVIEW_2026-11-14.md) enthält Anforderungen, Prozessregeln und die datierten Arbeitsnachträge; [PLAN](PLAN.md) und [COVERAGE](COVERAGE.md) behalten den vollständigen Umfang.

„Berichtet“ bezeichnet einen Original-EXE-Lauf von Grok mit lokal verglichenem Profil und Schreibvertrag. Dessen private Rohsaves liegen hier nicht vor. Hosttests, Browser und Originalausführung ersetzen einander nicht.

| Abnahme | Originalvertrag / lokale Prüfung | Original-EXE | Browser / Persistenz | Noch offen |
|---|---|---|---|---|
| A: CONT1-Bodenobjekt9 → Rucksack | FRISE/SOURIS/IO gebunden, HP-/Klasse-Gate, unveränderte Fremdbytes | Aufnahme, voller Rucksack, Originalsave/Neustart/Weitergabe berichtet | Aufnahme/Empfänger/Export/Reload bytegenau geprüft | Die konkrete Codex-Exportdatei noch nicht hashidentisch im Original geladen; negative Empfänger nativ nur statisch |
| A: Code9-Trefferfläche | Originale26-Proben-Regel116..141 ×104..123 | Kanten/Ecken/Transparenz berichtet und Profile verglichen | Unabhängiges Rechteck, Bildpointerevents aus, transparente Mitte nimmt auf | Allgemeine Form-/Entitätsliste, überlagerte Objekte und blockierte Bodenablage |
| A: Goldfund10 | Vollständiges Gate,300 Arithmetikfälle, IO-Mapping | Gold, Übertrag, Löschen14–17, Neustart und14×19-Trefferfläche berichtet | Gutschrift, unverändertes Inventar, Export/Reload bytegenau geprüft | 24 native Kantenproben bestätigt; allgemeine Form-/Entitätskollision und andere Positionen bleiben offen |
| A: Handpanel, Nichtstapel-Transfer |825 Code9-Pfade;18 Rüstungsblätter/54 Tausche; originale unterschiedliche Rüstungsbedingungen |9-Handablage/Weitergabe berichtet; breiterer Nichtstapel-Codeabgleich ohne konkrete Abweichung berichtet | Handpanel,9-Transfer und kontrollierter-25-Tausch samt Reload geprüft | Waffen/Zweihand, weitere Ausrüstung, Effekte und sämtliche Original-UI-/Szenenpfade |
| A: ganze/einzelne Stapelweitergabe | Listinglücke geschlossen; vollständige Aufnahmebytes/IO-Mapping;660 Übergabefälle mit Mengenbilanz | Nicht abgenommen | Teilübergabe6→2+4, Einzelentnahme und Export/Reload bytegenau geprüft | Native Weitergabe und Stapel-Handtausch |
| B: selector6/-61/1800 | Reproduzierbare START-Auswahl, Originalsortiment und binärer IO-Readback | Zu Fuß ohne Patch erreicht; Kauf/Neustart berichtet, Commerce-Bytes stimmen | Kauf/Gold/Exit-Umkehr/Export/Reload bytegenau geprüft | Kein allgemeiner NPC-/Dialog-/Verkaufs-/Tavernenabschluss; unbekanntes Originalbyte7577 bleibt unbekannt |
| B: Stapelware-50/qty5/300 | Auswählbarer Stockslot2; Kauf-/Deckel-/Teilbündelregressionen | Normalkauf, Teilbündel, voller Stapel, Geldmangel samt Neustarts berichtet | Zweimal5, voller Stapel, keine dritte Abbuchung, Export/Reload geprüft | Andere Empfänger, native Handstapel und Code-49/Deckel20 nicht abgedeckt |
| C: Ishar1-SAV-Schreibschutz | Alte Kandidatenmap direkt/Party/UI gesperrt;107 MAIN-Felder aus I/O;8 Saves/856 Änderungen geprüft | Neue veränderte SAV nicht im Original abgenommen | Separater Rohfeldeditor: Undo/Redo/Export/Reload geprüft | Vollständige benannte Charaktersemantik und Original-Ladeabnahme; eng begrenzte Schutz-/Strukturprüfung erledigt |
| D: erste Modkopie je Spiel | CONT/ALIS-Kopierer; raw/A1-/Quellschutztests, vollständiger Readback und abschließender Quellprofilvergleich | Nicht abgenommen; lokaler DOSBox-Versuch per Esc beendet | Private kontrastreiche LOGO-Palette6-Kopie je Spiel mit je einem geänderten Imagebyte aus64a3c4f vorbereitet | Originalstart, sichtbare Änderung, erneuter Lauf je Spiel; keine reine Exportprüfung als Ausführungsbeleg |

## Aktive Arbeit und feste Grenzen

1. Produktarbeit: A/B weiter schließen. Nach ausdrücklichem Nutzer-„fahre fort“ Browserarbeit wieder aufgenommen; kein neuer direkter DOSBox-Modlauf. Fehlende Originalläufe bleiben offen.
2. Abgeschlossen/geprüft:b0117b0 (10-Klickkanten, I2-Stapelkauf, Nichtstapel-Abgleich). Neu gesendet und von Cupero quittiert: Hoth hashgleicher Codex-SAV-Originalreload, Quesh26e290c-Stapeladapter, Alderaan kontrastreiche LOGO-Modprobe beider Spiele aus64a3c4f. Keine alten Aufträge offen laut Quittung; aktuelle Botprozesse werden ohne neue Beobachtung nicht als laufend behauptet.
3. Neue Berichte ausdrücklich mit `git fetch origin refs/heads/grok/reports-2026-10-18:refs/remotes/origin/grok/reports-2026-10-18` holen. Der Arbeitscheckout hat einen eingeschränkten Fetch-Refspec; bloßes Fetch kann sonst nur FETCH_HEAD aktualisieren.
4. Nicht ausgeführte UI-Tests bleiben offen. Kernregressionen und geeignete Originaldatenprüfer laufen vor einem Commit; CI ergänzt die quellenfreien Prüfungen. Bestehende Tests werden nur bei neuen Änderungen/Fehlern erneut verbreitert.
5. Nächster direkt vergleichbarer Originalfall: Codex-SAV über vorhandenen deterministischen Prüfer aus identischem START-/CONT-Profil reproduzieren, SHA256 mit Browserexport vergleichen und **diese hashgleiche Datei** in separater Originalkopie laden. Ein ähnlicher Ablauf allein schließt diesen Rest nicht.

## Auslieferung und Belege

- Letzte stabile Testlieferung: Quellcommit1210da8, Paket `../testbuild-1210da8.zip`; SHA256ed1077f6dd0f3ef434657eb1e1e88ea9f66edded7ea3010c10814c3581674731. Manifest und alle62 Nutzdateien geprüft. Nutzerzugänge4181 und4183 verwenden diese feste Kopie; frühere Pakete bleiben erhalten.
- Beide zuletzt eingerichteten Server verwenden jetzt die unveränderliche Paketkopie1210da8. Neue Repo-Builds ersetzen ihre Dateien nicht mehr. Acht Routen/Buildkennung/Root-Assets und lokale Händlerquellen je Port geprüft; bestehende Browserseite neu laden.
- CI1210da8:43642885087/43642890475 und43642890471 erfolgreich. Frühere CI64a3c4f und26e290c einschließlich Stapeladapter ebenfalls erfolgreich. CI3b4a5bc einschließlich gemeinsamem Modkopierer erfolgreich. Keine CI-Prüfung benötigt Originaldateien.
- Private lokale Nachweise stehen ausschließlich unter `../analysis-output/`; genaue Fallordner und Grenzen im [Arbeitsjournal](CURRENT_REVIEW_2026-11-14.md). Originale, SAVs, Listings und native Rohbelege werden nicht eingecheckt.

## Rest des Gesamtziels

Auch nach A–D bleiben Ishar1-Produktintegration, vollständige Welt-/Übergangs-/Türzustände, originale KI/Kampf/Tod/Respawn, Magie, Dialoge/Quests, Audio, vollständige Originaldarstellung/VM/Boot, Ressourcenabhängigkeiten sowie neue Inhalte und ihre Speicher-/ID-/Originalexportgrenzen offen. Einzelne grüne Abläufe ergeben keine Gesamtquote und keinen Abschluss eines dieser Bereiche.
