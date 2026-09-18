import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { Athlete, Gender, currentSeason, normalizeAthlete } from './types'

export const ATHLETES_COLLECTION = 'athletes'

/**
 * Initial roster. The doc id is the athlete's original name, because existing
 * competitions and score documents already reference them by that exact string.
 * Seeding therefore links the master data to the historic results without
 * touching a single stored score.
 */
const SEED: { id: string; gender: Gender; active: boolean; level: string | null }[] = [
  { id: 'Jaron', gender: 'm', active: true, level: 'K2' },
  { id: 'Tiago', gender: 'm', active: true, level: 'K2' },
  { id: 'Lian', gender: 'm', active: true, level: 'K2' },
  { id: 'Lias', gender: 'm', active: true, level: 'K2' },
  { id: 'Nico', gender: 'm', active: true, level: 'K2' },
  { id: 'Tim', gender: 'm', active: true, level: 'K2' },
  { id: 'Alessandro', gender: 'm', active: true, level: 'K1' },
  // Andreas ist nicht mehr im Verein — bleibt für die Historie erhalten.
  { id: 'Andreas', gender: 'm', active: false, level: null },
]

export async function fetchAthletes(): Promise<Athlete[]> {
  const snap = await getDocs(collection(db, ATHLETES_COLLECTION))
  return snap.docs
    .map((d) => normalizeAthlete(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

/** Creates the initial roster the first time the Verwaltung is opened. */
export async function seedAthletesIfEmpty(): Promise<boolean> {
  const snap = await getDocs(collection(db, ATHLETES_COLLECTION))
  if (!snap.empty) return false

  const season = String(currentSeason())
  const batch = writeBatch(db)
  SEED.forEach((a) => {
    batch.set(doc(db, ATHLETES_COLLECTION, a.id), {
      name: a.id,
      gender: a.gender,
      active: a.active,
      levels: a.level ? { [season]: a.level } : {},
    })
  })
  await batch.commit()
  return true
}

/**
 * Picks a free doc id for a new athlete. Normally the plain name; if that is
 * already taken (a second "Nico"), a numeric suffix is appended. The suffix is
 * internal only — the display name stays whatever was typed.
 */
export function freeAthleteId(name: string, existing: Athlete[]): string {
  const base = name.trim().replace(/\//g, '-') || 'Turner'
  const taken = new Set(existing.map((a) => a.id))
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export async function createAthlete(
  name: string,
  gender: Gender,
  level: string | null,
  existing: Athlete[]
): Promise<string> {
  const id = freeAthleteId(name, existing)
  await setDoc(doc(db, ATHLETES_COLLECTION, id), {
    name: name.trim(),
    gender,
    active: true,
    levels: level ? { [String(currentSeason())]: level } : {},
  })
  return id
}

export async function updateAthlete(
  id: string,
  patch: Partial<Omit<Athlete, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, ATHLETES_COLLECTION, id), patch)
}

/** Sets an athlete's level for one season. Passing null removes the assignment. */
export async function setAthleteLevel(
  athlete: Athlete,
  season: number,
  level: string | null
): Promise<void> {
  const levels = { ...athlete.levels }
  if (level) levels[String(season)] = level
  else delete levels[String(season)]
  await updateDoc(doc(db, ATHLETES_COLLECTION, athlete.id), { levels })
}

/** Applies a whole season rollover in one atomic write. */
export async function applySeasonRollover(
  season: number,
  assignments: { athlete: Athlete; level: string | null; active: boolean }[]
): Promise<void> {
  const batch = writeBatch(db)
  assignments.forEach(({ athlete, level, active }) => {
    const levels = { ...athlete.levels }
    if (level) levels[String(season)] = level
    else delete levels[String(season)]
    batch.update(doc(db, ATHLETES_COLLECTION, athlete.id), { levels, active })
  })
  await batch.commit()
}

export async function deleteAthlete(id: string): Promise<void> {
  await deleteDoc(doc(db, ATHLETES_COLLECTION, id))
}

/** Athletes eligible for a given level + gender + season. */
export function eligibleAthletes(
  athletes: Athlete[],
  level: string,
  gender: Gender,
  season: number
): Athlete[] {
  return athletes.filter(
    (a) => a.active && a.gender === gender && a.levels?.[String(season)] === level
  )
}
