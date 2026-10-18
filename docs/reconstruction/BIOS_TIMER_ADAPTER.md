# Expliziter Plattformadapter für den BIOS-Timer

Stand 2026-10-18. `dos-platform-bios-timer.ts` ist eine Plattformanpassung,
kein dekompilierter Ishar-Code und keine ausgeführte BIOS-Firmware.
Das Profil `dosbox-ega-unhooked` wird ausschließlich explizit aktiviert.
Es registriert das aus den kontrollierten DOS-Antworten bekannte BIOS-Ziel;
abweichende Zielregister oder ein gesetzter INT1C-Vektor werden abgewiesen.
Der kontrollierte Speicher hat dort einen uninitialisierten Nullvektor, keinen
nachgewiesenen echten BIOS-Default-Handler. Das Profil erklärt diesen Zustand
ausdrücklich als unhooked; es wird kein Code an 7000:1234 oder in die IVT geschrieben.

Plattformreferenz, festgehaltener DOSBox-Staging-Commit
`e8b4771a7de58a7d5c6d7c9c5b36c6ab09c6d93d`:

- [INT8-Dienst](https://github.com/dosbox-staging/dosbox-staging/blob/e8b4771a7de58a7d5c6d7c9c5b36c6ab09c6d93d/src/ints/bios.cpp):
  32-Bit-Ticks erhöhen, Mitternachtsgrenze 1800B0, Überlaufbyte, EGA-Motortimeout.
- [CB_IRQ0](https://github.com/dosbox-staging/dosbox-staging/blob/e8b4771a7de58a7d5c6d7c9c5b36c6ab09c6d93d/src/cpu/callback.cpp):
  INT1C-Callout, PIC-Quittierung und Rückkehr über den Interruptframe.
- [BDA-Adressen](https://github.com/dosbox-staging/dosbox-staging/blob/e8b4771a7de58a7d5c6d7c9c5b36c6ab09c6d93d/src/ints/bios.h).

Das Profil verwendet keine Host-Uhr und keine Clock-Synchronisierung. Es erhält
Register, aktualisiert die angegebenen BDA-Felder und liefert IP/CS/FLAGS/SP aus
dem bestehenden Hardwareframe zurück. Ein unhooked INT1C-Callout und EOI werden
als Plattformereignisse ausgewiesen. Zwischenzeitliche Firmware-Stack-Scratch-
Schreibvorgänge und verschachtelte Interrupts sind kein Vertrag dieses Adapters.
Andere Maschinenprofile und echte INT1C-Hooks benötigen eigene Dienste.

`check-dos-platform-bios-timer.mjs` prüft 48 Vertragsfälle: Ticks inklusive
32-Bit-Überlauf, Mitternacht, Motortimeout, Speicher-/Registererhalt, Rückkehr
und abgewiesene unpassende Registrierung/Hooks. Das ist kein Firmwarevergleich.

`check-native-dos-runtime-timer-irq.py CHECKPOINT_DIRECTORY platform` vergleicht
weiterhin den ausgeführten Ishar-IRQ bis zum BIOS-Ziel. Danach wird die explizite
Plattformantwort unabhängig im Python-Nativlauf und im TypeScript-Modell
angewendet. Speicher, Register, Flags und EOI stimmen überein. Bei allen vier
unveränderten Ishar-1-Wartecheckpoints verlässt der folgende originale CMP/JA-
Pfad die Schleife nach 3D6B. Zwei Ishar-2-Framezustände prüfen dieselbe Verbindung.
Keine Countdown-Änderung wird für diese sechs Fälle vorgenommen. Ohne das
Argument bleibt die ursprüngliche BIOS-Grenze erhalten und weiterhin geprüft.

Nachweis: BIOS_TIMER_ADAPTER_2026-10-18.json. Noch kein vollständiger Frame nach
dem Tick, keine BIOS-Firmware-Abnahme und kein neues Toolkitbild. Nächster
Schritt: originale Framefortsetzung ab 3D6B in den bestehenden Ablauf einbinden.
