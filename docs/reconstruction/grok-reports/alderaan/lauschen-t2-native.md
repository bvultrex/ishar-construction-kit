# Ishar 2: Taverne „Lauschen“ t2 (TEXTIND 102) nativ geprüft

Stand: 2026-11-16, Kit-Stand `f2a77b9` (eigener Klon, nur gelesen, `git status` leer). Nichts committet. Ohne Save-Patch.

## Kit-Erwartung (Code-Suche im aktuellen Stand)

- **Ort und Zone:** Taverneneingang auf Karte 3 (CONT3). Der Kit-Fixture startet an der Straßenzelle vor der Taverne. Wer gegen die Tavernenzelle vorwärts geht, löst Ereignis 17 aus. Ein Layer-B-Betrag 1..15 bedeutet Taverne t = |B| − 1, hier t = 2.
- **Bedingung:** Für Tavernen gibt es keine Tageszeitprüfung. Die Nachtschließung gilt nur für Händler (Bereich 17..39).
- **Aktion:** Button 1 „Lauschen“ im Tavernenmenü.
- **Erwartetes Verhalten:**
  - Nachricht 100 + t = **102**.
  - Text-Beleg nur für t = 2.
  - Eigene Nachrichtenphase bis zum Schließen, danach zurück ins Tavernenmenü.
  - **Kein persistenter Write.** Fixture: `persistentWrites 0`.
- **Fundstellen:**
  - `original-tavern-dialogue.ts` (`originalTavernRumour`)
  - `playtest.tsx` (`listenOriginalTavern`, `closeOriginalTavernRumour`, Eintritt über `originalShopEntry`)
  - `prepare-original-tavern-listen-browser.mjs` (Fixture)
  - `check-original-tavern-dialogue(-local).mjs`
  - Abschnitt „Lauschen“ in `TAVERN_MEAL_CONTRACT.md`
- **Kit-Tests:** Selector-Test und hashgebundener lokaler Prüfer bestehen. Der lokale Prüfer lief gegen eine hash-geprüfte Arbeitskopie.

## Original-Code (Gegenprobe in den Listings)

- **TAVERNE 0x0010b:** Ein Klick wird nur ausgewertet, wenn
  - ein Button gewählt ist,
  - kein Objekt am Mauszeiger hängt (0x2d16 = 0),
  - und ein Flag aus FRISE nicht gesetzt ist (0x2ab7 = 0).
- **Button 1 (0x00150):** startet TEXTIND mit 100 + t und schläft. Es wird keine Hauptvariable geschrieben.
- **TEXTIND, Fall 102:** fester vierzeiliger Text ohne weitere Bedingung.
- **MAIN 0x03169:** öffnet die Taverne ohne Tagesphasenprüfung.

## Native Läufe

Eigene DOSBox-X-Instanz, Original-EXE auf einer Arbeitskopie, Deutsch. Start ist der vorhandene Ishar-2-Zwischen-Save an der Straße vor der Taverne, ohne Patch. Neue Saves haben Nur-Buchstaben-Namen. Neue Saves wurden nach einem DOSBox-Reboot geladen.

| Lauf | Ablauf | Saves |
|---|---|---|
| A | Laden → Save vorher → zweimal links, vorwärts (Taverne t2 öffnet) → Lauschen → Text → Schließklick → Ausgang → Save nachher | LTA → LTB |
| C (Kontrolle) | wie A, gleiche Verweildauer in der Taverne, aber **ohne** Lauschen | LTC → LTD |
| B | DOSBox-Reboot → LTB laden → Save vorher → Taverne → **zweimal** Lauschen → Ausgang → Save nachher | LTE → LTF |

## Ergebnis

- **Auslösung: ja**, in allen drei Lauschen-Vorgängen (A einmal, B zweimal).
  - **Bedingung:** Taverne t2 geöffnet (Vorwärts gegen die Tavernenzelle). Danach ein Linksklick auf Button 1, ohne gehaltenes Objekt.
  - **Zeitpunkt:** Der Text erscheint sofort, im ersten 5-fps-Frame nach dem Klick (< 0,5 s). Im Frame davor ist nur der Button hervorgehoben.
  - Der Text bleibt ohne Eingabe stehen (nach 13 s noch offen). Erst ein Klick schließt ihn. Dieser Klick wird verbraucht und löst im Menü nichts aus.
  - Wiederholtes Lauschen im selben Besuch zeigt denselben Text.
- **Textindex 102:** Der angezeigte Text entspricht wortgleich dem Kit-Text und dem TEXTIND-Fall 102 (**stimmt**). Der Wortlaut liegt nur privat vor.
- **Persistente Writes: keine.**
  - **A (vorher → nachher):** nur 3 Bytes, Uhr (Stunde, Tick).
  - **B (vorher → nachher, zweimal Lauschen):** nur dieselben 3 Uhr-Bytes.
  - **C (Kontrolle ohne Lauschen):** dieselben 3 Uhr-Bytes plus 1 Byte im Akteurbereich. Das ist Akteur-Rauschen, weil es auch ohne Lauschen auftritt.
  - Party, Gold, Inventar, Nahrung, Position und Blickrichtung sind unverändert. Die Blickrichtung wird beim Verlassen wie bekannt umgekehrt und steht danach wieder wie vor dem Eintritt.
  - CONT1–7 unverändert.
- **Abgrenzung:**
  - Die Uhr läuft in Echtzeit weiter, auch während die Textrolle offen ist. Die Stunde rückte in A wie in der Kontrolle um eine vor. Das kommt nicht vom Lauschen.
  - Die Akteur-Neuwürfelung tritt jeweils beim Laden auf (Laden → Save vorher) und liegt damit außerhalb des Messfensters.
  - Gemessen wurde bei Tag. Laut Code gibt es keine Tageszeitbedingung; nativ bei Nacht ist das nicht geprüft.
- **Reload:** LTB lädt nach einem DOSBox-Reboot normal. Lauf B baut darauf auf.

## Vergleich mit dem Kit

| Punkt | Kit | Original | Bewertung |
|---|---|---|---|
| Auslösung | Button „Lauschen“ im Tavernenmenü t2 | Button 1, Klick | **stimmt** |
| Text-Index | 102 (100 + t) | 102, Text wortgleich | **stimmt** |
| Writes | keine (`persistentWrites 0`) | keine; nur Uhr, Akteur-Rauschen wie in der Kontrolle | **stimmt** |
| Zeitpunkt / Phase | eigene Nachrichtenphase bis zum Schließen, danach Menü | sofort nach dem Klick, bleibt bis zum verbrauchten Schließklick, danach Menü | **stimmt** |
| Ort | Fixture: Straßenzelle vor der Taverne, Taverne t2 über Ereignis 17 | gleich | **stimmt** |
| Vorbedingung „kein Objekt am Zeiger, FRISE-Flag 0“ | nicht modelliert (im Kit kann man mit gehaltenem Objekt ohnehin nicht laufen) | im Code vorhanden, nativ nicht provoziert | offen, ohne praktische Abweichung beobachtet |
| Uhr während der Textrolle | keine Echtzeituhr im Browser | läuft weiter | erwartete Plattformgrenze, kein Lauschen-Write |

**Label:** Auslösung, Textindex 102, Zeitpunkt und „kein persistenter Write“: **belegt (nativ, ohne Patch)**. Nachtvariante und Zeiger-Vorbedingung: **nur Code**.

## Risiken

- Akteur-Rauschen und Uhr sind zufalls- bzw. zeitabhängig. Die Abgrenzung beruht auf Vorher/Nachher-Saves im selben Lauf plus Kontrolllauf. Ein einzelnes Akteurbyte trat nur in der Kontrolle auf.
- Nur Taverne t2 und nur bei Tag. Andere Tavernen (101..110) wurden nicht nativ geprüft.
- Eingaben laufen über Automatik. Jeder Schritt wurde per Bildschirmfoto bestätigt, verlorene Klicks traten nicht auf.

## Regeln eingehalten

Nur Arbeitskopien, Originale hash-identisch, kein Kampf, Kampf-Icon nicht berührt, nur die eigene Emulator-Instanz beendet, keine Kerndateien geändert, nichts committet, kein Save-Patch. Öffentlich stehen keine Save-Werte, keine Palettenwerte und kein Textwortlaut.
