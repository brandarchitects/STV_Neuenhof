# Entwickler-Brief

Technische Referenz. Fachliche Regeln stehen in [KONZEPT.md](KONZEPT.md).

---

## Architektur in einem Satz

Eine Next.js-App ohne eigenes Backend, die Firestore direkt aus dem Browser
liest und schreibt; Echtzeit-Synchronisation über `onSnapshot`-Listener.

Es gibt keine API-Routes, keine Server Actions, keinen Auth-Provider. Jede
Seite ist eine Client Component.

---

## Datenmodell

### `athletes/{id}`

Turner-Stammdaten.

```ts
{
  name:   string                      // Anzeigename, änderbar
  gender: 'm' | 'w'
  active: boolean                     // false = ausgetreten
  levels: Record<string, string>      // { "2026": "K2" } — Saison → Stufe
}
```

**Die Doc-ID ist unveränderlich und entspricht dem ursprünglichen Namen**
(`athletes/Jaron`). Das ist kein Zufall, sondern der Kern der Migration: Vor
der Einführung der Stammdaten referenzierten Wettkämpfe und Score-Dokumente
die Turner bereits über ihren Namen. Indem die Doc-ID diesem Namen entspricht,
blieben alle bestehenden Resultate ohne eine einzige Datenänderung gültig.

Der Anzeigename liegt separat in `name` und darf sich ändern — die Verknüpfung
zur Historie bricht dadurch nicht. Kommt ein zweiter Turner mit gleichem
Vornamen dazu, vergibt `freeAthleteId()` intern `Nico-2`; der Anzeigename
bleibt frei wählbar.

### `competitions/{id}`

```ts
{
  name:           string
  level:          string              // 'K1' … 'K7'
  gender:         'm' | 'w'
  season:         number              // Kalenderjahr
  date:           string              // 'YYYY-MM-DD'
  athletes:       string[]            // Athlete-IDs, Momentaufnahme
  apparatuses:    string[]            // bereits rotiert, Startgerät zuerst
  startApparatus: string
  hasTeams:       boolean
  teams:          { name: string; athletes: string[] }[]
  status:         'active' | 'completed'
  createdAt:      Timestamp
}
```

`athletes` ist eine **Momentaufnahme**. Steigt ein Turner später auf, ändert
sich der Wettkampf nicht — er hält fest, wer damals angetreten ist.

### `competitions/{id}/scores/{athleteId|apparatus}`

Ein Dokument pro Tabellenzelle. Die Doc-ID ist der zusammengesetzte Schlüssel
aus `SCORE_KEY()`, z. B. `Jaron|Reck`.

```ts
{
  score:     number                   // Vielfaches von 0.05
  updatedAt: Timestamp                // serverTimestamp()
  updatedBy: string                   // Name des Erfassers
  athlete:   string
  apparatus: string
}
```

---

## Nebenläufigkeit

Das zentrale Anforderung war, dass sich parallel arbeitende Betreuer nicht
gegenseitig überschreiben. Gelöst über die **Granularität der Dokumente**:

Jede Zelle ist ein eigenes Firestore-Dokument. Zwei Personen, die
unterschiedliche Turner oder Geräte bewerten, schreiben nie dasselbe Dokument —
es kann also gar kein Konflikt entstehen. Der typische Ablauf (eine Person pro
Gerät, jeder arbeitet seine Spalte ab) ist damit vollständig konfliktfrei.

Bearbeiten zwei Personen *dieselbe* Zelle, gewinnt der letzte Schreibvorgang.
Das ist bewusst so: Eine Sperre wäre an einem Wettkampftag mehr Last als
Nutzen, und `updatedBy` macht nachvollziehbar, wessen Wert steht.

Alle Listener sind Echtzeit-Listener; eine fremde Änderung erscheint innerhalb
von Sekundenbruchteilen und wird kurz blau hinterlegt (`recentKeys`).

---

## Umgang mit Altdaten

Wettkämpfe, die vor `gender` und `season` entstanden sind, werden **nicht
umgeschrieben**, sondern beim Lesen ergänzt:

```ts
// lib/types.ts
normalizeCompetition(id, data)
  → gender: data.gender ?? 'm'
  → season: data.season ?? seasonOfDate(data.date)
```

Jeder Lesepfad geht durch diese Funktion. Beim nächsten Speichern eines alten
Wettkampfs werden die Felder regulär mitgeschrieben. Eine Migration war damit
nirgends nötig.

`normalizeAthlete()` macht dasselbe für Turner (`name ?? id`).

---

## Wichtige Funktionen

| Ort | Funktion | Zweck |
|---|---|---|
| `lib/types.ts` | `rotateApparatuses()` | Geräte in fixer Reihenfolge, rotiert aufs Startgerät |
| | `normalizeCompetition()` | Altdaten-Defaults beim Lesen |
| | `athleteName()` | Athlete-ID → aktueller Anzeigename |
| | `SCORE_KEY()` | Schlüssel eines Score-Dokuments |
| `lib/athletes.ts` | `seedAthletesIfEmpty()` | Erstbefüllung beim ersten Öffnen der Verwaltung |
| | `eligibleAthletes()` | Turner für Stufe + Geschlecht + Saison |
| | `applySeasonRollover()` | Saisonwechsel als eine atomare Batch-Schreiboperation |
| | `freeAthleteId()` | Kollisionsfreie Doc-ID bei Namensgleichheit |

---

## Konstanten mit Fachbezug

```ts
APPARATUS_ORDER     = ['Reck', 'Boden', 'Ringe', 'Sprung', 'Barren']
APPARATUS_BY_GENDER = { m: [...alle fünf], w: [ohne Barren] }
LEVELS              = ['K1' … 'K7']
```

Die Rundung auf gültige Noten steckt im Score-Picker:

```ts
const round2 = (n: number) => Math.round(n * 20) / 20   // → 0.05-Schritte
```

---

## Authentifizierung

`app/components/AuthWrapper.tsx` umschliesst die gesamte App im Root-Layout.

| | |
|---|---|
| Passwort | im Quelltext (`PASSWORD`), `localStorage['stv_auth'] = '1'` |
| Erfassername | `localStorage['stv_judge_name']` |
| Admin-PIN | `process.env.NEXT_PUBLIC_ADMIN_PIN`, nur für den Saisonwechsel |

Das ist **Zugangsbeschränkung, keine Sicherheit** — siehe *Offene Punkte*.

---

## Farbsystem

`app/components/Badges.tsx` ist die einzige Quelle für Stufen- und
Geschlechtsfarben. Die Tailwind-Klassen stehen dort **ausgeschrieben** in
Lookup-Maps:

```ts
LEVEL_SOLID = { K1: 'bg-emerald-500', K2: 'bg-sky-500', … }
```

Das ist Absicht: Dynamisch zusammengebaute Klassennamen (`bg-${x}-500`) findet
Tailwind beim Build nicht und entfernt sie. Beim Ergänzen einer Stufe alle drei
Maps (`LEVEL_SOLID`, `LEVEL_SOFT`, `LEVEL_BAR`) mitpflegen.

Stufen werden als gefüllte Fläche mit weisser Schrift dargestellt, das
Geschlecht als helles Feld mit ♂/♀-Symbol — unterschiedliche Machart, damit die
Kennzeichen auch bei ähnlichem Farbton unterscheidbar bleiben.

---

## Häufige Erweiterungen

**Neues Gerät** → `APPARATUS_ORDER` und `APPARATUS_BY_GENDER` in `lib/types.ts`,
dazu das Icon in `APPARATUS_ICONS` (`competition/new/page.tsx`). Bestehende
Wettkämpfe bleiben unberührt, da sie ihre Geräteliste selbst speichern.

**Streichnoten-Regel ändern** → `TeamResults` in `competition/[id]/page.tsx`,
Funktionen `dropRule()`, `apparatusTeamScore()`, `droppedAthlete()`.

**Resultat-Historie pro Turner** → nicht vorhanden, aber vorbereitet: Über die
stabile Athlete-ID lassen sich alle Wettkämpfe eines Turners saisonübergreifend
finden (`competitions` nach `athletes array-contains <id>`).

---

## Offene Punkte

**Passwort im Quelltext bei öffentlichem Repository.** Wer das Repository
findet, kann `stvneuenhof` lesen. Behebbar durch Umstellung auf eine
Umgebungsvariable (wie beim Admin-PIN) und/oder Umstellung des Repositories auf
privat.

**Firestore-Regeln offen.** Die Datenbank läuft im Testmodus
(`allow read, write: if true`). Jeder mit der Projekt-ID kann schreiben. Für
den produktiven Betrieb sollten die Regeln zumindest auf die beiden
Collections und plausible Feldtypen eingeschränkt werden.

**Kein Schutz gegen gleichzeitiges Bearbeiten derselben Zelle.** Bewusste
Entscheidung, siehe *Nebenläufigkeit*.

**Kein automatisierter Test.** Abgesichert ist nur die Typprüfung
(`npx tsc --noEmit`) und der Build.
