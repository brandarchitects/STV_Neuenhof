export interface Competition {
  id: string
  name: string
  level: string
  date: string
  athletes: string[]
  apparatuses: string[]
  createdAt: Date
  status: 'active' | 'completed'
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

export const APPARATUSES = ['Reck', 'Barren', 'Sprung', 'Ring', 'Boden']

export const LEVELS = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7']

export const QUICK_SCORES = [
  8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9,
  9.0, 9.1, 9.2, 9.3, 9.4, 9.5,
]

export const SCORE_KEY = (athlete: string, apparatus: string) =>
  `${athlete}|${apparatus}`
