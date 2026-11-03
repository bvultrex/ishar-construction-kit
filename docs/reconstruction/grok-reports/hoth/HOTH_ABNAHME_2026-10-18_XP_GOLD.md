# Ergänzung: XP-/Gold-Savepaar Ishar 2 im Original (Hoth), 18.10.2026

Auftrag von Cupero, 18.10. 16:20; bearbeitet 16:20–16:45 Europe/Berlin (MESZ). Format wie `HOTH_ABNAHME_2026-10-18.md` (Handoff-Punkte 1–7).
Private Dateien liegen unter `/workspace/ishar/codex-support/hoth/private/xpgold/`.
Nichts committet, nichts gepusht. Nicht angefasst: Codex-Prüfer, local-repo, Saschas PC und fremde DOSBox-Instanzen.

## 1. Basis, Profil, Versionen
- **Toolkit:** Clone `/workspace/ishar/clones/hoth`, Commit 319819c (detached), Node v24.22.0.
- **Original:** Ishar 2 DOS, deutsch, `/workspace/ishar/originals/ishar2/Ishar2`.
  - start.exe: 5e35e58d…340dadf9
  - IO.IO: 0df1f34c…6b5918
- **Ausgangssave:** GRIMZEL.SAV (8359 B, sha256 4b42d32b6a682bb71cd112d7a30d172114bf13117c63ad5d5fee76e57884d3bf).
  - Karte 5, r53 c16, Gruppe Eliandr, Bragl, Noegh, Bron, Molgo.
- **Emulator:** DOSBox-X 2025.02.01 SDL2 (Debian 2025.02.01+dfsg-3), Xvfb 2:21.1.16 auf eigenem Display :97, xdotool 3.20160805.1, Pillow 12.3.0.
- **conf:** `private/dosbox-x-auto2-xpgold.conf` (sha256 5315f2d7…0aa8d), eine Kopie von `dosbox/dosbox-x-auto2.conf`. Geändert sind nur:
  - die beiden mount-Zeilen auf die Arbeitskopie;
  - **ab 16:34 `cycles=fixed 25000` statt `cycles=max 80%`**, wegen der CPU-Last-Meldung von Alderaan (Werte laut `alderaan/private/run_notes.md`).
- **Läufe vor der Umstellung:** Laden der Varianten, Panels, Bogen, HOTREF sowie die ungültigen HOTXCS/HOTGLS/HOTXBS liefen mit `cycles=max 80%`. Die Instanz (pid 57262, nur eigene) wurde per SIGKILL beendet.
- **Läufe nach der Umstellung:** Die Roundtrips HOTXC2 und HOTGL2 laufen mit `fixed 25000`. Pro Lauf wird eine eigene Instanz gestartet und danach per SIGKILL beendet; am Ende wurde auch Xvfb :97 beendet.

## 2. Fragestellung
Sind die Quesh-Angaben (suspected) zu XP, Gold, Level und HP richtig? Lassen sich Gold- und XP-Varianten mit dem Toolkit sauber erzeugen und im Original laden? Löst XP über der Schwelle einen Level-up aus? Gehört Gold einem Charakter oder der Gruppe?

## 3. Befehle und Exitcodes
Jeweils `cd /workspace/ishar/clones/hoth; PATH=<node24>:$PATH`, danach `npm run -s save:main -- patch <IO.IO> <GRIMZEL.SAV> <writes.json> <neue .SAV>`:

| Variante | writes.json | Exit | `cmp -l` GRIMZEL gegen Ausgabe (einsbasiert, oktal) | sha256 Ausgabe |
|---|---|---|---|---|
| (a) HOTGLD, Gold Eliandr 12 345 | `[{"address":11624,"width":2,"value":12},{"address":11648,"width":2,"value":345}]` (0x2d68 Tausender, 0x2d80 Rest) | 0 | 1008: 0→14 (=12); 1027: 0→1; 1028: 0→131 (0x0159=345) | c742e442…f1f1 |
| (b) HOTXPB, XP Eliandr 600 (unter Schwelle) | `[{"address":11600,"width":2,"value":600}]` (0x2d50) | 0 | 988: 33→130 (0x021b→0x0258) | 30a7757e…f1f1 |
| (c) HOTXPC, XP Eliandr 620 (über Schwelle) | `[{"address":11600,"width":2,"value":620}]` | 0 | 988: 33→154 (0x026c) | d3e15a9f…e5 |

Die Report-`changedOffsets` sind [1007,1026,1027], [987] und [987]: **nur die beabsichtigten Bytes**. Alle Werte sind BE16 (High-Byte zuerst).

**Arbeitskopie:** `private/xpgold/work-20261018-1621`, frisch per `cp -a` aus den Originalen. Die drei Varianten kamen mit `cp -n` hinein.

**Ablauf im Original** (Skripte in `private/xpgold/`):
1. Boot (KP_3, 20× space, KP_2).
2. Laden über `hoth_load.sh` (Disk-Icon, LOAD, Name, Return).
3. Parameter-Panel: zweites Icon über jedem Portrait, Spielkoordinate (22+64·i, 131).
4. Charakterbogen: Klick auf den Namen (30,193).
5. Speichern in einen **neuen** Namen über `savenew.sh` (Disk-Icon, SAVE (232,55), Name, Return). Das Skript bricht ab, wenn die Datei schon existiert.
6. Roundtrip je Variante: `rt_session.sh <SAVE> <NEU>`.

**Unversehrtheit:**
- Originale (311 Dateien) sind vorher und nachher hashgleich; ebenso alle 435 .SAV unter `dosbox/ishar2*` (`private/xpgold/{originals,saves}-{vorher,nachher}.sha`).
- In der Arbeitskopie sind nur neue Dateien dazugekommen: HOTREF, HOTXCS, HOTGLS, HOTXBS, HOTXC2, HOTGL2 (`work-vorher.sha` gegen `work-nachher.sha`).

## 4. Adressen und Datenvertrag
Selbst nachgeprüft mit `python3 decompile/repro/save_layout.py <addr>` aus der IO.IO-Laderoutine:
- 0x2d50 liegt bei Byte 986, Block 10 B.
- 0x2d68 bei 1006 (10 B), 0x2d80 bei 1026 (10 B).
- 0x2eb6 bei 1291 (5 B).
- 0x2d5c bei 996 (10 B).

Also 5 Charaktere zu je 2 B, beim Level 1 B pro Charakter.

GRIMZEL dekodiert:
- XP [539, 615, 473, 667, 546]
- Level [13, 14, 12, 14, 13]
- HP (996) [87, 176, 108, 145, 114]; Byte 1016 hat dieselben Werte
- Gold-Tausender [0, 132, 0, 0, 0], Gold-Rest [0, 345, 0, 0, 0]

Die Formel round(√(0,3·XP)) passt bei allen 5 GRIMZEL-Charakteren zum gespeicherten Level (rechnerisch).

**Speichern im Original ohne Änderung** (GRIMZEL laden → HOTREF): Es ändern sich nur 3 Byte, Offset 45 (0x4fc6, 6→7) und 48–49 (0x4fca). Das sind Spielzeitfelder (die HUD-Anzeige „17 · 6“ entspricht 0x4fc6). Alle anderen 8356 Byte bleiben gleich.

## 5. Ergebnis je Punkt

| # | Punkt | Urteil | Beleg |
|---|---|---|---|
| 1 | Offsets XP 986, Gold 1006/1026, Level 1291, HP 996 | **known** (Layout aus Listing plus Anzeige im Original) | save_layout.py; Panels und Bogen |
| 2 | XP-Anzeige = XP×100 | **known**: Die Referenz-Panels zeigen 53900/61500/47300/66700/54600 = 100 × [539,615,473,667,546]. HOTXPB zeigt 60000, HOTXPC 62000 (Panel und Bogen „Erfahrung“) | `ref_panels_zoom.png`, `HOTXPB_panels.png`, `HOTXPC_sheet.png`. „Max 10000“ nicht geprüft |
| 3 | Gold = Tausender·1000 + Rest | **known**: Die Referenz zeigt bei Bragl „gold 132345“ (132/345). HOTGLD zeigt bei Eliandr „gold 12345“ (Panel, zusätzlich als Zahl im Bogen) | `ref_panels_zoom.png`, `HOTGLD_sheet.png` |
| 4 | Gold-Zuordnung | **known: pro Charakter**, nicht für die Gruppe. Es gibt ein eigenes Feld je Charakterindex, jedes Panel zeigt den eigenen Wert, nur Bragl bzw. nach dem Patch nur Eliandr ist ≠ 0. Eine Gruppensumme wird nirgends angezeigt | wie 3 |
| 5 | Level-up beim Laden mit XP über Schwelle | **widersprochen für Laden und Speichern**: HOTXPC (XP 620, Formel ergibt 14) zeigt im Bogen weiterhin **Level 13**. Nach Speichern im Original (HOTXC2) ist Byte 1291 weiterhin 13 | `HOTXPC_sheet.png`; `cmp` HOTXPC gegen HOTXC2 |
| 6 | Level-up beim nächsten XP-Gewinn (FRISE 0x060e0 nach 0x05846/0x0585d) | **offen**, nicht getestet (dafür ist ein Kill im Spiel nötig) | – |
| 7 | Roundtrip: Laden, Speichern in neuen Slot, Bytevergleich | **known**: HOTXC2 gegen HOTXPC und HOTGL2 gegen HOTGLD unterscheiden sich nur in 0x4fca (Bytes 49/50, Spielzeit). XP 620 bzw. Gold 12/345 bleiben byte-genau erhalten | `cmp -l` (2 Byte je Datei) |
| 8 | HP 996 / maxHP 1016 | HP 996: **known** (Bogen „Vitalität 87“ = Eliandr HP 87). maxHP 1016: **offen**, weil in GRIMZEL HP = maxHP, also ununterscheidbar; keine Variante getestet | `ref_sheet_Eliandr.png` |
| 9 | Variante (b) XP unter Schwelle | **known**: geladen, Anzeige 60000. Level wie erwartet unverändert (laut Bogen nicht erneut abgelesen; Byte 1291 ist im Save unverändert) | `HOTXPB_panels.png` |

**Fehlläufe, ehrlich vermerkt:**
- HOTXCS, HOTGLS und HOTXBS sind **ungültig**. Das Laden vor dem Speichern hat nicht gegriffen: Die Panels zeigten noch die GRIMZEL-Werte, und die Dateien enthalten den GRIMZEL-Zustand mit fortgeschrittener Zeit.
- Zusätzlich ist dort Byte 91/93 (0x519f/0x51a0, unteres Byte) von 2 auf 1 gefallen. Vermutlich ist das ein UI- bzw. Panelzustand (suspected).
- Außerdem gilt: Bei offenem Charakterbogen wird das Laden ignoriert (beobachtet zweimal).
- Die gültigen Wiederholungen HOTXC2 und HOTGL2 sind jeweils in einer neuen Instanz gelaufen, mit Warmlauf GRIMZEL, Panelnachweis vor dem Speichern (`rt2_HOTXPC_panel.png` zeigt 62000) und Speichern in neuen Namen.

## 6. Grenzen und nächster Schritt
**Verglichen:**
- Bytes Ein- gegen Ausgabe (Toolkit) und Ein- gegen Original-Save (Roundtrip).
- Bildschirmwerte der Panels und des Bogens gegen die Referenz GRIMZEL in derselben Instanz.

**Nicht verglichen:**
- RAM-Zustand.
- Level-up über ein echtes XP-Ereignis.
- Gold beim Handel bzw. Geben (FRISE 0x046ac, MARCHAND 0x004b8).
- maxHP.
- Gold-Rest ≥ 1000 bzw. Überlauf; XP-Maximum.
- Andere Saves bzw. Charaktere als Eliandr.

**Nächster Schritt:**
- Level-up-Test: einen Kampf mit Kill auf HOTXPC ausführen und in einen neuen Slot speichern. Erwartet wird Byte 1291 = 14 sowie HP-Gewinn über FRISE 0x06668.
- Gold-Abzug im Original beim Kauf mit HOTGLD prüfen.
- Save-Writer: Hinweis ergänzen, dass Level beim Laden nicht neu berechnet wird.

## 7. Codevorschlag
Keiner.
