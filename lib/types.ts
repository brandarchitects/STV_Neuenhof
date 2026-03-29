export interface Competition {
  id: string
  name: string
  level: string
  date: string
  athletes: string[]
  apparatuses: string[]     // stored in rotated order (start apparatus first)
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
// key format: "athleteName|apparatusName"

export const ATHLETES = [
  'Jaron',
  'Lian',
  'Alessandro',
  'Lias',
  'Andreas',
  'Nico',
  'Tiago',
  'Tim',
]

// Fixed canonical order — rotated based on start apparatus
export const APPARATUS_ORDER = ['Reck', 'Boden', 'Ringe', 'Sprung', 'Barren']

// Legacy alias so existing imports still work
export const APPARATUSES = APPARATUS_ORDER

export const LEVELS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7']

export const QUICK_SCORES = [
  8.0, 8.05, 8.1, 8.15, 8.2, 8.25, 8.3, 8.35, 8.4, 8.45,
  8.5, 8.55, 8.6, 8.65, 8.7, 8.75, 8.8, 8.85, 8.9, 8.95,
  9.0, 9.05, 9.1, 9.15, 9.2, 9.25, 9.3, 9.35, 9.4, 9.45,
]

export const SCORE_KEY = (athlete: string, apparatus: string) =>
  `${athlete}|${apparatus}`

/** Returns selected apparatuses in canonical order, rotated so startApparatus comes first */
export function rotateApparatuses(selected: string[], start: string): string[] {
  const ordered = APPARATUS_ORDER.filter((a) => selected.includes(a))
  const idx = ordered.indexOf(start)
  if (idx <= 0) return ordered
  return [...ordered.slice(idx), ...ordered.slice(0, idx)]
}
