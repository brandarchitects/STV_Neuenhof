'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  ATHLETES,
  APPARATUS_ORDER,
  LEVELS,
  Team,
  rotateApparatuses,
} from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Check, Users, Plus, Trash2, Flag } from 'lucide-react'

// ─── Motivational Overlay ────────────────────────────────────────────────────

function MotivationOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-700/90 fade-in">
      <div className="text-center text-white pop-in">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-extrabold mb-1">Los geht's!</h2>
        <p className="text-blue-200 text-xl font-semibold">Hop Neuenhof! 💪</p>
      </div>
    </div>
  )
}

const APPARATUS_ICONS: Record<string, string> = {
  Reck: '🏃',
  Boden: '🟦',
  Ringe: '⭕',
  Sprung: '⚡',
  Barren: '🤸',
}

export default function NewCompetitionPage() {
  const router = useRouter()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [name, setName] = useState(
    `Wettkampf ${format(new Date(), 'dd.MM.yyyy')}`
  )
  const [level, setLevel] = useState('K1')
  const [date, setDate] = useState(today)
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([...ATHLETES])
  const [selectedApparatuses, setSelectedApparatuses] = useState<string[]>([
    ...APPARATUS_ORDER,
  ])
  const [startApparatus, setStartApparatus] = useState(APPARATUS_ORDER[0])
  const [hasTeams, setHasTeams] = useState(false)
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Mannschaft 1', athletes: [] },
    { name: 'Mannschaft 2', athletes: [] },
  ])
  const [saving, setSaving] = useState(false)
  const [showMotivation, setShowMotivation] = useState(false)
  const [error, setError] = useState('')

  // ── Apparatus helpers ────────────────────────────────────────────────────

  const toggleApparatus = (app: string) => {
    setSelectedApparatuses((prev) => {
      const next = prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
      // If we just removed the start apparatus, reset it to first remaining
      if (!next.includes(startApparatus)) {
        const first = APPARATUS_ORDER.find((a) => next.includes(a))
        if (first) setStartApparatus(first)
      }
      return next
    })
  }

  // ── Athlete helpers ──────────────────────────────────────────────────────

  const toggleAthlete = (athlete: string) => {
    setSelectedAthletes((prev) => {
      const next = prev.includes(athlete)
        ? prev.filter((a) => a !== athlete)
        : [...prev, athlete]
      // Remove from teams if deselected
      if (!next.includes(athlete)) {
        setTeams((t) =>
          t.map((team) => ({
            ...team,
            athletes: team.athletes.filter((a) => a !== athlete),
          }))
        )
      }
      return next
    })
  }

  // ── Team helpers ─────────────────────────────────────────────────────────

  const addTeam = () => {
    setTeams((prev) => [
      ...prev,
      { name: `Mannschaft ${prev.length + 1}`, athletes: [] },
    ])
  }

  const removeTeam = (idx: number) => {
    setTeams((prev) => prev.filter((_, i) => i !== idx))
  }

  const renameTeam = (idx: number, name: string) => {
    setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, name } : t)))
  }

  const getAthleteTeam = (athlete: string): number | null => {
    const idx = teams.findIndex((t) => t.athletes.includes(athlete))
    return idx === -1 ? null : idx
  }

  const assignAthleteToTeam = (athlete: string, teamIdx: number | null) => {
    setTeams((prev) =>
      prev.map((team, i) => {
        const withoutAthlete = team.athletes.filter((a) => a !== athlete)
        if (i === teamIdx) return { ...team, athletes: [...withoutAthlete, athlete] }
        return { ...team, athletes: withoutAthlete }
      })
    )
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!name.trim()) return setError('Bitte einen Namen eingeben.')
    if (selectedAthletes.length === 0)
      return setError('Mindestens einen Turner auswählen.')
    if (selectedApparatuses.length === 0)
      return setError('Mindestens ein Gerät auswählen.')

    const orderedApparatuses = rotateApparatuses(selectedApparatuses, startApparatus)

    setSaving(true)
    setError('')
    try {
      const docRef = await addDoc(collection(db, 'competitions'), {
        name: name.trim(),
        level,
        date,
        athletes: selectedAthletes,
        apparatuses: orderedApparatuses,
        startApparatus,
        hasTeams,
        teams: hasTeams ? teams.filter((t) => t.athletes.length > 0) : [],
        status: 'active',
        createdAt: serverTimestamp(),
      })
      setShowMotivation(true)
      setTimeout(() => router.push(`/competition/${docRef.id}`), 1600)
    } catch (err) {
      console.error(err)
      setError('Fehler beim Speichern. Bitte Firebase konfigurieren.')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {showMotivation && <MotivationOverlay />}

      {/* Header */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-500 text-white px-5 pt-12 pb-6 shadow-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-blue-100 mb-4 -ml-1 active:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Zurück</span>
        </button>
        <h1 className="text-2xl font-extrabold">Neuer Wettkampf</h1>
        <p className="text-blue-200 text-sm mt-1">Wettkampf einrichten</p>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Name + Datum */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-slate-800 font-semibold text-base border-0 outline-none bg-transparent placeholder:text-slate-300"
            placeholder="z.B. Wettkampf 15.03.2024"
          />
          <div className="h-px bg-slate-100 mt-3 mb-3" />
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-slate-800 font-medium text-sm border-0 outline-none bg-transparent"
          />
        </div>

        {/* Level */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Wettkampfstufe
          </label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  level === l
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Geräte */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Geräte ({selectedApparatuses.length})
            </label>
            <button
              onClick={() =>
                selectedApparatuses.length === APPARATUS_ORDER.length
                  ? setSelectedApparatuses([])
                  : setSelectedApparatuses([...APPARATUS_ORDER])
              }
              className="text-xs text-blue-600 font-semibold"
            >
              {selectedApparatuses.length === APPARATUS_ORDER.length
                ? 'Alle abwählen'
                : 'Alle wählen'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {APPARATUS_ORDER.map((apparatus) => {
              const selected = selectedApparatuses.includes(apparatus)
              return (
                <button
                  key={apparatus}
                  onClick={() => toggleApparatus(apparatus)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    selected
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    {selected && <Check size={12} color="white" strokeWidth={3} />}
                  </div>
                  <span className="text-lg leading-none mr-1">
                    {APPARATUS_ICONS[apparatus]}
                  </span>
                  {apparatus}
                </button>
              )
            })}
          </div>
        </div>

        {/* Startgerät */}
        {selectedApparatuses.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              <span className="flex items-center gap-1.5">
                <Flag size={13} />
                Startgerät
              </span>
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Die Reihenfolge der Geräte beginnt hier und folgt der festen Abfolge.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {APPARATUS_ORDER.filter((a) => selectedApparatuses.includes(a)).map(
                (apparatus) => {
                  const isStart = startApparatus === apparatus
                  // Show the resulting order as preview
                  const preview = rotateApparatuses(selectedApparatuses, apparatus)
                  return (
                    <button
                      key={apparatus}
                      onClick={() => setStartApparatus(apparatus)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                        isStart
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 font-medium'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isStart ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      >
                        {isStart && <Check size={12} color="white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-bold">{apparatus}</span>
                        {isStart && (
                          <span className="ml-2 text-xs text-emerald-500 font-medium">
                            → {preview.join(' → ')}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                }
              )}
            </div>
          </div>
        )}

        {/* Turner */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users size={13} />
              Turner ({selectedAthletes.length})
            </label>
            <button
              onClick={() =>
                selectedAthletes.length === ATHLETES.length
                  ? setSelectedAthletes([])
                  : setSelectedAthletes([...ATHLETES])
              }
              className="text-xs text-blue-600 font-semibold"
            >
              {selectedAthletes.length === ATHLETES.length ? 'Alle abwählen' : 'Alle wählen'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ATHLETES.map((athlete) => {
              const selected = selectedAthletes.includes(athlete)
              return (
                <button
                  key={athlete}
                  onClick={() => toggleAthlete(athlete)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    selected
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-100'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    {selected && <Check size={12} color="white" strokeWidth={3} />}
                  </div>
                  {athlete}
                </button>
              )
            })}
          </div>
        </div>

        {/* Mannschaften */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Mannschaften
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Optional: Turner Mannschaften zuordnen
              </p>
            </div>
            <button
              onClick={() => setHasTeams((p) => !p)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                hasTeams ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  hasTeams ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {hasTeams && (
            <div className="mt-4 space-y-4">
              {/* Team list */}
              {teams.map((team, ti) => (
                <div key={ti} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={team.name}
                      onChange={(e) => renameTeam(ti, e.target.value)}
                      className="flex-1 bg-transparent text-slate-800 font-bold text-sm outline-none border-b border-slate-200 pb-1"
                    />
                    {teams.length > 1 && (
                      <button
                        onClick={() => removeTeam(ti)}
                        className="text-slate-400 active:text-red-500 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {team.athletes.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">
                        Noch keine Turner zugeordnet
                      </span>
                    ) : (
                      team.athletes.map((a) => (
                        <span
                          key={a}
                          className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-lg"
                        >
                          {a}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={addTeam}
                className="flex items-center gap-2 text-blue-600 text-sm font-semibold py-2"
              >
                <Plus size={16} />
                Mannschaft hinzufügen
              </button>

              {/* Athlete assignment */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Turner zuordnen
                </p>
                <div className="space-y-2">
                  {selectedAthletes.map((athlete) => {
                    const currentTeam = getAthleteTeam(athlete)
                    return (
                      <div
                        key={athlete}
                        className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-slate-700 w-24 flex-shrink-0">
                          {athlete}
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {teams.map((team, ti) => (
                            <button
                              key={ti}
                              onClick={() =>
                                assignAthleteToTeam(
                                  athlete,
                                  currentTeam === ti ? null : ti
                                )
                              }
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                currentTeam === ti
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {team.name}
                            </button>
                          ))}
                          {currentTeam !== null && (
                            <button
                              onClick={() => assignAthleteToTeam(athlete, null)}
                              className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-slate-400 border border-slate-200 bg-white"
                            >
                              —
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            'Wettkampf starten'
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 py-4">
          App gesponsert durch{' '}
          <a href="https://www.brandarchitects.ch" target="_blank" rel="noopener noreferrer" className="text-blue-500 font-semibold hover:underline">
            Brand Architects
          </a>
        </p>
      </main>
    </div>
  )
}
