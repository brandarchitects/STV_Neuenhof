# Konzept-Briefing

Fachliche Grundlage der App: was sie leistet, für wen, und nach welchen Regeln
sie rechnet. Dieses Dokument braucht kein technisches Vorwissen.

---

## Ausgangslage

An einem Geräteturn-Wettkampf des STV Neuenhof turnen mehrere Riegen
gleichzeitig an fünf Geräten. Bisher wurden die Noten auf Papier notiert,
später abgetippt und zusammengerechnet — fehleranfällig, und die Rangliste
stand erst lange nach dem Wettkampf fest.

Die App ersetzt das Papier. Mehrere Betreuer erfassen parallel auf ihren
Handys, die Ranglisten entstehen live.

---

## Nutzer und Rollen

Die App kennt bewusst **keine Benutzerkonten**. Wer das Vereinspasswort hat,
kommt hinein — an einem Wettkampftag ist jede Anmeldehürde eine Hürde zu viel.

| Rolle | Was sie tut | Zugang |
|---|---|---|
| **Betreuer / Wertungsrichter** | Noten erfassen, Wettkämpfe anlegen | Vereinspasswort |
| **Verantwortlicher** | zusätzlich: Saisonwechsel durchführen | Vereinspasswort **+ PIN** |

Beim ersten Öffnen gibt jede Person ihren Namen ein. Er wird lokal auf dem
Gerät gespeichert und bei jeder erfassten Note mitgeschrieben — so ist später
nachvollziehbar, wer was eingetragen hat.

---

## Fachliche Regeln

### Wettkampfstufen

K1 bis K7, jeweils getrennt nach **Jungen** und **Mädchen**. Jede Kombination
ist ein eigener Wettkampf.

### Geräte

Die Reihenfolge ist fix:

> **Reck → Boden → Ringe → Sprung → Barren**

Je nach Wettkampf startet eine Riege an einem anderen Gerät. Beim Anlegen wird
das **Startgerät** gewählt; die Reihenfolge rotiert entsprechend. Start bei
Sprung ergibt also:

> Sprung → Barren → Reck → Boden → Ringe

**Mädchen turnen nie am Barren.** Das Gerät fällt bei ihnen automatisch weg,
es bleiben vier.

### Bewertung

- Skala 0 bis 10
- Schrittweite **0.05** — die zweite Nachkommastelle ist immer 0 oder 5
  (9.25 ist gültig, 9.23 nicht)
- Der übliche Bereich 8.50–9.45 liegt als Schnellauswahl direkt auf dem Schirm,
  seltenere Noten sind aufklappbar
- Anzeige immer zweistellig: `9.25`, `8.80`

### Einzelwertung

Das Total eines Turners ist die Summe seiner Gerätenoten. Der Rang wird live
berechnet, sobald jemand an allen Geräten bewertet ist. Turner mit
identischem Total teilen sich den Rang.

### Mannschaftswertung

Optional. Beim Anlegen wird festgelegt, wer in welcher Mannschaft turnt; die
Einzelwertung läuft unabhängig davon immer mit.

**Streichnoten-Regel:** Hat eine Mannschaft **vier oder mehr** Turner, wird pro
Gerät die tiefste Note gestrichen. Bei weniger als vier Turnern zählen alle
Noten.

Das gestrichene Resultat bleibt sichtbar — beim betroffenen Turner steht das
gewertete Total, daneben durchgestrichen sein Gesamttotal:

> Jaron **33.80** ~~34.60~~

Über den Mannschaftsrang entscheidet immer die Summe der gewerteten Noten.

### Saison

Eine Saison entspricht dem **Kalenderjahr** (Januar bis Dezember). Die Saison
eines Wettkampfs ergibt sich aus seinem Datum — nichts muss manuell verschoben
werden. Die Startseite zeigt die laufende Saison, ältere Wettkämpfe rutschen
zum Jahreswechsel automatisch ins Archiv.

---

## Turner verwalten

Der anspruchsvollste Teil fachlich: Kinder wechseln die Stufe, aber nicht alle
gleichzeitig und nicht jedes Jahr. Manche bleiben mehrere Saisons im selben K,
andere steigen auf, wieder andere treten aus.

Die App löst das, indem jeder Turner eine **Stufen-Historie pro Saison** hat:

```
Jaron    2025: K1  │  2026: K2
Nico     2025: K2  │  2026: K2      ← bleibt
Andreas  2025: K1  │  —             ← ausgetreten
```

Daraus folgt:

- Ein Wettkampf lädt automatisch die Turner, die in dieser Saison, dieser Stufe
  und diesem Geschlecht eingeteilt sind
- Vergangene Wettkämpfe bleiben unverändert, auch wenn ein Kind später
  aufsteigt — sie halten fest, wer damals dabei war
- Ausgetretene Turner werden deaktiviert, nicht gelöscht; ihre Resultate
  bleiben im Archiv erhalten

### Saisonwechsel

Einmal jährlich. Eine Liste aller aktiven Turner, die neue Stufe jeweils mit
der bisherigen vorausgefüllt — angepasst werden muss nur, wer wechselt.

Weil der Schritt alle Turner auf einmal betrifft, ist er dreifach abgesichert:

1. **PIN-Sperre** — ohne die hinterlegte PIN öffnet sich der Dialog nicht
2. **Warnung bei Doppelausführung** — hat die Zielsaison schon Zuteilungen,
   wird das deutlich angezeigt
3. **Vorschau** — vor dem Speichern eine Zusammenfassung: wie viele Turner
   wechseln, wie viele bleiben, wie viele treten aus

Ein versehentlich zu früh ausgelöster Saisonwechsel ist trotzdem harmlos: Jede
Saison wird getrennt gespeichert, laufende Wettkämpfe lesen ihre eigene Saison.
Korrigieren lässt sich alles in der Verwaltung.

---

## Abläufe

### Vor dem Wettkampf

1. Turner-Verwaltung prüfen — sind alle erfasst, stimmen die Stufen?
2. Wettkampf anlegen: Name, Datum, Stufe, Geschlecht
3. Turner erscheinen automatisch, nicht Anwesende abwählen
4. Startgerät wählen
5. Falls nötig: Mannschaften einteilen

### Während des Wettkampfs

Jeder Betreuer öffnet denselben Wettkampf. In der Tabelle auf eine Zelle
tippen, Note wählen, speichern. Die Eingabe erscheint sofort auf allen
anderen Geräten.

Typischerweise betreut eine Person ein Gerät und arbeitet ihre Spalte ab,
während andere parallel an ihren Geräten erfassen.

### Nach dem Wettkampf

Sind alle Zellen gefüllt, erscheint ein Abschluss-Banner mit Konfetti. Die
Ranglisten stehen damit fest — Einzelwertung in der Tabelle, Mannschaften
darunter.

---

## Gestaltungsprinzipien

**Für die Turnhalle gebaut.** Grosse Tippflächen, kein Scrollen für die
häufigen Noten, funktioniert einhändig. Die Schnellauswahl deckt den Bereich
ab, in dem 90 % der Noten liegen.

**Farbe als Orientierung.** Jede Stufe K1–K7 hat eine eigene Farbe, sichtbar
als Streifen an jeder Karte. Das Geschlecht nutzt bewusst eine andere
Darstellung — helles Feld mit ♂/♀ statt gefüllter Fläche —, damit die beiden
Kennzeichen nebeneinander nie verwechselt werden. Das Marken-Orange bleibt den
Bedienelementen vorbehalten.

**Hell und freundlich.** Es ist ein Kinderwettkampf, kein Buchhaltungssystem.
Begrüssung mit Konfetti, «Hopp Neuenhof» beim Start, Gratulation am Schluss.

**Nichts geht verloren.** Löschen verlangt zwei Bestätigungen und das Eintippen
von «Ja». Ausgetretene Turner werden deaktiviert statt entfernt. Vergangene
Wettkämpfe sind unveränderlich.
