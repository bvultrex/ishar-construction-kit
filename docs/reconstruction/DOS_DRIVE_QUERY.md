# DOS-Laufwerksausdruck 160

Stand 2026-10-18, beide durch Capture-SHA identifizierten DOS-Profile.
Originalhandler 6F6D–6FDD ruft für A/a, B/b, C/c und ? die Funktion 15A1 auf.
Andere Selektoren liefern Null ohne Dienstaufruf. Gültige Antworten sind
ASCII A/B/C; andere aktuelle Laufwerke und Fehler liefern Null.

15A1 ruft zuerst 1000:8ADB auf. Die fr�here Deutung als Laufwerksdialog war
falsch: 8ADB/8AE4 stoppt Audio vor DOS-Zugriffen. CS:E940 ist der Audiomodus.
Der interne Pfad ist nun rekonstruiert; externe Treiber1941:2209 und der aktive
Sound-Blaster-Stopp92E0 bleiben explizite Grenzen. Siehe AUDIO_QUIESCE.md.

Anschlie�end liest ? das aktuelle Laufwerk per DOS INT21/AH19.
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
außer FEC0–FF0F CPU-Stack-Scratch. Externe Audiotreiber und CPU-Scratchregister/-Flags
sind kein Vollständigkeitsnachweis dieser Prüfung.

Der historische Nachweis STARTUP_DRIVE_QUERY_NATIVE_2026-10-18.json stoppt
noch mit der inzwischen korrigierten Fehlerbezeichnung bei 183 Befehlen.
Der neue Nachweis STARTUP_AUDIO_QUIESCE_NATIVE_2026-10-18.json erreicht mit
explizitem aktuellem Laufwerk C: und Equipment-Wort 0 nun 202 Befehle bis Yield,
danach Callback und die erste sichtbare Objektgrenze 3DE4. Originalzust�nde
werden dabei nicht zur Umgehung eines Gates gepatcht.
DOS-/BIOS-Einzelpfade: DOS_DRIVE_QUERY_NATIVE_2026-10-18.json.
