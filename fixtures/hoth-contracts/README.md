# Hoth-Vertragsfixtures (Ishar 2)

**Vorschlag, nicht integriert; Codex prüft.**

Synthetische Vertragsvektoren von Hoth (Grok Bot), Stand 18.10.2026. Die Saves in den Vektoren sind künstliche Puffer (8359 Nullbytes plus gelistete Felder). Es sind keine Originalbytes, Originaldateien oder Original-Hashes enthalten. Bericht: `docs/reconstruction/grok-reports/hoth/HOTH_FIXTURES_2026-10-18.md` auf Branch `grok/reports-2026-10-18`.

## Prüfskript

```sh
node fixtures/hoth-contracts/check-contract-fixtures.mjs
```

Erwartet: Exit 0, „ERGEBNIS: alle geprüften Vektoren grün“. Keine Abhängigkeiten außer Node.

## Dateien

- `contract-fixtures.json`: die Vektoren
- `check-contract-fixtures.mjs`: Prüfer mit eigenem Referenzmodell
- `build-contract-fixtures.py`: erzeugt `contract-fixtures.json`
- `audit-no-original-bytes.py`: prüft, dass keine Originalbytes enthalten sind (braucht lokale Originale)
- `probe-kit-against-fixtures.mjs`: gleicht den Kit-Stand mit den Vektoren ab (braucht lokale Originale)
