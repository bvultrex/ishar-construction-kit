# DOS-Dateisuche: beobachteter Referenzvertrag

## Abgrenzung

Die ALIS-Ausdrucksform156 ruft FindFirst über Ishars Routine2064 auf. Ihre Enginezweige sind für beide identifizierten Spiele nativ geprüft. DOS-Dateisystem, DTA und Laufwerkszustand gehören zur externen Plattformgrenze. Die hier beschriebenen Beobachtungen stammen aus der lokal vorhandenen DOSBox-Referenz, nicht aus einer behaupteten vollständigen DOS-Rekonstruktion.

Referenzprogramm SHA256: e09f78e60b5be25a6af0381b71a90b8aa625f2ea42ecd427638edf2abb7130f0. Die Installation wurde zuvor als DOSBox0.74 identifiziert. Jeder automatische Lauf hält den tatsächlich verwendeten Executable-Hash fest.

## Reproduzierbarer Test

```powershell
./scripts/run-dos-findfirst-oracle.ps1 -Output '../analysis-output/new-findnext-run' -Python '<vollständiger Pfad zu python.exe>' -Enumeration
```

Das Zielverzeichnis muss neu sein. Der Generator erzeugt eigene COM-Programme, eine eigene Batchdatei und eigene Testdateien. Nur dieses Verzeichnis wird gemountet. Originalinstallationen werden nicht gelesen, beschrieben oder gemountet. SDL-Dummytreiber vermeiden sichtbare Fenster; `call probes.bat` gefolgt von `exit` beendet den Prozess selbst. Ein Timeout ist keine Erfolgsmeldung und kein Anlass für einen unkontrollierten Neustart.

Ohne `-Enumeration` laufen die acht bisherigen FindFirst-Fälle. Mit dem Schalter kommen acht Suchfolgen mit jeweils vier DOS-Aufrufen hinzu: FindFirst, dann drei FindNext-Aufrufe. Jede Folge protokolliert vor und nach jedem Aufruf den vollständigen43-Byte-DTA sowie AX/Flags/CX/DX/DS/ES. Alle Programme und binären Aufzeichnungen bleiben außerhalb Git. `check-dos-findfirst-oracle.mjs` verifiziert Programmhashes, Ausgabegrößen, Rückgabewerte und DTA-Roundtrips, bevor ein Bericht geschrieben wird.

## Neue Befunde vom18.10.2026

Der erfolgreiche Lauf enthält16 eigene COM-Programme und40 Suchaufrufe. Neben acht FindFirst-Einzelfällen werden folgende Folgen mit Standard-DTA PSP:0080h und mit explizitem INT21/AH1A-DTA geprüft:

- `*.TST` findet die drei eigenen Dateien A.TST/B.TST/C.TST mit Größen1/2/3. Der folgende FindNext liefert Carry1 und AX18.
- `A.TST` liefert einen Treffer, danach drei Fehler18.
- `Z.TST` liefert bereits bei FindFirst Fehler18 und danach weitere Fehler18. FindFirst ändert dabei Suchzustandsbytes, während die anschließenden erfolglosen FindNext-Aufrufe den DTA in dieser Referenz unverändert lassen.
- Zwei weitere Folgen sichern den vollständigen DTA nach dem ersten Treffer, führen FindNext aus, spielen vor dem nächsten Aufruf exakt alle43 gesicherten Bytes zurück und rufen FindNext erneut auf.

In beiden Rückspielversuchen lautet die beobachtete Folge A,B,C,Fehler18. Das Wiederherstellen des DTA nach A wiederholt B also nicht. Der Prüfer bestätigt vor diesem Aufruf byteweise, dass der DTA tatsächlich dem Snapshot nach A entspricht. Daraus folgt für diese Referenz: Der vollständige Fortsetzungszustand einer Suche befindet sich nicht allein in den43 sichtbaren DTA-Bytes. Die genaue Ablage des zusätzlichen Zustands wurde damit nicht bestimmt.

Bei den gewöhnlichen erfolgreichen FindNext-Aufrufen ändern sich die Ergebnisfelder, die ersten21 DTA-Bytes bleiben hier jedoch gleich. Daraus wird keine universelle DOS-Struktur oder stabile interne Kennung abgeleitet. Die Reihenfolge A,B,C wurde beobachtet; die normalen Aufzählungstests verlangen nur die korrekte Treffermenge und Größen, keine allgemeingültige Verzeichnisreihenfolge.

Metadaten: `DOS_FINDNEXT_ORACLE_2026-10-18.json`. runtime.processExited ist true, originalInstallationsMounted false. Der alte Acht-Fälle-FindFirst-Lauf besteht mit dem erweiterten Prüfer weiterhin.

## Konsequenz für die Rekonstruktion

`dos-findfirst-dta.ts` ist ein verlustfreier Datensatzcodec und kein vollständiger Snapshot einer laufenden Dateisuche. Die21 noch unbekannten Bytes und unbekannte Namensrestbytes bleiben erhalten. Ein späterer Plattformadapter muss den zusätzlichen Suchzustand getrennt erhalten; er darf beim Wiederherstellen eines DTA nicht automatisch eine neue Suche starten und damit eine andere Trefferfolge erzeugen.

Der derzeitige ausdrückliche `OriginalDosFileSearch`-Vertrag für Ausdruck156 bildet weiterhin nur die geprüfte Carry-/Register- und Laufwerksgrenze ab. Er ist nicht automatisch an die Toolkitdiagnose angebunden. DTA-Schreibeffekte, Zustandsverwaltung und reale Ressourcen müssen vor einer vollständigen Anbindung integriert werden. Weitere offene Punkte sind Attributfilter, Verzeichnisse, komplexe Pfade/Wildcards, Laufwerkswechsel und Ishars tatsächlich aktiver DTA-Pointer nach Spielinitialisierung.

Der nächste Schritt soll wieder an Ishars konkreten Dateiaufrufen ansetzen: deren DTA-Verwendung und Ressourcenpfade prüfen und die erforderlichen Plattformwirkungen ausdrücklich erfassen. Eine vollständige DOS-Neuentwicklung ist kein Ersatz für die Rekonstruktion der Spielengine.

## Ishars Öffnungshelfer als separater Enginebaustein

`original-dos-file-open.ts` rekonstruiert inzwischen1F97 samt Such-/Anlege-/Öffnungs-/Seekzweigen und Laufwerksfallback mit ausdrücklich gelieferten DOS-Antworten. Je280 native Fälle beider Spiele vergleichen Requests, Register, Globalfelder und Fehlerstack. Die kontrollierte DOS-Grenze führt keinerlei echte Dateioperationen aus. Auch der MAIN-Headernachweis enthält jetzt den Original-Öffnungsaufruf und vergleicht anschließend beide Reads sowie alle Tabellenfelder im selben CPU-Zustand (je8 Fälle).

Dies schließt eine konkrete Engine-Lücke, ohne den noch offenen DTA-/Dateisystemzustand durch einen vermeintlich originalen Hostdienst zu ersetzen. Details und verbleibende Grenzen stehen in DOS_STARTUP.md.
