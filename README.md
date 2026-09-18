# STV Neuenhof – Geräteturnen

Mobile Web-App zur Notenerfassung an Geräteturn-Wettkämpfen des STV Neuenhof.
Mehrere Wertungsrichter erfassen gleichzeitig auf ihren Handys; alle Eingaben
erscheinen bei allen anderen in Echtzeit.

**Live:** [stv-neuenhof.vercel.app](https://stv-neuenhof.vercel.app)

---

## Überblick

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Sprache | TypeScript |
| Datenbank | Firebase Firestore (Echtzeit-Listener) |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Hosting | Vercel (Deploy bei Push auf den Branch) |

Kein eigenes Backend: Die App spricht Firestore direkt aus dem Browser an.

---

## Lokal starten

```bash
npm install
cp .env.local.example .env.local   # Firebase-Werte eintragen
npm run dev                        # http://localhost:3000
```

```bash
npm run build      # Produktions-Build
npx tsc --noEmit   # Typprüfung ohne Build
```

---

## Umgebungsvariablen

Alle im Vercel-Projekt unter *Settings → Environment Variables*, lokal in
`.env.local`.

| Variable | Zweck |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase-Projekt |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase-Projekt |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase-Projekt |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase-Projekt |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase-Projekt |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase-Projekt |
| `NEXT_PUBLIC_ADMIN_PIN` | PIN für den Saisonwechsel — **ohne diese Variable ist der Saisonwechsel gesperrt** |

Fehlen die Firebase-Werte, zeigt die Startseite einen Verbindungsfehler.

---

## Projektstruktur

```
app/
  page.tsx                    Startseite – Wettkämpfe der laufenden Saison
  archiv/page.tsx             Vergangene Saisons, nach Jahr gruppiert
  verwaltung/page.tsx         Turner-Stammdaten + Saisonwechsel
  competition/
    new/page.tsx              Wettkampf anlegen
    [id]/page.tsx             Notenerfassung (Kernstück der App)
  components/
    AuthWrapper.tsx           Passwort-Gate vor der ganzen App
    Badges.tsx                Farbsystem für Stufen und Geschlecht
    CompetitionCard.tsx       Wettkampfkarte für Start- und Archivseite
    ServiceWorkerRegistration.tsx  Registriert public/sw.js
  layout.tsx                  Root-Layout, PWA-Metadaten
  globals.css                 Tailwind + Animationen (Konfetti, Sheets)

scripts/
  generate-icons.mjs          Erzeugt die App-Icons aus public/icon.svg

lib/
  types.ts                    Typen, Konstanten, Firestore-Normalisierung
  athletes.ts                 Turner-CRUD, Seeding, Startberechtigung
  firebase.ts                 Firebase-Initialisierung

public/
  icon.svg                    Vereinslogo (weiss, für farbigen Hintergrund)
  manifest.json               PWA-Manifest
```

---

## Als App auf dem Handy

Die App ist eine PWA und lässt sich auf Android wie auf iOS zum
Startbildschirm hinzufügen. Sie startet dann im Vollbild, ohne Browserleiste.

Die App wirbt nicht selbst dafür — die Installation läuft über den Browser:
unter Android im Menü über *App installieren*, auf iOS über *Teilen → Zum
Home-Bildschirm*. Damit Chrome das überhaupt anbietet, registriert
`app/components/ServiceWorkerRegistration.tsx` den Service Worker aus
`public/sw.js`; ohne ihn fehlt das Angebot.

Wichtig: Kein Code darf `beforeinstallprompt` mit `preventDefault()` abfangen,
ohne selbst ein Angebot zu zeigen — das unterdrückt sonst Chromes eigenes.

### Icons neu erzeugen

Nur nötig, wenn sich `public/icon.svg` ändert. Das Vereinslogo ist weiss auf
transparent und wäre auf einem hellen Startbildschirm unsichtbar — das Skript
setzt es deshalb zentriert auf das orange Markenquadrat:

```bash
npm install --no-save sharp
node scripts/generate-icons.mjs
```

Erzeugt `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` und
`apple-touch-icon.png` in `public/`. Die maskierbare Variante hat mehr Rand,
damit Android das Logo beim runden Zuschneiden nicht anschneidet.

---

## Deployment

Das Vercel-Projekt hängt am GitHub-Repository. Jeder Push auf
`claude/gymnastics-scoring-app-IpQdl` löst automatisch ein Deployment aus —
ein manueller Schritt ist nicht nötig.

Nach dem Ändern einer Umgebungsvariablen muss in Vercel unter *Deployments*
einmal **Redeploy** ausgelöst werden, sonst gilt der alte Wert weiter.

---

## Weiterführende Dokumentation

- **[docs/KONZEPT.md](docs/KONZEPT.md)** — Fachliches: Wettkampfregeln, Rollen,
  Abläufe, Gestaltungsprinzipien
- **[docs/ENTWICKLER.md](docs/ENTWICKLER.md)** — Technisches: Datenmodell,
  Architekturentscheide, Nebenläufigkeit, Erweiterungen
