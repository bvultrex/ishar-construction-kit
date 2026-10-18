# Originale Framefortsetzung nach Timer-Wartephase

Stand 2026-10-18. `runOriginalDosPhysicalFrame` unterstützt optional
`resumeWait: {ax, sp}` für den tatsächlichen Einstieg bei 3D64. Der Frame-
Prolog wird dabei nicht wiederholt. Die Schwelle stammt aus dem bereits
geladenen AL, nicht aus einem erneuten Lesen von SS:C99. Bei weiterbestehender
Wartebedingung bleibt die Grenze 3D64 erhalten; bei freier Bedingung folgt die
vorhandene Eingabe-/Puffer-/Objektverarbeitung. Bei Rückkehr werden die sechs
ALIS-Register aus dem vorhandenen Saved-Frame gelesen und SP um 20 erhöht.
Der echte gespeicherte Caller muss 264C sein. Diese Prüfung ist eine Host-
Schutzbedingung, keine behauptete Validierung im Original.

`check-native-dos-wait-frame.py` prüft je Spiel 64 synthetische Zustände:
AL-Schwellen 0/1/3/255, Timerstände 0/1/2/255, abweichendes aktuelles C99 sowie
leere Objektgruppen. Bei erwarteter Wartephase wird CMP/JA tatsächlich bis zur
erneuten Schleifengrenze ausgeführt; ein Stop direkt vor CMP genügt nicht.
Bei Rückkehr werden auch die bekannten gesicherten AX/BX/DI-Werte geprüft.
Sechs ALIS-Register, SP und der ganze Speicher außer FEC0–FF0F werden verglichen.
Originaldateien bleiben unverändert; IRQ-/BIOS-Verhalten ist kein Gegenstand
dieser isolierten Fixtures. Nachweis: WAIT_FRAME_NATIVE_2026-10-18.json.

Der Startprüfer verbindet dies über den ausdrücklich gewählten Schalter
`--timer-platform` mit installiertem IRQ8 und dem dokumentierten BIOS-Adapter.
Direkte IRET-Zyklen werden ohne BIOS-Dienst ausgeführt, nur der tatsächliche
Saved-Handler-Zweig nutzt die registrierte Plattformantwort. Portereignisse,
Register, Hardwareframe und Speicher werden an den jeweiligen Grenzen verglichen.
Die gemeinsame Python-Plattformantwort steht in `dos_platform_bios_timer.py`;
sie ist ein kontrollierter Testdienst, keine ausgeführte Firmware.

Reproduktionsaufruf aus dem Repo, mit den privaten Root-Checkpoints:

```powershell
$env:PYTHONPATH='../analysis-tools/python'
& 'C:\Users\Hoffmann\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/check-native-dos-startup-main-script.py ../analysis-output/startup-main-root-ishar1-2026-10-18 --find-first-carry 1 --shift-flags 0 --palette-retrace 8 --current-drive 2 --equipment-word 0 --cycles 30 --traverse-empty --timer-platform
```

Dieser Modus liefert explizite Dienste und Tick-Zustellungen; er ist kein
Nachweis einer echten BIOS-Firmware, einer realen CPU-Geschwindigkeit oder
vollständiger Hardwareemulation. Browserintegration bleibt eine eigene Abnahme.

Der vollständige Vergleich aller vier Länder-/Mauszustände besteht: Nach dem
202-Befehle-Präfix folgen 30 zusätzliche Schedulerzyklen mit je einem expliziten
IRQ8. Im 30. Zyklus führt MAIN elf Befehle bis Yield aus und erzeugt die
Zeichenrecords. Nach Callback, Tick und Verarbeitung der leeren Gruppe BX=686
erreicht die Ausführung die nichtleere Gruppe BX=738 bei 3DE4, CX=154.
Direkte IRET- und registrierte BIOS-Service-Zweige werden in derselben Kette
unterschieden. Noch keine Pixelzeichnung ist Gegenstand dieses Nachweises.
Ergebnisse: STARTUP_TIMED_CYCLES_ISHAR1_2026-10-18.json.

`--checkpoint-name country33-mouse0.bin` beschränkt einen Exportlauf ausdrücklich
auf einen authentifizierten Eingangscheckpoint. `--checkpoint-end` speichert
den daraus tatsächlich erreichten Speicherzustand privat mit Profil, Hash,
Registersatz und Grenze. Es setzt keine manuell erzeugten Zeichenrecords ein.

Aus dem anschließend exportierten Zustand country33-mouse0 besteht nun auch
der vollständige Vergleich von Objektvorbereitung, Projektion, Recordübernahme,
Batch-/Clip-/Formatwahl und erster Typ-1-Pixelfüllung. Genau 64.000 verschiedene
Zieladressen im tatsächlichen 320×200-Puffer 905F:0000 stimmen überein. Der
Puffer wird aus der Originalinitialisierung gelesen, nicht auf E000 festgesetzt.
Nachweis: STARTUP_FIRST_SOLID_ISHAR1_2026-10-18.json (ein Grafikzustand, kein
behaupteter Grafikvergleich aller vier Startvarianten).

Der folgende Record erreicht nativ identisch Grafiktyp 0 bei 1E97:0531.
Der Prüfer kann mit `--stop-unsupported` diese verifizierte Grenze ausgeben und
privat exportieren; er zeichnet den noch offenen Typ nicht und kennzeichnet die
Recordkette ausdrücklich als unvollständig. `--present` lässt sich damit nicht
kombinieren. Nachweis: STARTUP_NEXT_BYTE_ISHAR1_2026-10-18.json.
Nächste Implementierung: originales Typ-0-Byteblitting. Noch kein vollständiger
Ishar-1-Frame, keine VGA-Präsentation und kein neues Browserbild.
