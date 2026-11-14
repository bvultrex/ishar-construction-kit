# Ishar2: Stapel in Handplätzen

Arbeitsstand14.11.2026, lokale FRISE.IO SHA25627117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64. Statischer Kontrollflussbefund, noch keine native Handstapelabnahme. Die bisherige Portraitweitergabe allein deckt diesen Pfad nicht ab.

## Reihenfolge

1.02e20 merkt sich den bisherigen Inhalt des angeklickten Platzes in local0100.
2.02e2e ruft03580. Für gehaltene Codes-59..-49 werden zuerst die charakterweiten Mengen in T4bd4 erhöht und die gehaltene Menge T4bbc vermindert. Deckel10, für-49 Deckel20. Zielcode16 überspringt diesen Schritt wegen des gesonderten Umwandlungszweigs.
3.02e32 ruft03b98: Gegenhandreservierung-125 wird unabhängig vom Gegenstandstyp freigegeben. Danach folgt die Waffenreservierung02e36.
4.02f0c entscheidet anhand des vorher gemerkten Platzinhalts über leeren Platz oder Tausch. Diese Entscheidung erfolgt nach den Mengenschreiboperationen.

## Leerer Platz oder gleicher Stapel

-02f19..02f58 sucht für gehaltene Stapel nach einem bereits vorhandenen gleichen Code in den Plätzen0..10. Bei Treffer wird kein zweiter Slot angelegt; die Zählermenge wurde schon im Helper übertragen.
-Andernfalls schreibt02f5a den gehaltenen Code in den gewählten Platz, auch wenn noch Restmenge am Cursor bleibt.
-02fdb..0300e scannt alle20 Cursorzähler. Nur wenn alle null sind, wird auch der gehaltene Objektcode gelöscht und der Cursor freigegeben.
-0301f..03043 führt einen Klick auf denselben Stapel ebenfalls zu02f19. Damit sind Ergänzung und Rest am Cursor möglich.

## Verschiedene belegte Gegenstände

-0315b..03181 verhindert den eigentlichen Tausch, solange irgendein Cursorzähler positiv ist. Die vorherige Teilübertragung nach03580 bleibt dabei erhalten. Beispiel: Gehalten-50×6, Empfänger besitzt-50×8 in einem anderen Slot; angeklickte Hand enthält9. Ergebnis: Zähler10, Hand weiterhin9, Cursor weiterhin-50×4.
-Ist der Cursorzähler nach Übertragung null, läuft der Tausch weiter. Ein alter Stapel wird bei03212 mit seiner ganzen charakterweiten Menge in den Cursorzähler übernommen;0322c löscht seine Menge beim Charakter.
-0323d..03289 sucht den eingehenden Stapelcode erneut in0..10. Existiert er schon anderswo, wird der angeklickte bisherige Slot gelöscht, anstatt den gleichen Stapel doppelt einzutragen. Andernfalls schreibt0328b den eingehenden Code in den Zielslot.
-0330c setzt den vorherigen Zielcode als gehaltenen Code. Rüstungsänderungen verwenden den bereits belegten engen Tauschbereich-29..-26.

## Konsequenzen für die Implementierung

Ein Handtransfer-Ergebnis braucht aktualisierte SAV-Bytes und einen vollständigen Cursorzustand aus Code und Menge. „Tausch abgelehnt“ darf nicht pauschal unveränderte Bytes bedeuten. Die bisherige Schnittstelle `{held:number|null}` reicht für einen ausgetauschten alten Stapel nicht aus.

Kein zweiter Inventarslot für einen schon vorhandenen Stapel. Mengenbilanz muss die charakterweiten Zähler und den Cursor erfassen; Slotanzahl ist keine Mengenbilanz. Prüfungen benötigen leere Hand, denselben Stapel, verschiedenen Stapel, Nichtstapel, existierenden Stapel anderswo, Teilübergabe und volle Deckel10/20.

Noch gesondert abzuklären: Klick auf reservierten Zielplatz-125 nach frühen Mengenwrites, ungültige/mehrfach belegte Stapelzustände, Zielcode16-Umwandlung, vollständige Entity-/Cursoranzeige. Der Originalcode prüft-125 erst03012. Eine frühe UI-Sperre kann diesen Sonderfall vermeiden, ist aber kein Nachweis identischen Originalverhaltens. Keine hypothetische „Bereinigung“ solcher Zustände implementieren.

Lokaler Prüfer `npm run test:original-stack-hand-contract-local` bindet die entscheidenden Aufrufe, Sprünge und Schreiboperationen an die Originalbytes. Er beweist weder eine implementierte Handweitergabe noch einen Originallauf.

## Adapterstand

`original-hand-runtime.ts` implementiert nun die Reihenfolge für konsistente Stapelzustände und die bisher unterstützten Nichtstapel-/Waffencodes. Das Ergebnis enthält vollständigen Cursorzustand, angenommene Menge und getrennte Tauschinformation.880 synthetische Handfälle plus gezielte Teil-/Vollübertragungen zu bestehenden Stapeln, umgekehrte Tausche, Rüstung und Zweihandreservierung bestehen. Typecheck und Build bestanden. Reservierter Zielplatz und Effektcode16 bleiben ausgeschlossen. Der Adapter ist an die Originalinventar-Handbuttons angeschlossen.

Browserprüfung40c8ae2: gehalten-50×6 auf Zielstapel8 bei belegter Hand9 übernimmt2, lässt Hand9 unverändert und hält4 am Cursor; Rest an dritte Figur. Danach tauscht Code9 gegen Handstapel-49×20; der alte Stapel bleibt mit Menge20 am Cursor und wird an eine weitere Figur übergeben. Export SHA323f0fc0bd9f521a520ef9bb57b2c81c6e2fc38aa97b7b26da770f4b7a1326de entspricht der unabhängig erzeugten Erwartungsdatei vollständig; Reload zeigt Stapel10, Rest4, beide Code9-Hände und-49×20 erneut. Privater Beleg: `../analysis-output/stack-hand-browser-2026-11-14/browser-check.json`. Native Handstapelprüfung steht aus. Die ausgelieferte Fassung788cd8e enthält diesen Stand nicht.
