#!/usr/bin/env python3
"""Checks that the fixtures contain no original bytes: (1) no sha256 of an original/save as text,
(2) no fixture file equals an original, (3) no 12-byte window (with >=3 non-zero bytes) of the fixture files
or of any synthetic save buffer occurs (trivial windows with <4 distinct byte values,
e.g. space runs or a zero run plus one item code, are counted separately) in an original file or a save under dosbox/ishar2*."""
import hashlib, json, os, glob, sys
HERE=os.path.dirname(os.path.abspath(__file__)); W=12
roots=['/workspace/ishar/originals']+glob.glob('/workspace/ishar/dosbox/ishar2*')
orig=[os.path.join(d,f) for r in roots for d,_,fs in os.walk(r) for f in fs]
files=[os.path.join(HERE,f) for f in sorted(os.listdir(HERE)) if os.path.isfile(os.path.join(HERE,f))]
fx=json.load(open(os.path.join(HERE,'contract-fixtures.json')))
def mk(fields):
    b=bytearray(8359)
    for f in fields or []:
        if 'be16' in f: b[f['offset']]=(f['be16']>>8)&255; b[f['offset']+1]=f['be16']&255
        else: b[f['offset']]=f['u8']&255
    return bytes(b)
blobs={os.path.basename(p):open(p,'rb').read() for p in files}
for v in fx['vectors']:
    if 'save' in v['input']: blobs['buffer:'+v['id']]=mk(v['input']['save'])
cand={}; triv={}; trivhits=set()
for name,b in blobs.items():
    for i in range(len(b)-W+1):
        w=b[i:i+W]
        if sum(1 for x in w if x)>=3: (cand if len(set(w))>=4 else triv).setdefault(w,name)
print('Originale/Saves:',len(orig),'Fixture-Dateien:',len(files),'synth. Puffer:',sum(1 for k in blobs if k.startswith('buffer:')),'Fenster:',len(cand))
txt=b''.join(open(p,'rb').read() for p in files).lower()
fail=0; fsha={hashlib.sha256(open(p,'rb').read()).hexdigest() for p in files}
for p in orig:
    data=open(p,'rb').read(); h=hashlib.sha256(data).hexdigest()
    if h.encode() in txt: print('SHA im Text:',p); fail+=1
    if data and h in fsha: print('Datei identisch mit Original:',p); fail+=1
    for i in range(len(data)-W+1):
        w=data[i:i+W]
        if w in cand: print('gemeinsames Fenster',cand[w],'<->',p,hex(i),w.hex()); fail+=1; break
        if w in triv: trivhits.add((triv[w],w.hex()))
print('triviale Fenster (<4 verschiedene Bytewerte) mit Treffern:',sorted(trivhits))
print('Treffer:',fail); sys.exit(1 if fail else 0)
