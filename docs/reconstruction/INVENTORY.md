# Originalbestände und Zielprofile

Stand: 2026-10-17. Ziel sind zunächst die lokal bereitgestellten DOS-Bestände,
identifiziert pro Datei durch SHA-256. Keine Behauptung einer bestimmten
Verkaufsedition, Patchnummer oder Sprache ohne zusätzlichen Nachweis.
MZ bestätigt eine DOS-kompatible ausführbare Datei, keine vollständige Plattformanalyse.

Die Ordner enthalten auch Nutzer-Saves, Sicherungen, Handbücher und sonstige
Begleitdateien. Der Profilhash beschreibt den vollständigen beobachteten Bestand,
NICHT einen unveränderlichen Release-Fingerprint. Neue Saves ändern diesen Hash.
Dateihashes von MAIN.IO/start.exe sind getrennte Versionsanker.

Die vollständigen lokalen Manifeste liegen außerhalb Git unter
`../analysis-output/inventory-2026-10-17/`. Sie enthalten relative Namen, Größen,
SHA-256 und Dateitypen, keine Dateiinhalte. Originalressourcen bleiben lokal.

## ishar1

122 Dateien, 14164371 Bytes.
Bestandsprofil: `7dcc0af38bc5dc22aa1e5de900dc9c78fa8f53ca04dcc43c0a48d2f2aa8ddde2`.

| Datei | Bytes | SHA-256 |
|---|---:|---|
| CONT1.FIC | 4860 | `5303c1ccc7602393c53fa0ae5d177811fa4d160c3581a3695688c3a6036e14d8` |
| MAIN.IO | 11240 | `27c5834de005afc99d7819a0b2244e7d176421451c80a3befd6c273b0ef0bd7b` |
| MESSAGE.IO | 4826 | `38c1082c5901e748541b1c46f23db19ab12eb76e4c22a0be59858ebe3efd7717` |
| MESSAGED.IO | 4838 | `e2eeeca923fd5a2a4e5431766b92a34c610d67be695f5e1762f9b0e07e818d90` |
| MESSAGEE.IO | 4794 | `1b6a76f2c931e4ddb2b143a794c178d5f4c5c9e39912784ba1077ae89599d8e7` |
| MESSAGEI.IO | 4792 | `94cbdf5d1543ce0f38545d053d6108fa075c448c5fe5eea13a2527f23cd247c2` |
| start.exe | 43265 | `3ea63234c97b77d88e3c18aa5d88ac10dede1f10daf2854225b88b7d948d588b` |

Erfasste Endungen: .IO: 98, .FIC: 8, .AO: 1, .SAV: 8, .BAK: 1, .STP: 1, .ICO: 2, .PDF: 1, .PNG: 1, .EXE: 1.

## ishar2

190 Dateien, 25997231 Bytes.
Bestandsprofil: `d9603fde3b9b2eb2e0ccda4a06cf3586e35bfe760444454479d046b481bcaeca`.

| Datei | Bytes | SHA-256 |
|---|---:|---|
| CONT1.FIC | 10800 | `b3f48f1856b79fda6dec61838c6bd00810db0b30f568dab82732230689a39717` |
| IO.IO | 2274 | `0df1f34cf2519341ef20825d49c7f1e7ff204878814db744f7e5cb58ce6b5918` |
| MAIN.IO | 11982 | `bfab5e9175931dbb1c2c51f0576092ef423e0bf950579340c8a1715e8cf8db95` |
| MESSAGE.IO | 6438 | `d180a5d858c7d188bc1ccf4546c3561bfed1779b8389ad10e7c74599a73e2742` |
| MESSAGED.IO | 6486 | `94f80de429cc62844da5f46aae1fc746f5c6ace5d20208d1173462a10dfb06ce` |
| MESSAGEE.IO | 6314 | `7ef08cd36e37d6a519a66e8288859488fd6782a4770dd50da60f65e131455313` |
| START.SAV | 8359 | `e685cd6902575392a9fe445e649863885f75832ed28657a5f6faf612c6305555` |
| start.exe | 43462 | `5e35e58d2d133dadeed4b233b7f962f9c941c3d635feb9d3a067a63c340dadf9` |

Erfasste Endungen: .IO: 142, .SAV: 22, .FIC: 10, .XLS: 1, .DOCX: 5, .MP3: 1, .BAK: 2, .STP: 1, .ICO: 2, .PDF: 1, .GIF: 2, .EXE: 1.

## Sprache und Versionen

MESSAGE-, MESSAGED-, MESSAGEE- und bei Ishar 1 MESSAGEI-Dateien sind vorhanden.
Die Namen sind Hinweise auf Varianten, aber die aktive Sprache und die Zuordnung
zu Editionen sind noch nicht durch Startkonfiguration/Textdecodierung bestätigt.
Kein stillschweigender Transfer von DOS-Erkenntnissen auf Amiga/Atari-Versionen.

## Reproduktion

```powershell
node scripts/inventory-originals.mjs E:/Spiele/Ishar1 E:/Spiele/Ishar2 ../analysis-output/inventory-2026-10-17
npm run test:inventory
$env:ISHAR1_DIR='E:/Spiele/Ishar1'
$env:ISHAR2_DIR='E:/Spiele/Ishar2'
npm run test:original-resources
```

Inventur folgt keinen symbolischen Links innerhalb der Installation. Ausgaben in
Originalverzeichnissen werden auch nach Auflösung existierender Verzeichnislinks
abgewiesen. Vorhandene, abweichende Berichte werden nicht überschrieben; neuen
Ausgabeordner verwenden. Byteidentische Berichte dürfen erneut erzeugt werden.
