# Installierter Timer-IRQ im tatsächlichen Laufzeitzustand

Stand 2026-10-18. `original-dos-runtime-timer-irq.ts` verbindet explizite IRQ8-
Zustellung, Originalentry 0D6D/0D98, VGA-Palettenrückruf und Original-Tail.
Die neun gespeicherten Register und der Hardwareframe IP/CS/FLAGS entstehen
in derselben Reihenfolge im gemeinsamen physischen Speicher. Keine künstliche
IRET-Funktion wird an einen externen Handler geschrieben.

0D6D wartet auf explizite Retrace-Antworten, programmiert PIT-Kanal 0 aus
CS:BF8 und schreibt SS:288C. 0D98 überspringt diesen Teil. Beide quittieren
per OUT20/60, setzen IF und erhöhen C9A mit Sättigung bei FF. Bei aktiven
2898/CB8 folgt der vorhandene VGA-Callback EA8; danach die vorhandene
Auswahl-/Countdown-/Rückkehrroutine DC9. Audio-, Record- und Cursorbodies
bleiben deren ausdrücklich ausgewiesene Grenzen. CPU-Arithmetikflags sind
kein API-Vertrag; im Hardwareframe und bei IRET bleiben die Originalflags exakt.

`check-native-dos-runtime-timer-irq.py` prüft vier tatsächliche Ishar-1-
Timer-Wartezustände bei 3D64 und zwei tatsächliche Ishar-2-Frame-Rückkehrzustände
bei 264C. Im unveränderten Zustand erzeugt der erste IRQ jeweils 1030
Portereignisse (nur Anzahl/Hash im öffentlichen Nachweis), C9A steigt 0 -> 1,
alle Register werden wiederhergestellt und der Originalcode springt zum
gespeicherten BIOS-Ziel 7000:1234. Der aus expliziten DOS-Startantworten stammende
Zeiger enthält hier keinen verifizierten BIOS-Handler. Dessen Körper wird nicht
ausgeführt; die Rückkehr zur Warteschleife ist deshalb noch nicht nachgewiesen.

Weitere sechs getrennt gekennzeichnete synthetische Fälle setzen ausschließlich
den Countdown C97 auf 2. Sie prüfen den tatsächlichen Original-IRET statt des
BIOS-Kettenzweigs, einschließlich zurückgekehrter IP/CS/FLAGS und SP. Diese Fälle
beweisen keine Fortsetzung der unveränderten Startzustände. Inputdateien bleiben
unverändert. Der Prüfer authentifiziert Capture-Profil und Checkpoint-SHA, prüft
den ganzen Speicher außer 0798–07ED und kontrolliert den ausstehenden
Hardwareframe des BIOS-Zweigs zusätzlich separat.

Ergebnisse: RUNTIME_TIMER_IRQ_NATIVE_2026-10-18.json (zwölf Fälle, davon sechs
synthetische IRET-Fälle). TypeScript-Prüfung und physischer Skripttest bestanden.

Nächste Abnahme: den gespeicherten BIOS-Timerdienst als expliziten Plattform-
Adapter oder anhand einer echten Firmware-Referenz anschließen. Plattform-
Anpassung und Ishar-Originalrekonstruktion dabei getrennt halten. Erst danach
den unveränderten Ishar-1-Wartezustand weiterführen und Pixelpipeline abnehmen.
Kein vollständiger Hardware-/BIOS-Nachweis und kein neues Browserbild.
