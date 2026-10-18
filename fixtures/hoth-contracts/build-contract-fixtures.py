#!/usr/bin/env python3
"""Generator for contract-fixtures.json (Hoth, 18.10.2026).
Expected values are written literally from the observed runs or computed here in Python
(independent second implementation); the Node checker computes them in its own reference model.
No original bytes: saves are sparse synthetic field lists (base = 8359 zero bytes)."""
import json, os
H='HOTH_ABNAHME_2026-10-18_'
Q='quesh/'
V=[]
def v(id,contract,status,source,input,expected,note=None):
    if 'save' in input: input['save']=[{'offset':0,'be16':2}]+input['save']  # format marker 2 (kit checks it)
    d=dict(id=id,contract=contract,status=status,source=source,input=input,expected=expected)
    if note: d['note']=note
    V.append(d)
def be(off,val): return {'offset':off,'be16':val}
def by(off,val): return {'offset':off,'u8':val}

# ---------------- 1 pickup (Ishar 2) ----------------
C='pickup-ishar2'
SRC_P=Q+'pickup-contract-ishar2.json/.md (SOURIS/FRISE); alderaan run_pickup.md, REFERENCES.md §8'
base_obj9=[by(345,7),by(545,25),by(736+9,1)]  # synthetic: object 9 on map 1 at r7 c25 (values artificial)
VIEW={'map':1,'row':6,'col':25,'facing':2}  # party one cell in front of it (for kit adapters)
v('P01',C,'suspected',SRC_P+'; PICK9A (Alderaan)',
  {'save':base_obj9,'view':VIEW,'ops':[{'op':'floorPickup','obj':9},{'op':'dropPortrait','char':0}]},
  {'changes':{'345':0,'545':0,'745':0,'1037':9},'held':0},'Variante A: erster freier Rucksackplatz c0 s0 = Save 1036/1037 (cmp 1037/1038)')
v('P02',C,'suspected',SRC_P+'; PICK9B (Alderaan)',
  {'save':base_obj9,'view':VIEW,'ops':[{'op':'floorPickup','obj':9},{'op':'dropHand','char':0,'slot':10}]},
  {'changes':{'345':0,'545':0,'745':0,'1057':9},'held':0},'Variante B: Handplatz 10 = 1056/1057; Rüstung 1336 bleibt (armour(9)=0)')
v('P03',C,'suspected',SRC_P,
  {'save':base_obj9+[be(1036,0xffe7),be(1038,0xffef)],'view':VIEW,'ops':[{'op':'floorPickup','obj':9},{'op':'dropPortrait','char':0}]},
  {'changes':{'345':0,'545':0,'745':0,'1041':9},'held':0},'erster freier Platz 0..8: s0,s1 belegt -> s2 = 1040/1041 (künstliche Belegung)')
v('P04',C,'suspected',SRC_P+'; PICKR (Alderaan); Quesh Gegenprobe CH1N->CH2N',
  {'save':[be(1056,0xffe7),by(1336,4)],'ops':[{'op':'handPickup','char':0,'slot':10},{'op':'dropHand','char':1,'slot':10}]},
  {'changes':{'1056':0,'1057':0,'1086':0xff,'1087':0xe7,'1336':0,'1337':4},'held':0},'Transfer -25 von c0 Hand 10 zu c1 Hand 10: Rüstung wandert 4 mit')
v('P05',C,'suspected',SRC_P+'; PICKQ->PICKS (Alderaan)',
  {'save':[be(1056,0xffe7),by(1336,4)],'ops':[{'op':'handPickup','char':0,'slot':10},{'op':'dropHand','char':0,'slot':10}]},
  {'changes':{},'held':0},'Aufnehmen + Ablegen am selben Platz ist neutral (im Original nur Uhr 45/49)')
v('P06',C,'suspected',SRC_P,
  {'save':[be(1056,0xffe7),by(1336,4)],'ops':[{'op':'handPickup','char':0,'slot':10}]},
  {'changes':{'1056':0,'1057':0,'1336':0},'held':-25,'saveAllowed':False},'Gegenstand am Cursor: Speichern nicht möglich (Alderaan)')
ARM={-89:4,-87:3,-85:2,-83:1,-79:1,-77:6,-75:2,-71:12,-69:9,-67:7,-65:5,-63:3,-61:2,-29:6,-28:3,-27:2,-26:1,-25:4}
v('P07',C,'suspected',Q+'pickup-contract-ishar2.md Rüstungstabelle (Addendum R7)',
  {'armourCodes':[-89,-87,-71,-69,-25,-26,-30,-17,9,10,0]},
  {'armour':[ARM.get(c,0) for c in [-89,-87,-71,-69,-25,-26,-30,-17,9,10,0]]},'18 negative Codes != 0, sonst Default 0')
v('P08',C,'suspected',SRC_P,
  {'save':[be(1036+2*s,0xffe0) for s in range(9)]+base_obj9,'view':VIEW,'ops':[{'op':'floorPickup','obj':9},{'op':'dropPortrait','char':0}]},
  {'rejected':True,'changes':{'345':0,'545':0,'745':0},'held':9},'Rucksack voll (0..8 belegt): Ablage am Porträt scheitert, Objekt bleibt am Cursor (Annahme aus "erster freier Platz", nicht im Original getestet)')

# ---------------- 2 mechanics (Ishar 2) ----------------
C='mechanics-ishar2'
for i,(b,mp,exp,st,src) in enumerate([
  (65,5,{'kind':'door','index':5},'known',H+'HEBEL_TUER.md (Rahmen Tür 5, B=65 r40 c31)'),
  (66,5,{'kind':'door','index':6},'known',H+'HEBEL_TUER_2.md (Tür 6 per Hebel 6)'),
  (68,5,{'kind':'door','index':8},'known',H+'TUER8.md (Gitter Tür 8)'),
  (88,7,{'kind':'door','index':28},'known',H+'TUER28_ZEIT.md (map 7 r6 c11)'),
  (-16,5,{'kind':'lever','index':6},'known',H+'HEBEL_TUER_2.md (Hebel 6 -> 7437 und 7387)'),
  (61,5,{'kind':'door','index':1},'suspected',Q+'hebel-tuer-trigger-ishar2.md; kit cont-grid.ts doorNumber'),
  (109,5,{'kind':'door','index':49},'suspected',Q+'hebel-tuer-trigger-ishar2.md'),
  (110,5,{'kind':'none'},'suspected','Grenze 61..109 (cont-grid.ts doorNumber)'),
  (-11,5,{'kind':'lever','index':1},'suspected',Q+'hebel-tuer-trigger-ishar2.md'),
  (-30,5,{'kind':'lever','index':20},'suspected',Q+'hebel-tuer-trigger-ishar2.md'),
  (-76,5,{'kind':'zone'},'suspected','Ebene B -70..-99 Zonenmarker (Quesh), Formel der Zone nicht Teil dieses Vektors'),
  (-105,5,{'kind':'walkTrigger','index':5},'suspected','Ebene B -100..-119 Lauf-Trigger (maps>4), GERDEP 0x01515; door-mechanics.ts afterStep'),
  (0,5,{'kind':'none'},'suspected','leer')]):
    v('M%02d'%(i+1),C,st,src,{'decodeB':b,'map':mp},exp)
v('M14',C,'known',H+'HEBEL_TUER.md (Save-Offsets, cmp = ab0+1)',{'doorOffset':[5,6,8,28],'switchOffset':[6]},
  {'doorOffsets':[7386,7387,7389,7409],'switchOffsets':[7437]},'Türtabelle 0x4aa4 @7381+d, Schaltertabelle 0x4ad8 @7431+k (ab 0)')
v('M15',C,'known',H+'HEBEL_TUER_2.md (Klick 152,58; HOTHB*)',
  {'save':[by(7387,1),by(7437,1)],'ops':[{'op':'lever','k':6}]},{'changes':{'7387':0,'7437':0}})
v('M16',C,'known',H+'HEBEL_TUER_2.md (zweiter Hebelklick)',
  {'save':[by(7387,1),by(7437,1)],'ops':[{'op':'lever','k':6},{'op':'lever','k':6}]},{'changes':{}},'1 -> 0 -> 1')
v('M17',C,'known',H+'HEBEL_TUER.md (Rahmen Tür 5, Klick 128,70)',
  {'save':[],'ops':[{'op':'frame','d':5}]},{'changes':{'7386':1}})
v('M18',C,'known',H+'TUER8.md Teil 2 (zweiter Rahmenklick ohne Wirkung)',
  {'save':[by(7386,1)],'ops':[{'op':'frame','d':5}]},{'changes':{}},'nur öffnen')
KEYPOS={'map':5,'row':61,'col':15,'facing':2,'cellA':78}
v('M19',C,'known',H+'TUER8.md (Schlüsselloch r61 c15 Blick 2, Klick 129,72)',
  {'save':[be(1054,0xffef)],'pos':KEYPOS,'ops':[{'op':'keyhole','held':-17}]},{'changes':{'7389':1},'keyConsumed':False},'Schlüssel -17 = FF EF; 1054/55 bleiben FF EF')
v('M20',C,'known',H+'TUER8.md (Schlüssel auf Gitterflügel ohne Wirkung)',
  {'save':[],'pos':dict(KEYPOS,row=53,col=16,facing=3,cellA=0),'ops':[{'op':'keyOnLeaf','held':-17}]},{'changes':{}})
v('M21',C,'suspected',Q+'hebel-tuer-trigger-ishar2.md Addendum (Form nur auf dem Feld mit Blick 2)',
  {'save':[],'pos':dict(KEYPOS,facing=3),'ops':[{'op':'keyhole','held':-17}]},{'changes':{}},'falsche Blickrichtung: keine Form, nicht im Original getestet')
v('M22',C,'suspected','door-mechanics.ts useOnDoorForm (SOURIS 0x00a5d)',
  {'save':[],'pos':KEYPOS,'ops':[{'op':'keyhole','held':-21}]},{'changes':{}},'anderer Gegenstand am Schlüsselloch von Tür 8')
for i,(h0,h1,d0,d1,st) in enumerate([(0,1,0,1,'known'),(1,2,1,1,'known'),(2,3,1,1,'known'),(3,4,1,0,'known'),(4,5,0,0,'suspected'),(23,0,0,0,'suspected')]):
    v('M%02d'%(23+i),C,st,H+'TUER28_ZEIT.md (GERDEP 0x00500/0x0052f)' if st=='known' else 'GERDEP 0x00500/0x0052f (eigene Listing-Lesung, Übergang nicht im Lauf beobachtet)',
      {'save':[be(44,h0),by(7409,d0)],'ops':[{'op':'hour','to':h1}]},{'door28':d1})
for i,(h0,h1,a0,o6,a1,st) in enumerate([(1,2,0,1,12,'known'),(2,3,12,1,12,'known'),(3,4,12,1,0,'known'),(1,2,0,0,0,'suspected')]):
    v('M%02d'%(29+i),C,st,H+'ACTOR69.md (6850 = 0x449a+69)' if st=='known' else H+'ACTOR69.md Herleitung (Bedingung Objekt 6 != 0), nicht im Original getestet',
      {'save':[be(44,h0),by(6850,a0),by(736+6,o6)],'ops':[{'op':'hour','to':h1}]},{'actor69scene':a1})
for i,(h,p,st) in enumerate([(1,3,'known'),(6,2,'known'),(7,2,'known'),(8,1,'known'),(12,1,'suspected'),(19,1,'suspected'),(20,2,'suspected'),(22,3,'suspected')]):
    v('M%02d'%(33+i),C,st,(H+'TUER28_ZEIT.md / ACTOR69.md (Saves Wort @90/92)') if st=='known' else Q+'zeit-ishar2.md (Phase 0x519f)',{'dayPhaseHour':h},{'phase':p})
v('M41',C,'known',H+'TUER28_ZEIT.md (Uhr: Stunde @44, Tag @46, Ticks @48, BE16)',{'clockOffsets':True},{'hour':44,'day':46,'ticks':48})
v('M42',C,'suspected',Q+'zeit-ishar2.md (0x4fcc = 1000, DOS); MAIN 0x03faa ff. (eigene Lesung); beobachtet max. 957',
  {'save':[be(44,0),be(46,3),be(48,998)],'ops':[{'op':'ticks','n':3}]},{'hour':1,'day':3,'ticks':1})
v('M43',C,'suspected',Q+'zeit-ishar2.md',
  {'save':[be(44,23),be(46,3),be(48,999)],'ops':[{'op':'ticks','n':1}]},{'hour':0,'day':4,'ticks':0},'Tageswechsel')
v('M44',C,'suspected',Q+'zeit-ishar2.md (Ticks nur wenn 0x2ab7 == 0)',
  {'save':[be(44,5),be(48,10)],'paused':True,'ops':[{'op':'ticks','n':50}]},{'hour':5,'day':0,'ticks':10})

SR=H+'STEP_RESET.md'
v('M45',C,'known',SR+' (HOTSR1 -> B,F -> HOTSR2: 7386 1->0; GERDEP L_013af 0x013f3)',
  {'save':[by(7386,1)],'ops':[{'op':'step'},{'op':'step'}]},{'changes':{'7386':0}},'Tür 5 fällt nach dem ersten erfolgreichen Schritt zu')
v('M46',C,'known',SR+' (HOTSL1..HOTSL4: 7387/7437 bleiben 0 über 22 Schritte/Drehungen)',
  {'save':[by(7387,0),by(7437,0)],'ops':[{'op':'step'}]*6},{'changes':{}},'Tür 6 / Hebel 6 sind nicht in L_013af')
v('M47',C,'known',SR+' (HOTSR1 frisch geladen: offen; Laden ist kein Schritt)',
  {'save':[by(7386,1)],'ops':[]},{'changes':{}})
v('M48',C,'suspected','GERDEP 0x013d5-0x01407 (eigene Listing-Lesung; Türen 9/17 und Kontaktliste nicht im Original getestet)',
  {'save':[by(7390,1),by(7398,1),by(7576,91),by(7577,92),by(7578,93),by(7387,1)],'ops':[{'op':'step'}]},
  {'changes':{'7390':0,'7398':0,'7576':0,'7577':0,'7578':0}},'L_013af setzt auch 0x4b80[0..2] = 0; Tür 6 bleibt')
v('M49',C,'suspected','GERDEP 0x00682 ff. (L_013af nur bei erfolgreichem Schritt, odirb(0x16)==1)',
  {'save':[by(7386,1)],'ops':[{'op':'turn'},{'op':'blockedStep'}]},{'changes':{}},'Drehen bzw. blockierter Schritt setzen nicht zurück (HOTSR3: Vorwärts gegen die geschlossene Tür 5 blockiert)')

# ---------------- 3 combat ----------------
def tdiv(a,b): q=abs(a)//abs(b); return q if (a>=0)==(b>0) else -q
def rng(r): return (r*0x7ab7+0xf881)&0xffff
def seq(seed,bounds):
    r=seed; out=[]
    for n in bounds: r=rng(r); out.append((r*n)>>16)
    return out,r
C='rng'
for i,(s,b) in enumerate([(0,[100,100,100]),(1,[6,6,6,6]),(0x1234,[100,20,5]),(0xffff,[2,32767])]):
    o,r=seq(s,b)
    v('R%02d'%(i+1),C,'suspected',Q+'combat-contract-ishar2.json (start.exe 1000:6d7b, ss:0x0c4e); decompile/engine/rules.md (r*0x7ab7-0x77f)',
      {'seed':s,'bounds':b},{'values':o,'state':r},'-0x77f == +0xf881 mod 2^16; Seed aus BIOS-Tick, nicht im Save')
o,_=seq(0,[1])
v('R05',C,'suspected','rules.md',{'seed':0,'firstState':True},{'state':0xf881})
C='combat-ishar2'
S2=Q+'combat-contract-ishar2.json/.md'
def hit2(L,A,F,At,l172,sk,blind=False): return 20 if blind else 50+2*L+3*(tdiv(A*F,80)-At)-tdiv(l172,2)+tdiv(sk,5)
for i,a in enumerate([(5,18,80,10,0,50),(3,12,40,15,30,10),(1,5,0,20,7,4)]):
    v('K2%02d'%(i+1),C,'suspected',S2+' Spielertreffer',{'f':'playerHit','LVL':a[0],'AGI':a[1],'FOOD':a[2],'AGI_t':a[3],'loc172':a[4],'skill':a[5]},{'hit':hit2(*a)},'Ganzzahldivision trunc (suspected); Wurf rnd(100) < hit')
v('K204',C,'suspected',S2,{'f':'playerHit','LVL':5,'AGI':18,'FOOD':80,'AGI_t':10,'loc172':0,'skill':50,'blind':True},{'hit':20})
def dmgFist(S,Ct,At): return max(0,tdiv(S-Ct,2)-At)
def dmgW(S,Ct,At,r): return max(0,tdiv(S+2-Ct,2)-At+r+1)
v('K205',C,'suspected',S2+' Faust',{'f':'fist','STR':20,'CON_t':6,'ARM_t':3},{'dmg':dmgFist(20,6,3)})
v('K206',C,'suspected',S2+' Faust clamp',{'f':'fist','STR':5,'CON_t':9,'ARM_t':3},{'dmg':dmgFist(5,9,3)})
v('K207',C,'suspected',S2+' Waffe',{'f':'weapon','STR':20,'CON_t':6,'ARM_t':3,'die':10,'seed':0x1234},{'dmg':dmgW(20,6,3,seq(0x1234,[10])[0][0])})
v('K208',C,'suspected',S2+' Waffe clamp',{'f':'weapon','STR':2,'CON_t':30,'ARM_t':9,'die':4,'seed':0},{'dmg':dmgW(2,30,9,seq(0,[4])[0][0])})
v('K209',C,'suspected',S2+' Monstertreffer',{'f':'monsterHit','LVL_m':4,'AGI_p':10,'AGI_m':12},{'hit':9*4+3*10-12})
def mdmg(Sm,Cp,Ap,seed,half=False):
    dmax=max(0,Sm+2-tdiv(Cp,2)-Ap); d=seq(seed,[dmax])[0][0]+1 if dmax>0 else 1
    return tdiv(d,2) if half else d
v('K210',C,'suspected',S2+' Monsterschaden',{'f':'monsterDmg','STR_m':15,'CON_p':10,'ARM_p':4,'seed':7},{'dmg':mdmg(15,10,4,7)})
v('K211',C,'suspected',S2+' Monsterschaden dmax<=0 -> 1',{'f':'monsterDmg','STR_m':1,'CON_p':20,'ARM_p':4,'seed':7},{'dmg':1},'rnd(0)=0 angenommen')
v('K212',C,'suspected',S2+' halbiert bei 0x2e56',{'f':'monsterDmg','STR_m':15,'CON_p':10,'ARM_p':4,'seed':7,'half':True},{'dmg':mdmg(15,10,4,7,True)},'Rundung beim Halbieren unbestätigt')
v('K213',C,'suspected',S2+' XP; ENCB-Diff (+3/+4)',{'f':'xp','LVL_t':9,'killer':1,'alive':[1,1,1,1,1]},{'xp':[9//5+1,9//3+1,9//5+1,9//5+1,9//5+1]})
v('K214',C,'suspected',S2+' XP nur Lebende',{'f':'xp','LVL_t':12,'killer':0,'alive':[1,0,1,1,0]},{'xp':[12//3+1,0,12//5+1,12//5+1,0]})
v('K215',C,'suspected',S2+' Food -1 pro Schlag; ENCB c0 -7',{'f':'food','FOOD':80,'swings':7},{'food':73})
v('K216',C,'suspected',S2+' Tod schreibt 0x449a/0x36ac/0x3a24/0x4b80',{'f':'death','actor':91,'contactSlot':1,'save':[by(6781+91,21),be(3261+2*91,72),by(7576+1,91)]},
  {'changes':{'6872':0,'3444':0,'7577':0}},'0x3a24 nicht im Save abgebildet (nicht geprüft); ENCB: Wort 3443/44 72->0 (High-Byte bleibt 0), 6872 21->0')
v('K217',C,'suspected',S2+' Monster-Cooldown',{'f':'monsterCooldown','AGI_m':7,'ticksPerHour':1000},{'cooldown':tdiv(1000,480)*tdiv(40,8)})
v('K218',C,'suspected',S2+' Spieler-Cooldown',{'f':'playerCooldown','T':4,'skill':50,'ticksPerHour':1000},{'cooldown':tdiv(1000,120)*(tdiv(4*25,50)+2)})
v('K219',C,'unknown',S2+' "Trefferchancen im Original offen"',{'f':'hitChanceObserved'},{'unknown':True},'Keine Original-Statistik; nicht erfinden')
C='combat-ishar1'
S1=Q+'combat-contract-ishar1.json/.md'
def hit1(L,A,F,At,l146,sk): return 30+2*L+5*(tdiv(A*F,80)-At)-l146+tdiv(sk,5)
v('K101',C,'suspected',S1+' Spielertreffer',{'f':'playerHit','LVL':4,'AGI':16,'FOOD':80,'AGI_t':12,'loc146':5,'skill':30},{'hit':hit1(4,16,80,12,5,30)})
def d1(bonus,At,S,Ct,seed):
    m=max(0,tdiv(S+2-Ct,2)); r=seq(seed,[m])[0][0] if m>0 else 0
    return max(0,bonus-At+r+1)
v('K102',C,'suspected',S1+' Schaden mit Waffe',{'f':'dmg','bonus':5,'ARM_t':2,'STR':18,'CON_t':6,'seed':0x1234},{'dmg':d1(5,2,18,6,0x1234)})
v('K103',C,'suspected',S1+' Schaden ohne Waffe (bonus -3)',{'f':'dmg','bonus':-3,'ARM_t':4,'STR':10,'CON_t':6,'seed':3},{'dmg':d1(-3,4,10,6,3)},'ENCA: 1 HP pro Treffer')
v('K104',C,'suspected',S1+' Monstertreffer',{'f':'monsterHit','T_m':3,'AGI_p':10,'AGI_m':8},{'hit':27+30-8})
v('K105',C,'suspected',S1+' XP',{'f':'xp','T':4,'killer':2,'alive':[1,1,1,0]},{'xp':[80,80,200,0]})
LV=[700,1700,3000,5000,8000,12000,17000,23000,30000]
def lvl(x): return 1+sum(1 for t in LV if x>=t)
for i,(p,x) in enumerate([(650,700),(690,1800),(29000,32000),(5000,5000)]):
    xc=min(x,31000)
    v('K1%02d'%(6+i),C,'suspected',S1+' R6 Schwellen/Kappe (FRISE 0x06f23)',{'f':'levelUp','prevXP':p,'XP':x,'LVL':lvl(p)},{'XP':xc,'LVL':max(lvl(p),lvl(xc))},'Prüfung prev < T <= XP; bei XP == prev keine Prüfung')
v('K110',C,'suspected',S1+' Monster-Cooldown',{'f':'monsterCooldown','AGI_m':9,'seed':0x1234},{'cooldown':tdiv(40,10)+seq(0x1234,[5])[0][0]},'RNG-Reihenfolge rnd100, rnd(dmax) bei Treffer, rnd5')
v('K111',C,'suspected',S1+' Save-Offsets (5216 B)',{'f':'offsets','char':2,'mon':3},{'xp':462,'hp':472,'gold':482,'maxhp':492,'lvl':740,'str':745,'con':750,'agi':765,'food':775,'arm':785,'monHp':1734,'monT':2711})
v('K112',C,'unknown',S1+' L_072f2',{'f':'levelGains'},{'unknown':True},'Stat/HP-Zuwachs beim Levelaufstieg nicht dekodiert')

# ---------------- 4 save fields (Ishar 2) ----------------
C='savefields-ishar2'
SX=H+'XP_GOLD.md'
v('S01',C,'known',SX+' (Gold 1006+2c / 1026+2c, pro Charakter; HOTGLD 12/345)',{'save':[be(1006,12),be(1026,345)],'read':'gold','char':0},{'value':12345})
v('S02',C,'known',SX+' (Referenz Bragl 132/345)',{'save':[be(1008,132),be(1028,345)],'read':'gold','char':1},{'value':132345})
v('S03',C,'known',SX+' (pro Charakter, keine Gruppensumme)',{'save':[be(1008,132),be(1028,345)],'read':'gold','char':0},{'value':0})
v('S04',C,'known',SX+' (Schreiben)',{'save':[],'write':'gold','char':4,'value':7008},{'changes':{'1015':7,'1035':8}},'Tausender 1014/15, Rest 1034/35')
v('S05',C,'known',SX+' (XP 986+2c, Anzeige x100)',{'save':[be(986,620)],'read':'xpDisplay','char':0},{'value':62000})
v('S06',C,'known',SX,{'save':[be(986+6,539)],'read':'xpDisplay','char':3},{'value':53900})
v('S07',C,'known',SX+' (Level 1291+c Byte)',{'save':[by(1293,7)],'read':'level','char':2},{'value':7})
v('S08',C,'known',SX+' (HP 996+2c; Vitalität 87)',{'save':[be(996,87)],'read':'hp','char':0},{'value':87})
v('S09',C,'suspected',Q+'pickup-contract-ishar2.md (0x2f0e = 1336+c, Byte)',{'save':[by(1337,12)],'read':'armour','char':1},{'value':12})
v('S10',C,'known',H+'TUER8.md / CONT_WRITEBACK_2.md (Kopf: Reihe 2, Spalte 4, Blick 6, Karte 8, Zone 18; BE16)',
  {'save':[be(2,61),be(4,15),be(6,2),be(8,5),be(18,36)],'read':'header'},{'value':{'row':61,'col':15,'facing':2,'map':5,'zone':36}})
v('S11',C,'known',H+'TUER28_ZEIT.md (Uhr)',{'save':[be(44,13),be(46,2),be(48,957)],'read':'clock'},{'value':{'hour':13,'day':2,'ticks':957}})
v('S12',C,'known',SX+' Punkt 7 (HOTXC2 vs HOTXPC: nur 49/50 cmp = 48/49 ab0)',
  {'diffOffsets':[48,49]},{'roundtripOk':True})
v('S13',C,'known',H+'CONT_WRITEBACK_2.md (HOTTU1 vs GRIMZEL: nur 45, 49/50 cmp)',{'diffOffsets':[44,48,49]},{'roundtripOk':True})
v('S14',C,'known',SX+' Punkt 7 (Gold/XP bleiben byte-genau)',{'diffOffsets':[48,49,1007]},{'roundtripOk':False},'Negativvektor: Änderung ausserhalb der Uhr verletzt den Roundtrip')
v('S15',C,'suspected','Annahme: Stundenwechsel während Laden/Speichern ändert auch Tag/Phase (90..93)',{'diffOffsets':[45,47,49,91,93]},{'roundtripOk':True},'Phase-Bytes nur bei Stundenwechsel; nicht im Original gezielt getestet')
v('S16',C,'known','Größe 8359 Byte (IO.IO Größenprüfung; save_layout)',{'saveSize':True},{'size':8359})

out={'schema':'hoth-contract-fixtures/1','created':'2026-10-18','author':'Hoth (Grok Bot executor)',
 'notes':['Offsets ab 0 (cmp -l = ab0+1).','Saves = 8359 Nullbytes, Formatmarke Wort@0 = 2, plus die gelisteten künstlichen Felder (be16 = Big-Endian-Wort, u8 = Byte). Keine Originalbytes.',
 'status: known = eigener Beleg im Original-Lauf (Bericht); suspected = Fremdbefund (Quesh/Alderaan) oder Annahme; unknown = offen, wird nur gezählt.',
 'changes: exakte Menge der geänderten Bytes (Offset -> neuer Wert) gegenüber dem Eingangspuffer.'],
 'vectors':V}
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'contract-fixtures.json')
json.dump(out,open(p,'w'),ensure_ascii=False,indent=1)
from collections import Counter
print(len(V),Counter((x['contract'],x['status']) for x in V))
