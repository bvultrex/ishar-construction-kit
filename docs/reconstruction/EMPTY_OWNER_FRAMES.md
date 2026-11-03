# Leere Objektgruppen im echten Ishar-1-Start

Stand 2026-10-18. Die Grenze 3DE4 bezeichnet eine sichtbare Objektgruppe,
beweist aber noch keine Zeichenrecords. Im ersten Ishar-1-Frame sind beide
sichtbaren Gruppen (BX=686 und 738) leer.

`runOriginalDosPhysicalFrame(..., traverseEmpty=true)` verbindet nun die
vorhandene Vorbereitung 3E55 mit der originalen Objektiteration. Nur wenn die
Vorbereitung tatsächlich nach 3DE7 zurückkehrt, werden ihre Speicherwirkungen
übernommen und das nächste Listenfeld gelesen. Bei einer nichtleeren Gruppe
bleibt die Grenze vor CALL3E55 bestehen; die zur Prüfung auf einer Kopie
berechneten Änderungen werden nicht übernommen. Die Frame-Rückkehr stellt
die ursprünglich gesicherten Skriptregister wieder her.

Der optionale Schalter bewahrt die bisherigen Einzelgrenzen. Er überspringt
keine Originalausführung. Der native Prüfer durchläuft dieselben CALL-/RET-
Pfade und unterscheidet wiederholte Adressen 3DE4 anhand der Zahl leerer Gruppen.
Zyklische Listen bleiben explizite Fehler.

`check-native-dos-physical-frame.py` prüft je Spiel 23 Fälle, darunter leere
Gruppen vor versteckten beziehungsweise nichtleeren Gruppen und ein aliasierendes
Segmentfenster. Verglichen werden sechs ALIS-Register, SP, Besuchszahlen und
der gesamte Speicher außer ausgewiesenem Stack-Scratch.
Nachweis: EMPTY_OWNER_FRAME_NATIVE_2026-10-18.json.

Aus vier tatsächlichen Ishar-1-Root-Checkpoints stimmen 202 MAIN-Befehle, erster
Yield, elf Callback-Befehle, beide leeren Gruppen und die volle Frame-Rückkehr
nach 264C mit dem Original überein. Danach stimmen auch der Wiedereinstieg,
zwei weitere MAIN-Befehle und der nächste Callback überein. Der folgende Frame
erreicht die originale Timer-Wartebedingung bei 3D64. Keine Timerwerte wurden
zur Umgehung gesetzt und keine IRQs in diesen Test injiziert. Nächster Schritt
ist die echte Timer-/IRQ-Fortschaltung, keine künstliche Objektbestückung.
Nachweis: STARTUP_EMPTY_OWNER_FRAME_NATIVE_2026-10-18.json.

Weiterhin kein fertiges Ishar-1-Bild und keine sichtbare Toolkitänderung.
