# Native Skript-Diagnose im Toolkit

Im Asset Lab (`/assets`) steht die Sektion **Native Skript-Diagnose**. Über **IO-Modul für Skript-Diagnose öffnen** wird eine lokale DOS-IO-Datei aus Ishar1 oder Ishar2 geladen. Die Datei wird nur gelesen; weder der aktive Playtest noch das Mod-Projekt werden verändert. Der Import ist noch getrennt von der gemeinsamen Projektverwaltung.

Die Anzeige baut mit `createOriginalDosScriptContext` einen kontrollierten Kontext auf: Moduloffset0/Segment4000h, Kontextsegment5000h, Pooloffset0200h, Tabellenslot6 und obere GrenzeFFFFh. Diese Werte sind Testparameter, kein aus einem Originalspielstand wiederhergestellter Zustand. Angezeigt werden Modul-ID, Bildgröße, Header-Einstieg, BP, SI, nächstes Opcodebyte, Skriptstackoffset und gespeicherter Skriptzeiger.

**Einen nativen Kontrollfluss-Schritt ausführen** ruft die gegen Originalinstruktionen geprüften Rekonstruktionen auf: Opcodes5–10 für relative Aufrufe/Sprünge,41 für rohe Kontextblöcke und17 für Skript-Return im kontrollierten Hauptskriptmodus. Opcode66 gibt per Yield ab; der Schrittadapter stoppt dort ausdrücklich vor dem Scheduler. Es läuft keine x86-Emulation im Browser. Andere Opcodes werden nicht geraten oder übersprungen: Der Adapter hält an, ohne SI oder Schrittzahl zu verändern. Beispiel: Ishar2 `IO.IO` führt13 Opcode41-Blöcke aus und hält dann bei Opcode106 an Offset005Fh. Das ist die aktuelle Abdeckungsgrenze, kein vollständiger VM-Test.

**Diagnose zurücksetzen** erzeugt den unveränderten Anfangskontext aus der eingelesenen Originalkopie erneut. Für Module über64KiB ist nur die Kontextprüfung eingebunden; Einzelbefehle bleiben dort gesperrt. Fehlende Operanden oder Skriptzeiger außerhalb der Bilddaten führen zu einem sichtbaren Halt. Der Adapter enthält keine automatische Schleife und verändert Originaldateien nicht.

Nachweise: Native Kontextkonstruktion wurde separat gegen alle240 lokalen IO-Header geprüft (siehe `NATIVE_CONTEXT_CORPUS_2026-10-18.json`). Die neue Toolkit-Anbindung öffnet ebenfalls alle98/142 Module. `node scripts/check-native-script-diagnostic.mjs` prüft einen synthetischen gültigen Modulablauf Kontext→Aufruf→Return→Yield, Halt bei unbekanntem Opcode und unveränderte Quelldaten. Typecheck und Produktionsbuild bestehen. Im Browser wurden Import von Ishar2 `IO.IO`, angezeigte Kontextwerte,13 Blockschritte und unveränderter Halt auf Opcode106 geprüft. Diese UI-Prüfung beweist keine vollständige NPC-/Gegnerausführung.

Nächste Schritte: weitere belegte Handler an den Adapter anbinden, Scheduler-/Callbackzustände darstellen, Schrittprotokoll ergänzen und anschließend den Diagnoseimport in die gemeinsame Projektverwaltung integrieren. Mehrsegmentausführung und die vollständige native VM bleiben eigene offene Arbeit.

## Erweiterung: Opcode106

Opcode106 ist mit den Zahlenoperand-Tags0/2/6/8 angebunden: vorzeichenbehaftetes Literalbyte, Literalwort, Kontextbyte und Kontextwort. Das Timer-Zielbyte SS:0C99h wird angezeigt. Die Globals starten als kontrollierter Nullkontext, nicht als Originalspielzustand.

Diese Erweiterung ersetzt die oben genannte Grenze bei Opcode106: Ishar2 `IO.IO` erreicht nach14 Schritten SI0062h und Timerziel1. Der folgende Opcode71 stoppt unverändert. Native Vergleiche mit je1056 Fällen beider Spiele und Adaptertests bestehen. Die erneute Browserprüfung dieser Erweiterung steht noch aus.
