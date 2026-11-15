# Vertrag: Tavernenmahlzeit Ishar 2, Zahlung bei mehreren Goldhaltern
Stand: 2026-11-14 (Europe/Berlin). Quesh, nur statische Arbeit. Die Zahlenbeispiele sind synthetisch.

## Spiel und Datei
- **Spiel:** Ishar 2 (known).
  - Der Kit-Nahrungswriter (`original-tavern.ts`, TAVERNE 0x0062e..0x0069d) und der lokale Prüfer `check-original-tavern-food-local.mjs` binden TAVERNE.IO mit SHA-256-Präfix `ea315973f218`.
  - Die Datei im Ishar-2-Originalverzeichnis hat denselben Hash.
  - Die Bereiche 0x0062e..0x0069d (Nahrung) und 0x00499..0x0062b (Zahlung) passen zum Listing.
- **Ishar 1:** Es gibt keine TAVERNE.IO, nur ITAVERNE.IO (`f3bed78c5fb9`), eine andere Datei. Ein Byte-Vergleich entfällt.
- **Quellen:**
  - Vollständige Dekodierung von TAVERNE.IO, 99,6 % Codeabdeckung, ohne Stopps.
  - MAIN Ishar 2 für den Tavernenparameter.
  - Save-Layout aus der MAIN-Speicherroutine.

## Variablen (Taverne: dirw/dirb des Tavernen-Entity, MAIN: main)
| Name | Adresse | Save | Bedeutung |
|---|---|---|---|
| t | dirb 0x0c (Taverne) | – | Tavernenparameter |
| Preis | main 0x4c9a (Tausender) / 0x4c98 (Einheiten) | nicht gespeichert (nicht im Save-Layout) | Preis, nach der Zahlung Restschuld |
| n | dirb 0x11 | – | Zahl der belegten Plätze |
| Gold T[c] / E[c] | 0x2d68 / 0x2d80 | 1006 + 2c / 1026 + 2c (BE16) | Gold-Tausender / Gold-Einheiten |
| Klasse | 0x2e9e | 1276 + c (Byte) | ≠ −1 = belegt, Zahler-Gate |
| HP | 0x2d5c | 996 + 2c (BE16) | > 0 = Esser-Gate |
| Nahrung | 0x2ef6 | 1326 + c (Byte) | |
| Stunde / Tick | 0x4fc6 / 0x4fca | 44 / 48 (BE16) | |

## (2) Preisformel (known)
- **t:**
  - MAIN 0x003af: Die Zellnummer B wird gescannt (`oscan`).
  - 0x0315f/0x03169: Die Taverne öffnet nur bei 0 < |B| < 16.
  - 0x03183: t = |B| − 1. 0x0324f übergibt t an TAVERNE (dirb 0x0c).
  - **Wertebereich:** 0..14 (Byte). Welche Zellen es tatsächlich gibt, ist unknown.
- **Preis:**
  - Mahlzeit (Knopf 2, 0x12 = 2): Preis = 500 + 40·t (0x001ae).
  - Zimmer (0x12 = 3): 900 + 80·t (0x00199), nur zur Abgrenzung.
- **Rundung:** keine. Der Preis ist ganzzahlig.
- **Aufteilung in Tausender und Einheiten** (0x001bf–0x001e4):
  - Bei Preis > 1000 wird einmal 1000 abgezogen: Tausender = 1, Einheiten = Preis − 1000.
  - Sonst: Tausender = 0, Einheiten = Preis.
  - Für die Mahlzeit gilt Preis ∈ {500, 540, …, 1060}. Genau 1000 kommt nicht vor.
  - Ab t ≥ 13 ist Tausender = 1 (t = 13: 1 / 20; t = 14: 1 / 60).

## (3) Zu wenig Gold insgesamt (known)
- 0x001ea–0x00237 summiert über alle Plätze mit Klasse ≠ −1:
  - n += 1.
  - Gold aufaddieren über `L_00b41`; sobald die Einheiten > 999 sind, wandert der Überlauf in die Tausender.
- 0x00239: Ist Preis > Summe (Tausender zuerst, dann Einheiten), folgt
  - Meldung −21 (TEXTIND, 0x0025d),
  - `csleep`, `cret`.
- Das passiert **vor** der Preis- und ok-Leiste. Es gibt keinen Save-Write: keine Stunde, kein Gold, keine Nahrung.
- Preis = Summe gilt als ausreichend.

## (1) Zahlungsreihenfolge (known)
Ablauf nach ok:
1. Stunde +1 (0x00443) und Tick = 0x4fcc − 1 (0x00449).
2. Essensnachricht −22, Warten bis zum Schließen (`csleep` 0x00477).
3. Erst danach beginnt bei 0x00499 die Zahlung.

**Anteil** (`L_00bff`, 0x00bff/0x00c17, Ganzzahldivision):
- AE = (PE + 1000·(PT mod n)) div n
- AT = PT div n
- Damit ist AT·1000 + AE = ⌊Preis / n⌋.

**Subtraktion** `L_00b6f` (A − B, mit Flag 0x10):
- Zahlungsfähig ist A, wenn AT > BT gilt, oder AT = BT und AE ≥ BE.
- Dann: E −= BE, T −= BT. Ist E < 0, wird von den Tausendern geborgt (0x00b96–0x00bc9): E += 1000, T −= 1.
- Sonst: Flag = 1, keine Änderung.

**Pass 1** (0x004b8–0x00574), Plätze c = 0..4 in Slotreihenfolge, nur Klasse ≠ −1:
- Kann c den Anteil zahlen: Gold[c] −= Anteil.
  - Write T[c] bei 0x0052d, danach E[c] bei 0x00537.
  - Restschuld −= Anteil (0x00557, gespeichert bei 0x0055b/0x00561).
- Kann c den Anteil nicht zahlen: c zahlt **alles**, was er hat.
  - T[c] = 0 (0x00515), danach E[c] = 0 (0x0051f).
  - Restschuld −= altes Gold[c].

**Pass 2** (0x0057c–0x00628), wieder c = 0..4, nur Klasse ≠ −1:
- Kann c die Restschuld decken: Gold[c] −= Restschuld.
  - Write T[c] bei 0x00603, danach E[c] bei 0x0060d.
  - **Ende** (`L_0062b`).
- Sonst zahlt c alles (0x005db/0x005e5), die Restschuld sinkt, und der nächste Platz ist dran.
- Die Restschuld besteht aus Preis mod n und den Fehlbeträgen armer Figuren.
- Ist die Restschuld 0, schreibt der erste belegte Platz in Pass 2 sein unverändertes Gold zurück. Es ändert sich kein Byte.

**Vergleich mit dem Ishar-1-Muster** (SOS: 1000 div n, dann deckt die erste zahlungsfähige Figur den Rest):
- Die Grundform ist dieselbe: zwei Pässe, gleiche Anteile, danach deckt die Slotreihenfolge den Rest.
- Belegte Unterschiede hier:
  - Der Anteil wird aus dem ganzen Preis mit Tausender-Übertrag gebildet.
  - Arme Figuren zahlen in **beiden** Pässen alles, was sie haben.
  - In Pass 2 können mehrere Figuren nacheinander beitragen.

## (4) Persistente Reihenfolge der Writes (known)
| # | Code | Save | Bedingung |
|---|---|---|---|
| 1 | 0x00443 | 44 (Stunde, +1) | nach ok, vor der Nachricht |
| 2 | 0x00449 | 48 (Tick = 0x4fcc − 1) | ebenso |
| 3 | 0x0052d/0x00537 bzw. 0x00515/0x0051f | 1006 + 2c, danach 1026 + 2c | Pass 1, je belegtem c aufsteigend |
| 4 | 0x00603/0x0060d bzw. 0x005db/0x005e5 | 1006 + 2c, danach 1026 + 2c | Pass 2 bis zum Decker |
| 5 | 0x0065d/0x0066b/0x00684 | 1326 + c | Nahrung, c = 0..4 mit HP > 0: > 60 → 100, sonst +40, gedeckelt auf 100 |

- **Gezahlt wird vor der Nahrung** (known): Die Zahlung endet bei 0x0062b, die Nahrung beginnt bei 0x0062e.
- 0x4c98/0x4c9a (Restschuld) liegen nur im RAM.

## Synthetische Fälle
Notation: (T, E) je Platz.

| Fall | Eingang | Preis / Anteil | Erwartet |
|---|---|---|---|
| A: n = 4, alle reich, t = 2 | c0 (1, 0), c1 (0, 900), c2 (2, 500), c3 (0, 300), c4 leer | 580 = (0, 580); Anteil (0, 145); Rest 0 | c0 (0, 855) mit Borgen, c1 (0, 755), c2 (2, 355), c3 (0, 155); Pass 2: c0 zahlt 0. Nahrung danach für HP > 0. |
| B: n = 3 mit Rest, t = 2 | c0 (0, 600), c1 leer, c2 (1, 0), c3 (0, 400) | Anteil (0, 193); Rest 580 − 3·193 = 1 | Pass 1: c0 (0, 407), c2 (0, 807) mit Borgen, c3 (0, 207). Pass 2: c0 −1 → (0, 406). |
| C: arme Figuren, n = 4, t = 0 | c0 (0, 100), c1 (0, 800), c2 (0, 50), c3 (1, 0) | 500; Anteil (0, 125) | Pass 1: c0 → (0, 0), Rest 400; c1 (0, 675), Rest 275; c2 → (0, 0), Rest 225; c3 (0, 875), Rest 100. Pass 2: c0 (0) zahlt 0; c1 −100 → (0, 575). |
| D: Gesamtgold zu knapp, t = 2 | c0 (0, 200), c1 (0, 300) | 580 > 500 | Meldung −21, Abbruch vor der ok-Leiste; kein Save-Byte ändert sich. |
| E: Borgen über die Tausendergrenze, n = 2, t = 14 | c0 (3, 100), c1 (0, 900) | 1060 = (1, 60); Anteil AE = (60 + 1000·1) div 2 = 530, AT = 0 | c0 (3, 100) → (2, 570); c1 (0, 370); Rest 0; Pass 2: c0 zahlt 0. |

Formel je Zahler im Normalfall: neu = alt − Anteil über T·1000 + E, danach zurück in (T, E) mit E ∈ 0..999.

## Grenzen
- **Esser-Gate:** Die Nahrung prüft HP 0x2d5c > 0 (0x0063f), die Zahlung prüft Klasse ≠ −1.
  - Eine belegte Figur mit HP ≤ 0 zahlt also mit, isst aber nicht (known).
  - Der Kit-Nahrungswriter prüft dagegen die Klasse (`original-tavern.ts` Z. 10). Eine solche Figur bekäme dort Nahrung.
- **Nahrung > 127:** Wird der Wert als vorzeichenbehaftetes Byte gelesen (`omaintc`), nimmt das Original den +40-Zweig, das Kit den 100-Zweig. Ob solche Werte vorkommen, ist unknown.
- **Zimmer, t = 14:** 2020 ergibt Tausender 1, Einheiten 1020 (nur ein Abzug). Diese Einheiten sind nicht normiert; das Zimmer liegt außerhalb dieses Vertrags.
- **Borgen:** Die Herleitung setzt ganzzahlige Division mit Abschneiden gegen 0 voraus (div/mod wie x86 `idiv`). Mit Abrundungsdivision würde das Borgen anders ausfallen (suspected: Abschneiden, wie es die Engine üblicherweise tut).
- **Gold-Einheiten ≥ 1000 im Save:** Den Fall prüft keine Normierung. Der Vergleich in `L_00b6f` setzt normierte Einheiten voraus (suspected: kommt nicht vor).
- **Nativ beobachtet** ist nur der Einzelzahlerfall t = 2. Mehrzahler-Fälle sind aus dem Code abgeleitet und nicht nativ abgenommen.

Keine SAV-Werte, Originalbytes, Dumps oder Profilwerte in diesem Bericht.
