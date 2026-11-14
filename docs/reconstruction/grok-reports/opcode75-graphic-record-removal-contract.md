# Vertrag: Opcode 75 (0x4b, `cerasen`) – Grafikdatensätze nach numelem entfernen – Ishar 1 und Ishar 2 (DOS)

Stand: 2026-11-14, Quesh (statische Analyse). Evidenzstufen: **known** = direkt im EXE-Disassembly gelesen; **suspected** = abgeleitet oder nur durch Referenz (ext/alis, maestun) gestützt; **unknown**.
Dieser Bericht enthält keine Originalbytes, Hexblöcke oder Save-Werte. Disassembly-Auszüge liegen nur privat (`codex-support/quesh/private/opcode75/`).

## 0. Profile und Hashes
| Profil | Datei | SHA-256-Präfix | Bemerkung |
|---|---|---|---|
| Ishar1 | `start.exe` | `3ea63234c97b` | MZ + selbstrelozierender Stub, unkomprimiert |
| Ishar1 | entpacktes Image Segment 1000 | `3374a47e3047` | Analysebasis (lokal, außerhalb Git) |
| Ishar1 | `LOGO.IO` | `8d1dad784ed7` | Aufrufstelle 0x00F0 |
| Ishar2 | `start.exe` | `5e35e58d2d13` | gleicher Stub-Typ |
| Ishar2 | entpacktes Image Segment 1000 | `e3a929a3916b` | Analysebasis |
| Ishar2 | `LOGO.IO` | `5b8d56fed3d7` | ebenfalls cerasen an 0x00F0 |

**Identität I1/I2 (known):** Die Bereiche 1000:3500–3C00 (Handler und alle Unterfunktionen), 1000:26E0–2700 (Dispatcher) und 1000:6900–6B00 (Ausdrucksauswertung) sind in beiden entpackten Images bytegleich (Vergleich 2026-11-14). Alle Adressen unten gelten unverändert für beide Spiele. Bekannte Abweichungen der Images liegen nur bei 0x788–0x789, 0x949–0x94F und im zweiten Segment.

## 1. Korrektur der Zuordnung
- Opcode 75 dezimal = 0x4b = **`cerasen`**, kein Audio-Opcode. Die Audio-Zuordnung kam aus einem alten Handoff. (known)
- Dispatcher 1000:26EB: Byte holen (`lodsb` über DS:SI), verdoppeln, `call cs:[bx+0x24]`, danach zurück nach 26EB. (known)
- Tabelleneintrag CS:0x24 + 2·0x4b → **1000:3A84** in Ishar1 **und** Ishar2. Damit ist die Korrektur vom 2026-11-14 bestätigt (known, nicht mehr suspected).
- Zum Abgleich: `csound` = 0x9d (157) → 1000:62BB in beiden Spielen. Dieser Opcode ist nicht Gegenstand des Vertrags.
- Nummerierung passt zu Codex' resource-draw 72/73/167 = 0x48 `cput` (1000:333F), 0x49 `cputnat` (1000:336F), 0xa7 `cxputat` (1000:33B7). (known)
- Die Unterfunktionen 35CF (Suche) und 3AFA (Entfernen) sind bestätigt. (known)

## 2. Aufrufkontext LOGO (Ishar1)
- Codex' VM erreicht in LOGO.IO Offset 0x00F0 nach zwei `cputnat`-Aufrufen ein `cerasen`. Laut Disassembly ist der einzige Operand ein Ausdruck vom Typ Immediate-Byte (2 Byte Ausdruckscode inkl. Opername). **Folge-PC = 0x00F3** (dort steht `cstop`). (known, statisches Listing; konkreter Operandwert nur privat)
- In Ishar2 LOGO.IO stehen `cerasen` an 0x0026, 0x00F0 und 0x0263. Verbreitung: 34 Skripte in Ishar1 und 30 in Ishar2 enthalten `cerasen`. (known, Listing)

## 3. Operanden und Kodierung (Ishar1 + Ishar2, 1000:3A84) – known
| Punkt | Inhalt |
|---|---|
| Opcodebyte | 1 Byte 0x4b, vom Dispatcher konsumiert |
| Operand | **genau 1 Ausdruck (E)**, gelesen über 1000:69A6. Das ist der Opername-Dispatcher: BX = 0x277C, CX = altes DX, `lodsb` Opername, Sprung über Tabelle CS:0x1F2. Ergebnis in **DX**. |
| Länge | variabel, gleich der Länge des Ausdrucks. Es folgen keine weiteren Inline-Bytes. |
| Verwendung | Nur **DL** (Low-Byte) wird verwendet: `ss:[0x0C0E]` (numelem) = DL. Später wird es als **signed 8 Bit** verglichen. |

Der Ausdruck wird **vor** allen anderen Aktionen vollständig ausgewertet. Erst danach lädt der Handler DS um (siehe 4). Der PC (SI) steht danach schon auf dem Folgebefehl.

## 4. Register und Variablen
| Objekt | Zugriff | Bedeutung | Stufe |
|---|---|---|---|
| SI | gelesen/fortgeschrieben (nur durch die Ausdrucksauswertung) | Skript-PC, danach = Folge-PC | known |
| DS | gesichert (`push ds`), dann `lds di, ss:[0x0BE8]` (Segment des Sprite-/Grafikdatensatzbereichs), am Ende `pop ds` | Datensätze sind DS-relativ; DS des Skripts wird wiederhergestellt | known |
| ES:BP | gelesen | Variablenbereich der laufenden Skriptinstanz | known |
| `es:[bp−0x16]` (s16) | gelesen | Screen-ID der Instanz (Referenzname `screen_id`, Offset 0x16) | known (Zugriff), suspected (Name) |
| `es:[bp−0x18]` (u16) | gelesen, **ggf. geschrieben** | Kopf der instanzeigenen Datensatzliste (Verkettung über +4) | known |
| `ss:[0x0C0E]` (u8) | **geschrieben** = DL | gesuchtes numelem (Referenz `image.numelem`) | known |
| `ss:[0x0BF3]` (u8) | gelesen in 3AFA, am Ende **auf 0 gesetzt** | Sofortlöschflag (Referenz `alis.ferase`) | known |
| `ss:[0x0BEC]` (u16) | gelesen/geschrieben (nur Sofortpfad) | Kopf der Freiliste (Referenz `libsprit`) | known |
| `ss:[0x0BF6]` (u16) | gelesen | Basis der Screen-/Instanztabelle im ES-Segment | known (Zugriff), suspected (Name) |
| AX, BX, CX, DX, DI | zerstört | keine Rückgabewerte | known |
| Flags | ZF als Such-Ergebnis zwischen 35CF und 3A95 (intern) | – | known |

## 5. Datensatzformat (nur die von 0x4b berührten Felder)
Datensätze liegen im Segment aus `ss:[0x0BE8]+2`; die Zeiger sind 16-Bit-Offsets.
| Offset | Typ | Bedeutung | Stufe |
|---|---|---|---|
| +0 | s8 | Zustand: 0xFF (<0) = neu bzw. noch nicht gezeichnet (gesetzt beim Anlegen in 1000:3626); 1 = zum Löschen markiert; 0 = ruhend | known (Werte und Verwendung), suspected (Benennung „gezeichnet“) |
| +1 | s8 | numelem | known |
| +2 | s16 | Screen-ID/Besitzer | known |
| +4 | u16 | Verkettung der Instanzliste bzw. der Freiliste | known |
| +6 | u16 | Verkettung der Screen-/Zeichenliste | known |
| Größe | – | Referenz: 0x30 Byte | suspected (nicht im EXE geprüft) |

## 6. Ablauf
### 6.1 Handler 3A84 (known)
1. Ausdruck auswerten (69A6) → `ss:[0x0C0E]` = DL.
2. DS sichern, DS:DI = `ss:[0x0BE8]`.
3. Schleife: **35CF** suchen. Wird ein Datensatz gefunden (ZF=1), entfernt ihn **3AFA**, dann beginnt die Suche **erneut am Listenkopf**.
4. Nicht gefunden: DS wiederherstellen, `ss:[0x0BF3]` = 0, `ret` zum Dispatcher.

Ergebnis: **Alle** Datensätze der Instanzliste mit (Screen-ID = eigene Screen-ID, numelem = DL) werden entfernt, nicht nur der erste.

### 6.2 Suche 35CF (known)
- BX (Vorgänger) = 0, DI = `es:[bp−0x18]`. Ist DI = 0 (leere Liste), endet die Suche mit „nicht gefunden“ (ZF=0 über `cmp sp,1`).
- CX = eigene Screen-ID, AL = numelem.
- Für jeden Knoten wird verglichen:
  - Ist CX < [DI+2] (signed), geht es weiter: BX = DI, DI = [DI+4].
  - Ist CX > [DI+2], ist das Ergebnis „nicht gefunden“.
  - Bei Gleichheit gilt dasselbe für AL gegen [DI+1] (signed 8 Bit): kleiner → weiter, größer → nicht gefunden, gleich → **gefunden** (ZF=1, DI = Treffer, BX = Vorgänger oder 0).
- Ende der Liste (DI = 0): nicht gefunden.
- Folge: Die Suche setzt eine Liste voraus, die absteigend nach (Screen-ID, numelem) sortiert ist. Sie bricht früh ab. Ein Datensatz hinter einem „größeren“ Schlüssel wird nicht gefunden. (known für die Suche; die Sortierung durch den Einfüger 3626 wurde nicht vollständig geprüft → suspected)

### 6.3 Entfernen 3AFA (known)
- **Verzögerter Pfad:** `ss:[0x0BF3]` = 0 **und** Zustand [DI] ≥ 0.
  - Ablauf: [DI] = 1; aushängen aus der Instanzliste (BX = 0 → `es:[bp−0x18]` = [DI+4], sonst [BX+4] = [DI+4]).
  - Der Datensatz **bleibt in der +6-Zeichenliste** und kommt **nicht** in die Freiliste.
- **Sofortpfad:** `ss:[0x0BF3]` ≠ 0 **oder** Zustand < 0 (z. B. 0xFF, noch nicht gezeichnet).
  - Gleiches Aushängen aus der Instanzliste.
  - Dann Freiliste: [DI+4] = `ss:[0x0BEC]`, `ss:[0x0BEC]` = DI.
  - Danach **3B52**: aushängen aus der +6-Kette. Ihr Anker ist `es:[ss:[0x0BF6] + [DI+2] + 2]`: Ist der Anker = DI, wird der Anker = [DI+6]; sonst wird die Kette ab dem Anker bis zum Vorgänger mit [SI+6] = DI gelaufen und [SI+6] = [DI+6] gesetzt.
- Rückgabe von 3AFA: DI = Nachfolger. 3A84 nutzt das nicht, es sucht neu ab dem Kopf.

### 6.4 Spätere Freigabe der Zustand-1-Datensätze
- Der Durchlauf ab 1000:3F3A geht die +6-Kette entlang. Bei Zustand 1 springt er nach 1000:4002: aushängen aus der +6-Kette ([BX+6] = [DI+6]) und in die Freiliste ([DI+4] = `ss:[0x0BEC]`, `ss:[0x0BEC]` = DI). (known für diese Stelle)
- Dass dieser Durchlauf der Zeichen-/Aufräumpass nach dem Frame ist und dort auch der Bildbereich restauriert wird: suspected.
- Konsequenz für Codex: Nach `cerasen` ist ein gezeichneter Datensatz sofort unsichtbar für Suchen der Instanz (Instanzliste), aber bis zum nächsten Durchlauf noch Teil der Zeichenliste mit Zustand 1. (known im Code)

## 7. Ressourcenauflösung / Typ
- `cerasen` löst **keine Ressource** auf. Es liest keinen Ressourcenindex, keine Ressourcentabelle und prüft keinen Typ. Es arbeitet nur auf bereits angelegten Grafikdatensätzen über (Screen-ID, numelem). (known)
- Ressourcenbezüge der Datensätze (Referenzfelder +0x08 `newad`, +0x12 `data`) werden von 0x4b weder gelesen noch geändert. (known: keine Zugriffe auf diese Offsets im Pfad)
- Es gibt keinen Fehlerpfad: Kein Aufruf des Fehlerhandlers 1000:8468, der nur beim Anlegen (3626, leere Freiliste, AX = 0x0A) erreicht wird. (known)

## 8. Rückkehr und Folge-PC – known
- Rückkehr per `ret` zu 26F7 → `jmp 26EB`. Es gibt keinen Sprung, keine PC-Änderung außer dem Ausdruckskonsum und kein Yield.
- **Folge-PC = Opcodeadresse + 1 + Länge des Ausdrucks**, in jedem Fall: Treffer, kein Treffer, leere Liste.
- Stack ausgeglichen (`push ds`/`pop ds`).

## 9. Grenzfälle
| Fall | Verhalten | Stufe |
|---|---|---|
| Leere Instanzliste (`es:[bp−0x18]` = 0) | Nur `ss:[0x0C0E]` = DL und `ss:[0x0BF3]` = 0 werden geschrieben; Folge-PC normal | known |
| Kein passender Datensatz | wie leere Liste | known |
| Mehrere Treffer | alle entfernt (Neustart der Suche am Kopf) | known |
| Treffer hinter einem größeren Schlüssel (unsortierte Liste) | wird nicht gefunden (früher Abbruch) | known (Suche) |
| Ausdruckswert > 127 oder < −128 | nur Low-Byte zählt, signed verglichen | known |
| `ss:[0x0BF3]` beim Eintritt ≠ 0 | alle Treffer sofort freigegeben; Flag danach 0 | known |
| Datensatz fehlt in der +6-Kette (inkonsistente Listen, nur Sofortpfad) | 3B52 läuft ohne Nullprüfung über die Kette, also keine Terminierungsgarantie (Endlosschleife oder Fremdspeicher). Die Referenz ext/alis `delprec` hat hier eine NULL-Prüfung; das ist **nicht originalgetreu**. | known (Code), Laufzeitfolge suspected |

## 10. Verwandte Einstiege (zur Abgrenzung, known)
- 0xdd `ccancen` (1000:3A7A): setzt `ss:[0x0BF3]` = 1 und ruft 3A84, also `cerasen` mit sofortiger Freigabe.
- 0x4a `cerase` (1000:3AAE) und 0xdb `ccancel` (1000:3AA4, Flag = 1): entfernen alle Datensätze der eigenen Screen-ID über die Suche 3600 (ohne numelem).
- 0x50 `cerasall` (1000:3ADB) und 0xdc `ccancall` (1000:3AD1).

## 11. Abgleich mit der Referenz ext/alis (suspected-Quelle)
- `cerasen`/`searchelem`/`killelem`/`delprec` in ext/alis (opcodes.c, image.c) entsprechen dem EXE in Ablauf, Vergleichsreihenfolge und Flaglogik.
- Abweichung: die NULL-Prüfung in `delprec` (siehe 9).
- `readexec_opername_saveD7` in der Referenz entspricht 69A6 (BX = 0x277C, CX = altes DX). Eine dauerhafte Ablage des alten Werts war in 3A84 nicht zu sehen.

## 12. Offene Grenzen
- Einfügeordnung in 3626/Sortierung der Instanzliste: nicht vollständig verfolgt (suspected: absteigend nach Screen-ID, dann numelem; maßgeblich ist die Suche 35CF).
- Datensatzgröße 0x30 und die Benennung der Felder jenseits +0..+7: nur Referenz (suspected).
- Rolle des Durchlaufs 3F3A/4002 im Frameablauf (welcher Aufrufer, wann Bildrestauration): suspected.
- `ss:[0x0BE8]`/`ss:[0x0BF6]`: Bedeutung über Zugriffe belegt, Initialisierung nicht verfolgt.
- Laufzeit-Spiegelung in DOSBox (Breakpoint auf 1000:3A84 mit Listenstand vor/nach) steht aus; alle Aussagen sind statisch.
