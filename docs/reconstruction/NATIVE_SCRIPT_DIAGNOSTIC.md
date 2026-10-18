# Native Skript-Diagnose im Toolkit

Im Asset Lab (`/assets`) öffnet **IO-Modul für Skript-Diagnose öffnen** eine lokale DOS-IO-Datei aus Ishar1 oder Ishar2. Originaldatei, Playtest und Mod-Projekt bleiben unverändert. Der Diagnoseimport ist noch getrennt von der gemeinsamen Projektverwaltung.

## Kontrollierter Testkontext

Moduloffset0/Segment4000h, Kontextsegment5000h, Pooloffset0200h, Tabellenslot6 und obere GrenzeFFFFh sind Testparameter. Globals beginnen mit null, abgesehen von Tabellenbasis0100h in SS:0BD2. DX/CX und die Snapshotworte beginnen mit0. Aktive Listenlinks und Objektsegmente werden nicht erfunden. Dieser Zustand ist kein importierter Originalspielstand.

Angezeigt werden Modul-ID, Bildgröße, Header-Einstieg, BP, SI, Timerziel SS:0C99h, DX/CX, Diagnosephase, Tabellenslot SS:0B02, Skriptstackoffset, gespeicherter Skriptzeiger und Opcode-Schrittzahl. An den Schedulergrenzen wird kein vermeintlich nächstes Opcodebyte angezeigt.

## Unterstützte Einzelschritte

- 5–10: relative Aufrufe und Sprünge.
- 17: Skript-Return im kontrollierten Hauptskriptmodus.
- 18–29: bedingte Sprünge bei DX=0/!=0 beziehungsweise DX=CX/!=CX mit drei Offsetcodierungen.
- 31: Zahlenformen0/2/6/8, Ausdrucksschleifen56/58 und sechs Vergleiche74–84.
- 41: rohe Kontextblöcke.
- 62: nichtnegativer Slot setzt das Aktivitätsbyte des gefundenen Kontexts; negative Worte ändern nichts.
- 66: Yield, ausdrücklich keine automatische Scheduler-Fortsetzung.
- 71: Literalwort nach ES:[BP-16h].
- 76: drei sequentielle Zahlenoperanden nach ES:BP,+2,+4; spätere Operanden sehen frühere Änderungen.
- 106: niedriges Zahlenoperandbyte nach SS:0C99h.
- 148: Modul-ID-Suche mit Selbstkontext-Ausschluss und erstem/allen Treffern.
- 156: rohe Kontextliste.

Zahlenoperanden0/2/6/8 sind signiertes Literalbyte, Literalwort, Kontextbyte und Kontextwort. Direkte Ergebnisziele6/8/18/20 schreiben Byte/Wort mit16-/8-Bit-Offset. Andere Tags oder Opcodes halten ohne Überspringen an. Fehlende Operanden und Zeiger außerhalb der Bilddaten halten ebenfalls an. Weitere Hostgrenzen, insbesondere Segmentrand-Wortzugriffe, sind in den Helfern und DOS_STARTUP.md dokumentiert.

## Fortsetzung an Originalgrenzen

Nach Yield aktiviert sich **Yield-Abschluss prüfen**. Die rekonstruierte Routine26B2 speichert den Skriptzeiger und erreicht entweder einen Rückkehr-Callback (`callback`) oder die Kontextauswahl2632 (`next-context`). Eine nichtleere Objektkette ohne geladenes Originalsegment wird unverändert abgewiesen. Callback-Ausführung ist noch nicht angebunden.

Im Status `next-context` ist **Nächsten Kontext prüfen** aktiv. Der rekonstruierte Ablauf2632 aktualisiert SS:0B02 und liest den nächsten Kontextpointer. Ein vorhandener Link führt zum Status `context` vor264F, sonst zum Status `frame` vor dem Frame-CALL2649. Null-Kontextpointer werden nicht durch erfundene Ersatzwerte korrigiert. Weder Frame-Service noch Scan-/Main-Vorbereitung werden automatisch ausgeführt. In diesen Grenzzuständen bleiben die Ausführungsbuttons gesperrt.

**Diagnose zurücksetzen** erzeugt den Anfangszustand aus der unveränderten Originalkopie erneut. Für Module über64KiB ist nur die Kontextprüfung verfügbar. Es gibt keine automatische Ausführungsschleife oder vollständige ALIS-VM.

## Verifikation

Kontextaufbau gegen alle240 lokalen IO-Header (98/142) geprüft. Native Einzelvergleiche pro Spiel: Opcode41 1536, Zahlenoperanden/106 1056,71 144,76 384, Ergebnisdispatcher192,156 komplett96, Ausdrucksauswertung912, bedingte Sprünge8704,148 2160 und62 3168. Yield-Abschluss und Kontextauswahl verwenden die bereits separat geprüften Helfer;24 beziehungsweise54 Fälle pro Profil wurden erneut geprüft. Adaptertests prüfen Zustandsänderungen, erhaltene Vorgängerzustände und Grenzhalte. Typecheck und Produktionsbuild bestehen.

Fortlaufende native Vergleiche prüfen nach jedem unterstützten Befehl SI/DX/CX, Kontextsegment, Globals und Stackwirkung. Ishar2 IO.IO erreicht22 Schritte bis Yield, anschließend den Abschluss bis2632 und die Auswahl bis zur Frame-Grenze. Ishar1 PRESTI.IO erreicht einen Yield mit denselben beiden Fortsetzungen. Ishar1 FRISE.IO ist14 Schritte bis zum offenen134 geprüft. Alles verwendet kontrollierte Anfangszustände, keine vollständige Spielinitialisierung.

Aufruf: `python scripts/check-native-script-diagnostic-file.py <capture-memory.bin> <lokales-Modul.IO> --select-next` mit dem isolierten Unicorn-Pythonpfad. `--select-next` enthält `--finish-yield`. Ohne Optionen endet die Prüfung an Yield oder einem unbekannten Befehl. Keine Originalressourcen werden ins Repo geschrieben.

Nächste Schritte: Frame-Service und Scan-/Main-Vorbereitung mit dem Diagnosezustand verbinden, Rückkehr-Callbacks ausführen, echte Modul-/Kontext- und Objektverwaltung importieren, Mehrsegmentausführung und Schrittprotokoll ergänzen und den Import in die gemeinsame Projektverwaltung integrieren. Vollständige NPC-/Gegner- oder Spielausführung ist noch nicht erreicht.

Browserprüfung am18.10.2026: IO.IO erreicht nach22 Schritten, Yield-Abschluss und Kontextauswahl den Status `frame`, SI0100h und Slot0. Die Opcodeanzeige bleibt an dieser Schedulergrenze leer; der gespeicherte Skriptzeiger bleibt00A0h. Beide Fortsetzungsbuttons werden in der vorgesehenen Reihenfolge aktiv und anschließend wieder gesperrt.

## Leerer Frame und kontrollierter Timer-IRQ

In Phase `frame` oder `frame-wait` ist **Leeren Frame-Service prüfen** aktiv. Die kontrollierte Tastatureingabe ist0. Der Timervergleich kann zu `frame-wait` führen; es läuft keine automatische Uhr. **Kontrollierten Timer-IRQ prüfen** führt genau einen geprüften inaktiven IRQ-Pfad aus, mit Audio-Flag0 und ohne aktive Paletten-/Cursor-/Recordcallbacks. Nicht erschlossene Callback- und BIOS-Verkettungspfade werden abgewiesen. Danach muss der Frame-Service separat erneut geprüft werden.

Die Frame-Rückkehr endet als `frame-return` vor264C. Timerzähler und Anzahl kontrollierter IRQs sind sichtbar; die Opcode-Schrittzahl bleibt unverändert. Ein vollständiger Schedulerzyklus ist damit noch nicht erreicht.

Native Prüfung: `python scripts/check-native-script-diagnostic-file.py <capture> <lokales-Modul.IO> --frame-cycle`. Diese Option enthält Yield-Abschluss und Kontextauswahl. Ishar2 IO.IO besteht22 Schritte mit anschließendem wartendem Frame, echtem kontrolliertem Timer-IRQ, IRET und Frame-Rückkehr; Ishar1 PRESTI.IO besteht mit direkter Frame-Rückkehr ohne IRQ. Globale Vergleichsgrenze ist nun28BFh, vor dem folgenden Grafikcode im Realmode-Speicher.

Browserprüfung am18.10.2026 bestanden: IO.IO erreicht nach22 Opcode-Schritten und den Fortsetzungsbuttons zunächst `frame-wait`. Ein kontrollierter IRQ erhöht den Timerzähler auf1. Erneute Frameprüfung erreicht `frame-return` vor264C und setzt den Zähler zurück auf0; die Diagnose zählt genau einen kontrollierten IRQ.

## Kontextvorbereitung nach dem Frame (API/CLI)

`prepareNativeScriptDiagnosticContext` setzt die Diagnose ab `frame-return` oder `context` fort. Nach dem Frame liest sie den originalen Wurzelpointer bei ES:[BX+SI], anschließend Aktivität/Countdown und Scan-Vorrang. Main führt zu `ready`, Skip zu `next-context`. Ein Null-Wurzelpointer bleibt0; fehlende Segmente und Scan-Callbacks werden unverändert angehalten. Der Oberflächenbutton dafür ist noch nicht angeschlossen.

Prüfung: `python scripts/check-native-script-diagnostic-file.py <capture> <lokales-Modul.IO> --prepare-context`. Diese Option enthält den bisherigen Framezyklus. Ishar2 IO.IO und Ishar1 PRESTI.IO stimmen bis zum nächsten `next-context` nativ überein. Zusätzlich je216 isolierte native Schedulerfälle pro Spiel, darunter40 Main- und36 Scanpfade; Details und Grenzen in DOS_STARTUP.md. Kein vollständiger Scheduler oder Spielstart.

## Opcode186 und fortgesetzter Main-Test

186 liest fünf Zahlenoperanden (Formen0/2/6/8) und schreibt fünf globale Rohfelder mit den originalen Wort-/Bytebreiten. Die Feldzwecke bleiben unbenannt. Je4096 native Vergleiche pro Spiel bestanden; unbekannte oder abgeschnittene Operanden halten unverändert an.

`python scripts/check-native-script-diagnostic-file.py <capture> <module> --resume-main` prüft zusätzlich die Mainfortsetzung mit erhaltenem CPU-Zustand. Dieser Test verknüpft den vorhandenen Kontext ausdrücklich als Wurzel nach dem Frame; die Laufzeit tut das nicht automatisch. Ishar2 IO.IO erreicht nach22 ersten Schritten und dem Frame einen weiteren Schritt186, anschließend einen offenen Ausdruck in31. Ishar1 PRESTI.IO erreicht nach dem Frame einen weiteren Yield. Es handelt sich weiterhin um kontrollierte Anfangszustände.

## Ausdruckstags30/32

Opcode31 unterstützt nun zusätzlich30 (signiertes Kontextbyte) und32 (Kontextwort) relativ zur tatsächlichen Basis aus SS:0BF6, jeweils plus16-Bit-Literaloffset. Diese Formen benötigen ausdrücklich das Globalsegment; BP oder0 werden nicht als Ersatz verwendet. Je4752 native Fälle pro Spiel bestanden. Die anderen Zahlenoperanden verwendenden Diagnose-Opcodes behalten vorerst ihre bisherigen Tagfreigaben.

Der kontrollierte Ishar2-`--resume-main`-Test erreicht jetzt186,31 und20 nach dem Frame, anschließend Opcode30 bei SI00C5h. Ishar1 PRESTI.IO erreicht weiterhin den zweiten Yield. Die echte Initialisierung der globalen Kontextbasis ist damit noch nicht rekonstruiert.

## Opcode30: Zuweisung und Literalstring

30 unterstützt die bereits erschlossene numerische Ausdrucksteilmenge mit direkten Byte-/Wortzielen sowie Literalstrings4 und Stringziel34 relativ zu SS:0BF6. Die Originalfolge Literalpuffer schreiben,0C58/0C5C tauschen und in das Kontextsegment kopieren bleibt erhalten. Fehlende Terminatoren und überschrittene Hostfenster halten unverändert an. Weitere Stringformen und Segmentüberlappungen bleiben offen.

Je148 native Vergleichsfälle pro Spiel bestanden;192 bestehende Ergebnisfälle pro Spiel bestehen erneut. Der kontrollierte Ishar2-Main-Test erreicht nach dem Frame nun186,31,20,30 und hält bei SI00D3h vor einem weiteren Ausdruck in31. Ishar1 erreicht unverändert seinen zweiten Yield. Noch keine vollständige String- oder Skript-VM.
