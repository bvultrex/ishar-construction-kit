# Stapelweitergabe Ishar 2: Kit 26e290c gegen FRISE
Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit.

- **Kit-Tip:** `workbench/playable-slice` `64a3c4f`.
- **Geprüft:** `26e290c`: `original-stack-runtime.ts`, Routing in `original-inventory-runtime.ts` und `playtest.tsx`.
- **Original:** FRISE.IO `27117c124caf`. Die Listinglücke 0x02cbb–0x02dba ist mit großem Ausdrucksbudget neu dekodiert; der Ausdruck endet bei 0x02d4f, keine Stopps mehr.
- **Basis:** die gepushten Fassungen von `quesh/pickup-contract-ishar2.md/.json`. Der Nachtrag 2026-11-14 zur Lückenschließung ist dort eingetragen.
- **Ergebnis:** Im unterstützten Umfang gibt es **keine konkrete Abweichung**. Der von Codex im Browser geprüfte Ablauf passt zum Original:
  - Teilübergabe 6 → Ziel mit 8 bei Deckel 10, danach 10, Rest 4 am Cursor, Rest 4 an eine dritte Figur.
  - Einzelentnahme.
  - Export ist nur ohne gehaltenes Item möglich.

| Prüfpunkt | Kit | FRISE | Label | Ergebnis |
|---|---|---|---|---|
| Ganzer Stapel | `original-stack-runtime.ts` `takeOriginalStackItem` Z. 11–13: gehalten = Zähler, Zähler = 0, Slot = 0 | 0x02d53/0x02d6d: T4bbc[j] = T4bd4[c][j], T4bd4[c][j] = 0; 0x02dbb Slot = 0 | known | passt |
| Ein Stück | Z. 11–13: gehalten = 1, Zähler − 1; Slot nur bei Zähler 0 gelöscht | 0x02d82/0x02d90; bei Zähler > 0 → `L_02e1b` (Slot und Icon bleiben), sonst 0x02dbb | known | passt |
| Rest am Cursor | `playtest.tsx` `giveOriginalGround` Z. 932–938: `quantity` transient, nicht im SAV | T4bbc (MAIN 0x00247, nicht im Save) = Pendant zu 0x403a in Ishar 1 | known | passt |
| Zielslot | `receiveOriginalStackItem` Z. 23: gleicher Code 0..10, sonst erster freier 0..8, sonst null | `L_03bef` 0x03c10 (0..10), 0x03c45 (0..8), 0x03c9a `cret` | known | passt |
| Deckel | `limit` Z. 3: −49 → 20, sonst 10 | `L_03580` 0x035a4–0x035d2 | known | passt |
| Aufnahme beim Ziel | Z. 25–27: min(gehalten, D − Zähler) | 0x035d8–0x0364c | known | passt |
| Verwurf | keiner; Rest bleibt gehalten (Z. 28, `playtest.tsx`) | kein Verwurf; Freigabe nur bei allen T4bbc == 0 (0x03c9b) | known | passt (anders als der Ishar-1-Kauf) |
| Voller Zielstapel | Z. 25 → null, nichts geschrieben | Merge-Pfad: Rest 0, Zähler bleibt, kein Slot-Write, keine Freigabe | known | passt |
| Mengenbilanz | Entnahme: Rest + gehalten = alt; Ziel: angenommen + Rest = gehalten | gleich (0x02d53–0x02db7, 0x035fb–0x0364c) | known | passt: keine Duplikation, kein Verlust |
| Handlungsfähigkeit beim Ziel | Z. 22 | 007C9 vor `L_03bef` | known | passt |
| Zähler-Offset | `stacks` 7629, Schritt 20, Byte, j = Code + 59 | MAIN `cdim` T4bd4, Schritt 20; Save 7629 + 20c + j | known | passt |

## Grenzen (keine Abweichungen)
- **Ganz oder ein Stück:** Im Original entscheidet die Klickzone 0x02cbb (Teilzone des Slots → ganzer Stapel, sonst ein Stück). Das Kit nutzt dafür zwei Buttons. Dass die Teilzone die Zahlenanzeige ist: suspected.
- **Stapel auf Handfeld bzw. bei offenem Handpanel:** Das Kit lehnt ab (`playtest.tsx`, `giveOriginalGround`, Z. 933). Im Original laufen `L_02e20`/`L_03580` und der Tausch 0x031fc–0x0326b. Nicht modelliert, also konservativ.
- **Fehlerhafte Zähler** (0 oder über D): Das Kit lehnt ab (Z. 10, 24). Das Original würde unbeschränkt rechnen (z. B. negativer Rest bei 0x0363e). Betrifft nur inkonsistente Zustände.
- **Leerer Slot bei vollem Altzähler:** Das Original schreibt den Slot (0x03c58) ohne Freigabe; das Kit schreibt nichts. suspected, inkonsistenter Ausgangszustand.
- **Lokale Variable `loc100` in `L_03580` (0x03596):** Steht von früher noch auf 16, bricht `L_03580` ohne Mengenbuchung ab. unknown, ob erreichbar.

Keine SAV-Werte, Originalbytes oder Dumps in diesem Bericht.
