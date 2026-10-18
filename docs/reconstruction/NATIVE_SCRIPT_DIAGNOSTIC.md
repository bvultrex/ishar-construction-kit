# Native Skript-Diagnose im Toolkit

Im Asset Lab (`/assets`) öffnet **IO-Modul für Skript-Diagnose öffnen** eine lokale DOS-IO-Datei aus Ishar1 oder Ishar2. Die Quelldatei, der Playtest und das Mod-Projekt bleiben unverändert. Der Import ist noch getrennt von der gemeinsamen Projektverwaltung.

Der kontrollierte Kontext verwendet Moduloffset0/Segment4000h, Kontextsegment5000h, Pooloffset0200h, Tabellenslot6 und obere GrenzeFFFFh. Globals beginnen mit null; die kontrollierte Tabellenbasis0100h wird in SS:0BD2 gesetzt. Aktive Listenlinks werden nicht erfunden. Diese Testparameter stellen keinen wiederhergestellten Originalspielzustand dar. Angezeigt werden Modul-ID, Bildgröße, Einstieg, BP, SI, nächstes Opcodebyte, Skriptstackoffset, gespeicherter Skriptzeiger und Timer-Zielbyte SS:0C99h.

**Einen nativen Kontrollfluss-Schritt ausführen** verwendet gegen Originalinstruktionen geprüfte Rekonstruktionen:

- Opcodes5–10: relative Aufrufe und Sprünge.
- Opcode17: Skript-Return im kontrollierten Hauptskriptmodus.
- Opcode31: direkte Zahlenformen, Ausdrucksschleifen56/58 und sechs Vergleiche74–84; andere Ausdruckstags halten an.
- Opcode41: rohe Kontextblöcke.
- Opcode66: Yield; ausdrücklich keine Scheduler-Fortsetzung.
- Opcode71: Literalwort nach ES:[BP-16h], ohne höhere Feldsemantik zu behaupten.
- Opcode76: drei aufeinanderfolgende Zahlenoperanden nach ES:BP,+2,+4. Spätere Operanden sehen frühere Änderungen.
- Opcode106: niedriges Ergebnisbyte eines Zahlenoperanden nach SS:0C99h.
- Opcode156: Kontextliste und Ergebnisübernahme für direkte Ziel-Tags6/8/18/20 (Byte/Wort mit16-/8-Bit-Offset). Eine leere kontrollierte Liste liefertFFFFh.

Die Zahlenoperanden unterstützen Tags0/2/6/8: vorzeichenbehaftetes Literalbyte, Literalwort, Kontextbyte und Kontextwort. Andere Formen oder Opcodes werden nicht geraten oder übersprungen. Der Adapter hält ohne Änderung von SI und Schrittzahl an. Die Hostfunktionen ersetzen keine vollständige x86-Emulation oder ALIS-VM.

**Diagnose zurücksetzen** erzeugt den Anfangskontext erneut. Für Module über64KiB ist nur die Kontextprüfung verfügbar. Fehlende Operanden oder Skriptzeiger außerhalb der Bilddaten führen zum Halt. Nicht unterstützte Wortzugriffe über eine Segmentgrenze werden von den Hostfunktionen abgelehnt. Keine automatische Ausführungsschleife ist eingebunden.

Nachweise: Kontextaufbau gegen alle240 lokalen IO-Header (98/142) geprüft. Opcode41 mit je1536, Zahlenoperanden/106 mit je1056, Opcode71 mit je144 und Opcode76 mit je384 nativen Vergleichsfällen pro Spiel geprüft. Adaptertests prüfen unter anderem Aufruf→Return→Yield, Kontextänderungen, unveränderte Vorgängerzustände und sichere Halte bei unbekannten oder abgeschnittenen Operanden. Typecheck und Produktionsbuild bestehen.

Am18.10.2026 wurde Ishar2 IO.IO erneut im Browser importiert und16 Schritte ausgeführt: SI006Ch, Timerziel1, nächster Opcode156. Ein weiterer Klick hält dort ohne Änderung von SI/Schrittzahl an. Dies deckt die zuletzt hinzugefügten Opcodes106,71,76 im tatsächlichen UI-Ablauf ab. Es beweist keine vollständige NPC-/Gegnerausführung.

Aktueller Hoststand:17 Schritte mit Ishar2 IO.IO, SI0070h; der nächste Halt ist Opcode31. Ergebnisdispatcher: je192 native Fälle pro Spiel; zusammengesetzter156: je96 Fälle. Auch im Browser am18.10.2026 bestätigt:17 Schritte, SI0070h, Timerziel1 und anschließender unveränderter Halt auf31.

Aktueller Hoststand für Opcode31:18 Schritte bis SI0079h, DX0, CXFFFFh; nächster Halt20. Beide Zahlenregister werden jetzt angezeigt und zwischen unterstützten Befehlen weitergeführt.912 native Ausdrucksvergleiche pro Spiel bestehen. Im Browser am18.10.2026 bestätigt:18 Schritte, SI0079h, DX0000h, CXFFFFh, Timerziel1 und anschließender unveränderter Halt auf20.

Nächste Schritte: Opcode20 und seine Abhängigkeiten rekonstruieren, weitere belegte Handler anbinden, Scheduler-/Callbackzustände und Schrittprotokoll darstellen, Diagnoseimport in die gemeinsame Projektverwaltung integrieren. Mehrsegmentausführung und vollständige native VM bleiben offen.
