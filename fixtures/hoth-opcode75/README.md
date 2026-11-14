# Opcode 75 (cerasen): Grafikdatensatz-Fixtures

Hoth, 14.11.2026. Alle Werte sind synthetisch. Es gibt keine Originalbytes, Dumps oder Assets, und Hashes erscheinen nur als Präfix mit höchstens 12 Zeichen.

Opcode 75 ist das Byte `0x4B` (`cerasen`). Es entfernt Grafikdatensätze und ist **kein** Audiobefehl. `csound` ist `0x9D` = 157.

## Dateien

| Datei | Inhalt |
|---|---|
| `opcode75-vectors.json` | 38 Vektoren: 30 `record-list`, 2 `dispatch`, 6 `logo-path` |
| `schema.json` | JSON-Schema (Draft 2020-12) |
| `check-opcode75-vectors.mjs` | Checker ohne Abhängigkeiten, mit eigenem Referenzmodell. Exit 0 nur, wenn alles grün ist. |
| `build-opcode75-spec.py` | Erzeugt die synthetischen Startzustände und Eingaben (ohne Erwartungswerte) |
| `audit-no-original-bytes.py` | Bereinigungsaudit: SHA, identische Dateien, 12-Byte-Fenster, Hex-Folgen über 12 Zeichen |

## Ausführen

```
node check-opcode75-vectors.mjs            # erwartet: green 38, red 0
python3 audit-no-original-bytes.py [private Speicheraufnahmen ...]
```

## Datenmodell (synthetisch abstrahiert)

- **Datensatz:** `state` s8 @+0, `num` s8 @+1, `screen` u16 @+2, `next` u16 @+4, `link` u16 @+6.
- **Kontext:** `head` (Kontextwort BP-0x18), `screenId` (Kontextwort BP-0x16).
- **Globals:**
  - `free`: Kopf der Freiliste
  - `ferase`: Flagbyte
  - `linkHeads[screen]`: Kopf der +6-Kette je Bildschirm-ID
- **Eingabe:** Folge von Operanden (`oimmb`/`oimmw`). Es zählt nur das Lowbyte, signed verglichen.
- **Erwartung:**
  - `steps` je Aufruf: RET erreicht, SI-Vorschub, DS/SP/ES/BP erhalten, gespeichertes num-Byte, `ferase` danach
  - `after`: Liste, Freiliste, Link-Köpfe
  - `otherChanges`: Bytes außerhalb der Modellfelder; alle 0

## Herkunft der Erwartungswerte

Die Werte unter `record-list` stammen aus der Ausführung der Originalbefehle ab `1000:3A84` bis RET in Unicorn 2.1.4. Grundlage ist je eine eigene Startup-Speicheraufnahme beider Profile. Es gibt keine Stubs, und beide Profile liefern identische Ergebnisse. Der Harness und die Aufnahmen liegen privat. Der Checker bildet die Werte unabhängig mit seinem Modell nach.

Labels:
- `known`: eigener reproduzierbarer Beleg
- `suspected`: statisch abgeleitet
- `open`: nicht belegt

Details stehen im Bericht `opcode75-graphic-record-fixtures.md`.
