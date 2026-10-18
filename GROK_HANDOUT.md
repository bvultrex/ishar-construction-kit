# Ishar Construction Kit – Projektübergabe an Grok

**Stand: 10. Oktober 2026.** Dieses Dokument fasst Zielsetzung, bisherige Arbeit, belegte Erkenntnisse, den aktuellen Code und die nächsten Aufgaben zusammen. Maßgeblich ist der **lokale Checkout** auf Branch `workbench/playable-slice`. Die Arbeitskopie war vor dieser Übergabe 30 Commits vor `origin/workbench/playable-slice`; GitHub allein bildet den Stand daher nicht vollständig ab. Vor einer Fortsetzung bitte `git status -sb` und `git log -1 --oneline` im übergebenen Checkout prüfen.

## 1. Ziel und Arbeitsprinzip

Das Produkt soll ein **Construction Kit für neue Ishar-artige Rollenspielabenteuer** werden: Gebiete und mehrere Ebenen erstellen, passende originale beziehungsweise selbst importierte Grafiksets zuordnen, Räume, Gänge und offene Außenwelt modellieren, Figuren und Gegenstände verwalten und das Ergebnis als begehbaren First-Person-Crawler testen. Die anfangs vorhandene Savegame-Forschung und die Character/File Labs bleiben ein eigener Kompatibilitätsstrang. Das Produkt ist weder bloß ein Save-Editor noch eine Veröffentlichung der Originalspiele.

Die verbindliche Regel lautet **„Audit first, edit second“**. Originaldateien und Skript-/Video-Beobachtungen sind von CK-Rekonstruktionen zu trennen. Die Begriffe `known`, `suspected`, `unknown` im Belegregister und `confirmed`, `probable`, `possible`, `unknown` bei Dateifeldern dürfen nicht vermischt werden. Dekodierte Pixel und konkrete Ressourcen-IDs können gesichert sein, ohne dass ihre ursprüngliche Position, Zeichenreihenfolge oder Spielregel gesichert ist. Das vorhandene lokale Ishar-Material bleibt außerhalb von Git und wird nicht mit dem Kit verteilt.

## 2. Technische Ausgangslage

- Repository: `https://github.com/bvultrex/ishar-construction-kit`, lokaler Branch `workbench/playable-slice`. **Der lokale Branch ist dem Remote voraus.** Keine Aussage über den neuesten GitHub-Stand aus diesem Dokument ableiten.
- Lokaler Checkout beim Verfassen: `D:\Downloads\ishar-construction-kit-playable-slice (2)\repository`.
- Stack: TypeScript, React 19, TanStack Router/Start, Vite 8, Zustand, JSZip; Node.js 22.18+ beziehungsweise 24 LTS. `package-lock.json` ist maßgeblich.
- Wichtige Einstiege: `src/routes/author.tsx` (Builder), `src/routes/playtest.tsx` (Crawler und UI), `src/routes/assets.tsx` (Asset Lab), `src/lib/ishar/project.ts` (Starterprojekt/Migration), `src/lib/ishar/types.ts` (Projektmodell), `src/lib/ishar/ishar-auto-import.ts` (Originalasset-Zuordnung), `src/lib/ishar/alis-assets.ts` (Grafikdekodierung), `src/lib/ishar/dungeon-scenes.ts` und `room-surfaces.ts` (Dungeon-Geometrie), `src/lib/ishar/swamp-view.ts` und `swamp-area.ts` (Sumpf), `src/lib/asset-store.ts` und `asset-cache.ts` (lokale Asset-Persistenz).
- Die App hat die Routen Overview, Character Lab, File Lab, Knowledge, Project, Adventure Builder, Asset Lab und Playtest. Die Originalarchive werden lokal im Browser importiert; generierte Vorschaubilder/Metadaten liegen im IndexedDB-Cache. Ein optionaler lokaler Server kann mit `ISHAR_LOCAL_ZIP` eine vom Benutzer bereitgestellte ZIP beim Start automatisch laden.
- `dist/` und `node_modules/` sind Build-/Installationsprodukte. Die laufende Vorschau ist kein eigener Quellstand. Bereits geöffnete Tabs behalten altes JavaScript, bis sie neu geladen werden; ein Reload setzt die momentane Playtest-Position zurück.

## 3. Erreichte Meilensteine in Arbeitsreihenfolge

1. **Wiederherstellung aus Grok-Export (25.09.2026):** Der verlorene Ausgangsstand aus `GROK files.zip` wurde als eigenständiges Git-Projekt rekonstruiert. Die Ishar-1/2-Save-Kandidatenkarten, binäre Inspektion, Silmarils-Packer-Vorarbeit, lokaler ZIP-/Dateikatalog, Character Lab mit kopierendem Byte-Patch und die App-Shell wurden wieder lauffähig. Bei Save-Patches bleiben unbekannte Bytes erhalten; Figurennamen sind bis zur Offset-Verifikation nur Projekt-Overlays.
2. **Spielbarer Vertikalschnitt:** Adventure Builder, Projektvalidierung, JSON-Export/-Reimport und Playtest wurden verbunden. Auf Nutzerfeedback wurde der zunächst textlastige Ablauf zu einem **rasterbasierten First-Person-Crawler** korrigiert: Drehen und schrittweise Bewegung per WASD/Pfeilen, Wände/Abzweige, Türen, Gegner, Quest, Inventar und fünf Parteiplätze.
3. **Original-Asset-Pipeline:** Ishar-1/2-Archive können lokal klassifiziert und ALIS-Grafiken samt Paletten und 0xFF-Kompositen extrahiert werden. Die falschen roten Vorschaubilder wurden durch kontextabhängige Palettenwahl korrigiert. Asset Lab bietet Suche, Gruppenfilter und Seiten statt eines harten Galerie-Limits; Haus-, UI- und glyphenartige Grafikgruppen sind sichtbar. Komposite sind zusammengesetzte Szenengrafiken, keine frei kachelbaren Wandtexturen. Gleiche Abmessungen der DJ1/DJ2-Komposite bedeuten keine Duplikate; deren Kind-Pixel unterscheiden sich.
4. **Dungeon-Szenen:** DJ1- und DJ2-Wandfamilien wurden für vier Entfernungen zugeordnet; FDJ-Bodenstreifen und solide Hintergründe/Decken, originale offene Türumrandungen und DJ1-Seitendurchgänge kamen hinzu. Die anfängliche Silhouetten-Streckung verursachte eine abfallende Wellenlinie; sie wurde für aktuelle Original-Dungeon-Szenen durch Quellmaße und Skript-Tiefenwerte ersetzt. Offene Bögen sind Originalgrafiken, **geschlossene Türblätter weiterhin gezeichnete Platzhalter**. DJ1 #114–119 sind Lampen und DJ2 #77–80 Buntglas – nicht die gesuchten Türblätter.
5. **Räume, Durchgänge, Ebenen:** Builder erstellt verbundene rechteckige Raumblöcke von 2×2 bis 5×5, offene Außenweltfelder und mehrere benannte Ebenen mit getrennten Koordinaten, Szenentypen und Assetsets. Portale verbinden Ebenen bidirektional; alte Projekte migrieren zu `level-1`. Der Raumrenderer unterdrückt Innenwände auch bei älteren manuell verbundenen Räumen sowie bei unterschiedlich gruppierten, aber offen verbundenen Raumfeldern. Vorderwände laufen über benachbarte Felder weiter. Ein Durchgang an einer entfernten seitlichen Raumkante und die richtige seitliche Türansicht sind noch offen.
6. **Sumpf-Testgebiet auf Irvans Insel:** Ein separates 5×5-Außenwelt-Preset nutzt die lokal decodierten `FOND1`, `PLAINE1` und `FORET1`-Grafiken. Gras ersetzt den früheren Thorm-artigen Vordergrund; graues Wasser belegt unpassierbare Felder und blendet weich in Gras/Horizont aus. Bäume und Pflanzen hängen an deterministischen Weltpunkten; für Bäume wurden zwei verifizierte `FORET1`-Distanzfamilien ausgewählt, Fremd-Kronen entfernt, Wurzeln am Boden verankert und Wiederholungen benachbarter großer Bäume reduziert. Kamera, Sichtbarkeit am eigenen Standort, Baumverdeckung, Dichte und exakte Distanzschwellen bleiben **CK-Heuristiken**, keine wiedergewonnene ALIS-Zeichenroutine.
7. **Funktionsfähige Teil-UI:** Originale `FRISE.IO`-Action-/Life-Grafiken sind in der Parteizeile eingebunden. Die fünf Menübereiche, Karte, Aufgaben, Kampf- und Türaktion sind bedienbar. Klick auf einen Namen öffnet ein Charakterblatt; Klick auf ein Porträt öffnet im Normalzustand dessen Gepäck. Pro Figur gibt es neun Slots, Besitzerzuordnung, Beschreibung, Übergabe an andere Figuren und Schlüsselverwendung an passender Tür. Das Layout wurde mit Gameplay und Handbuch verglichen, ist aber noch keine vollständige Original-UI: Ausrüstung, Zauber, weitere Statusseiten, Porträtgrafiken und `MAIN.IO`-Bitmap-Schrift sind offen.
8. **Bodengegenstand „in der Hand“ – jüngster Stand:** Ein Gegenstand im aktuellen Feld lässt sich direkt in der Szene oder über den Aufheben-Knopf anklicken. Er verschwindet am Boden und seine Grafik folgt dem Mauszeiger. Noch ein Linksklick auf den ursprünglichen Fundort legt ihn zurück; Escape beziehungsweise der Kontextknopf ebenso. Solange er gehalten wird, stehen Drehung/Bewegung still. Linksklick auf ein lebendes Charakterporträt weist ihn dessen Inventar zu, **ohne das Inventarfenster zu öffnen**; anschließend gibt es keine Bodenablagefunktion für inventarisierte Gegenstände. Ein transparenter 64×52-Trefferbereich macht auch den winzigen Sonnenschlüssel anklickbar. Die 16×4-Originalgrafik wird für die Handanzeige pixelig vergrößert. Kampfzustand und Neun-Slot-Grenze gelten weiterhin.

## 4. Was durch Befund gedeckt ist – und was nicht

| Bereich | Gesichert beziehungsweise praktisch geprüft | Noch Rekonstruktion oder ungeklärt |
| --- | --- | --- |
| Assetformat | Lokale ALIS-Ressourcentabellen, Kind-Pixel, Palettenpaare und Komposit-IDs; mehrere Skript-Ausdrücke für Wandfamilien und Tiefenwerte wurden untersucht. | Vollständige originale Zeichenfolge für alle Szenen, Kameraursprung und Licht-/Tageszustände. |
| DJ1/DJ2-Korridor | Die bekannten Wände, FDJ-Bodenstreifen, offenen Türumrandungen und Seitensäulen ergeben einen begehbaren CK-Dungeon. | Geschlossene Originaltürblätter, Türanimation, seitliche Raumtür, Dekorpositionen und genaue Entfernungsskalierung. |
| Karten/Räume | CK-Konnektivität und 4×4-Raum-Topologie werden durch Regressionen geprüft. Die vom Nutzer verlinkte Rasterkarte zeichnet feste Mauern als ganze Kästchen. | Ob und wie die Originaldaten *immer* ein separates unpassierbares Mauerfeld zwischen Gang und Raum kodieren; CK-Raumprojektion ist keine 1:1-Engine-Kopie. |
| Irvan-Sumpf | Originalgrafikgruppen und zwei `FORET1`-Distanzserien wurden identifiziert; Wasserblockade und weiche Darstellung funktionieren im Testgebiet. | Originale Baumanker, Zeichenreihenfolge, Verdeckung, Distanzen, Paletten-/Tageswechsel und Vegetationsverteilung. |
| UI/Inventar | Menü-, Slot-, Besitzer-, Kampf-, Schlüssel- und Mausaufnahmefluss sind im CK funktional. | Originales vollständiges HUD, Ausrüstung, Zauber, Statistiklogik und Bitmap-Font-Kodierung. |
| Save-/Weltformate | Kopierende Save-Patch-Architektur und begrenzte Decoder-Tests existieren. | Kandidaten-Offsets brauchen echte kontrollierte Save-Differenzen; `.FIC`, NPC-/Quest-/Dialog-Schemata sind nicht komplett dekodiert. |

Wichtig: Die **seitliche DJ1-Raumnische #71/#72 wurde vom Nutzer als falsche Türtextur zurückgewiesen**. Sie darf nicht als bestätigte Lösung bezeichnet werden. Die Hypothese eines blockierenden Mauerfelds rechtfertigt auch keine automatische Änderung der vorhandenen begehbaren Projektkarte.

## 5. Konkreter aktueller Prüfstand

Am 10.10.2026 liefen im lokalen Checkout `npm run typecheck`, `npm run test:a1`, `npm run test:palettes`, `npm run test:scenes`, `npm run test:world` und `npm run build` erfolgreich. Der letzte interaktive Browser-Test der neuen Aufnahmebedienung erfolgte im isolierten Playtest auf Port 4177 mit dem echten lokal importierten Ishar-2-Pack: Runenstein aufgehoben, am Zeiger bewegt, am Fundort abgelegt und per Porträt zugewiesen. Danach wurde die Standardroute über Kreuzgang, Wächterhalle und Nordgang bis zum Sonnenheiligtum gespielt. Der Sonnenschlüssel ließ sich ebenfalls aufheben, zurücklegen und Figur 2 zuweisen; die Spielansicht blieb bei der Inventarübernahme sichtbar. Der Nutzer-Builderstand auf Port 4175 wurde dabei nicht editiert. Browser-Playtestzustand ist flüchtig, während Projekt und Assetcache lokal im Browser persistieren.

**Nicht mit der GitHub-Kopie verwechseln:** Der oben genannte Funktionsstand liegt im lokalen Branch. Falls Grok nur den Remote klont, fehlen die vorausgegangenen lokalen Commits. Der Übergabeschritt muss daher den lokalen Checkout oder einen ausdrücklich aktualisierten Remote-Branch umfassen. Es wurde hier kein Remote-Push behauptet.

## 6. Reproduzierbarer Einstieg für Grok

```powershell
cd 'D:\Downloads\ishar-construction-kit-playable-slice (2)\repository'
git status -sb
git log -1 --oneline
npm ci
npm run typecheck
npm run test:a1
npm run test:palettes
npm run test:scenes
npm run test:world
npm run build
node scripts/serve-build.mjs
```

Ohne andere Portvorgabe läuft die Produktionsvorschau auf `http://127.0.0.1:4173`. Für Entwicklung mit Hot Reload: `npm run dev` und die von Vite ausgegebene Adresse. Ein eigener Test-Origin ist für Änderungen an Projekt-/Browserdaten sinnvoll. Das optionale `ISHAR_LOCAL_ZIP` darf auf ein **lokal vorhandenes, vom Benutzer bereitgestelltes** Archiv zeigen; der Server bietet diese Datei nur auf Loopback als Bootquelle an. Keine Originalarchive, extrahierten Assets, fremden Manuals oder Videos committen. Cache pro Origin/Browserprofil beachten.

Eine kurze manuelle End-to-End-Probe im Starter-Dungeon: Runenstein in der Krypta anklicken, Zeigerbewegung und Zurücklegen prüfen, erneut aufnehmen und per Porträt zuweisen (Spielansicht muss offen bleiben); über Kreuzgang/Wächterhalle zum Nordgang gehen, Wächter besiegen und die Runenstein-Tür öffnen; im Sonnenheiligtum denselben Aufnahmefluss mit dem kleinen Sonnenschlüssel prüfen. Bei UI-Änderungen auch volles Inventar, besiegte Figur und Neustart testen. Für Raum-/Sumpfänderungen eigene Testprojekte nutzen und denselben Weltpunkt aus mehreren Richtungen vergleichen.

## 7. Priorisierte Fortsetzung

1. **Aktuelle UI-Schiene abschließen:** Den nun funktionierenden „in der Hand“-Fluss an weiteren Originalgegenständen, vollem Gepäck und ungewöhnlichen Eingabewegen prüfen; übrige `FRISE.IO`-Kontrollen und `MAIN.IO`-Glyphen anhand belegter Originalansichten katalogisieren. Weitere Charakterseiten erst mit realen Spielregeln ausbauen. Langlebige Browser-Tabs sollten einen nicht störenden Build-Hinweis erhalten, statt still auf altem JavaScript zu bleiben.
2. **Dungeon-Tür und Raumgrenzen:** Den **wirklichen** seitlichen Tür-/Raumübergang aus Originalskript und Gameplay herleiten. Geschlossene DJ1- und DJ2-Türblätter über Zeichencode oder bislang nicht identifizierte Ressourcen finden. Durchgänge, Boden-/Deckenanschluss und Sicht auf entfernte laterale Raumkanten in mehreren Distanzen abgleichen. #71/#72 nicht ohne neue Belege erneut als Lösung ausgeben.
3. **Ebenen und feste Rasterzellen:** Optionales Modell für unpassierbare Ganzfeld-Mauern anhand der Kartenhypothese entwerfen und in einem separaten Testlevel gegen Tür- und Raumsicht prüfen. Vorhandene Nutzerkarte nicht automatisch umschreiben. Haus-/Außenwelt-Assetsets und große Maps auf Basis verifizierter Ressourcen ausbauen; Portale und Levelmigration erhalten.
4. **Irvan-Sumpf:** Dieselben Bäume aus mehreren benachbarten Feldern und Blickrichtungen mit Originalaufnahmen vergleichen. Nah-Verdeckung, abgeschnittene Wurzeln, Fern-Größen und Vegetationsdichte bleiben Prüfaufgaben. Bestätigte Wasseroptik stabil halten; Thorm-Assets nicht erneut in den Irvan-Sumpf mischen.
5. **Spätere Kompatibilitätsschiene:** Reale Ishar-2-Saves mit reproduzierbaren Vorher/Nachher-Diffs untersuchen, dann Ishar 1 und Welt-/Text-/Questformate. Keine vermuteten Offsets als gesichert deklarieren. Für ein echtes 1.0 braucht der Builder außerdem robusten Export eines spielbaren eigenständigen Projekts statt nur JSON-Projektdateien.

## 8. Quellen und Detailprotokolle

Die ausführliche Chronik steht in [HANDOFF.md](HANDOFF.md), der jeweilige Produktstand in [PROJECT_STATE.md](PROJECT_STATE.md), die Prioritäten in [NEXT_STEPS.md](NEXT_STEPS.md), Originalformat-/Ressourcenbelege in [AUDIT.md](AUDIT.md) und [DUNGEON_ASSET_EVIDENCE.md](DUNGEON_ASSET_EVIDENCE.md), das Importmodell in [ASSET_PACK.md](ASSET_PACK.md). Diese Dateien enthalten auch verworfene Hypothesen und Versionsmigrationen, die nicht in einer Kurzfassung verloren gehen sollten.

Vom Nutzer gelieferte visuelle Referenzen: [Ishar-2-Playthrough](https://www.youtube.com/watch?v=T8xhKR4Gz98&list=PLk4TlbSQ2rXhPXnOhTMFu5oqOiX_a4twx), [geschlossene DJ1-Tür bei 0:10](https://www.youtube.com/watch?v=FOFb6Nt0mE8&t=10s), [Irvan-Sumpf](https://www.youtube.com/watch?v=Xf3QzHE4byM&list=PLC698061B3F758948&index=5) und [Ollivision-Komplettlösung mit Karten](https://www.ollivision.de/kl/i/ishar2.htm). Die Belegdateien nennen weitere genaue Zeitstempel und ihre Grenzen. Die Videos zeigen Bildverhalten, liefern aber weder automatisch Dateizuordnungen noch einen vollständigen Quellcode der Originalengine.
