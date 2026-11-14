#!/usr/bin/env python3
"""Hoth 14.11.2026: Bereinigungsaudit fuer diesen Ordner und den Bericht.
(1) Kein sha256 eines Originals im Text; (2) keine Datei identisch mit einem Original;
(3) kein 12-Byte-Fenster (>=3 Nicht-Null-Bytes, >=4 verschiedene Werte) der Dateien kommt in einer Originaldatei
    oder einer optionalen privaten Speicheraufnahme vor (Pfade per Argument);
(4) keine Hex-Folge mit mehr als 12 Zeichen (Hash-/Commit-Laenge)."""
import hashlib, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); W = 12
roots = ['/workspace/ishar/originals']; extra = sys.argv[1:]
orig = [os.path.join(d, f) for r in roots for d, _, fs in os.walk(r) for f in fs] + extra
files = [os.path.join(HERE, f) for f in sorted(os.listdir(HERE)) if os.path.isfile(os.path.join(HERE, f))]
rep = os.path.join(os.path.dirname(HERE), 'opcode75-graphic-record-fixtures.md')
if os.path.exists(rep): files.append(rep)
cand = {}
for p in files:
    b = open(p, 'rb').read()
    for i in range(len(b) - W + 1):
        w = b[i:i + W]
        if sum(1 for x in w if x) >= 3 and len(set(w)) >= 4: cand.setdefault(w, os.path.basename(p))
txt = b''.join(open(p, 'rb').read() for p in files).lower(); fsha = {hashlib.sha256(open(p, 'rb').read()).hexdigest() for p in files}
fail = 0
for p in orig:
    data = open(p, 'rb').read(); h = hashlib.sha256(data).hexdigest()
    if h.encode() in txt: print('SHA im Text:', p); fail += 1
    if data and h in fsha: print('Datei identisch mit Original:', p); fail += 1
    for i in range(len(data) - W + 1):
        if data[i:i + W] in cand: print('gemeinsames Fenster', cand[data[i:i + W]], '<->', p, hex(i)); fail += 1; break
for p in files:
    for m in re.finditer(rb'(?<![0-9a-fA-F])[0-9a-fA-F]{13,}(?![0-9a-fA-F])', open(p, 'rb').read()):
        print('Hex-Folge > 12 Zeichen:', os.path.basename(p), m.group()[:16]); fail += 1
print('Originale/Aufnahmen:', len(orig), 'Dateien:', len(files), 'Fenster:', len(cand), 'Treffer:', fail); sys.exit(1 if fail else 0)
