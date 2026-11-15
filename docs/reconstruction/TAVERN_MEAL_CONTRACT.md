# Ishar2: Tavernenmahlzeit

Stand: 15.11.2026. TAVERNE.IO0062e..0069d vergibt Nahrung ausschließlich an Plätze mit signierten HP > 0. Die Klasse ist kein Esser-Gate: Belegte tote Figuren essen nicht; auch bei Klasse255 entscheidet dieser Block allein nach HP. Der frühere Klassenvergleich im Kit war falsch und ist korrigiert.

feedOriginalTavernParty bildet ausschließlich den persistenten Nahrungsblock nach bestätigter und bezahlter Mahlzeit ab. Nahrung wird wie omaintc als signiertes Byte gelesen. Werte0..60 erhalten40, Werte61..127 werden100. Rohbytes128..255 folgen dem +40-Zweig mit Byteüberlauf; etwa128→168 und255→39. Diese ungewöhnlichen Eingaben sind synthetische Grenzfälle, keine Behauptung regulärer Spielzustände. Die anschließende >100-Prüfung kann nach diesem Zweig keinen weiteren Fall ändern.

Der quellenfreie Prüfer deckt alle256 Rohbytes bei fünf HP-Grenzwerten und zwei Klassenwerten ab (2560 Fälle), dazu eine gemischte Gruppe, Subarrays, Eingabeimmutabilität und sämtliche Fremdbytes. Der lokale Prüfer test:original-tavern-food-local bindet TAVERNE.IO SHA256ea315973… einschließlich des bisher ausgelassenen HP-Gates0063f an Originalbytes. Signierte Byte-Lesung entspricht zusätzlich der separaten ALIS-C-Referenz opernames.c, omaintc. Kein neuer Original-EXE-Lauf.

Der neue [Quesh-Zahlungsvertrag](grok-reports/taverne-payment-contract.md) beschreibt Preis500+40·t (t0..14), zwei Zahlungspässe in Slotreihenfolge, arme Zahler und Restverteilung. Bezahlen prüft Klasse≠255 und unterscheidet sich damit ausdrücklich vom Esser-Gate. Mehrzahlerfälle sind statisch abgeleitet, nativ ist nur der Einzelzahlerfall t2 berichtet. Der Zahlungsvertrag ist übernommen, sein Gold-/Zeitwriter ist noch nicht implementiert oder vollständig lokal gebunden.

Preisabbuchung, Bestätigungs-/Nachrichtenreihenfolge, Stunden-/Tickfortschreibung und Tavernen-UI bleiben als Produktaktion offen. Nach ok werden zuerst Zeitfelder geändert; nach Schließen der Essensnachricht folgen Zahlung und Nahrung. Eine unmittelbare gemeinsame SAV-Aktion würde diesen transienten Ablauf noch nicht nachweisen.
