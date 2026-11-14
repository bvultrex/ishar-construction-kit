# Ishar2: stat-unabhängiger Ausrüstungsplatz12

FRISE.IO SHA25627117c124caf904a31568f5c58f615946083dd3429c02ade1dc1e17552cc2b64 bindet den Charakterblattbereich026cf..02a66. Diese erste Produktstufe beschränkt sich auf die Kategorie, die ohne Charakterwerte oder Spezialeffekte auskommt.

- Bildschirmband026fe..0272c wählt Slot12.
-027d2..027ed ordnet gehaltene Codes-89..-82 diesem Slot zu.
-0294c prüft ausschließlich denselben Bereich. Anders als Slot11 gibt es hier keine Wert-/Flagbedingungen.
-029b4 speichert `gehaltener Code + 1` im Inventarslot.029cf/029d3 addieren die Rüstung des gehaltenen Codes.
-Beim Ablegen erzeugen0275a und0277f aus `gespeichertem Code - 1` das gehaltene Objekt.0278b löscht den Slot;02798/0279c ziehen dessen Rüstungswert ab.
-Beim Tausch läuft zuerst das Anlegen, danach wird der vorherige gespeicherte Code um eins vermindert und dessen Rüstung abgezogen.

`original-equipment-runtime.ts` bildet nur Slot12 und-89..-82 ab. Slots11,13,14 bleiben geschlossen: Slot11 enthält Wert- und Flagbedingungen; Slot13 überschneidet sich mit Stapelcode-49; Code-31 hat einen Akteur-Spezialeffekt. Diese Grenzen dürfen nicht durch generisches Verschieben übergangen werden.

Prüfungen:360 synthetische Anlege-/Tausch-/Ablegepfade über alle fünf Figuren, unveränderte Fremdbytes, lokaler Originalbytevertrag, Typecheck und Produktionsbuild. Die Demo zeigt Slot12 im geöffneten Hand-/Ausrüstungspanel. Der kontrollierte Browserlauf tauscht -89 gegen -87, legt -87 bei einer dritten Figur an, exportiert und lädt erneut; die Rückgabe in den Rucksack über einen zweiten Export/Reload ist ebenfalls bytegenau. Private Belege: `../analysis-output/equipment-browser-2026-11-14/browser-check.json`. Die native Originalabnahme steht noch aus.

Queshs statischer Nachtrag46 (`317fc60`) bestätigt den Adapter gegen die vollständige FRISE-Dekodierung026cf..02a66 und `L_03f22`: Bereich, Speichertransformation, Rüstungswerte und Tauschendzustand stimmen im unterstützten Umfang ohne konkrete Abweichung. Der Originalcode akzeptiert beim Entnehmen auch fremde gespeicherte Werte; das Kit lehnt sie absichtlich ab, bis deren Kategorien separat belegt sind.
