# Originaler Händlerumfang: Kaufen, kein Verkaufen

Die lokalen Ishar-1- und Ishar-2-Profile bieten in `MARCHAND.IO` ausschließlich den Kaufpfad. „Verkaufen“ ist deshalb keine fehlende Originalfunktion des Toolkits und darf nicht als noch zu implementierendes Kompatibilitätsgate geführt werden.

- Ishar2 schreibt Gold nur mit dem Ergebnis der Preis-Subtraktion und schreibt den gekauften Code ausschließlich in einen freien Inventarslot. Kein Pfad erhöht Charaktergold oder leert einen Inventarslot.
- Ishar1 hat dieselbe Richtung: Preisabzug und Einlagerung, aber keinen Goldzuschlag oder Entnahmepfad.
- Die native Oberfläche bietet in beiden Berichten nur Auswahl/Kaufen und Verlassen.

Belege: `grok-reports/alderaan/REFERENCES.md` §10.4 und §15.4 sowie `grok-reports/i2-shop-original-roundtrip.md`. Die bestehende Originalshop-Oberfläche bleibt daher absichtlich kauf-only. Ein künftig authored Verkaufssystem wäre eine neue Toolkit-Regel und müsste ausdrücklich als nicht originales Verhalten gekennzeichnet werden.

Offen bleiben weitere Händler, Empfängerfälle, Dialog-/Tavernenvarianten, Zeit-/Schließzustände und nicht verstandene Begleitbytes. Dieser Scopevermerk schließt nur den falschen „Verkaufen fehlt“-Punkt.
