'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Athlete,
  Gender,
  GENDER_LABEL,
  APPARATUS_BY_GENDER,
  APPARATUS_ORDER,
  LEVELS,
  Team,
  rotateApparatuses,
  seasonOfDate,
  athleteName,
} from '@/lib/types'
import { fetchAthletes, eligibleAthletes } from '@/lib/athletes'
import { format } from 'date-fns'
import { ArrowLeft, Check, Users, Plus, Trash2, Flag, Info } from 'lucide-react'

function MotivationOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#c97c0e]/90 fade-in">
      <div className="text-center text-white pop-in">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-extrabold mb-1">Los geht's!</h2>
        <p className="text-orange-200 text-xl font-semibold">Hopp Neuenhof! 💪</p>
      </div>
    </div>
  )
}

const APPARATUS_ICONS: Record<string, string> = {
  Reck: '🏃', Boden: '🟦', Ringe: '⭕', Sprung: '⚡', Barren: '🤸',
}

export default function NewCompetitionPage() {
  const router = useRouter()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [name, setName] = useState(`Wettkampf ${format(new Date(), 'dd.MM.yyyy')}`)
  const [level, setLevel] = useState('K2')
  const [gender, setGender] = useState<Gender>('m')
  const [date, setDate] = useState(today)
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([])
  const [athletesLoaded, setAthletesLoaded] = useState(false)
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([])
  const [selectedApparatuses, setSelectedApparatuses] = useState<string[]>([
    ...APPARATUS_BY_GENDER.m,
  ])
  const [startApparatus, setStartApparatus] = useState(APPARATUS_BY_GENDER.m[0])
  const [hasTeams, setHasTeams] = useState(false)
  const [teams, setTeams] = useState<Team[]>([
    { name: 'Mannschaft 1', athletes: [] },
    { name: 'Mannschaft 2', athletes: [] },
  ])
  const [saving, setSaving] = useState(false)
  const [showMotivation, setShowMotivation] = useState(false)
  const [error, setError] = useState('')

  const season = seasonOfDate(date)

  // ── Load master data ─────────────────────────────────────────────────────

  useEffect(() => {
    fetchAthletes()
      .then(setAllAthletes)
      .catch(console.error)
      .finally(() => setAthletesLoaded(true))
  }, [])

  // Athletes registered for this level + gender + season
  const eligible = useMemo(
    () => eligibleAthletes(allAthletes, level, gender, season),
    [allAthletes, level, gender, season]
  )

  // Preselect everyone eligible whenever the selection criteria change
  useEffect(() => {
    setSelectedAthletes(eligible.map((a) => a.id))
    setTeams((prev) => prev.map((t) => ({ ...t, athletes: [] })))
  }, [eligible])

  // Mädchen turnen nie am Barren — Geräte an Geschlecht anpassen
  const availableApparatuses = APPARATUS_BY_GENDER[gender]
  useEffect(() => {
    setSelectedApparatuses([...availableApparatuses])
    setStartApparatus(availableApparatuses[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const toggleApparatus = (app: string) => {
    setSelectedApparatuses((prev) => {
      const next = prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
      if (!next.includes(startApparatus)) {
        const first = APPARATUS_ORDER.find((a) => next.includes(a))
        if (first) setStartApparatus(first)
      }
      return next
    })
  }

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) => {
      const next = prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
      if (!next.includes(id)) {
        setTeams((t) => t.map((team) => ({
          ...team,
          athletes: team.athletes.filter((a) => a !== id),
        })))
      }
      return next
    })
  }

  const addTeam = () =>
    setTeams((prev) => [...prev, { name: `Mannschaft ${prev.length + 1}`, athletes: [] }])
  const removeTeam = (idx: number) => setTeams((prev) => prev.filter((_, i) => i !== idx))
  const renameTeam = (idx: number, n: string) =>
    setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, name: n } : t)))

  const getAthleteTeam = (id: string): number | null => {
    const idx = teams.findIndex((t) => t.athletes.includes(id))
    return idx === -1 ? null : idx
  }

  const assignAthleteToTeam = (id: string, teamIdx: number | null) => {
    setTeams((prev) =>
      prev.map((team, i) => {
        const without = team.athletes.filter((a) => a !== id)
        return i === teamIdx ? { ...team, athletes: [...without, id] } : { ...team, athletes: without }
      })
    )
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!name.trim()) return setError('Bitte einen Namen eingeben.')
    if (selectedAthletes.length === 0) return setError('Mindestens einen Turner auswählen.')
    if (selectedApparatuses.length === 0) return setError('Mindestens ein Gerät auswählen.')

    const orderedApparatuses = rotateApparatuses(selectedApparatuses, startApparatus)

    setSaving(true)
    setError('')
    try {
      const docRef = await addDoc(collection(db, 'competitions'), {
        name: name.trim(),
        level,
        gender,
        season,
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
      setError('Fehler beim Speichern.')
      setSaving(false)
    }
  }

  const nameOf = (id: string) => athleteName(id, allAthletes)

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {showMotivation && <MotivationOverlay />}

      <header className="bg-gradient-to-br from-[#c97c0e] to-[#f29411] text-white px-5 pt-12 pb-6 shadow-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-orange-100 -ml-1 mb-4 active:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Zurück</span>
        </button>
        <h1 className="text-2xl font-extrabold">Neuer Wettkampf</h1>
        <p className="text-orange-200 text-sm mt-1">Saison {season}</p>
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
            placeholder="z.B. Kantonalfinal Aarau"
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

        {/* Stufe + Geschlecht */}
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
                    ? 'bg-[#f29411] text-white shadow-md shadow-orange-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="h-px bg-slate-100 my-4" />

          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Geschlecht
          </label>
          <div className="flex gap-2">
            {(['m', 'w'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                  gender === g
                    ? 'bg-[#f29411] text-white shadow-md shadow-orange-200'
                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {GENDER_LABEL[g]}
              </button>
            ))}
          </div>
          {gender === 'w' && (
            <p className="text-xs text-slate-400 mt-2.5 flex items-start gap-1.5">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              Mädchen turnen nicht am Barren — das Gerät entfällt automatisch.
            </p>
          )}
        </div>

        {/* Turner */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users size={13} />
              Turner ({selectedAthletes.length})
            </label>
            {eligible.length > 0 && (
              <button
                onClick={() =>
                  setSelectedAthletes(
                    selectedAthletes.length === eligible.length ? [] : eligible.map((a) => a.id)
                  )
                }
                className="text-xs text-[#f29411] font-semibold"
              >
                {selectedAthletes.length === eligible.length ? 'Alle abwählen' : 'Alle wählen'}
              </button>
            )}
          </div>

          {!athletesLoaded ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-11 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : eligible.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm font-semibold">
                Keine Turner in {level} / {GENDER_LABEL[gender]}
              </p>
              <p className="text-slate-400 text-xs mt-1 mb-3">
                Für die Saison {season} ist hier noch niemand eingeteilt.
              </p>
              <button
                onClick={() => router.push('/verwaltung')}
                className="text-[#f29411] font-bold text-sm underline"
              >
                Zur Turner-Verwaltung
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {eligible.map((a) => {
                const selected = selectedAthletes.includes(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAthlete(a.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                      selected
                        ? 'bg-orange-50 text-[#c97c0e] border border-orange-200'
                        : 'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-[#f29411]' : 'bg-slate-200'
                    }`}>
                      {selected && <Check size={12} color="white" strokeWidth={3} />}
                    </div>
                    <span className="truncate">{a.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Geräte */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Geräte ({selectedApparatuses.length})
            </label>
            <button
              onClick={() =>
                setSelectedApparatuses(
                  selectedApparatuses.length === availableApparatuses.length
                    ? []
                    : [...availableApparatuses]
                )
              }
              className="text-xs text-[#f29411] font-semibold"
            >
              {selectedApparatuses.length === availableApparatuses.length
                ? 'Alle abwählen'
                : 'Alle wählen'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {availableApparatuses.map((apparatus) => {
              const selected = selectedApparatuses.includes(apparatus)
              return (
                <button
                  key={apparatus}
                  onClick={() => toggleApparatus(apparatus)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                    selected
                      ? 'bg-orange-50 text-[#c97c0e] border border-orange-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-[#f29411]' : 'bg-slate-200'
                  }`}>
                    {selected && <Check size={12} color="white" strokeWidth={3} />}
                  </div>
                  <span className="text-lg leading-none mr-1">{APPARATUS_ICONS[apparatus]}</span>
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
              Die Reihenfolge beginnt hier und folgt der festen Abfolge.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {APPARATUS_ORDER.filter((a) => selectedApparatuses.includes(a)).map((apparatus) => {
                const isStart = startApparatus === apparatus
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
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isStart ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}>
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
              })}
            </div>
          </div>
        )}

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
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                hasTeams ? 'bg-[#f29411]' : 'bg-slate-200'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                hasTeams ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {hasTeams && (
            <div className="mt-4 space-y-4">
              {teams.map((team, ti) => (
                <div key={ti} className="bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      value={team.name}
                      onChange={(e) => renameTeam(ti, e.target.value)}
                      className="flex-1 bg-transparent text-slate-800 font-bold text-sm outline-none border-b border-slate-200 pb-1"
                    />
                    {teams.length > 1 && (
                      <button onClick={() => removeTeam(ti)} className="text-slate-400 active:text-red-500 p-1">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {team.athletes.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Noch keine Turner zugeordnet</span>
                    ) : (
                      team.athletes.map((id) => (
                        <span key={id} className="bg-orange-100 text-[#c97c0e] text-xs font-semibold px-2 py-1 rounded-lg">
                          {nameOf(id)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}

              <button onClick={addTeam} className="flex items-center gap-2 text-[#f29411] text-sm font-semibold py-2">
                <Plus size={16} />
                Mannschaft hinzufügen
              </button>

              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Turner zuordnen
                </p>
                <div className="space-y-2">
                  {selectedAthletes.map((id) => {
                    const currentTeam = getAthleteTeam(id)
                    return (
                      <div key={id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                        <span className="text-sm font-semibold text-slate-700 w-24 flex-shrink-0 truncate">
                          {nameOf(id)}
                        </span>
                        <div className="flex gap-1.5 flex-wrap">
                          {teams.map((team, ti) => (
                            <button
                              key={ti}
                              onClick={() => assignAthleteToTeam(id, currentTeam === ti ? null : ti)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                                currentTeam === ti
                                  ? 'bg-[#f29411] text-white'
                                  : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {team.name}
                            </button>
                          ))}
                          {currentTeam !== null && (
                            <button
                              onClick={() => assignAthleteToTeam(id, null)}
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

        <button
          onClick={handleCreate}
          disabled={saving || selectedAthletes.length === 0}
          className="w-full bg-[#f29411] hover:bg-[#c97c0e] active:bg-[#b87212] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            'Wettkampf starten'
          )}
        </button>

        <p className="text-center text-xs text-slate-400 py-4">
          App gesponsert durch{' '}
          <a href="https://www.brandarchitects.ch" target="_blank" rel="noopener noreferrer" className="text-[#f29411] font-semibold hover:underline">
            Brand Architects
          </a>
        </p>
      </main>
    </div>
  )
}
