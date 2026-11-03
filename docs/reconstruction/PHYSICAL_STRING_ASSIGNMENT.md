# Physische DOS-Stringzuweisung

Stand 2026-10-18, beide über Capture-SHA identifizierten DOS-Profile.

Opcode 30 (2915–2932) wertet zuerst den Operanden aus, tauscht anschließend
SS:C58 und SS:C5C und dispatcht das Ergebnisziel. Ergänzt sind Literalstrings
(Tag 4, 69D0), kontextlokale Strings (Tag 10, 69F4) und Strings relativ zum
globalen Kontextbasiswort SS:BF6 (Tag 34). Alle Kopien schließen die Null ein.
Die Ergebnisziele 10 (7168) und 34 (724C) kopieren aus SS:[C5C] nach ES:BP+Offset
beziehungsweise ES:[SS:BF6]+Offset. DS, ES und Skript-SI werden entsprechend
den Original-PUSH/POP-Folgen erhalten; DX/CX werden durch die Stringkopie nicht
verändert. Die physische Implementierung benutzt denselben Speicher für alle
Segmentfenster. Ein Traversierungslimit verhindert endlose Host-Kopien.

`original-dos-indexed-assignment.ts` verbindet dies mit Opcode 30.
`original-dos-script-expression.ts` unterstützt außerdem Tag 10 beim Lesen
von Ausdrücken, auch im bereits vorhandenen physischen Speicherwrapper.
Es wird kein Unicode- oder neues Stringformat eingeführt.

`check-native-dos-indexed-assignment.py` prüft je Originalprofil 126 Fälle:
108 bisherige numerische/indexierte Fälle und 18 Stringkombinationen aus
drei Quellformen, zwei Zielbasen und Textlängen 0–2. Register einschließlich
AX/BX/DI sowie der gesamte Speicher außer ausgewiesenem CPU-Stack-Scratch
werden verglichen. Überlappende Stringkopien und längere Texte sind hier
noch nicht durch eigene synthetische Vergleichsfälle abgedeckt.

Der zusammenhängende Ishar-1-Startvergleich erreicht in allen vier Länder-/
Mauskombinationen jetzt 183 MAIN-Befehle. Er stoppt anschließend ausdrücklich
bei Ausdruckstag 160 in Opcode 31. Ein vollständiger Start oder eine sichtbare
Änderung der Browserlaufzeit ist damit weiterhin nicht nachgewiesen.
Originalspeicher und Texte bleiben außerhalb des Repositorys.
