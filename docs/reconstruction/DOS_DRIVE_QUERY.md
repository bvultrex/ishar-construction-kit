# DOS-Laufwerksausdruck 160

Stand 2026-10-18, beide durch Capture-SHA identifizierten DOS-Profile.
Originalhandler 6F6D–6FDD ruft für A/a, B/b, C/c und ? die Funktion 15A1 auf.
Andere Selektoren liefern Null ohne Dienstaufruf. Gültige Antworten sind
ASCII A/B/C; andere aktuelle Laufwerke und Fehler liefern Null.

15A1 ruft zuerst 1000:8ADB auf. Bei CS:E940=0 kehrt diese Funktion unmittelbar
zurück. Andernfalls beginnt bei 8AE4 ein interaktiver Originaldialog, dessen
Körper noch offen ist. Die Rekonstruktion wirft dort ausdrücklich einen Fehler
und verändert die Eingabe nicht. Dieses Gate bleibt auch im realen Start aktiv.

Im Pfad ohne Dialog liest ? das aktuelle Laufwerk per DOS INT21/AH19.
C: wird per AH0E ausgewählt; dessen zurückgegebene Laufwerksanzahl ignoriert das
Original. A: und B: lesen vorher einen BIOS-Sektor (INT13/AH02, AL=1,
CH=1, CL=1, DH=0) nach CS:227E. Bei Fehler wird genau einmal wiederholt.
Für B: muss außerdem INT11 im Equipment-Wort eines der Bits 6/7 setzen.
Beide fehlgeschlagenen Leseversuche verhindern die Laufwerksauswahl.

`original-dos-drive-query.ts` bildet dies mit expliziten Dienstantworten ab.
Auch fehlgeschlagene BIOS-Leseversuche erhalten explizite 512-Byte-Pufferdaten,
da Fehler den Zielpuffer nicht zwingend unverändert lassen. Es erfolgt kein
Host-Laufwerkszugriff. Der physische Ausdrucksinterpreter übernimmt die
Speicherwirkung transaktional; ein nachfolgender Fehler mutiert die Eingabe nicht.

`check-native-dos-drive-query.py` vergleicht pro Spiel 330 Kombinationen:
Selektoren, aktuelles Laufwerk, Equipment-Wort, unmittelbaren Leseerfolg,
Erfolg nach Wiederholung und zweimaligen Fehler. Verglichen werden die genaue
Dienstreihenfolge, Pufferdaten, sechs ALIS-Register, SP und der gesamte Speicher
außer FEC0–FF0F CPU-Stack-Scratch. Dialogverhalten und CPU-Scratchregister/-Flags
sind kein Vollständigkeitsnachweis dieser Prüfung.

`check-native-dos-startup-main-script.py --current-drive 2` kann die DOS-AH19-
Antwort nun explizit liefern. Bei den vier tatsächlichen Ishar-1-Startzuständen
bleibt die verglichene Präfixlänge 183: CS:E940 aktiviert dort den offenen Dialog.
Diese Zustände wurden nicht für einen scheinbaren Fortschritt umgepatcht.
Nächster Arbeitsschritt ist 8AE4 einschließlich Grafik-/Eingabeabhängigkeiten.
Nachweise: `DOS_DRIVE_QUERY_NATIVE_2026-10-18.json` und
`STARTUP_DRIVE_QUERY_NATIVE_2026-10-18.json`.
