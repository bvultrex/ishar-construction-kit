# Stapel-Handadapter Ishar 2: Kit c3df950 gegen FRISE

Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit. Selektiv aus Grok-Nachtrag45 (`019d6bb`) übernommen.

- Geprüft: `original-hand-runtime.ts` ab `c3df950` und Wiring in `playtest.tsx` ab `e6b463e`.
- Original: FRISE.IO `27117c124caf`, vollständige Dekodierung `L_02e20`–`0x03348` und `L_03580`.
- Ergebnis: Die beiden kontrollierten Browserkernfälle stimmen. Eine konkrete Abweichung H1 am reservierten Zielplatz wurde gefunden.

## Bestätigte Kernfälle

1. Gehalten `-50×6`, vorhandener Stapel8 und angeklickte Hand mit Code9: Der Originalhelper erhöht auf10 und lässt4 am Cursor; wegen des Rests findet kein Tausch statt. Das Kit stimmt überein.
2. Gehalten Code9, angeklickte Hand mit `-49×20`: Der alte Stapelcode samt Menge20 geht an den Cursor, sein Charakterzähler wird null und Code9 wird eingesetzt. Das Kit stimmt überein.

## H1: reservierter Zielplatz

Das Kit lehnte einen Zielcode `-125` vor jeder Änderung ab. FRISE ruft dagegen zuerst `L_03580` auf und bucht den gehaltenen Stapel bis zum Deckel in den Charakterzähler. Erst danach führt `0x03012` über `L_03348` ohne Slot-Write und ohne Cursorfreigabe hinaus. Der Zielslot bleibt `-125`; der Cursor behält den Code auch bei Rest0 (dieser Folgezustand ist laut Quesh suspected). Existiert kein passender Slot, kann dadurch ein Zähler ohne Itemslot entstehen.

## Grenzen

- Statisch, kein Originallauf und keine privaten Roh-SAVs.
- Effektcode16, inkonsistente Zähler-/Slotzustände und weitere nicht unterstützte Altgegenstände bleiben außerhalb des Adapters.
- Die vollständigen Quesh-Vertragsnachträge bleiben im Grok-Berichtsbranch; hier wurde nur der unmittelbar geprüfte Produktbefund übernommen.
