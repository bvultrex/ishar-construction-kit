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
  (65,5,{'kind':'door','index':5},'known',H+'HEBEL_TUER.md (Rahmen Tür 5, B=65)'),
  (66,5,{'kind':'door','index':6},'known',H+'HEBEL_TUER_2.md (Tür 6 per Hebel 6)'),
  (68,5,{'kind':'door','index':8},'known',H+'TUER8.md (Gitter Tür 8)'),
  (88,7,{'kind':'door','index':28},'known',H+'TUER28_ZEIT.md (map 7)'),
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
KEYPOS={'map':5,'row':44,'col':27,'facing':1,'cellA':78}
v('M19',C,'known',H+'TUER8.md (Schlüsselloch, Klick 129,72)',
  {'save':[be(1054,0xffef)],'pos':KEYPOS,'ops':[{'op':'keyhole','held':-17}]},{'changes':{'7389':1},'keyConsumed':False},'Schlüssel -17 = FF EF; 1054/55 bleiben FF EF')
v('M20',C,'known',H+'TUER8.md (Schlüssel auf Gitterflügel ohne Wirkung)',
  {'save':[],'pos':dict(KEYPOS,row=38,col=12,facing=3,cellA=0),'ops':[{'op':'keyOnLeaf','held':-17}]},{'changes':{}})
v('M21',C,'suspected',Q+'hebel-tuer-trigger-ishar2.md Addendum (Form nur auf dem Feld mit richtiger Blickrichtung)',
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
v('M42',C,'suspected',Q+'zeit-ishar2.md (0x4fcc = 1000, DOS); MAIN 0x03faa ff. (eigene Lesung); eigene Beobachtung < 1000',
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
v('M49',C,'known',H+'STEP_RESET.md (Nachtrag 2026-11-03 Hoth, private/stepreset4) HOT5A -> Klick Rahmen -> HOT5B (7386 0->1); HOT5E (Kopie HOT5B, ticks 0) -> TL -> HOT5F: 7386 offen->zu, Blick geändert; Gegenprobe Laden HOT5E -> HOT5D: 7386 = 1; GERDEP 0x0083a/0x0096b cjsr L_013af ohne Bedingung',
  {'save':[by(7386,1)],'ops':[{'op':'turn'}]},{'changes':{'7386':0}},'Korrigiert 2026-11-03: Drehen (TL Fall 4 L_007e2, TR Fall 8 L_00913) ruft L_013af, Tür 5 fällt zu')
v('M58',C,'suspected','GERDEP 0x0066a (L_013af beim Schritt nur bei odirb(0x16)==1); HOTSR3 Vorwärts gegen geschlossene Tür 5 blockiert',
  {'save':[by(7386,1)],'ops':[{'op':'blockedStep'}]},{'changes':{}},'Abgespalten aus altem M49: blockierter Schritt setzt nicht zurück (offene Tür im Original nicht blockiert getestet)')

S3=H+'STEP_RESET.md (Nachtrag 2026-11-03, Sitzungen private/stepreset3)'
v('M50',C,'known',S3+' HOT17E -> Klick Rahmen (B=77, Karte 6 r25 c17) -> B -> HOT17G: 7398 1->0; GERDEP 0x01407',
  {'save':[by(7398,1)],'ops':[{'op':'step'}]},{'changes':{'7398':0}},'Tür 17 fällt nach erfolgreichem Schritt zu (gleiche Stunde h8)')
v('M51',C,'known',S3+' HOT17H frisch geladen -> HOT17I ohne Schritt: 7398 bleibt 1',
  {'save':[by(7398,1)],'ops':[]},{'changes':{}},'Laden ist kein Schritt (Tür 17)')
v('M52',C,'known',S3+' HOT17E -> Klick -> TL -> HOT17J (h8, kein Stundenwechsel): 7398 = 0; Bild 49/54 Wand zu',
  {'save':[by(7398,1)],'ops':[{'op':'turn'}]},{'changes':{'7398':0}},'Drehen schließt Tür 17: GERDEP 0x0083a/0x0096b cjsr L_013af -> 0x01407')
v('M53',C,'known',S3+' HOT9G (7390=1 im eigenen Save gesetzt, Karte 5 r50 c21) -> B -> HOT9I: 7390 = 0; GERDEP 0x013fd',
  {'save':[by(7390,1)],'ops':[{'op':'step'}]},{'changes':{'7390':0}},'Tür 9 per Klick nicht zu öffnen (c21/c22); Zustand gesetzt')
v('M54',C,'known',S3+' HOT9G -> TL -> HOT9J (h6): 7390 = 0',
  {'save':[by(7390,1)],'ops':[{'op':'turn'}]},{'changes':{'7390':0}},'Drehen schließt auch Tür 9')
v('M55',C,'known',S3+' HOT9G frisch geladen -> HOT9H ohne Schritt: 7390 bleibt 1',
  {'save':[by(7390,1)],'ops':[]},{'changes':{}})
v('M56',C,'known',S3+' HOTKA (Kopie GRIMZ, 7577=52) -> F -> HOTKC: 7577 = 0; GERDEP 0x013df',
  {'save':[by(7577,52)],'ops':[{'op':'step'}]},{'changes':{'7577':0}},'Kontaktliste nach erfolgreichem Schritt leer')
v('M57',C,'known',S3+' HOTKA -> TL,TR -> HOTKB: 7577 bleibt 52',
  {'save':[by(7577,52)],'ops':[{'op':'turn'},{'op':'turn'}]},{'changes':{}},'Kontakt bleibt trotz L_013af (0x013d5-0x013e9 leeren beim Drehen); vermutlich Neueintrag durch Monster in Reichweite (suspected, nicht ausserhalb Reichweite getestet)')

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
v('S01',C,'known',SX+' (Gold 1006+2c / 1026+2c, pro Charakter; synthetische Werte)',{'save':[be(1006,21),be(1026,456)],'read':'gold','char':0},{'value':21456})
v('S02',C,'known',SX+' (Charakter 1, synthetische Werte)',{'save':[be(1008,243),be(1028,518)],'read':'gold','char':1},{'value':243518})
v('S03',C,'known',SX+' (pro Charakter, keine Gruppensumme)',{'save':[be(1008,243),be(1028,518)],'read':'gold','char':0},{'value':0})
v('S04',C,'known',SX+' (Schreiben)',{'save':[],'write':'gold','char':4,'value':7008},{'changes':{'1015':7,'1035':8}},'Tausender 1014/15, Rest 1034/35')
v('S05',C,'known',SX+' (XP 986+2c, Anzeige x100)',{'save':[be(986,410)],'read':'xpDisplay','char':0},{'value':41000})
v('S06',C,'known',SX,{'save':[be(986+6,318)],'read':'xpDisplay','char':3},{'value':31800})
v('S07',C,'known',SX+' (Level 1291+c Byte)',{'save':[by(1293,5)],'read':'level','char':2},{'value':5})
v('S08',C,'known',SX+' (HP 996+2c; synthetischer Wert)',{'save':[be(996,53)],'read':'hp','char':0},{'value':53})
v('S09',C,'suspected',Q+'pickup-contract-ishar2.md (0x2f0e = 1336+c, Byte)',{'save':[by(1337,12)],'read':'armour','char':1},{'value':12})
v('S10',C,'known',H+'TUER8.md / CONT_WRITEBACK_2.md (Kopf: Reihe 2, Spalte 4, Blick 6, Karte 8, Zone 18; BE16; synthetische Werte)',
  {'save':[be(2,40),be(4,22),be(6,1),be(8,5),be(18,36)],'read':'header'},{'value':{'row':40,'col':22,'facing':1,'map':5,'zone':36}})
v('S11',C,'known',H+'TUER28_ZEIT.md (Uhr)',{'save':[be(44,11),be(46,3),be(48,812)],'read':'clock'},{'value':{'hour':11,'day':3,'ticks':812}})
v('S12',C,'known',SX+' Punkt 7 (HOTXC2 vs HOTXPC: nur 49/50 cmp = 48/49 ab0)',
  {'diffOffsets':[48,49]},{'roundtripOk':True})
v('S13',C,'known',H+'CONT_WRITEBACK_2.md (HOTTU1 vs GRIMZEL: nur 45, 49/50 cmp)',{'diffOffsets':[44,48,49]},{'roundtripOk':True})
v('S14',C,'known',SX+' Punkt 7 (Gold/XP bleiben byte-genau)',{'diffOffsets':[48,49,1007]},{'roundtripOk':False},'Negativvektor: Änderung ausserhalb der Uhr verletzt den Roundtrip')
v('S15',C,'suspected','Annahme: Stundenwechsel während Laden/Speichern ändert auch Tag/Phase (90..93)',{'diffOffsets':[45,47,49,91,93]},{'roundtripOk':True},'Phase-Bytes nur bei Stundenwechsel; nicht im Original gezielt getestet')
v('S16',C,'known','Größe 8359 Byte (IO.IO Größenprüfung; save_layout)',{'saveSize':True},{'size':8359})

# ---------------- magic-ishar1 (Quesh magic-contract-ishar1.md; Hoth 2026-11-03) ----------------
C='magic-ishar1'; MQ=Q+'magic-contract-ishar1.md'
# T = PARAM 0x4010 table as given by Quesh R3 (T[0..35]; T[36]=0 assumed). Hoth check: lvl(s)=T[s-1] and sl(s)=T[s] columns are mutually consistent.
T=[1,3,5,1,3,5,1,2,0,8,0,6,3,8,10,4,6,1,1,1,0,3,3,4,4,5,6,6,0,7,9,10,3,4,6,5,0]
def r100(seed,n):
    r=seed; out=[]
    for _ in range(n): r=(r*0x7ab7+0xf881)&0xffff; out.append(r)
    return out
def rnd(r,n): return (r*n)>>16
v('I01',C,'known','FRISE 0x02cee-0x02d0c (Hoth-Lesung: loc136 -= dirb5c+5; <0 -> 0; -> 0x16b4[dirb11])',
  {'op':'cost','M':64,'sl':0},{'mental':59})
v('I02',C,'known','FRISE 0x02cee (Untergrenze 0)',{'op':'cost','M':3,'sl':9},{'mental':0})
v('I03',C,'suspected',MQ+' R3/R5 T1 (sl(28)=T[28]=0 -> M-5; synthetisch M=64); FRISE 0x02337 dirb5c = 0x4010[dirb5d]',
  {'op':'castCost','s':28,'M':64},{'mental':59},'53 wäre lvl(s) statt sl(s) (R3 off-by-one widerlegt)')
v('I04',C,'suspected',MQ+' R9 T2 (sl(30)=9)',{'op':'castCost','s':30,'M':64},{'mental':50})
v('I05',C,'suspected',MQ+' R9 T3 (sl(23)=4)',{'op':'castCost','s':23,'M':70},{'mental':61})
v('I06',C,'known','FRISE 0x02413 (rnd(100) < 8*loc134 + loc136; loc134=0x167c[c], loc136=0x16b4[c] bei 0x02314/0x0231f)',
  {'op':'friendlyThreshold','L':6,'M':64},{'threshold':112})
v('I07',C,'known','FRISE 0x02515 (rnd(100) < loc136 - 3*(dirb5c - loc134))',{'op':'hostileThreshold','L':9,'M':70,'sl':4},{'threshold':85})
v('I08',C,'known','FRISE 0x02515 (negativ möglich)',{'op':'hostileThreshold','L':1,'M':10,'sl':10},{'threshold':-17})
seed=0x1234; rs=r100(seed,3); hp=10
for r in rs: hp=min(14,hp+rnd(r,2*2+2)+1)
v('I09',C,'suspected',MQ+' R5 Healing; FRISE 0x0243a (rnd(2*s+2)+1, Hoth-Lesung) ; RNG wie Vertrag rng',
  {'op':'heal','s':2,'L':3,'hp':10,'maxHp':14,'seed':seed},{'hp':hp},'L Iterationen, Kappe je Schritt')
v('I10',C,'suspected',MQ+' R5 Schadenszauber (L+sl, kein RNG, keine Rüstung)',{'op':'damage','s':23,'L':10,'actor':63,'item40':False},{'dmg':14})
v('I11',C,'suspected',MQ+' R5 (Spell 32 gegen Actor != 39: 300/60)',{'op':'damage','s':32,'L':10,'actor':63,'item40':False},{'dmg':5})
v('I12',C,'suspected',MQ+' R5 (Actor 39 + Item 40: x4)',{'op':'damage','s':32,'L':10,'actor':39,'item40':True},{'dmg':1200})
v('I13',C,'suspected',MQ+' R5 Lightning (D=floor((L+sl)/2), D -= ARM kumulativ)',{'op':'lightning','L':10,'arm':[2,3,10]},{'dmg':[5,2,0]})
v('I14',C,'suspected',MQ+' R3 Protection 3 (s=5: 10000*(s-4)+floor(5ML/4))',{'op':'protection','s':5,'L':6,'M':64},{'timer':10480})
v('I15',C,'suspected',MQ+' R3 Mental shield (floor(5ML/4))',{'op':'timer54','L':6,'M':64},{'timer':480})
v('I16',C,'suspected',MQ+' R3 Sleep/Blindness/Binding/Confusion (floor(ML/4))',{'op':'actorTimer','L':6,'M':64},{'timer':96})
v('I17',C,'known','STAGE 0x005e6 (0x3f12 = 3*T[s-1], Tausender) ; Werte T: '+MQ+' R3',{'op':'price','lvl':6},{'goldK':18})
v('I18',C,'suspected',MQ+' R4 Preis aus Tabelle (s=28: lvl 6)',{'op':'priceSpell','s':28},{'goldK':18})
v('I19',C,'suspected',MQ+' R4 Lernwurf rnd(13)+lvl < WIS (Klassen 0,2,5) sonst INT; STAGE 0x007ea',
  {'op':'learn','s':4,'cls':6,'wis':5,'int':12,'r':0x8000},{'learned':True},'rnd(13)=6, lvl(4)=1 -> 7 < 12')
v('I20',C,'suspected',MQ+' R4 Lernwurf (Paladin nutzt WIS)',{'op':'learn','s':4,'cls':0,'wis':5,'int':12,'r':0x8000},{'learned':False})
for n,(cls,sp,ok) in enumerate([(0,1,True),(0,2,False),(6,34,True),(6,17,False),(9,20,True),(2,33,True),(18,23,True),(18,31,False)]):
    v('I%02d'%(21+n),C,'suspected',MQ+' R4 Klassenregel STAGE 0x00461',{'op':'allow','cls':cls,'s':sp},{'allowed':ok})
v('I29',C,'suspected',MQ+' R1 ITAVERNE 0x0067d (Schlaf: >50 -> 100 sonst +50)',{'op':'sleep','M':[30,51,0]},{'mental':[80,100,50]})
v('I30',C,'suspected',MQ+' R2 Zauberklassen',{'op':'canCast','cls':[0,1,6,17]},{'can':[True,False,True,False]})
v('I31',C,'suspected',MQ+' R7 Save-Offsets (MAIN L_0480e cfwriteb)',{'op':'saveOffsets','c':3,'k':2},{'mental':771,'spell':850,'rune':5024,'icon':4953,'level':741,'size':5216})
v('I32',C,'suspected',MQ+' R6 Actor-Timer: nur der erste != 0 (Bindung, Schlaf, Verwirrung, Blindheit) sinkt',{'op':'actorTimers','t':[0,5,3,2]},{'t':[0,4,3,2]})
v('I33',C,'suspected',MQ+' R6 Actor 39/50 immun',{'op':'actorTimers','t':[4,5,3,2],'actor':39},{'t':[0,0,0,0]})
v('I34',C,'suspected',MQ+' R5 Kosten auch bei Fehlwurf; nicht bei Abbruch (außer 16)',{'op':'paid','cases':['miss','cancel','cancel16','dead']},{'paid':[True,False,True,False]})

# ---------------- shop/tavern/party Ishar 1 (Quesh shop-tavern-contract-ishar1.md, party-contract-ishar1.md; Hoth 2026-11-03) ----------------
SQ=Q+'shop-tavern-contract-ishar1.md'; PQ=Q+'party-contract-ishar1.md'; OWN='HOTH_ABNAHME_2026-11-03_ISHAR1_SAVE.md (eigener Lauf, Details private/ishar1save)'
C='shop-ishar1'
v('SH01',C,'suspected',SQ+' S1; MAIN Tabelle 0x3fd6 (x,y,zone) -> Laden',{'op':'shopAt','cells':[[31,16,1],[29,69,14],[19,6,4],[30,16,1]]},{'shop':[1,7,6,None]})
v('SH02',C,'suspected',SQ+' S2 (Preis von -57 je Laden 0/1/3/7)',{'op':'price','item':-57,'shops':[0,1,3,7]},{'price':[[0,320],[0,380],[0,400],[0,410]]})
def pay(k,u,pk,pu):
    if pk>k or (pk==k and pu>u): return None
    u-=pu; k-=pk
    if u<0: k-=1; u+=1000
    return [k,u]
v('SH03',C,'known','MARCHAND L_0062f 0x00640-0x0067c (Hoth-Lesung: Einheiten - pu, Borgen aus Tausendern); Struktur wie '+SQ+' T1, synthetische Werte',{'op':'pay','gold':[5,123],'price':[1,100]},{'gold':pay(5,123,1,100)})
v('SH04',C,'known','MARCHAND 0x00640-0x0067c (Borgen)',{'op':'pay','gold':[2,100],'price':[0,380]},{'gold':pay(2,100,0,380)})
v('SH05',C,'suspected',SQ+' S4.3 Ablehnung (nur Gold des gewählten Mitglieds, Meldung -21 MARCHAND 0x0053f)',{'op':'pay','gold':[1,99],'price':[1,100]},{'gold':None,'refused':True})
v('SH06',C,'suspected',SQ+' S4.3 Gleichstand',{'op':'pay','gold':[1,100],'price':[1,100]},{'gold':[0,0]})
v('SH07',C,'known','MARCHAND 0x006bf (Hoth-Lesung: stapelbar = -66 <= Code <= -57)',{'op':'stackable','items':[-67,-66,-60,-57,-56,-49]},{'stackable':[False,True,True,True,False,False]})
v('SH08',C,'suspected',SQ+' S4.6 Kappen -57 -> 5, -58 -> 20, sonst 10; Menge 0x403a (MARCHAND 0x007e8/0x0080a)',{'op':'stackAdd','items':[[-57,0,5],[-58,0,20],[-60,9,1],[-57,4,5]]},{'count':[5,20,10,5]})
v('SH09',C,'suspected',SQ+' S5/T2 Zähler 0x3e22[c][item+66] Save 4971+10c+(item+66)',{'op':'stackOffset','c':2,'item':-57},{'offset':5000})
v('SH10',C,'known',OWN+': Speichern kostet 1000 GS, cmp vorher->nachher Byte 483 (Gold-Tausender c2 Low-Byte, 478+2c+1)',{'op':'goldOffset','c':2},{'goldK':482,'goldKLow':483})
v('SH11',C,'suspected',SQ+' S5 (Einheiten 3993+2c, Gegenstände 498+26c+2k; SHOPA-Diff Alderaan 3998, 556/557)',{'op':'goldOffset','c':2,'k':3},{'goldU':3997,'item':556})
v('SH12',C,'suspected',SQ+' S4 kein Verkauf, Vorrat unbegrenzt (Tabelle bei jedem Eintritt neu)',{'op':'flags'},{'sell':False,'stockSaved':False})
C='tavern-ishar1'
v('TV01',C,'known','ITAVERNE 0x0017f (dirb18==3: 900+80t) / 0x00194 (500+40t) -> 0x3f10',{'op':'price','t':[0,5,12],'kind':['eat','sleep']},{'eat':[500,700,980],'sleep':[900,1300,1860]})
v('TV02',C,'known','ITAVERNE 0x001a5-0x001ca (P > 1000 -> 0x3f12=1, 0x3f10=P-1000; sonst 0x3f12=0)',{'op':'split','P':[980,1000,1001,1860]},{'k':[[0,980],[0,1000],[1,1],[1,860]]})
v('TV03',C,'suspected',SQ+' V3 Bezahlbarkeit = Summe aller Mitglieder (class != -1, auch tote); Schleife ITAVERNE 0x001e4 (Hoth gesehen)',{'op':'afford','P':900,'members':[[0,500,10],[0,300,0],[-1,5000,0],[1,100,5]]},{'ok':True})
def split(P,g):
    g=g[:]; n=len(g); sh=P//n; R=P
    for i in range(n):
        x=min(sh,g[i]); g[i]-=x; R-=x
    for i in range(n):
        if R==0: break
        x=min(R,g[i]); g[i]-=x; R-=x
    return g
v('TV04',C,'suspected',SQ+' V3 Zahlung: Anteil floor(P/n) (L_00b6e), Rest in Durchgang 2',{'op':'pay','P':900,'units':[1000,100,5000]},{'units':split(900,[1000,100,5000])})
v('TV05',C,'known','ITAVERNE 0x005e4-0x00629 (Essen: HP>0; >60 -> 100 sonst +40, Kappe 100)',{'op':'eat','food':[61,60,0,100,95],'hp':[5,5,5,0,5]},{'food':[100,100,40,100,100]})
v('TV06',C,'known','ITAVERNE 0x0064b-0x006bd (Schlaf: Nahrung +15 Kappe 100; MENTAL >50 -> 100 sonst +50; HP += (max-HP)/5, osub(opile) = Stapel - acc wie 0x00661); Struktur wie '+SQ+' T4, synthetische Werte',
  {'op':'sleep','food':[95,100,66,43,82],'mental':[100,91,66,41,74],'hp':[10,121,0,48,60],'maxHp':[35,124,40,48,60]},
  {'food':[100,100,66,58,97],'mental':[100,100,66,91,100],'hp':[15,121,0,48,60]},'c2 HP 0: unverändert (Bedingung 0x0064b)')
v('TV07',C,'suspected',SQ+' V5 Verlassen: rnd(3)==0 (ITAVERNE 0x006e7) und npc in {21,28,15,10}',{'op':'leave','npc':[3,21,30,-1,-1],'r3':0,'rel':None,'items':[[-30,0],[-60,-25],[-40,0]]},{'leaver':1,'items':[[0,0],[-60,-25],[0,0]]},'Andere verlieren ersten Gegenstand mit -57 < Code < -19 in Plätzen 0..8')
v('TV08',C,'suspected',SQ+' V5/T4 kein Verlassen, wenn jede Zeile eine Relation > -2 hat',{'op':'leave','npc':[3,2,30,29,1],'r3':1,'rel':[[0,0,0,0,0]]*5,'items':[]},{'leaver':None})
v('TV09',C,'suspected',SQ+' V1 Tabelle 0x3f94',{'op':'tavernAt','cells':[[33,18,1],[35,77,14],[22,10,4]]},{'tavern':[2,11,9]})
v('TV10',C,'suspected',SQ+' V6 Anwerbe-Raster k=(x-1)/64, +4 bei Skript-y < 136',{'op':'hireClick','pts':[[1,140],[130,140],[130,100]]},{'k':[0,2,6]})
C='party-ishar1'
v('PA01',C,'known',OWN+': Klasse 728+c, Level 738+c, MENTAL 768+c (cmp 771 gesunken, c=3), Größe 5216; Charakterbögen',{'op':'offsets','c':3},{'class':731,'level':741,'mental':771,'size':5216})
v('PA02',C,'suspected',PQ+' P1 (HP 468+2c, maxHP 488+2c, Nahrung 773+c, npc 4028+c, rel 4003+5i+j, Raster 3758+5r+col)',{'op':'offsets','c':3,'i':1,'j':3,'row':2,'col':4},{'hp':474,'maxHp':494,'food':776,'npc':4031,'rel':4011,'grid':3772})
v('PA03',C,'known',OWN+': Klassenbytes [1,17,18,6,9] = Bogenanzeige',{'op':'className','cls':[1,17,18,6,9]},{'name':['Krieger','Finsterer Ritter','Okkulter Mönch','Zauberer','Priester']})
v('PA04',C,'suspected',PQ+' P2 lebend = class != -1 und HP > 0',{'op':'living','cls':[1,-1,6,9,2],'hp':[5,9,0,3,1]},{'living':[0,3,4]})
v('PA05',C,'suspected',PQ+' P3.2 angenommen wenn ja >= nein (FRISE 0x01327)',{'op':'vote','v':[[1,0,-1],[-1,-1,2],[0,0],[-3]]},{'accept':[True,False,True,False]})
v('PA06',C,'suspected',PQ+' P3.3 Platz = erstes c mit HP == 0',{'op':'recruitSlot','hp':[5,0,7,0,0]},{'slot':1})
v('PA07',C,'suspected',PQ+' P3.5 Raster: erste freie Zelle, Zeilen 4->0, Spalten 0->4',{'op':'gridPlace','grid':[[0]*5,[0]*5,[0]*5,[0]*5,[1,2,0,3,0]],'c':4},{'cell':[4,2]})
v('PA08',C,'suspected',PQ+' P4 Entlassen (L_00a76): HP 0, npc -1, class -1, Gold 0',{'op':'dismiss','votes':[1,-1,0],'m':{'hp':20,'npc':7,'cls':6,'gold':[3,50]}},{'m':{'hp':0,'npc':-1,'cls':-1,'gold':[0,0]}})
v('PA09',C,'suspected',PQ+' P5 Töten: Relationstabelle (FRISE L_0199c)',{'op':'killRel','AT':[[1,0],[1,1],[0,0],[0,1]],'rel':[5,5,5,5]},{'rel':[7,4,6,3]})
v('PA10',C,'suspected',PQ+' P5 Kette: A<=0, T>0, A-2 < -2 -> j tötet a',{'op':'killRel','AT':[[-1,1]],'rel':[-1]},{'rel':[-3],'chain':[True]})
v('PA11',C,'suspected',PQ+' P3.2 Stimme v = t379c - 2 + 2*t3eb2 - |a16cc - b206e|',{'op':'voteValue','x':[[3,1,10,8],[1,0,4,9],[2,-1,5,5]]},{'v':[1,-6,-2]})

# ---------------- savemap-ishar1 (Hoth 2026-11-03, Quesh save-map-ishar1.json/.md) ----------------
C='savemap-ishar1'
QM=Q+'save-map-ishar1.json/.md'
OWN2='HOTH_FIXTURES_ISHAR1_SAVEMAP.md (eigene Läufe, Details private/savemap)'
SM_BASE={'xp':(458,2),'hp':(468,2),'goldK':(478,2),'hpMax':(488,2),'class':(728,1),'race':(733,1),'level':(738,1),
 'str':(743,1),'con':(748,1),'wis':(753,1),'int':(758,1),'agi':(763,1),'mental':(768,1),'physical':(773,1),'temper':(778,1),'armor':(783,1),
 'goldU':(3993,2),'npc':(4028,1),'rune':(5021,1),'skillOneHand':(4738,1),'skillTwoHand':(4743,1),'skillThrow':(4748,1),'skillShoot':(4753,1),
 'skillLockpick':(4758,1),'skillOrientation':(4763,1),'skillFirstAid':(4768,1),'skillLanguages':(4773,1)}
def smo(fs,cs): return {f:[SM_BASE[f][0]+SM_BASE[f][1]*c for c in cs] for f in fs}
CS=[0,1,2,3,4]
v('SM01',C,'known',OWN2+': alle geprüften Ishar-1-Saves 5216 Bytes',{'op':'size'},{'size':5216})
v('SM02',C,'known',OWN2+'; HOTH_ABNAHME_2026-11-03_ISHAR1_SAVE.md: Klasse 728+c = Bogen',{'op':'offsets','fields':['class'],'c':CS},smo(['class'],CS))
v('SM03',C,'known',OWN2+'; Abnahme 11-03: Level 738+c',{'op':'offsets','fields':['level'],'c':CS},smo(['level'],CS))
v('SM04',C,'known',OWN2+'; Abnahme 11-03: MENTAL/psychic 768+c (cmp 771 gesunken, c=3)',{'op':'offsets','fields':['mental'],'c':CS},smo(['mental'],CS))
v('SM05',C,'known',OWN2+': Rasse 733+c = Bögen (Anzeige-Korrelation, keine Rassenänderung per Spielaktion)',
  {'op':'race','save':[by(733,5),by(734,2),by(735,4),by(736,1),by(737,3)]},{'offsets':[733,734,735,736,737],'race':['Echsenmensch','Elf','Ork','Mensch','Zwerg']})
v('SM06',C,'known',OWN2+': Regel Gold = 1000*W(478+2c) + W(3993+2c) (Anzeige im eigenen Lauf bestätigt; synthetische Werte). Korrektur zu Quesh: 478 = Tausender, 3993 = Rest (Quesh-Namen vertauscht)',
  {'op':'gold','save':[be(482,5),be(3997,123)]},{'goldK':[0,0,5,0,0],'goldU':[0,0,123,0,0],'gold':[0,0,5123,0,0],'total':5123})
v('SM07',C,'known',OWN2+': Spielaktion GEBE GELD -> Aufteilen (c2) + Speichern (1000 GS): nur Tausender 478+2c und Rest 3993+2c ändern sich (synthetische Werte, Gesamt 25123)',
  {'op':'gold','save':[be(478+2*c,4) for c in CS]+[be(3993+2*c,825) for c in CS[:3]]+[be(3993+2*c,824) for c in CS[3:]]},{'goldK':[4,4,4,4,4],'goldU':[825,825,825,824,824],'gold':[4825,4825,4825,4824,4824],'total':24123})
v('SM08',C,'known',OWN2+': Speichern kostet 1000 GS: nur Low-Byte des Tausender-Worts ändert sich um 1, Rest unverändert (synthetische Werte)',
  {'op':'gold','save':[be(482,4),be(3997,123)]},{'gold':[0,0,4123,0,0],'total':4123})
v('SM09',C,'suspected',OWN2+': Aufteilen (FRISE L_05511) gleich auf Lebende, Rest an die ersten; Speicherkosten 1000 gleich auf 5 verteilt (nur Endzustand beobachtet; synthetische Werte)',
  {'op':'splitSave','total':25123,'n':5,'cost':1000},{'afterSplit':[5025,5025,5025,5024,5024],'afterSave':[4825,4825,4825,4824,4824]})
SUSP=['xp','hp','hpMax','str','con','wis','int','agi','physical','temper','armor','npc','rune','skillOneHand','skillTwoHand','skillThrow','skillShoot','skillLockpick','skillOrientation','skillFirstAid','skillLanguages']
for n,f in enumerate(SUSP):
    v('SM%02d'%(10+n),C,'suspected',QM+' fields.'+f+(' (Quesh selbst: suspected)' if f=='temper' else ''),{'op':'offsets','fields':[f],'c':CS},smo([f],CS))
v('SM31',C,'suspected',QM+' inventory base 498, 26 je Charakter, 2 je Slot (0-8 Rucksack, 9/10 Hände, 11 Rüstung, 12 Helm)',{'op':'inv','pts':[[0,0],[2,3],[4,12]]},{'offset':[498+26*c+2*k for c,k in [[0,0],[2,3],[4,12]]]})
v('SM32',C,'suspected',QM+'.md Zauberbuch 788+20c+k',{'op':'spell','pts':[[0,0],[3,7],[4,19]]},{'offset':[788,855,887]})
v('SM33',C,'suspected',QM+'.md Name 418+8c (8 Zeichen)',{'op':'name','c':CS},{'offset':[418,426,434,442,450]})
v('SM34',C,'known','Auftrag: Offsets 7386/7576 gehören zu Ishar 2; jedes Ishar-1-Feld liegt < 5216',{'op':'bounds','offsets':[7386,7576]},{'ishar1':[False,False],'allFieldsInside':True})

# ---------------- monster-ki Ishar 1/2 (Quesh monster-ki-ishar{1,2}.*, Hoth 2026-11-03) ----------------
QK1=Q+'monster-ki-ishar1.json/.md (EDPLT/GERDEP/MAIN)'; QK2=Q+'monster-ki-ishar2.json/.md (EDPLT/GERDEP/MAIN)'; OWNK='HOTH_FIXTURES_MONSTER_KI.md (eigene Läufe 03.11.2026)'
NB=[(0,-1),(-1,-1),(-1,0),(-1,1),(0,1),(1,1),(1,0),(1,-1)]
def chase(g,m,party,h):
    okh=(-30<=h<=-2) or h==g['hSpecial']
    return okh and abs(m[0]-party[0])<=abs(h) and abs(m[1]-party[1])<=abs(h)
def step(g,m,t,home,h):
    best=None;bd=None
    for dx,dy in NB:
        n=(m[0]+dx,m[1]+dy)
        if not(abs(n[0]-home[0])<abs(h) and abs(n[1]-home[1])<abs(h) and 3<n[0]<g['xMax']): continue
        d=(n[0]-t[0])**2+(n[1]-t[1])**2
        if bd is None or d<bd: best,bd=n,d
    return list(best) if best else list(m)
G1={'hSpecial':-41,'xMax':50}; G2={'hSpecial':9,'xMax':85}
C='monster-ki-ishar1'
for id,m,party,h,st,nt in [('MK01',[25,54],[20,53],-4,'suspected','M1: Abstand 5 > |h| 4 -> keine Verfolgung'),('MK02',[24,54],[20,53],-4,'suspected','M2: Abstand 4 -> Verfolgung'),('MK03',[24,54],[20,53],-1,'suspected','h=-1 außerhalb [-30,-2]'),('MK04',[24,54],[20,53],-41,'suspected','Sonderhaltung -41')]:
    v(id,C,st,QK1,{'op':'chase','m':m,'party':party,'h':h},{'chase':chase(G1,m,party,h)},nt)
v('MK05',C,'suspected',QK1+' 8-Nachbar-Suche, erster gewinnt',{'op':'step','m':[24,54],'target':[21,53],'home':[25,54],'h':-4},{'pos':step(G1,[24,54],[21,53],[25,54],-4)},'Leine |neu-heim|<|h|; Karte als frei angenommen')
v('MK06',C,'suspected',QK1,{'op':'step','m':[24,54],'target':[21,53],'home':[25,54],'h':-2},{'pos':step(G1,[24,54],[21,53],[25,54],-2)},'Leine 2 blockiert Westschritt')
v('MK07',C,'known',OWNK+' §I1: Felder x/y/HP/Haltung/Zone werden für die Akteure 60..69 gemeinsam gelöscht',{'op':'offsets','i':[60,64,69]},{'x':[1568,1576,1586],'y':[1708,1716,1726],'hp':[1848,1856,1866],'stance':[3748,3752,3757],'zone':[4093,4097,4102]})
v('MK08',C,'suspected',QK1,{'op':'offsets','i':[60]},{'type':[2698],'chased':[4163],'homeX':[4841],'homeY':[4911],'contact':[4778,4779,4780]})
v('MK09',C,'known',OWNK+' §I1 (a): Laden + sofort Speichern in zwei frischen Sessions: Akteure unverändert, beide Saves byte-gleich',{'op':'afterLoad','zoneHasEntries':True,'sync':True},{'actorsChanged':False,'sessionsEqual':True})
v('MK10',C,'known',OWNK+' §I1 (a): ein Schritt mit Kartenwechsel löscht die Wandermonster 60..69 (x/y/HP/Haltung/Zone -> 0); Ergebnis in zwei Sessions byte-gleich',
  {'op':'wanderReset','save':[be(1448+2*i,30) for i in range(60,70)]+[be(1588+2*i,40) for i in range(60,70)]+[be(1728+2*i,7) for i in range(63,69)]+[by(3688+i,250) for i in range(60,70)]+[by(4033+i,12) for i in range(60,70)],'entries':0},
  {'changes':{str(o):0 for o in sorted([1448+2*i+1 for i in range(60,70)]+[1588+2*i+1 for i in range(60,70)]+[1728+2*i+1 for i in range(63,69)]+[3688+i for i in range(60,70)]+[4033+i for i in range(60,70)])}},'synthetische Werte; Neuerzeugung bei Einträgen > 0 nicht beobachtet')
C='monster-ki-ishar2'
for id,m,party,h,st,nt in [('MK21',[25,54],[20,53],-4,'suspected','N1'),('MK22',[24,54],[20,53],-4,'suspected','N2'),('MK23',[30,54],[20,53],9,'suspected','h=9 Sonderhaltung, |dx|=10 > 9')]:
    v(id,C,st,QK2,{'op':'chase','m':m,'party':party,'h':h},{'chase':chase(G2,m,party,h)},nt)
v('MK24',C,'suspected',QK2,{'op':'step','m':[24,54],'target':[21,53],'home':[25,54],'h':-4},{'pos':step(G2,[24,54],[21,53],[25,54],-4),'cooldown':2})
v('MK25',C,'known',OWNK+' §I2: beim Neuerzeugen nach dem Laden ändern sich genau diese Felder der Akteure 90+',{'op':'offsets','i':[90,104]},{'x':[2781,2809],'y':[3001,3029],'facing':[3221,3249],'hp':[3441,3469],'zone':[6871,6885]})
v('MK26',C,'known',OWNK+' §I2 (b): Laden in einer Zone mit Wandermonstern -> Akteure 90..104 neu erzeugt (Zone 0->Z, HP 0->>0, Kontaktliste belegt); zwei frische Sessions: gleiche Positionen, andere HP/Werte',
  {'op':'afterLoad','zoneHasEntries':True,'sync':False},{'actorsChanged':True,'sessionsEqual':False})
v('MK27',C,'known',OWNK+' §I2 (b): Zonenwechsel 36->35->36 (beide ohne Wandermonster): Akteure 90+ bleiben leer, keine Änderung',{'op':'zoneChange','entries':0,'before':'empty'},{'actorsChanged':False})
v('MK28',C,'suspected',QK2+' Kontaktliste Slotfolge 1,0,2',{'op':'contactOrder','arrivals':[91,92,93]},{'contact':[92,91,93]},'Ankunftsreihenfolge synthetisch')

out={'schema':'hoth-contract-fixtures/1','created':'2026-10-18','author':'Hoth (Grok Bot executor)',
 'notes':['Offsets ab 0 (cmp -l = ab0+1).','Saves = 8359 Nullbytes, Formatmarke Wort@0 = 2, plus die gelisteten künstlichen Felder (be16 = Big-Endian-Wort, u8 = Byte). Keine Originalbytes.',
 'status: known = eigener Beleg im Original-Lauf (Bericht); suspected = Fremdbefund (Quesh/Alderaan) oder Annahme; unknown = offen, wird nur gezählt.',
 'changes: exakte Menge der geänderten Bytes (Offset -> neuer Wert) gegenüber dem Eingangspuffer.'],
 'vectors':V}
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'contract-fixtures.json')
json.dump(out,open(p,'w'),ensure_ascii=False,indent=1)
from collections import Counter
print(len(V),Counter((x['contract'],x['status']) for x in V))
