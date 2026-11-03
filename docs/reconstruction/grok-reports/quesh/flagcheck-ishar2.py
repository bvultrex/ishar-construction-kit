#!/usr/bin/env python3
"""Read Ishar 2 quest flags from .SAV files (IO.IO layout; BE16 words, value in low byte).
usage: python3 flagcheck-ishar2.py A.SAV [B.SAV]   (two files -> diff)"""
import sys
F=[('0x4f13',20),('0x4fbd',26),('0x4fbe',28),('0x4fc0',32),('0x4fc1',34),('0x4fc4',40),('0x4fc5',42),('0x50a5',70)]
def rd(p):
    b=open(p,'rb').read(); return {a:(b[o]<<8|b[o+1]) - (65536 if b[o]&0x80 else 0) for a,o in F}
a=rd(sys.argv[1])
if len(sys.argv)<3:
    for k,v in a.items(): print(k,v)
else:
    b=rd(sys.argv[2])
    for k in a: print(k,a[k],'->',b[k],'' if a[k]==b[k] else '  CHANGED')
