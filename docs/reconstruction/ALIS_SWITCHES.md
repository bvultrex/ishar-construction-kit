# DOS-ALIS-Switchtabellen

Stand 2026-10-17. Implementierung `src/lib/ishar/original-alis-switch.ts`. Grundlage: separate lokale ALIS-C-Referenz `opcodes.c:cswitch1/cswitch2`, `script.c:script_read8/script_read16`; direkte Ressourcenprüfung am lokalen Ishar-2-EAFF-Profil. Kein Silmarils-Originalquelltext und kein nativer Ausführungsnachweis.

## Format und Adressierung

Der Aufrufer liefert Opcodeoffset und `operandEnd`, den Offset des Zählbytes unmittelbar nach dem ausgewerteten Operand. Diese Bibliothek ist kein vollständiger Operand-/Instruktionsdecoder. Alle Offsets beziehen sich auf das entpackte Modulimage mit gerade ausgerichteter Basis.

Beide Befehle lesen ein unsigned8-Zählbyte N, überspringen gegebenenfalls ein Ausrichtungsbyte und verwenden N+1 Fälle. Das übersprungene Byte hat keinen vorgegebenen Nullwert und bleibt erhalten. Worte sind im alten DOS-Profil little endian.

- 0x2E / cswitch1: N+1 Paare aus signed16-Fallwert und unsigned16-Sprungdistanz. Die Referenz sucht mit signed16-Vergleich in aufsteigender Reihenfolge. Unsortierte oder doppelte Werte weist der Toolkit-Reader als nicht unterstützte Struktur ab; das ist keine Aussage über native Fehlerbehandlung.
- 0x2F / cswitch2: zunächst signed16-Bias, anschließend N+1 unsigned16-Sprungdistanzen. Index= signed16(Eingabe+Bias); nur 0..N trifft. Die dargestellten signed16-Fallwerte werden invers aus Index und Bias berechnet, einschließlich Überlauf.

Ein Sprungziel ist die Adresse unmittelbar nach dem jeweiligen Distanzwort plus dessen unsigned16-Wert. Negative relative Sprünge sind damit in diesem Format nicht kodiert; keine stillschweigende signed16-Interpretation der Distanz. Der Default liegt hinter der gesamten Tabelle. Zieladressen außerhalb des bereitgestellten Images und abgeschnittene Tabellen werden abgewiesen. Der Reader prüft keine Instruktionsgrenzen der Ziele.

## Verlustfreie Änderung

`editDosAlisSwitchTarget` erstellt eine Kopie und ändert nur das relative Distanzwort eines vorhandenen Falls. Gleiche Größe, gleiche Fallwerte, gleiche Paddingbytes und gleiche sonstige Daten. No-op ist byteidentisch. Anschließend wird die vollständige Tabelle zurückgelesen. Ungültige Fälle, Ziele oder nicht darstellbare Distanzen schlagen fehl; der Eingangspuffer bleibt unverändert.

Der Aufrufer muss Zielinstruktion und Spiellogik prüfen. Ein strukturell kodierbarer Sprung kann semantisch falsch sein; kein Exportkompatibilitätsversprechen. Das Modulimage kann über den vorhandenen ALIS-Containerwriter erneut gepackt werden; ein eigener GUI-/CLI-Switcheditor ist noch nicht eingebaut.

## Originalbeleg und Tests

`npm run test:original-alis-switch` prüft synthetisch beide Tabellenarten, Bias, signed16-Werte, relative Ziele, Default, Padding, truncation, ungültige Ziele und verlustfreie Zieländerungen.

Mit ISHAR2_DIR und ISHAR_ACTOR_LISTINGS: alle zwölf EAFF-Tabellen mit 108 Fällen vollständig binär gelesen und gegen sämtliche Listingzuordnungen verglichen; alle 65536 signed16-Eingaben je Tabelle geprüft. Die Operandenden sind für diese zwölf Instruktionen explizit aus deren Operandformen angegeben, nicht durch eine heuristische Bytesuche geraten. Jedes der 108 Ziele wird auf ein bereits vorhandenes Tabellenziel umgebogen und wiederhergestellt; das vollständige Image muss danach byteidentisch sein. Originaldateien bleiben unverändert.

Damit ist die frühere Lücke der verkürzten Listing-Hexpräfixe für diese EAFF-Switchtabellen geschlossen. Es ist kein Vollständigkeitsnachweis aller Originalmodule, kein Ishar-1-Originaltest und keine DOS-Ausführung. Gemeinsame Arithmetik und Formatsemantik bleiben referenzbasiert.

## Erweiterter Ressourcenvergleich für beide Spiele

`original-alis-operand-layout.ts` bestimmt strukturell das Ende unterstützter Integeroperanden (Byte-/Wortliterale, numerische Speicher-/Arrayzugriffe, numerische Operatoren und verschachtelte EVAL-Folgen). Literalbytes werden längengerecht übersprungen; ein eingebettetes 0x3A beendet deshalb nicht versehentlich den Ausdruck. Unbekannte/String-/unfertige Referenzoperanden werden abgewiesen. Tiefen- und Arbeitsbudget begrenzen beschädigte Eingaben. Das ist kein vollständiger ALIS-Operanddecoder und keine Operandenausführung.

`test:original-alis-switch-profiles` durchläuft die vorhandenen lokalen Listings getrennt nach Spiel und prüft jede dort ausgewiesene Switchtabelle gegen das jeweilige Originalmodul. Ergebnisse am 2026-10-17:

| Profil | Module mit geprüften Switches | Tabellen | Fälle | Prüfungsfehler |
|---|---:|---:|---:|---:|
| lokales Ishar 1 DOS | 81 | 284 | 3098 | 0 |
| lokales Ishar 2 DOS | 118 | 378 | 3801 | 0 |

Für jede Tabelle sind sämtliche Fallwerte und Ziele verglichen. No-op-Zieländerungen erhalten das vollständige Image. Zusätzlich wird der erste Fall gezielt zum vorhandenen Defaultpfad umgebogen, als IO-Kopie gepackt, erneut entpackt und byteweise mit dem erwarteten Image verglichen. Wiederherstellen des Fallziels ergibt über den Containerwriter wieder die byteidentische Originaldatei. Keine Originaldatei wird geschrieben. Das bedeutet strukturell korrektes Schreiben/Readback, nicht automatisch sinnvolle Spielsemantik oder originale Ausführung.

Der lokale Bericht `analysis-output/switch-profiles-2026-10-17/switch-profiles.json` außerhalb des Repository enthält Dateinamen, Originalgrößen und SHA256 pro untersuchtem Modul sowie getrennte Zähler/Fehler. Keine Spielbytecodes im Bericht. Die geprüften Listings sind selbst referenzbasiert und können unentdeckte Programmbereiche auslassen; diese Zähler belegen nicht alle Switches im gesamten Originalprogramm. Beide Profile stimmen bei den untersuchten Tabellen mit unsigned16-Sprungdistanzen überein. Der separate Python-Disassembler liest Distanzen als signed16; für diese Tabellen ergeben sich keine Abweichungen. Negative Distanzen sind damit nicht als natives Feature nachgewiesen.

Reproduktion in PowerShell:

```powershell
$env:ISHAR1_DIR='E:\Spiele\Ishar1'
$env:ISHAR2_DIR='E:\Spiele\Ishar2'
$env:ISHAR1_LISTINGS='<lokaler Ishar-1-Listingordner>'
$env:ISHAR_ACTOR_LISTINGS='<lokaler Ishar-2-Listingordner>'
npm run test:original-alis-switch-profiles
# Optional neuer, von Installationen getrennter Berichtordner:
npm run test:original-alis-switch-profiles -- '<neuer Analyseordner>'
```

Der Bericht wird exklusiv neu angelegt; vorhandene Berichte werden nicht überschrieben. Fehlende Voraussetzungen oder irgendein Tabellenfehler dürfen nicht stillschweigend als bestandener Gesamttest zählen.
