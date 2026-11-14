# Waffenpfad Ishar 2: Kit 97a7367 gegen FRISE
Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit.

- **Kit-Teststand:** `788cd8e` (`workbench/playable-slice`).
- **Geprüft:** `97a7367`, dazu Kontext `4a18062` (PARAM-Profil).
  - `original-inventory-runtime.ts`
  - `original-weapon-profile.ts`
  - `playtest.tsx`
- **Original:** FRISE.IO `27117c124caf` (vollständige Dekodierung ohne Lücke) und PARAM.IO.
- **Nicht bewertet:** Handablage und Tausch von Stapeln.
- **Ergebnis:** **keine konkrete Abweichung** im unterstützten Umfang.

## PARAM-Profil
| Prüfpunkt | Kit | Original | Label | Ergebnis |
|---|---|---|---|---|
| Waffencodes | `original-weapon-profile.ts` `originalWeaponCode` Z. 4: −116..−90 | FRISE 0x02e36: −116 ≤ Code ≤ −90 | known | passt |
| Tabelle | `readOriginalWeaponProfile` Z. 10–27: 27 Sätze à 4 Byte ab PARAM 0x00f58, Feld 2 | MAIN `cdim` T4a08 (0x001ea, Schritt 4); PARAM 0x00f58ff schreibt 27 Sätze; einziger Writer; nicht im Save | known | passt |
| Zweihandkriterium | `originalWeaponTwoHanded` Z. 30–33: Feld 2 mod 10 == 2 | FRISE 0x02e4c: T4a08[Code+116][2] mod 10 == 2 | known | passt |
| Anzahl Zweihand | Prüfskript erwartet 12 | eigene Auszählung der PARAM-Initialisierung: 12; alle Werte in Feld 2 positiv, das Vorzeichen von `%` spielt also keine Rolle | known | passt |
| Fehlendes Profil | `placeOriginalInventoryItem` Z. 48–49: Waffe auf Hand ohne Profil → null | – | – | konservativ, keine Abweichung |

## Reservierung und Freigabe
| Prüfpunkt | Kit | FRISE | Label | Ergebnis |
|---|---|---|---|---|
| Sperrwert und Slot | Z. 50, 57: andere Hand = −125 | 0x02ea1 (Ziel 9 → Slot 10), 0x02eea (Ziel 10 → Slot 9) | known | passt |
| Bedingung für die Reservierung | Z. 51: andere Hand 0 oder −125, sonst null | 0x02e79/0x02ec2; sonst `cret` 0x02f0b ohne Write | known | passt |
| Freigabe bei Ablage | Z. 57: andere Hand = −125 und neuer Code einhändig → 0 | `L_03b98` (0x02e32), unabhängig vom Code, vor der Zweihand-Prüfung | known | passt |
| Freigabe bei Entnahme | `takeOriginalInventoryItem` Z. 28–30 | 0x02c6d → `L_03b98` | known | passt |
| Tausch Zweihand gegen Zweihand bzw. Einhand gegen Zweihand | Z. 46–47, 57: alter Code an den Cursor, Reservierung neu gesetzt bzw. freigegeben | `L_03b98` → 0x02e36 → `L_0315b`/0x0328b | known | passt |
| Ziel ist selbst −125 | Z. 47 → null (−125 ist nicht übertragbar) | 0x03012 → keine Aktion; bei Zweihand schon 0x02f0b | known | passt |

## Reihenfolge Prüfung → Reservierung → Write
- **Original** (`L_02e20`):
  1. Freigabe `L_03b98`.
  2. Zweihand-Prüfung und Reservierung (0x02e36–0x02f07).
  3. Danach erst Slot-Write bzw. Tausch (0x02f0c, 0x03012, `L_0315b`).
- **Kit:** alle Prüfungen zuerst (Z. 44–51), danach Slot, Reservierung bzw. Freigabe und Rüstung in einem Schritt (Z. 52–60).
- **Abgelehnte Fälle:**
  - Andere Hand belegt, Ziel −125, fehlendes Profil: Das Original schreibt in diesen Fällen nichts, weil `L_03b98` nur bei vorhandenem −125 eingreift und dann die Zweihand-Prüfung besteht. Das Kit schreibt ebenfalls nichts, die Ergebnisse sind gleich.
  - Der einzige Original-Pfad, der nach gesetzter Reservierung noch ablehnt, ist `L_0315b` bei T4bbc ≠ 0. Bei gehaltener Waffe ist das vermutlich nicht erreichbar (suspected). Das Kit setzt in diesem Fall nichts.

## Grenzen (keine Abweichungen)
- Alte Codes außerhalb des unterstützten Satzes, etwa −48..−30, −24..−15 oder Sondercodes: Das Original tauscht generisch, das Kit lehnt ab (Z. 47). Konservativ.
- Der Charakterblatt-Pfad (`L_02610`) ist nicht modelliert. `L_03b98` greift dort nur bei den Rasterslots 9/10.

Keine SAV-Werte, Originalbytes, Dumps oder Profilwerte in diesem Bericht.
