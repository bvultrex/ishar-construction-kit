# Ishar2: Tavernenmahlzeit

Der native Referenzfall MEALB und TAVERNE.IO0062e..0069d belegen den Nahrungsendzustand einer bestätigten Mahlzeit: Jeder belegte Charakterplatz erhält40 Nahrung, gedeckelt auf100. Werte über60 werden direkt100. Leere Partyplätze bleiben unverändert.

`feedOriginalTavernParty` bildet ausschließlich diesen persistenten SAV-Teil ab. Der quellenfreie Prüfer variiert Anwesenheitsmasken, Grenzwerte0/20/59/60/61/99/100/255, Subarrays, Eingabeimmutabilität und sämtliche Fremdbytes.

Der optionale lokale Prüfer `test:original-tavern-food-local` bindet TAVERNE.IO SHA256ea315973… und die Originalbereiche0062e..0069d an Anwesenheitsgate, >60-Abkürzung, +40-Zweig, Deckel100 und die fünf Charakterplätze. Er führt keine Original-EXE aus.

Noch nicht als Produktaktion freigegeben sind Preisabbuchung, Mehrfiguren-Verteilung, Bestätigungs-/Nachrichtenreihenfolge, Stundenfortschreibung und Tavernen-UI. Der nachgewiesene Fall t=2 kostet580 und zahlt erst nach Schließen der Essensnachricht; die genaue Zahlungsreihenfolge bei mehreren Goldhaltern muss vor einem SAV-Writer vollständig gebunden werden. Diese Trennung verhindert, dass ein nur plausibler Verteiler als Originalverhalten erscheint.
