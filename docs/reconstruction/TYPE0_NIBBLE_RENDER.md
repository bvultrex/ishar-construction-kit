# Typ 0 und erster farbiger Ishar-1-Diagnoseframe

Fortsetzung: MODULE_LOAD_STARTUP.md bestätigt MAIN.IO lokal und untersucht
den Original-Sucherfolgszweig zum LOGO-Modul. Die DISK-A-Diagnose unten bleibt
ein Nachweis des ausdrücklich kontrollierten Suchfehlerprofils.

Stand 2026-10-18. Die vorherige Bezeichnung „Typ-0-Byteblitting“ war eine
vorläufige, falsche Einordnung. Originalentry 1E97:0531 ruft denselben
038B-Clippingkern und dieselbe 0568-Pixelschleife wie Typ 16 auf.
Es handelt sich um zwei 4-Bit-Pixel pro Byte, nicht einen 8-Bit-Pixelpfad.

Typ 0 subtrahiert nach der Vorbereitung 2 von SI, verwendet damit einen
6-Byte-Header und setzt BL=0. Typ 16 beginnt bei 0553, verwendet 8 Headerbytes
und liest seine Palettebasis aus Headerbyte 6. Beide behandeln Nullnibbles als
transparent. Typ 0 verändert CS:30 nicht und benutzt dessen alten Wert nicht
als Palettebasis. Das ist nun im vorhandenen `original-dos-nibble-blit.ts`
verbunden. Spiegelpfade 0541/05AA bleiben ausdrücklich offen.

`check-native-dos-nibble-blit.py` prüft 720 synthetische Fälle je Originalprofil
(insgesamt 1440), darunter beide Typen, transparente/gefüllte Nibbles, gerade
und ungerade Ausschnitte, Top-Clipping, Strides, gewrappte Zieloffsets, Palette-
Overflow bei Typ 16 sowie einen alten CS:30-Wert bei Typ 0. Verglichen werden
sechs ALIS-Register, BX/DI, SP, Schreibanzahlen und der ganze Speicher außer
CPU-Stack-Scratch. Eingaben bleiben unverändert. Nachweise:
NIBBLE_TYPE0_ISHAR1_NATIVE_2026-10-18.json und
NIBBLE_TYPE0_ISHAR2_NATIVE_2026-10-18.json.

Aus dem privaten country33-mouse0-Zustand nach der getakteten Startfortsetzung
läuft jetzt die erste komplette Ishar-1-Recordkette: drei solide Flächen und
fünf Typ-0-Zeichensprites. Recordfortschaltung, Formatdispatch, Pixel, Objektende,
64.000 VGA-Kopierbytes und Rückkehr zum Framecaller stimmen nativ überein.
Der Originalpuffer 905F:0000 wird verwendet; A000 erhält dessen Daten.
Nachweise: STARTUP_TYPE0_VGA_ISHAR1_2026-10-18.json und
STARTUP_TYPE0_FRAME_RETURN_ISHAR1_2026-10-18.json.

Anschließend stimmen sieben MAIN-Befehle einschließlich zweier Palettenbefehle,
Callback und Framefortsetzung überein. Die begonnene Überblendung wird in einem
separaten Diagnosevergleich mit 64 ausdrücklich zugestellten IRQ8 fortgesetzt.
MAIN bleibt dabei pausiert. Jede Original-IRQ-/Paletten-/Tail-Ausführung wird
mit der Rekonstruktion verglichen; nur der BIOS-Zweig nutzt den gekennzeichneten
Plattformadapter. Am Ende stimmen Ziel-, aktuelle und DAC-Schattenpalette
überein, CB8=0; die VGA-Indizes bleiben unverändert.
Nachweise: STARTUP_TYPE0_AFTER_RENDER_ISHAR1_2026-10-18.json und
STARTUP_TYPE0_COLOUR_ISHAR1_2026-10-18.json.

Die private PNG-Diagnose zeigt **DISK A** in einem Rahmen. Sie entstand aus
Original-VGA-Indizes und DAC-Schattenwerten im kontrollierten Testprofil mit
FindFirst-Fehlerantworten. Sie ist kein Hardwaremitschnitt, kein vollständiger
Spielstart und kein Browser-Toolkit-Bild. Originalbilder und Speicherdateien
bleiben außerhalb Git; STARTUP_TYPE0_PREVIEW_ISHAR1_2026-10-18.json enthält
lediglich Prüfsummen und Render-Metadaten.

Nächste Abnahme: originale Eingabe-/Dateizugriffskette nach dieser Aufforderung
mit den vorhandenen Spieldaten verbinden. Ein bloßes Überspringen der
Aufforderung würde die Originalrekonstruktion nicht erfüllen.
