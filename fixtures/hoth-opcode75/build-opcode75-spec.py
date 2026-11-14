#!/usr/bin/env python3
"""Hoth 14.11.2026: erzeugt die synthetischen Startzustaende/Eingaben fuer Opcode 75 (cerasen, Byte 0x4B).
Keine Originalbytes: alle Adressen, Nummern und Bildschirm-IDs sind frei gewaehlt.
Datensatz (synthetisch abstrahiert): state s8 @+0, num s8 @+1, screen u16 @+2, next u16 @+4, link u16 @+6.
Kontext: head = Kontextwort -0x18, screenId = Kontextwort -0x16.
Global: free = Kopf Freiliste, ferase = Flagbyte, linkHeads[screen] = Kopf der +6-Kette je Bildschirm-ID."""
import json, sys
R = lambda k: 0x30 * k  # synthetische Datensatzadressen 0x30, 0x60, ...
def rec(k, state, num, screen, nxt, link=0): return {"addr": R(k), "state": state, "num": num, "screen": screen, "next": R(nxt) if nxt else 0, "link": R(link) if link else 0}
def chain(*ks):  # verkettet Datensaetze in Listenreihenfolge (next)
    return ks
S = 0x40  # synthetische Bildschirm-ID des aktiven Kontexts
def base(recs, head, free=0, ferase=0, links=None, screen=S):
    return {"head": R(head) if head else 0, "screenId": screen, "free": free, "ferase": ferase,
            "linkHeads": {str(k): v for k, v in (links or {}).items()}, "records": recs}
def lin(specs, screen=S, link_all=True):
    """specs: Liste (k, state, num[, screen]) in Listenreihenfolge; next wird verkettet, link-Kette gleich Reihenfolge je screen."""
    recs = []; per = {}
    for i, sp in enumerate(specs):
        k, st, num = sp[:3]; sc = sp[3] if len(sp) > 3 else screen
        nxt = specs[i + 1][0] if i + 1 < len(specs) else 0
        recs.append(rec(k, st, num, sc, nxt)); per.setdefault(sc, []).append(len(recs) - 1)
    links = {}
    if link_all:
        for sc, idx in per.items():
            links[sc] = recs[idx[0]]["addr"]
            for a, b in zip(idx, idx[1:]): recs[a]["link"] = recs[b]["addr"]
    return recs, links
V = []
def add(id_, case, desc, state, ops, label="known"):
    V.append({"id": id_, "case": case, "description": desc, "start": state, "input": {"ops": ops}, "label": label})
ob = lambda n: {"operand": "oimmb", "value": n}
ow = lambda n: {"operand": "oimmw", "value": n}
# Basisliste: drei Datensaetze, sortiert nach num absteigend (gleiche screen)
three = [(1, 0, 9), (2, 0, 5), (3, 0, 2)]
r, l = lin(three); add("E01", "vorhanden-mitte", "Vorhandener Datensatz (num 5) in der Mitte, state 0", base(r, 1, links=l), [ob(5)])
r, l = lin(three); add("E02", "erster", "Erster Eintrag (Kopf, num 9), state 0", base(r, 1, links=l), [ob(9)])
r, l = lin(three); add("E03", "letzter", "Letzter Eintrag (num 2), state 0", base(r, 1, links=l), [ob(2)])
r, l = lin(three); add("E04", "fehlend", "Fehlender Datensatz: num 7 liegt zwischen 9 und 5", base(r, 1, links=l), [ob(7)])
r, l = lin(three); add("E05", "fehlend", "Fehlender Datensatz: num 1 kleiner als alle", base(r, 1, links=l), [ob(1)])
r, l = lin(three); add("E06", "fehlend", "Fehlender Datensatz: num 12 groesser als alle", base(r, 1, links=l), [ob(12)])
add("E07", "leer", "Leere Liste (Kopf 0)", base([], 0), [ob(5)])
r, l = lin([(1, 0, 5)]); add("E08", "einzeln", "Einziger Eintrag wird entfernt", base(r, 1, links=l), [ob(5)])
r, l = lin(three); add("E09", "doppelt", "Doppeltes Entfernen: zweimal num 5 nacheinander", base(r, 1, links=l), [ob(5), ob(5)])
r, l = lin([(1, 0, 9), (2, 0, 5), (3, 0, 5), (4, 0, 2)]); add("E10", "duplikat", "Zwei Datensaetze mit gleicher num 5: ein Aufruf entfernt beide", base(r, 1, links=l), [ob(5)])
r, l = lin([(1, 0, 5), (2, 0, 5), (3, 0, 5)]); add("E11", "duplikat", "Drei gleiche num 5: Liste danach leer", base(r, 1, links=l), [ob(5)])
# state negativ -> Freiliste + Link-Kette
r, l = lin([(1, 0, 9), (2, -128, 5), (3, 0, 2)]); add("E12", "state-negativ", "state 0x80 (negativ): Datensatz wandert in die Freiliste, Link-Kette wird angepasst", base(r, 1, free=0x0F00, links=l), [ob(5)])
r, l = lin([(1, -1, 9), (2, 0, 5), (3, 0, 2)]); add("E13", "state-negativ", "state -1 am Kopf, zugleich Kopf der Link-Kette", base(r, 1, links=l), [ob(9)])
r, l = lin([(1, 0, 9), (2, 0, 5), (3, -1, 2)]); add("E14", "state-negativ", "state -1 am Ende, letzter der Link-Kette", base(r, 1, links=l), [ob(2)])
r, l = lin([(1, 0, 9), (2, 1, 5), (3, 0, 2)]); add("E15", "state-positiv", "state 1 (bereits markiert): wird erneut nur ausgehaengt", base(r, 1, links=l), [ob(5)])
r, l = lin([(1, 0, 9), (2, 127, 5), (3, 0, 2)]); add("E16", "state-positiv", "state 127: Markierung auf 1, keine Freiliste", base(r, 1, links=l), [ob(5)])
# ferase-Flag
r, l = lin(three); add("E17", "ferase", "Flag ferase=1 vor dem Aufruf: Freilistenpfad trotz state 0, Flag danach 0", base(r, 1, free=0x0F00, ferase=1, links=l), [ob(5)])
r, l = lin(three); add("E18", "ferase", "Flag ferase=1, num fehlt: nur Flag wird 0", base(r, 1, ferase=1, links=l), [ob(7)])
# Bildschirm-IDs (sortiert absteigend)
r, l = lin([(1, 0, 5, S + 4), (2, 0, 5, S), (3, 0, 5, S - 4)]); add("E19", "fremder-screen", "Gleiche num auf drei Bildschirm-IDs: nur die eigene wird entfernt", base(r, 1, links=l), [ob(5)])
r, l = lin([(1, 0, 5, S - 4)]); add("E20", "fremder-screen", "Nur kleinere Bildschirm-ID vorhanden: Suche bricht ab, nichts entfernt", base(r, 1, links=l), [ob(5)])
r, l = lin([(1, 0, 5, S + 4)]); add("E21", "fremder-screen", "Nur groessere Bildschirm-ID vorhanden: Ende der Liste, nichts entfernt", base(r, 1, links=l), [ob(5)])
# Sortierannahme verletzt
r, l = lin([(1, 0, 2), (2, 0, 5)]); add("E22", "unsortiert", "Unsortierte Liste: num 2 vor num 5 -> Suche bricht bei 2 ab, num 5 bleibt", base(r, 1, links=l), [ob(5)])
# Operandenbreite / Vorzeichen
r, l = lin(three); add("E23", "operand", "oimmw 0x0105: nur das Lowbyte (5) zaehlt", base(r, 1, links=l), [ow(0x0105)])
r, l = lin([(1, 0, 5), (2, 0, -1), (3, 0, -128)]); add("E24", "operand", "Vorzeichenbehaftete num: oimmb(-1) findet num -1 hinter num 5", base(r, 1, links=l), [ob(-1)])
r, l = lin([(1, 0, 5), (2, 0, -1), (3, 0, -128)]); add("E25", "operand", "oimmw 0x00FF ergibt dl=0xFF = -1", base(r, 1, links=l), [ow(0x00FF)])
r, l = lin([(1, 0, 9), (2, 0, 5), (3, 0, 2)], screen=0x8004); add("E26", "screen-vorzeichen", "Bildschirm-ID >= 0x8000 (signed negativ), eigener Kontext gleich", base(r, 1, links=l, screen=0x8004), [ob(5)])
# Link-Kette: Datensatz nicht am Kopf der +6-Kette
r, l = lin([(1, 0, 9), (2, 0, 7), (3, -128, 5)]); add("E27", "link-mitte", "state negativ, Datensatz ist drittes Glied der Link-Kette", base(r, 1, links=l), [ob(5)])
# Inkonsistenz: negativer state, aber nicht in Link-Kette
r, l = lin([(1, 0, 9), (2, -128, 5)], link_all=False); l = {S: R(1)}
add("E28", "inkonsistent", "state negativ, Datensatz fehlt in der Link-Kette (Kette: nur 0x30, link 0): Original haengt in 3B75..3B7B", base(r, 1, links=l), [ob(5)])
# Wiederholung: drei Aufrufe nacheinander erster/mitte/letzter
r, l = lin(three); add("E29", "folge", "Folge: num 5, dann 9, dann 2 -> Liste leer", base(r, 1, links=l), [ob(5), ob(9), ob(2)])
r, l = lin(three); add("E30", "folge", "Folge mit negativem state nach ferase: erst ferase-Pfad, danach Normalpfad", base(r, 1, free=0, ferase=1, links=l), [ob(9), ob(2)])
json.dump({"schema": "hoth-opcode75-spec/1", "vectors": V}, sys.stdout, indent=1)
print()
