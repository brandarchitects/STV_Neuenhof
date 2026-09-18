// ─── Core types ───────────────────────────────────────────────────────────────

export type Gender = 'm' | 'w'

/**
 * Turner-Stammdaten.
 * `id` is the Firestore doc id and never changes — for athletes that existed
 * before the master-data system it equals their original name, which is what
 * historic competitions and score documents already reference.
 * `name` is the mutable display name.
 */
export interface Athlete {
  id: string
  name: string
  gender: Gender
  active: boolean
  /** season year → level, e.g. { "2026": "K2" } */
  levels: Record<string, string>
}

export interface Competition {
  id: string
  name: string
  level: string
  gender: Gender
  season: number
  date: string
  /** athlete ids (snapshot taken when the competition was created) */
  athletes: string[]
  apparatuses: string[] // stored in rotated order (start apparatus first)
  startApparatus: string
  hasTeams: boolean
  teams: Team[]
  createdAt: Date
  status: 'active' | 'completed'
}

export interface Team {
  name: string
  athletes: string[]
}

export interface ScoreEntry {
  score: number
  updatedAt: Date
  updatedBy: string
}

export type ScoresMap = Record<string, ScoreEntry>
// key format: "athleteId|apparatusName"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fixed canonical order — rotated based on the start apparatus */
export const APPARATUS_ORDER = ['Reck', 'Boden', 'Ringe', 'Sprung', 'Barren']

/** Mädchen turnen nie am Barren */
export const APPARATUS_BY_GENDER: Record<Gender, string[]> = {
  m: ['Reck', 'Boden', 'Ringe', 'Sprung', 'Barren'],
  w: ['Reck', 'Boden', 'Ringe', 'Sprung'],
}

export const GENDER_LABEL: Record<Gender, string> = {
  m: 'Jungen',
  w: 'Mädchen',
}

export const LEVELS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7']

export const SCORE_KEY = (athleteId: string, apparatus: string) =>
  `${athleteId}|${apparatus}`

// ─── Season helpers ───────────────────────────────────────────────────────────

/** Eine Saison läuft von Januar bis Dezember — sie entspricht dem Kalenderjahr. */
export const currentSeason = (): number => new Date().getFullYear()

export const seasonOfDate = (date: string): number =>
  new Date(date).getFullYear()

// ─── Apparatus helpers ────────────────────────────────────────────────────────

/** Returns selected apparatuses in canonical order, rotated so start comes first */
export function rotateApparatuses(selected: string[], start: string): string[] {
  const ordered = APPARATUS_ORDER.filter((a) => selected.includes(a))
  const idx = ordered.indexOf(start)
  if (idx <= 0) return ordered
  return [...ordered.slice(idx), ...ordered.slice(0, idx)]
}

// ─── Firestore normalisation ──────────────────────────────────────────────────

/**
 * Competitions created before gender/season existed are read with sensible
 * defaults instead of being rewritten: they were all Jungen, and their season
 * follows from the competition date.
 */
export function normalizeCompetition(
  id: string,
  data: Record<string, any>
): Competition {
  return {
    id,
    name: data.name ?? '',
    level: data.level ?? 'K1',
    gender: (data.gender as Gender) ?? 'm',
    season: data.season ?? seasonOfDate(data.date),
    date: data.date ?? '',
    athletes: data.athletes ?? [],
    apparatuses: data.apparatuses ?? [],
    startApparatus: data.startApparatus ?? data.apparatuses?.[0] ?? '',
    hasTeams: data.hasTeams ?? false,
    teams: data.teams ?? [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    status: data.status ?? 'active',
  }
}

export function normalizeAthlete(
  id: string,
  data: Record<string, any>
): Athlete {
  return {
    id,
    name: data.name ?? id,
    gender: (data.gender as Gender) ?? 'm',
    active: data.active ?? true,
    levels: data.levels ?? {},
  }
}

/** Display name for an athlete id, falling back to the id itself. */
export function athleteName(id: string, athletes: Athlete[]): string {
  return athletes.find((a) => a.id === id)?.name ?? id
}
