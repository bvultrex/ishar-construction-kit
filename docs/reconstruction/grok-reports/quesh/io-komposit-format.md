# ALIS-.IO-Ressourcen: Komposit-Format 0xFF (Ishar 1 DOS)
Stand: 03.11.2026. Beleg: Nachbau `ext/alis/src/image.c` (putin Z.1439–1565) und `image_draw_16.c`. Die Original-EXE ist nicht disassembliert; bezogen auf die EXE gilt das Format daher als suspected.

## Ressourcentabelle (known)
- Grundlage ist das entpackte Skriptbild. Das Dword @14 (LE) ist p.
- Bei p stehen `u32 off, u16 anzahl`. Die Tabelle beginnt bei p+off.
- Eintrag i: u32 LE bei a = Tabelle + 4·i. Die Ressource liegt bei **a + Wert**, der Offset ist also relativ zum Eintrag.

## Typbyte
| Wert | Bedeutung |
|---|---|
| 0xFE | Palette |
| 0xFF (>0x80) | Komposit |
| 0x10 / 0x12 | 4 bpp transparent / deckend |
| 0x14 / 0x16 | 8 bpp transparent / deckend |
| 0x00 / 0x01 | vorhanden, Bedeutung unknown |

## Komposit 0xFF (known)
- `+0` = 0xFF, `+1` = n (Anzahl Teile).
- Danach folgen n Teile zu je 8 Byte, LE:
  - s16 Index: Bit 15 bedeutet horizontal spiegeln; der Index ist Wert & 0x7FFF.
  - s16 dx: wird negiert, wenn der Elternteil gespiegelt ist.
  - s16 dy.
  - s16 dz.
- Teile werden rekursiv gezeichnet. Ihre Position ist relativ zur Elternposition und wird danach zurückgesetzt.

## Bitmap
| Offset | Inhalt | Stufe |
|---|---|---|
| +0 | Typ | known |
| +1 | unknown | unknown |
| +2 u16 | Breite−1 | known |
| +4 u16 | Höhe−1 | known |
| +6 u8 | Palettenoffset | known |
| +7 | unknown | unknown |
| ab +8 | Pixel (4 bpp: Breite/2 Byte je Zeile, hohes Nibble zuerst) | known |

## Tests (nur Struktur und Hash-Präfixe)
| Datei | Idx | Typ | Struktur | SHA1-Präfix |
|---|---|---|---|---|
| MCAVE.IO | 12 | bitmap | 0x10 32×51 | a0c78e43 |
| MCAVE.IO | 126 | komposit | n=9, gespiegelt 3 | 9b1e19ae |
| MCAVE.IO | 144 | komposit | n=3, gespiegelt 0 | cc7d2660 |
| MCAVE.IO | 201 | komposit | n=1, gespiegelt 0 | 5abefabd |
| MCAVE.IO | 228 | komposit | n=10, gespiegelt 4 | 69af530b |
| MCAVE.IO | 241 | komposit | n=1, gespiegelt 0 | 253a470d |
| PCAVE.IO | 8 | komposit | n=3, gespiegelt 0 | 86cf3878 |
| PCAVE.IO | 9 | komposit | n=1, gespiegelt 0 | 5bda8534 |

- In 15 Dateien zeigt kein Komposit-Teil über die Ressourcenanzahl hinaus.
- Werkzeug: `private/io-komposit-export.py`. Bilder liegen nur in `private/io-export/`.
