'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ATHLETES, APPARATUSES, LEVELS } from '@/lib/types'
import { format } from 'date-fns'
import { ArrowLeft, Check, Users, Dumbbell as GymIcon } from 'lucide-react'

const APPARATUS_ICONS: Record<string, string> = {
  Reck: '🏃',
  Barren: '🤸',
  Sprung: '⚡',
  Ring: '⭕',
  Boden: '🟦',
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
  const [selectedApparatuses, setSelectedApparatuses] = useState<string[]>([...APPARATUSES])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleAthlete = (name: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    )
  }

  const toggleApparatus = (app: string) => {
    setSelectedApparatuses((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app]
    )
  }

  const handleCreate = async () => {
    if (!name.trim()) return setError('Bitte einen Namen eingeben.')
    if (selectedAthletes.length === 0)
      return setError('Mindestens einen Turner auswählen.')
    if (selectedApparatuses.length === 0)
      return setError('Mindestens ein Gerät auswählen.')

    setSaving(true)
    setError('')
    try {
      const docRef = await addDoc(collection(db, 'competitions'), {
        name: name.trim(),
        level,
        date,
        athletes: selectedAthletes,
        apparatuses: selectedApparatuses,
        status: 'active',
        createdAt: serverTimestamp(),
      })
      router.push(`/competition/${docRef.id}`)
    } catch (err) {
      console.error(err)
      setError('Fehler beim Speichern. Bitte Firebase konfigurieren.')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
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

      {/* Form */}
      <main className="flex-1 px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Name */}
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
          <div className="h-px bg-slate-100 mt-3" />
          <div className="mt-3">
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

        {/* Athletes */}
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
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
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

        {/* Apparatuses */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <GymIcon size={13} />
              Geräte ({selectedApparatuses.length})
            </label>
            <button
              onClick={() =>
                selectedApparatuses.length === APPARATUSES.length
                  ? setSelectedApparatuses([])
                  : setSelectedApparatuses([...APPARATUSES])
              }
              className="text-xs text-blue-600 font-semibold"
            >
              {selectedApparatuses.length === APPARATUSES.length ? 'Alle abwählen' : 'Alle wählen'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {APPARATUSES.map((apparatus) => {
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
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
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

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-bold text-base py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>Wettkampf starten</>
          )}
        </button>

        <div className="h-6" />
      </main>
    </div>
  )
}
