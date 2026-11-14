# Stapel-Handadapter Ishar 2: Kit c3df950 gegen FRISE
Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit.

- **Kit-Stand:** `40c8ae2`/`5598ad1` (`workbench/playable-slice`).
- **Geprüft:**
  - `c3df950`, `original-hand-runtime.ts` `placeOriginalHandItem`
  - Wiring in `playtest.tsx` (`e6b463e`)
- **Original:** FRISE.IO `27117c124caf`, vollständige Dekodierung: `L_02e20`–0x03348 und `L_03580`.
- **Ergebnis:** Beide Kernfälle stimmen. Im unterstützten Umfang gibt es eine konkrete Abweichung (H1), die das Kit bewusst ausschließt.

## Ablauf Original vs. Kit
| Schritt | FRISE | Kit | Label | Ergebnis |
|---|---|---|---|---|
| Frühe Mengenbuchung | 0x02e2e `L_03580`, vor allen Zielprüfungen: T4bd4[c][j] += min(gehalten, D − Zähler), Rest bleibt in T4bbc | Z. 37–40, nach den Prüfungen Z. 16–33 | known | passt, außer bei Zielen, die das Kit ablehnt (H1) |
| Deckel | `L_03580` 0x035a4–0x035d2: −49 → 20, sonst 10 | Z. 6 | known | passt |
| Sentinel-Freigabe | 0x02e32 `L_03b98`, vor allen Prüfungen, unabhängig vom Ergebnis | Z. 41, für alle angenommenen Pfade inklusive Restblockade | known | passt |
| Ziel leer bzw. gleicher Stapel | `L_02f19`: Code schon in 0..10 → kein Slot-Write, sonst 0x02f5a; Freigabe nur bei T4bbc == 0 (0x02fdb) | Z. 42–45 | known | passt |
| Restblockade | 0x03161 (`L_0315b`): T4bbc ≠ 0 → kein Tausch; Buchung aus 0x02e2e bleibt | Z. 48 (Zähler schon in Z. 39 geschrieben) | known | passt |
| Alter Handstapel | 0x03212/0x0322c: T4bbc[alt] = Zähler[alt]; Zähler[alt] = 0; Cursor = alter Code | Z. 49–50 | known | passt |
| Doppelslot-Unterdrückung | 0x0326b: gehaltener Stapel schon in 0..10 → Zielslot = 0, sonst 0x0328b Slot = gehalten | Z. 42, 51 | known | passt |
| Rüstung beim Tausch | 0x032d8/0x03313 (AND, −29..−26) | Z. 7, 52 | known | passt |
| Zweihand | 0x02e36–0x02f0b | Z. 30–33, 41 | known | passt |

## Kernfälle
1. **−50 ×6 auf Handfeld 9 (Code 9), vorhandener Stapel 8.**
   - Original:
     - `L_03580`: 8 + 6 > 10, also Zähler 10 und T4bbc 4.
     - `L_03b98`: keine Wirkung.
     - Altcode 9 → `L_0315b`. 0x03161 findet T4bbc ≠ 0 → Abbruch. Handfeld 9 bleibt 9, am Cursor bleibt −50 ×4.
   - Die Weitergabe an die dritte Figur geht über das Porträt (`L_03bef`/`L_03580`).
   - Kit: Z. 38/48 gleich. **Dasselbe Ergebnis** (known).
2. **Code 9 auf Handfeld mit −49 ×20.**
   - Original:
     - `L_03580` hat keine Wirkung, weil 9 kein Stapel ist.
     - Altcode −49 ≠ gehalten, nicht 16 → `L_0315b`. Alle T4bbc sind 0.
     - 0x03212: T4bbc[−49] = 20. 0x0322c: Zähler = 0. 0x0328b: Slot = 9. Rüstung ±0. Cursor −49 ×20.
   - Danach ins vierte Gepäck über `L_03bef` (Deckel 20).
   - Kit: Z. 49–52 gleich. **Dasselbe Ergebnis** (known).

## Abweichung
| # | Kit | FRISE | Label | Erwartet laut Original |
|---|---|---|---|---|
| H1 | `original-hand-runtime.ts` `placeOriginalHandItem` Z. 18 (Altcode −125 ist nicht übertragbar → null); Button deaktiviert (`playtest.tsx` Z. 1265) | 0x02e2e `L_03580` bucht vor 0x03012; Ziel −125 → `L_03348` ohne Slot-Write und ohne Freigabeprüfung | known | Ein gehaltener Stapel auf einem −125-Handfeld wird trotzdem in den Zähler gebucht (bis D), der Rest bleibt in T4bbc. Existiert der Code in einem Slot, entspricht das einer gültigen Zusammenführung. Sonst entsteht ein Zähler ohne Slot. Der Cursor bleibt auch bei Rest 0 stehen (Folgezustand suspected). Das Kit lässt alles unverändert. |

## Grenzen (keine Abweichungen)
- Altcode außerhalb des unterstützten Satzes, z. B. Code 16 oder andere Nichtstapelcodes: Das Original bucht zuerst (außer bei 16) und tauscht dann. Das Kit lehnt ab (Z. 18). Konservativ.
- Inkonsistente Zähler- oder Slotzustände: Das Kit lehnt ab (Z. 26–29), das Original rechnet weiter.
- T4bbc anderer Stapelcodes ist im Kit nicht modelliert. Der Kit-Cursor hält immer nur einen Code.

Keine SAV-Werte, Originalbytes, Dumps oder Profilwerte in diesem Bericht. Die Mengen in den Kernfällen sind synthetische Testwerte.
