# Audio-Stopp vor Laufwerkszugriff

Stand 2026-10-18. Korrigiert die frühere Deutung von 8ADB/8AE4 als Dialog.
Der Originalcode löscht die Pending-Audioqueue (8909=0, 890B=893D, 8947=0)
und stoppt abhängig vom Audiomodus die Wiedergabe. Grafik-/Dialoginterpretation
war nicht belegt und ist zurückgenommen. Historische JSON-Ergebnisse bleiben
als solche erhalten, ihre Fehlerbezeichnung ist überholt.

`original-dos-audio-quiesce.ts` rekonstruiert 8ADB–8B6C für:

- Modus E940=0: unmittelbares RETF ohne Speicheränderung.
- Interner Treiber E93E=1, Sampletimer inaktiv: Queue löschen, Register erhalten.
- Interner aktiver Sampletimer: PIT-Kanal 0 zurückstellen, Port61 Bits 0/1 löschen,
  gesicherten IRQ-Vektor nach 0000:0020 schreiben, CEBA/8947/86C3 löschen,
  CEBB=80 setzen. Die vorher geleerte Queue verhindert Sample-Neustart in 8E2C.
- Modus 2: kein weiterer Stopp bei 86C1 ungleich Null beziehungsweise inaktivem
  Sound-Blaster-Zustand CEBA=0. Aktiver SB-Stopp92E0 bleibt offen.

Externer Treiber1941:2209 wird nicht durch eine erfundene Rückgabe ersetzt.
Fehler werfen vor Mutation der Eingabe. CPU-Flags sind kein API-Vertrag;
insbesondere das originale CLI/STI ist noch kein Modell asynchroner Hardware.
Port61 muss beim aktiven Sampletimer explizit geliefert werden; Portereignisse
werden bis zum physischen Skriptschritt weitergereicht und nativ verglichen.

`check-native-dos-audio-quiesce.py` prüft je Spiel 24 Fälle bis zum echten RETF,
Registererhalt, Stackrückkehr, Portfolge und gesamten Speicher außer
FEC0–FF0F CPU-Stack-Scratch. Keine physische Audioausgabe wird behauptet.
Nachweis: AUDIO_QUIESCE_NATIVE_2026-10-18.json.

Der reale Ishar-1-Start verwendet den bereits initialisierten internen Fallback
mit inaktivem Sampletimer. Mit explizitem DOS-Laufwerk C:, Equipment-Wort 0,
FindFirst-Fehler und Shiftflags 0 stimmen in allen vier Startzuständen jetzt
202 MAIN-Befehle bis zum ersten Yield überein. Elf Callback-Befehle und der
anschließende Frame erreichen nativ identisch das erste sichtbare Objekt bei
3DE4, BX=686. Ein fertig gerendertes Ishar-1-Bild ist damit noch nicht belegt.
Nachweis: STARTUP_AUDIO_QUIESCE_NATIVE_2026-10-18.json.

Nächster Anschluss: Ishar-1-Objektpipeline mit diesem tatsächlichen Zustand,
danach dessen Record-/Pixelverfahren. Die Ishar-2-Pipeline bleibt Referenz,
ersetzt aber keinen eigenständigen Ishar-1-Vergleich.
