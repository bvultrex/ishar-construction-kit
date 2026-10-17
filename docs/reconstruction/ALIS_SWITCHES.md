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
