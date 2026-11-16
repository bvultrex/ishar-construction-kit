# Code-16-Effekte im Handadapter: Kit f2a77b9 gegen FRISE (Ishar 2)
Stand: 2026-11-16 (Europe/Berlin). Nur statische Arbeit. Die Werte sind synthetisch.

- **Geprüft:** `src/lib/ishar/original-hand-runtime.ts` in `f2a77b9` (`placeOriginalHandItem`, Z. 20–31) und der Aufruf in `src/routes/playtest.tsx` (Z. 971, 1305).
- **Original:** FRISE.IO `27117c124caf`, vollständige Dekodierung, mit
  - `L_02e20` (0x02e20–0x02f0b),
  - `L_03012`–`L_0313e` (0x03012–0x03157),
  - `L_0315b` (0x03161),
  - `L_03580` (0x03596),
  - `L_03b98`.
- **Save-Layout (MAIN-Speicherroutine):** main 0x4c38 = Save 10 (BE16), main 0x4c3a = Save 12 (BE16).
- **Ergebnis:**
  - Die Akkumulatorformeln für gehaltene Stapel −59..−51 stimmen (known).
  - **Eine Abweichung (D1, known):** ein Nicht-Stapel-Code, der auf ein Handfeld mit Code 16 gelegt wird.
  - **Ein Grenzfall (D2, suspected):** die −125-Freigabe.

## Ablauf im Original (Ziel-Handfeld = 16)
1. 0x02e20: loc100 = alter Code (16).
2. **0x02e2e `L_03580`:** gibt bei loc100 == 16 sofort zurück (0x03596). Es wird kein Stapelzähler gebucht, T4bbc bleibt voll.
3. **0x02e32 `L_03b98`:** gibt eine −125-Reservierung der anderen Hand frei, ohne Bedingung zum Ziel.
4. 0x02e36–0x02f0b: Zweihandprüfung, nur für Waffencodes −116..−90.
5. 0x03012: Ziel ≠ −125. 0x0301f: 16 ist kein Stapel. **0x03046:** Ziel == 16.
6. **0x03053:** Gehalten in −59..−51 → Effektzweig. Sonst (−50, −49, alle Nicht-Stapel) → `L_0315b`, der normale Tauschpfad.

## Effektzweig 0x03069–0x03157 (known)
| Gehalten | FRISE | Formel | Kit | Ergebnis |
|---|---|---|---|---|
| −59 / −58 / −57 / −56 | 0x0308c / 0x030a3 / 0x030b9 / 0x030cf | 0x4c3a += q·1000 / ·100 / ·10 / ·1 | Z. 27–28: at = 12, Faktor [1000, 100, 10, 1][id + 59] | passt |
| −55 / −54 / −53 / −52 | 0x030e2 / 0x030f9 / 0x0310f / 0x03125 | 0x4c38 += q·1000 / ·100 / ·10 / ·1 | Z. 27–28: at = 10, Faktor [1000, 100, 10, 1][id + 55] | passt |
| −51 | 0x03138 | 0x4c38 = −1 | Z. 25: Save 10 = −1 | passt |
| danach | 0x0313e / 0x0314c / 0x03150 | T4bbc[j] = 0, Cursor wird gelöscht, 0x2d16 = 0; kein Slot-Write, kein Zählerwrite | Z. 30: `held: null`, Slot und Zähler unverändert | passt |

- **q:** der volle gehaltene Wert T4bbc[j], denn `L_03580` hat nichts abgezogen. Im Kit ist das `held.quantity` (Z. 24).
- **Überlauf:** `cadd` auf einem main-Wort läuft modulo 2^16 über. Das Kit schreibt mit `setInt16`, ebenfalls modulo 2^16 (passt).
- **Gehalten −50 / −49 auf 16:** Im Original geht es weiter zu `L_0315b`. Dort sieht 0x03161 T4bbc ≠ 0 und bricht ohne Tausch ab. Das Kit liefert in Z. 23 dasselbe: unverändert, Cursor bleibt (passt).
- **Synthetisches Beispiel:** −57 mit q = 7 → 0x4c3a += 70 (Save 12). −54 mit q = 3 → 0x4c38 += 300 (Save 10).

## Abweichungen
| # | Kit | FRISE | Label | Erwartet laut Original |
|---|---|---|---|---|
| D1 | `original-hand-runtime.ts` Z. 22–30: Der Zweig `old === 16` fängt **jeden** angenommenen gehaltenen Code ab, auch Nicht-Stapel (Code 9, Waffen usw.). Ohne Menge ergibt Z. 27/28 NaN; `setInt16` schreibt dann 0 nach Save 10 (id ≥ −55) bzw. Save 12 (id < −55). Z. 30 liefert `held: null`, der Gegenstand verschwindet. Der Button ist aktiv (`playtest.tsx` Z. 1305, Ergebnis ≠ null). | 0x03053 → `L_0315b`; alle T4bbc == 0 → normaler Tausch (0x03183 ff.) | known | Code 16 kommt an den Cursor (0x0330c), der gehaltene Code in den Slot (0x0328b), Rüstungstausch nach der AND-Regel. Save 10/12 bleiben unberührt. Bei einer Zweihandwaffe setzt 0x02ea1/0x02eea vorher −125 in der anderen Hand, sofern sie leer oder schon reserviert ist; sonst bricht 0x02f0b ohne Tausch ab. Mindestens müsste das Kit hier ablehnen (`null`) statt Save 10/12 zu nullen. |

## Grenzfall −125 mit Code 16
| # | Kit | FRISE | Label | Bemerkung |
|---|---|---|---|---|
| D2 | Z. 22–31 kehren vor der Sentinel-Behandlung (Z. 54) zurück. Steht in der anderen Hand −125, bleibt das im Code-16-Zweig erhalten. | 0x02e32 `L_03b98`: Bei jeder Ablage auf Handfeld 9/10 wird −125 in der anderen Hand auf 0 gesetzt (0x03bb8/0x03bde), auch wenn das Ziel 16 ist. | suspected | Der Zustand „Ziel = 16, andere Hand = −125“ setzt eine Zweihandwaffe in einer Hand voraus, die 16 hält. Über die belegten Pfade entsteht er nicht, weil jede Ablage auf ein Handfeld zuerst `L_03b98` ausführt. Er wäre nur über einen schon inkonsistenten Spielstand erreichbar. Falls doch: Das Original setzt die andere Hand auf 0, auch im Abbruchfall −50/−49. |

Das Ziel −125 selbst liegt nicht im Code-16-Pfad: 0x03012 springt nach `L_03348`, bevor 0x03046 geprüft wird. Die Kit-Behandlung in Z. 57 war schon früher geprüft und wurde hier nicht neu bewertet.

## Offene Punkte
- Was 0x4c38/0x4c3a fachlich bedeuten, ist unknown. Geprüft sind nur die Formeln und die Save-Lage.
- D2 ist nur statisch eingeordnet. Ob der Zustand nativ erreichbar ist, wurde nicht geprüft.
- Wie Code 16 in ein Handfeld gelangt, gehört nicht zum Prüfumfang.

Keine SAV-Werte, Originalbytes oder Dumps in diesem Bericht.
