# Native Abnahme: Tavernenzahlung mit mehreren Zahlern (Ishar 2)

Stand: 2026-11-16, ca. 08:25 (Europe/Berlin, CET). Hoth.
- **Prüfgegenstand:** `payOriginalTavernMeal` (mit `feedOriginalTavernParty` und `beginOriginalTavernMeal`/`finishOriginalTavernMeal`) in `src/lib/ishar/original-tavern.ts`, Kit-Tip `workbench/playable-slice` f2a77b9 (Mehrzahler 7aa9e34).
  - Das Kit lief unverändert als privater Kit-Export dieses Commits und wurde mit node v24 direkt ausgeführt (`--experimental-strip-types` implizit). Kein Kit- oder Codex-Kern-File wurde geändert.
- **Grundlage:** Queshs `taverne-payment-contract.md` und `ACCEPTANCE_STATUS.md` (Mehrzahlerabnahme dort als offen geführt).
- **Original:** Ishar 2, eigene Arbeitskopie (Byte-Kopie der Originale). DOSBox-X auf eigenem Xvfb, cycles fixed 25000, genau eine Instanz, nach der Sitzung beendet.
- **Datenschutz:** Keine Namen, keine Partyposition, keine Original-SAV-Werte. Patchwerte sind als „mit Patch“ markiert. Original-Werte stehen als SW-Referenz da. Hashes sind 12-Zeichen-Präfixe. Rohdaten, Screenshots und Diffs liegen nur privat (SW-TMP…).

## Aufbau
- **Basis:** Spielstand SW-S (sha `49c2bb82ca24`, unverändert). Die Party (5 belegte Plätze c0..c4) steht direkt vor der Taverne mit t = 2. Der Preis wird nativ als „580 po“ angezeigt und passt damit zu 500 + 40·2.
- **Patches:** Pro Fall ein neuer Slot mit Patch nur auf Gold T 1006+2c / E 1026+2c (BE16). In Fall 4 zusätzlich HP 996+2c, Klasse 1276+c und Nahrung 1326+c. Alle Patches sind mit sha256 vorher/nachher protokolliert (Kürzel TMPA…TMPG).
- **UI-Route** (Spielkoordinaten, 320×200; Fensteroffset (90,67), Maßstab 1:1):
  1. Laden
  2. Linksdrehung (266,30) zweimal
  3. Vorwärts (287,24), die Taverne öffnet sich
  4. „Essen“ (108,131): die Preisleiste mit ok/exit erscheint
  5. „ok“ (272,131): die Essensnachricht erscheint
  6. Klick auf die Nachricht (150,131): die Nachricht schließt sich
  7. EXIT (287,60)
  8. Speichern in einen neuen Slot
- **Reload:** Den Ergebnis-Save laden, nachdem vorher ein anderer Stand geladen war, und sofort in einen neuen Slot speichern. Danach wird die Byte-Diff geprüft.
- **Kit:** Dieselbe Eingabedatei geht durch `beginOriginalTavernMeal(…,2)` und dann `finishOriginalTavernMeal(…,2)`. Das ist die Kit-Folge aus OK und Schließen der Nachricht.
- **Vergleich:** vollständige Byte-Diff Eingang→nativ und nativ↔Kit.
  - **Relevanter Bereich:** HP 996–1005, Gold 1006–1035, Klasse 1276–1280, Nahrung 1326–1330.
  - **Uhr-Bytes 44–49:** Sie werden getrennt behandelt, weil der native Lauf Echtzeit verbraucht (etwa 43 s pro Spielstunde).

## Fall 1: gemischte Goldstände (TMPA)
Eingang mit Patch: (T,E) c0 (1,0), c1 (0,50), c2 (0,500), c3 (0,10), c4 (2,300). Es gilt n = 5, Anteil 116, Preis/n ohne Rest.
- **Pass 1:** c0, c2 und c4 zahlen den Anteil, c0 dabei mit Borgen über die Tausendergrenze. c1 und c3 zahlen alles.
- **Pass 2:** Es bleibt eine Restschuld von 172 aus den Fehlbeträgen. c0 deckt sie allein.

| Größe | Original nativ | Kit f2a77b9 | Gleich |
|---|---|---|---|
| Preis (Anzeige) | 580 po | 580 | ja |
| Gold c0 | (1,0)→(0,712), −288 | (0,712), paid 288 | ja |
| Gold c1 | (0,50)→(0,0), −50 | (0,0), paid 50 | ja |
| Gold c2 | (0,500)→(0,384), −116 | (0,384), paid 116 | ja |
| Gold c3 | (0,10)→(0,0), −10 | (0,0), paid 10 | ja |
| Gold c4 | (2,300)→(2,184), −116 | (2,184), paid 116 | ja |
| Writes im relevanten Bereich | 1007, 1026, 1027, 1029, 1031, 1033, 1034, 1035, 1326–1330 | identische Offsetliste | ja |
| Nahrung | Eingang SW-N0..N4 (Original, alle > 60): alle → 100 | alle → 100 | ja |
| HP/Klasse | unverändert | unverändert | ja |
| Reload | TMPAN→TMPAS (nach Zwischenladen): nur Uhr-Bytes 48–49; zweiter Reload TMPAR ebenso | – | – |

- Volle Datei nativ↔Kit: 60 Bytes verschieden.
  - Davon 2 in den Uhr-Bytes.
  - Die übrigen 58 liegen außerhalb des Tavernenbereichs (2786–7339).
- Diese 58 Bytes traten nur im ersten Lauf nach dem Booten auf. In den Fällen 2, 3 und 4 mit identischer Route kamen sie nicht vor. Beim Reload bleiben sie stabil.
- **Deutung, vermutet:** Welt- oder Akteurzustand aus dem Spielablauf, kein Tavernen-Write.
- **Verdikt Fall 1:** Zahlung und Nahrung stimmen bytegleich mit dem Kit überein (**bekannt**). Die Herkunft der 58 Fremdbytes ist **vermutet**.

## Fall 2: Restschuld in Pass 2, mehrere Beitragende (TMPB)
Eingang mit Patch: c0 (0,120), c1 (0,130), c2 (0,0), c3 (0,0), c4 (0,400). Es gilt n = 5, Anteil 116.
- **Pass 1:** c0, c1 und c4 zahlen den Anteil. c2 und c3 zahlen alles, also 0. Die Restschuld beträgt 232.
- **Pass 2:**
  - c0 zahlt alles (4), c1 zahlt alles (14).
  - c2 und c3 tragen 0 bei.
  - c4 deckt den Rest von 214.

| Größe | Original nativ | Kit | Gleich |
|---|---|---|---|
| Gold c0 | (0,120)→(0,0), −120 | (0,0), paid 120 | ja |
| Gold c1 | (0,130)→(0,0), −130 | (0,0), paid 130 | ja |
| Gold c2/c3 | (0,0)→(0,0) | (0,0), paid 0 | ja |
| Gold c4 | (0,400)→(0,70), −330 | (0,70), paid 330 | ja |
| Writes im relevanten Bereich | 1027, 1029, 1034, 1035, 1326–1330 | identisch | ja |
| Nahrung | SW-N (Original) → alle 100 | alle 100 | ja |
| Volle Datei nativ↔Kit | nur 3 Uhr-Bytes verschieden | – | ja (außer Uhr) |
| Reload | TMPBN→TMPBR: nur Uhr-Bytes | – | – |

- Bytes mit unverändertem Wert sind in einer Save-Diff nicht sichtbar. Dazu gehören der Null-Write bei c2/c3 und das Rückschreiben des Golds.
- Die Reihenfolge der Writes ist ohne Debugger nicht beobachtbar.
- **Verdikt Fall 2:** Endzustand bytegleich mit dem Kit (**bekannt**). Write-Reihenfolge und Null-Writes: **unbekannt**, kein Debugger.

## Fall 3: zu wenig Gold insgesamt, Summe 579 < 580 (TMPC)
Eingang mit Patch: c0 (0,200), c1 (0,100), c2 (0,50), c3 (0,100), c4 (0,129). Das ist eine Grenze genau 1 unter dem Preis.

| Größe | Original nativ | Kit | Gleich |
|---|---|---|---|
| Reaktion auf „Essen“ | keine Preis- oder ok-Leiste; sofort eine Ablehnungsmeldung (Wortlaut privat), die sich per Klick schließt | `{ok:false, reason:'insufficient-gold', price:580}`, kein Write | ja |
| Gold, Nahrung, HP, Klasse | unverändert (0 Writes im relevanten Bereich) | unverändert | ja |
| Uhr | Anzeige bleibt während der Meldung auf derselben Stunde. In den Fällen 1, 2 und 4 springt sie bei ok um 2. | kein Zeit-Write | ja (vermutet, siehe unten) |
| Volle Datei Eingang↔nativ | nur 3 Uhr-Bytes (Echtzeit) | – | – |
| Reload | TMPCN→TMPCR: nur Uhr-Bytes | – | – |

- **Verdikt Fall 3:**
  - Keine Writes und kein ok-Schritt (**bekannt**).
  - Dass die angezeigte Meldung TEXTIND −21 ist, ist **vermutet**. Ohne Debugger ist nur der Text sichtbar, nicht der Index.

## Fall 4: Figur mit HP ≤ 0 (TMPD) – nativ so nicht erreichbar
Eingang mit Patch: alle (0,200), HP c2 = 0, Nahrung 30/70/30/61/60. Die Klasse von c2 bleibt belegt (SW-K2).
- **Kit direkt auf diesem Eingang:**
  - n = 5, alle zahlen 116 → je (0,84).
  - Nahrung 70/100/30/100/100.
  - c2 zahlt mit und isst nicht, wie im Vertrag.
- **Original nativ (TMPDN):**
  - c0, c1, c3 und c4 zahlen je 145 → (0,55). c2 → (0,0), zahlt aber nichts, denn n = 4 und 4·145 = 580.
  - Nahrung 70/100/30/100/100.
  - **Klasse c2 → 255.**
  - Weitere Writes: 991 → 0, 1478 → 255, 7120 → 0, 8036 → 0.
- **Ursache, isoliert mit Zusatzläufen ohne Taverne:**
  - Laden plus sofort speichern (TMPDL), ebenso mit HP −1 mit Patch (TMPE → TMPEL): keine Änderung außer der Uhr.
  - Zwei Drehungen plus speichern (TMPDT): keine Umwandlung.
  - Ein einfacher Schritt weg von der Taverne plus speichern (TMPDF): **Umwandlung**. Klasse c2 → 255, Gold c2 → 0 und dieselben Bytes 991/1478/7120/8036.
  - Taverne betreten, ohne zu essen verlassen, speichern (TMPDX): Es tritt dieselbe Umwandlung auf.
- **Folgerung (bekannt für diese Route):**
  - Das Original wandelt eine belegte Figur mit HP ≤ 0 beim ersten Bewegungsschritt um: Klasse wird −1, Gold wird 0. Die Taverne ist nur über einen Schritt erreichbar.
  - Der Vertragsfall „belegt und HP ≤ 0 zur Zahlungszeit“ lässt sich deshalb per SAV-Patch nicht herstellen.
  - Das Gold der toten Figur wird **nicht** auf die anderen verteilt.
- **Kit gegen den echten Zustand zur Tavernenzeit:** Eingang TMPDX, also nach der Umwandlung. Ergebnis gegen TMPDN:

| Größe | Original nativ | Kit (Eingang TMPDX) | Gleich |
|---|---|---|---|
| Gold c0/c1/c3/c4 | (0,200)→(0,55), je −145 | (0,55), paid 145 | ja |
| Gold c2 (Klasse −1) | (0,0), zahlt nicht | (0,0), paid 0 | ja |
| Nahrung | 30→70, 70→100, c2 30→30, 61→100, 60→100 | identisch | ja |
| Volle Datei nativ↔Kit | nur 2 Uhr-Bytes | – | ja (außer Uhr) |
| Reload | TMPDN→TMPDR: nur Uhr-Bytes | – | – |

**Fall 4b, Gate-Trennung nativ (TMPF):** c2 mit Klasse 255 (mit Patch), HP > 0 (mit Patch auf SW-HP2), Gold (0,200), Nahrung 30.
- **Original:**
  - c2 zahlt nicht, n = 4, die anderen je −145.
  - **c2 isst trotzdem:** 30 → 70.
- **Kit:** bytegleich, nur die Uhr weicht ab (Nahrung 70/100/70/100/100, Gold 55/55/200/55/55).
- **Reload:** TMPFN→TMPFR, nur Uhr-Bytes.
- **Bedeutung:**
  - Zahler-Gate (Klasse) und Esser-Gate (HP) sind auch nativ getrennt.
  - Die Klasse ist kein Esser-Gate. Das passt zum Kit-Korrekturstand.

**Verdikt Fall 4:**
- **Nicht nativ abnehmbar:** „HP ≤ 0 zahlt mit, isst nicht“. Auf dem Weg zur Taverne wird die Figur in einen Nicht-Zahler umgewandelt (**bekannt** für Schritt und Taverneneingang).
- Statisch bleibt der Fall aus Queshs Vertrag gültig (**vermutet** für das Original, weil der Zustand nativ nicht erreichbar ist).
- Für den tatsächlich erreichbaren Zustand ist das Kit bytegleich (**bekannt**). Das gilt für 4 und 4b.
- **Abweichung am Rand, vermutet:** Im Kit-Quellcode gibt es keine Todesumwandlung beim Bewegungsschritt. Gefunden sind nur `hp<=0`-Guards in Inventar-, Stapel- und Boden-Runtimes.
  - Würde das Kit einen solchen SAV direkt in die Taverne führen, zahlte c2 mit (n = 5, je 84). Das Original verlangt dagegen n = 4, je 55, Gold c2 0.
  - Das ist kein Fehler von `payOriginalTavernMeal`, sondern ein fehlender vorgelagerter Schritt. Im Browser ist es nicht geprüft.

## Uhr (alle Fälle)
- Die Uhr-Bytes 44–49 im nativen Save enthalten Echtzeit. Deshalb gibt es keinen Bytevergleich mit dem Kit (**unbekannt**).
- **Beobachtung:**
  - Die Stundenanzeige springt bei ok um +2 (Fälle 1, 2 und 4). In Fall 3 bleibt sie stehen.
  - Das passt zur Kit-Folge: Stunde +1, Tick 999, und der erste Tick nach dem Schließen rollt auf die nächste Stunde (**vermutet**).

## Gesamtzusammenfassung pro Punkt (kein Gesamt-Grün)
| Fall | Nativ gelaufen | Save/Reload | Kit-Vergleich | Verdikt |
|---|---|---|---|---|
| 1 gemischt | ja | ja, stabil | Gold/Nahrung bytegleich | bekannt; 58 Fremdbytes vermutet Weltzustand |
| 2 Restschuld Pass 2 | ja | ja, stabil | bytegleich außer Uhr | bekannt; Write-Reihenfolge unbekannt |
| 3 zu wenig Gold | ja | ja, stabil | keine Writes beidseitig | bekannt; Meldungsindex −21 vermutet |
| 4 HP ≤ 0 | ja, aber Zustand nicht erreichbar | ja, stabil | bytegleich auf dem erreichbaren Zustand; Kit fehlt vermutlich die Todesumwandlung | Vertragsfall nativ nicht abnehmbar |
| 4b Klasse −1, HP > 0 | ja | ja, stabil | bytegleich außer Uhr | bekannt: isst, zahlt nicht |

## Hashes (12-Zeichen-Präfix)
- **Eingänge (mit Patch):** TMPA `ea67d04f1100`, TMPB `8adbe9c74163`, TMPC `5238de58bc47`, TMPD `9cd405e0924e`, TMPE `4443ab5678bc`, TMPF `06d84dee2838`
- **Nativ:**
  - TMPAN `54da756e1ee7`, TMPAR `8e2616798f22`, TMPAS `b47f0611f93d`
  - TMPBN `45f8f785d32d`, TMPBR `72be297400c8`
  - TMPCN `ed5518a8dab9`, TMPCR `e5c96bcb2adc`
  - TMPDN `2764ab3eba2f`, TMPDR `0d3d340fde44`
  - TMPDL `2e91eb2b80f5`, TMPDT `2206b5dc9c56`, TMPDX `fb810a78c9df`, TMPDF `d758e54f1e1c`
  - TMPEL `7a638375683b`
  - TMPFN `093ebbcb2f31`, TMPFR `2e199b61ef90`
- **Kit:** TMPA `168fc5397366`, TMPB `927cbc02c6e4`, TMPD (direkt) `00d7fc220631`, TMPDX `c448635d54e4`, TMPF `7ed71f4f8e77`
- **Basis und Originale:** SW-S sowie alle 311 Originaldateien sind vorher und nachher hash-identisch.

## Offene Punkte
1. **Write-Reihenfolge und Null-Writes:** Die Reihenfolge Pass 1 → Pass 2 → Nahrung und das Rückschreiben unveränderter Werte lassen sich nativ nur mit Debugger oder Speicher-Trace belegen. Das DOSBox-X auf der Box hat keinen Debugger.
2. **Meldungsindex −21:** Ohne Debugger nicht direkt belegt, nur der sichtbare Ablehnungstext.
3. **Todesumwandlung beim Schritt:** Klasse → −1, Gold → 0, Bytes 991/1478/7120/8036.
   - Die Semantik der vier Zusatzbytes ist unbekannt.
   - Dass das Kit diesen Schritt nicht nachbildet, ist vermutet. Das wäre ein eigener Kit-Punkt außerhalb der Tavernenzahlung.
   - Ob es einen anderen Weg gibt, mit belegter HP-≤-0-Figur zu zahlen (etwa Tod in der Taverne), ist unbekannt.
4. **Nicht geprüft:**
   - Preis ≥ 1000 (t ≥ 13, Tausender-Anteil im Preis) und Division mit Rest (n = 3/4 mit Rest). Andere Tavernenzellen sind nicht erschlossen.
   - Fall „Summe = Preis genau“. Er ist statisch als ausreichend belegt, nativ aber nicht gelaufen.
5. **Die 58 Fremdbytes aus Fall 1** sind nur einmal aufgetreten. Ihre Ursache ist nicht isoliert (vermutet Weltzustand).
6. **DOSBox-Verzeichniscache:** Extern angelegte Saves sieht das Spiel erst nach einem spielinternen Speichern („File nicht gefunden“). Umgangen wurde das mit dem Wegwerf-Slot TMPZ1. Das ist ein Werkzeughinweis, kein Spielbefund.
