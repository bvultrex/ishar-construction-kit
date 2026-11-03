ISHAR CONSTRUCTION KIT – TESTBUILD

Dieses Testpaket enthält bewusst KEINE .cmd-, .bat-, .sh- oder .exe-Dateien.
Dadurch soll verhindert werden, dass Browser/Antivirus das ZIP wegen ausführbarer
Startskripte pauschal als gefährlich einstufen.

VORAUSSETZUNG
- Node.js 22 oder neuer

WINDOWS – STARTEN
1. ZIP vollständig entpacken.
2. Den entpackten Ordner im Explorer öffnen.
3. In die Adresszeile "powershell" eingeben und Enter drücken.
4. Folgende Befehle nacheinander ausführen:

   npm install --omit=dev --no-audit --no-fund
   node scripts/serve-build.mjs

5. Danach im Browser öffnen:
   http://127.0.0.1:4173

BEENDEN
- Im PowerShell-Fenster Strg+C drücken.

HINWEIS
Der Server lauscht nur auf 127.0.0.1 (diesem Rechner).
Die Ishar-Dateien/ZIPs, die im Asset Lab ausgewählt werden, bleiben im Browser
und werden nicht in dieses Projektpaket geschrieben.

BUILD
- Branch: workbench/playable-slice
- Stand: automatisch aus GitHub Actions erzeugt
