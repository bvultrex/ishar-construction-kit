# Direkte DOS-ALIS-Sprünge

Stand 2026-10-17. `src/lib/ishar/original-alis-branch.ts` liest und retargetiert bestehende direkte Sprünge, Aufrufe und Resume-Adressen. Kein vollständiger Bytecodedecoder, keine Ausführung und keine automatische Codeverlagerung.

## Kodierung und Herkunft

Gruppen 0x05..07 (cjsr), 0x08..0A (cjmp), 0x12..14 (cbz), 0x15..17 (cbnz), 0x18..1A (cbeq), 0x1B..1D (cbne), 0x30..32 (cstart) haben jeweils 8/16/24-Bit-Distanzen. Ziel=Adresse nach dem Distanzfeld + vorzeichenbehaftete little-endian Distanz. Loops mit zusätzlichen Storeoperanden, indirekte/absolute Sprünge und Rückkehr-/Stack-/Schedulerzustände sind nicht enthalten.

Die 8-/16-Bit-Handler der separaten ALIS-C-Referenz und die Originalbytes stützen diese Adressierung. Im Referenzhandler ist cbeq semantisch ein Sprung bei D7!=D6 und cbne bei D7==D6. Der kleine Bedingungsadapter hält dies ausdrücklich fest; er verwendet keine intuitive Namensumdeutung. Register sind signed16. cstart stellt in der Referenz einen Resumezustand ein, es ist kein sofortiger normaler Sprung; der Decoder liefert nur das kodierte Ziel und die Art.

Wichtige Referenzgrenze: `mem.c:_read_le24/_read_be_24` behandelt Werte oberhalb 0x7FFFFF mit `(result << 8) & 0xff`. Dies ist keine korrekte signed24-Erweiterung. In den untersuchten Originalstellen gibt es keine negativen 24-Bit-Distanzen; sie belegen die Grenzsemantik daher nicht. Der Reader beschreibt signed24 als strukturelle Listinginterpretation. Der Writer verweigert neue negative 24-Bit-Ziele bis zum nativen Nachweis; vorhandene unveränderte Kodierungen bleiben no-op-erhaltbar. Das ist bewusst keine Übernahme eines fehlerverdächtigen Referenzpfads als Originalwahrheit.

## Schreiben und Grenzen

`editDosAlisBranchTarget` kopiert das Image, ändert ausschließlich vorhandene Distanzbytes, prüft Wertebereich und zurückgelesenes Ziel. Opcode und Größe bleiben erhalten. Ziel muss im Image liegen; seine Instruktionsgrenze und Spielsemantik muss der Aufrufer separat verifizieren. Keine Behauptung, dass ein strukturell passender Patch im Spiel sinnvoll oder vollständig kompatibel ist. Call-/Resume-Nebenwirkungen sind nicht implementiert.

## Tests mit beiden Originalprofilen

Synthetisch: 21 Opcode-/Breitenkombinationen, signierte kurze Rückwärtssprünge, positive 24-Bit-Änderungen, Bedingungsregister, No-op-/Restore-Bytegleichheit, Eingabegrenzen und Ablehnung neuer negativer 24-Bit-Ziele.

Vorhandene Listings gegen jeweilige Originaldateien:

| Profil | Module mit geprüften Stellen | direkte Zweige | negative 24-Bit-Zweige | Fehler |
|---|---:|---:|---:|---:|
| Ishar 1 DOS lokal | 94 | 10616 | 0 | 0 |
| Ishar 2 DOS lokal | 140 | 13348 | 0 | 0 |

Je Stelle Opcodeart, Breite, vollständiges Ziel und byteidentischer No-op geprüft. Pro betroffenem Modul zusätzlich eine gezielte Distanzänderung mit IO-Pack-/Unpack-Readback und Wiederherstellung der originalen Containerbytes. Der lokale Bericht `analysis-output/branch-profiles-2026-10-17/branch-profiles.json` hält Dateinamen, Größen und SHA256 getrennt nach Spiel fest; keine Originalbytecodes. Originale wurden nicht verändert.

Reproduktion: `npm run test:original-alis-branch`; für `test:original-alis-branch-profiles` dieselben vier Variablen wie beim Switchprofiltest (ISHAR1_DIR, ISHAR2_DIR, ISHAR1_LISTINGS, ISHAR_ACTOR_LISTINGS) setzen. Optional einen neuen, separaten Berichtordner als Argument übergeben; vorhandene Berichte werden nicht überschrieben.

Die Zähler beziehen sich auf bereits ausgewiesene Listingstellen. Nicht gelistete/fehlinterpretiert unerreichbare Daten oder Funktionen sind dadurch nicht erschlossen. Kein Vollständigkeits-, Binäridentitäts- oder DOS-Ausführungsnachweis.

## Zählschleifen cloop

`original-alis-loop.ts` liest cloop8/16/24 mit skalarem alocb/alocw/adirb/adirw-Zähler. Referenz `opcodes.c:cloop` setzt D7=-1, merkt sich PC unmittelbar nach dem Distanzfeld, führt den Addoperanden aus und prüft dessen Zero-Flag. Bei nichtnull wird PC auf diese gemerkte Basis zurückgesetzt und die Distanz addiert. Nur beim Ende läuft PC hinter dem Zähleroperanden weiter. Daher dürfen Sprungbasis und Fallthrough nicht gleichgesetzt werden. Der missverständliche Quellkommentar „if ... zero ... jump“ beschreibt die Bedingung umgekehrt; der Handler selbst prüft `!alis.sr.zero`.

`addnames.c` setzt für die vier unterstützten skalaren lokalen/direkten Formen das Zero-Flag anhand des gespeicherten Bytes/Worts. Der reine Schrittadapter liefert den um eins verminderten Bitwert, Zero und Folgeziel. 0 läuft zu 255/65535 über und springt weiter; 1 wird 0 und beendet die Schleife. Andere Addoperanden werden nicht über Symmetrie geraten, da einige Referenzhandler das Zero-Flag nicht aktualisieren. Negative Kontextadressen können strukturell gelesen werden, sind im Figurenadapter ohne vollständigen VM-Kontext aber abgewiesen.

Der bestehende Figureninterpreter verwendet diesen Schrittadapter und setzt nach dem skalaren Loop D7-Bedingung auf -1 entsprechend dem Originalhandler. Synthetische Drei-Iterations-Skripte prüfen alle vier Zählerformen bis zur Ausgabe. Dies erweitert den begrenzten Interpreter, ersetzt keinen vollständigen VM-/Register-/Schedulerabgleich.

Alle 76 in vorhandenen Listings ausgewiesenen Originalschleifen wurden direkt binär auf Distanzbreite, Ziel und Counteroffset/-breite geprüft: Ishar 1 26 (13 adirb, 9 alocb, 4 adirw); Ishar 2 50 (29 adirb, 7 alocb, 11 adirw, 3 alocw). Die native 24-Bit-Grenzsemantik bleibt wie oben offen. Keine vollständige Loop-Erreichbarkeit oder Originalausführung nachgewiesen.

Reproduktion: `npm run test:original-alis-loop`; mit den vier Profilvariablen aus dem Zweigtest zusätzlich beide Originalbestände. `test:original-actor-frame` prüft die Integration. Originale werden nur gelesen.
