# Native Skript-Diagnose im Toolkit

Im Asset Lab (`/assets`) öffnet **IO-Modul für Skript-Diagnose öffnen** eine lokale DOS-IO-Datei aus Ishar1 oder Ishar2. Die Quelldatei, der Playtest und das Mod-Projekt bleiben unverändert. Der Import ist noch getrennt von der gemeinsamen Projektverwaltung.

Der kontrollierte Kontext verwendet Moduloffset0/Segment4000h, Kontextsegment5000h, Pooloffset0200h, Tabellenslot6 und obere GrenzeFFFFh. Globals beginnen mit null; die kontrollierte Tabellenbasis0100h wird in SS:0BD2 gesetzt. Aktive Listenlinks werden nicht erfunden. Diese Testparameter stellen keinen wiederhergestellten Originalspielzustand dar. Angezeigt werden Modul-ID, Bildgröße, Einstieg, BP, SI, nächstes Opcodebyte, Skriptstackoffset, gespeicherter Skriptzeiger und Timer-Zielbyte SS:0C99h.

**Einen nativen Kontrollfluss-Schritt ausführen** verwendet gegen Originalinstruktionen geprüfte Rekonstruktionen:

- Opcodes5–10: relative Aufrufe und Sprünge.
- Opcode17: Skript-Return im kontrollierten Hauptskriptmodus.
- Opcodes18–29: bedingte relative Sprünge bei DX=0/!=0 oder DX=CX/!=CX, jeweils mit drei Offsetcodierungen.
- Opcode31: direkte Zahlenformen, Ausdrucksschleifen56/58 und sechs Vergleiche74–84; andere Ausdruckstags halten an.
- Opcode41: rohe Kontextblöcke.
- Opcode62: nichtnegativer Slot setzt das Aktivitätsbyte des gefundenen Kontexts; negative Worte ändern nichts.
- Opcode66: Yield; ausdrücklich keine Scheduler-Fortsetzung.
- Opcode71: Literalwort nach ES:[BP-16h], ohne höhere Feldsemantik zu behaupten.
- Opcode76: drei aufeinanderfolgende Zahlenoperanden nach ES:BP,+2,+4. Spätere Operanden sehen frühere Änderungen.
- Opcode106: niedriges Ergebnisbyte eines Zahlenoperanden nach SS:0C99h.
- Opcode148: Suche nach Literal-Modul-ID mit Selbstkontext-Ausschluss und erstem/allen Treffern; direkte Ergebnisziele6/8/18/20.
- Opcode156: Kontextliste und Ergebnisübernahme für direkte Ziel-Tags6/8/18/20 (Byte/Wort mit16-/8-Bit-Offset). Eine leere kontrollierte Liste liefertFFFFh.

Die Zahlenoperanden unterstützen Tags0/2/6/8: vorzeichenbehaftetes Literalbyte, Literalwort, Kontextbyte und Kontextwort. Andere Formen oder Opcodes werden nicht geraten oder übersprungen. Der Adapter hält ohne Änderung von SI und Schrittzahl an. Die Hostfunktionen ersetzen keine vollständige x86-Emulation oder ALIS-VM.

**Diagnose zurücksetzen** erzeugt den Anfangskontext erneut. Für Module über64KiB ist nur die Kontextprüfung verfügbar. Fehlende Operanden oder Skriptzeiger außerhalb der Bilddaten führen zum Halt. Nicht unterstützte Wortzugriffe über eine Segmentgrenze werden von den Hostfunktionen abgelehnt. Keine automatische Ausführungsschleife ist eingebunden.

Nachweise: Kontextaufbau gegen alle240 lokalen IO-Header (98/142) geprüft. Opcode41 mit je1536, Zahlenoperanden/106 mit je1056, Opcode71 mit je144 und Opcode76 mit je384 nativen Vergleichsfällen pro Spiel geprüft. Adaptertests prüfen unter anderem Aufruf→Return→Yield, Kontextänderungen, unveränderte Vorgängerzustände und sichere Halte bei unbekannten oder abgeschnittenen Operanden. Typecheck und Produktionsbuild bestehen.

Am18.10.2026 wurde Ishar2 IO.IO erneut im Browser importiert und16 Schritte ausgeführt: SI006Ch, Timerziel1, nächster Opcode156. Ein weiterer Klick hält dort ohne Änderung von SI/Schrittzahl an. Dies deckt die zuletzt hinzugefügten Opcodes106,71,76 im tatsächlichen UI-Ablauf ab. Es beweist keine vollständige NPC-/Gegnerausführung.

Aktueller Hoststand:17 Schritte mit Ishar2 IO.IO, SI0070h; der nächste Halt ist Opcode31. Ergebnisdispatcher: je192 native Fälle pro Spiel; zusammengesetzter156: je96 Fälle. Auch im Browser am18.10.2026 bestätigt:17 Schritte, SI0070h, Timerziel1 und anschließender unveränderter Halt auf31.

Aktueller Hoststand für Opcode31:18 Schritte bis SI0079h, DX0, CXFFFFh; nächster Halt20. Beide Zahlenregister werden jetzt angezeigt und zwischen unterstützten Befehlen weitergeführt.912 native Ausdrucksvergleiche pro Spiel bestehen. Im Browser am18.10.2026 bestätigt:18 Schritte, SI0079h, DX0000h, CXFFFFh, Timerziel1 und anschließender unveränderter Halt auf20.

Aktueller Hoststand:19 Schritte mit Ishar2 IO.IO bis SI0095h, nächster Halt148. Bedingte Sprünge sind mit je8704 nativen Fällen beider Spiele geprüft. Ein fortlaufender nativer Vergleich bestätigt jeden der19 Schritte; zusätzlich sind14 Schritte des originalen Ishar1 FRISE.IO bis Opcode134 geprüft.

Aktueller Hoststand:20 Schritte mit Ishar2 IO.IO bis SI009Bh, DXFFFFh, CX1E7Eh; nächster Halt62. Opcode148 ist mit je2160 nativen Fällen pro Spiel geprüft. Die fortlaufende Originalprüfung bestätigt alle20 Schritte. Die erneute Browserprüfung für148 ist noch offen.

Aktueller Hoststand:22 Schritte mit Ishar2 IO.IO einschließlich erstem Yield. Opcode62 besteht je3168 native Fälle pro Spiel. Die fortlaufende Originalprüfung bestätigt alle22 Schritte einschließlich tatsächlicher Yield-Stackwirkung. Der Dateichecker unterstützt jetzt die Yield-Grenze, aber keine Scheduler-Fortsetzung.

Nächste Schritte: Scheduler-Fortsetzung nach Yield an den kontrollierten Kontext anbinden, weitere belegte Handler anbinden, Scheduler-/Callbackzustände und Schrittprotokoll darstellen, Diagnoseimport in die gemeinsame Projektverwaltung integrieren. Mehrsegmentausführung und vollständige native VM bleiben offen.

Die aktuelle Browserprüfung bestätigt ebenfalls19 Schritte bis SI0095h und den unveränderten Halt auf148. Für fortlaufende native Vergleiche: `python scripts/check-native-script-diagnostic-file.py <capture-memory.bin> <lokales-Modul.IO>` mit dem isolierten Unicorn-Pythonpfad aus der Testumgebung. Das Werkzeug prüft jeden unterstützten Schritt; Die Yield-Grenze wird jetzt verglichen; Scheduler-Fortsetzung und Mehrsegmentmodule werden ausdrücklich noch nicht verglichen. Es schreibt keine Originalressourcen ins Repo.

Aktuelle Browserprüfung am18.10.2026:22 Schritte bis zum ersten Yield, SI00A0h, DXFFFFh, CXFFFFh, Timerziel1. Die Oberfläche deaktiviert die weitere Ausführung an dieser Grenze. Damit sind auch die zuvor offenen UI-Prüfungen von148 und62 abgedeckt. Eine Scheduler-Fortsetzung steht weiterhin aus.
