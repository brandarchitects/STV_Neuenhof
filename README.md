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
  layout.tsx                  Root-Layout, PWA-Metadaten
  globals.css                 Tailwind + Animationen (Konfetti, Sheets)

lib/
  types.ts                    Typen, Konstanten, Firestore-Normalisierung
  athletes.ts                 Turner-CRUD, Seeding, Startberechtigung
  firebase.ts                 Firebase-Initialisierung

public/
  icon.svg                    Vereinslogo (weiss, für farbigen Hintergrund)
  manifest.json               PWA-Manifest
```

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
