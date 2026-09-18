'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Athlete,
  Gender,
  GENDER_LABEL,
  LEVELS,
  currentSeason,
} from '@/lib/types'
import {
  fetchAthletes,
  seedAthletesIfEmpty,
  createAthlete,
  updateAthlete,
  setAthleteLevel,
  applySeasonRollover,
  deleteAthlete,
} from '@/lib/athletes'
import {
  ArrowLeft, Plus, X, Users, Pencil, Trash2,
  AlertTriangle, CalendarClock, ChevronRight, ShieldAlert, Lock,
} from 'lucide-react'

// ─── Athlete Editor ───────────────────────────────────────────────────────────

function AthleteEditor({
  athlete, season, allAthletes, onClose, onSaved,
}: {
  athlete: Athlete | null
  season: number
  allAthletes: Athlete[]
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = athlete === null
  const [name, setName] = useState(athlete?.name ?? '')
  const [gender, setGender] = useState<Gender>(athlete?.gender ?? 'm')
  const [level, setLevel] = useState<string>(
    athlete?.levels?.[String(season)] ?? ''
  )
  const [active, setActive] = useState(athlete?.active ?? true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      if (isNew) {
        await createAthlete(name, gender, level || null, allAthletes)
      } else {
        const levels = { ...athlete!.levels }
        if (level) levels[String(season)] = level
        else delete levels[String(season)]
        await updateAthlete(athlete!.id, {
          name: name.trim(),
          gender,
          active,
          levels,
        })
      }
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteAthlete(athlete!.id)
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl slide-up p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-slate-800">
            {isNew ? 'Turner hinzufügen' : 'Turner bearbeiten'}
          </h2>
          <button onClick={onClose} className="bg-slate-100 rounded-full p-2 active:bg-slate-200">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Name */}
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Name
        </label>
        <input
          autoFocus={isNew}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Vorname"
          className="w-full border-2 border-slate-200 focus:border-[#f29411] rounded-2xl px-4 py-3 text-slate-800 font-semibold outline-none transition-colors"
        />

        {/* Geschlecht */}
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">
          Geschlecht
        </label>
        <div className="flex gap-2">
          {(['m', 'w'] as Gender[]).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${
                gender === g
                  ? 'bg-[#f29411] text-white shadow-md shadow-orange-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {GENDER_LABEL[g]}
            </button>
          ))}
        </div>

        {/* Stufe */}
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-2">
          Stufe Saison {season}
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setLevel('')}
            className={`px-3 py-2 rounded-xl font-bold text-sm transition-all ${
              level === ''
                ? 'bg-slate-700 text-white'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}
          >
            keine
          </button>
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-2 rounded-xl font-bold text-sm transition-all ${
                level === l
                  ? 'bg-[#f29411] text-white shadow-md shadow-orange-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Aktiv */}
        {!isNew && (
          <div className="flex items-center justify-between mt-5 bg-slate-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Im Verein</p>
              <p className="text-xs text-slate-400">
                Ausgetretene bleiben im Archiv sichtbar
              </p>
            </div>
            <button
              onClick={() => setActive((p) => !p)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                active ? 'bg-[#f29411]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  active ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={save}
          disabled={!name.trim() || busy}
          className="w-full mt-5 bg-[#f29411] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-md shadow-orange-200 transition-all"
        >
          {isNew ? 'Hinzufügen' : 'Speichern'}
        </button>

        {!isNew && (
          confirmDelete ? (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-700 text-sm font-semibold text-center mb-1">
                Endgültig löschen?
              </p>
              <p className="text-red-500 text-xs text-center mb-3">
                Besser: oben auf «Im Verein» ausschalten — dann bleiben die
                bisherigen Resultate erhalten.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={remove}
                  disabled={busy}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm"
                >
                  Löschen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full mt-3 text-slate-400 text-sm font-medium py-2 flex items-center justify-center gap-1.5"
            >
              <Trash2 size={14} /> Turner löschen
            </button>
          )
        )}
      </div>
    </div>
  )
}

// ─── Season Rollover ──────────────────────────────────────────────────────────

/** Nur wer die PIN kennt, kann den Saisonwechsel auslösen. */
const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? ''

function SeasonRollover({
  athletes, fromSeason, onClose, onSaved,
}: {
  athletes: Athlete[]
  fromSeason: number
  onClose: () => void
  onSaved: () => void
}) {
  const [target, setTarget] = useState(fromSeason + 1)
  const [busy, setBusy] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const active = useMemo(() => athletes.filter((a) => a.active), [athletes])

  // level per athlete for the new season, prefilled with the current one
  const [plan, setPlan] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      athletes
        .filter((a) => a.active)
        .map((a) => [a.id, a.levels?.[String(fromSeason)] ?? ''])
    )
  )
  const [leaving, setLeaving] = useState<Record<string, boolean>>({})

  /** Hat die Zielsaison bereits Zuteilungen? Schutz gegen doppeltes Ausführen. */
  const alreadyAssigned = useMemo(
    () => athletes.filter((a) => a.active && a.levels?.[String(target)]).length,
    [athletes, target]
  )

  const summary = useMemo(() => {
    let changed = 0, unchanged = 0, out = 0
    active.forEach((a) => {
      if (leaving[a.id]) { out++; return }
      const from = a.levels?.[String(fromSeason)] ?? ''
      if ((plan[a.id] || '') !== from) changed++
      else unchanged++
    })
    return { changed, unchanged, out }
  }, [active, leaving, plan, fromSeason])

  const bump = (id: string, dir: 1 | -1) => {
    setPlan((p) => {
      const cur = p[id]
      const idx = LEVELS.indexOf(cur)
      const next =
        idx === -1 ? LEVELS[0] : LEVELS[Math.min(LEVELS.length - 1, Math.max(0, idx + dir))]
      return { ...p, [id]: next }
    })
  }

  const apply = async () => {
    setBusy(true)
    try {
      await applySeasonRollover(
        target,
        active.map((a) => ({
          athlete: a,
          level: leaving[a.id] ? null : plan[a.id] || null,
          active: !leaving[a.id],
        }))
      )
      onSaved()
    } finally {
      setBusy(false)
    }
  }

  // ── PIN-Sperre ───────────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 fade-in px-6">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl slide-up">
          <div className="text-center mb-5">
            <div className="bg-amber-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={24} className="text-amber-500" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">Saisonwechsel</h2>
            <p className="text-slate-500 text-sm mt-2">
              Dieser Schritt ändert die Stufen aller Turner auf einmal und ist
              deshalb mit einer PIN geschützt.
            </p>
          </div>

          {ADMIN_PIN === '' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-amber-800 text-sm font-bold">Noch keine PIN hinterlegt</p>
              <p className="text-amber-700 text-xs mt-1.5 leading-relaxed">
                Der Saisonwechsel bleibt gesperrt, bis in den Vercel-Einstellungen
                die Variable <span className="font-mono font-semibold">NEXT_PUBLIC_ADMIN_PIN</span> gesetzt ist.
              </p>
            </div>
          ) : (
            <>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(false) }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  if (pin === ADMIN_PIN) setUnlocked(true)
                  else setPinError(true)
                }}
                placeholder="PIN"
                className={`w-full text-center border-2 rounded-2xl px-4 py-3.5 text-slate-800 font-bold text-lg tracking-widest outline-none transition-all ${
                  pinError ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-[#f29411]'
                }`}
              />
              {pinError && (
                <p className="text-red-500 text-sm font-medium mt-2 text-center">Falsche PIN.</p>
              )}
              <button
                onClick={() => (pin === ADMIN_PIN ? setUnlocked(true) : setPinError(true))}
                disabled={!pin}
                className="w-full mt-3 bg-[#f29411] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-md shadow-orange-200 transition-all"
              >
                Entsperren
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full mt-3 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 fade-in">
      {/* Bestätigung */}
      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 fade-in px-6">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl slide-up">
            <h2 className="text-xl font-extrabold text-slate-800 text-center">
              Saison {target} übernehmen?
            </h2>
            <div className="bg-slate-50 rounded-2xl p-4 my-4 space-y-2">
              <SummaryRow label="Stufe ändert sich" value={summary.changed} accent />
              <SummaryRow label="Bleiben in ihrer Stufe" value={summary.unchanged} />
              <SummaryRow label="Verlassen den Verein" value={summary.out} danger />
            </div>
            <p className="text-slate-400 text-xs text-center mb-4">
              Die Wettkämpfe der Saison {fromSeason} bleiben unverändert — es
              ändert sich nur, wer ab {target} in welcher Stufe startet.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm"
              >
                Zurück
              </button>
              <button
                onClick={apply}
                disabled={busy}
                className="flex-1 py-3.5 rounded-2xl bg-[#f29411] disabled:bg-orange-300 text-white font-bold text-sm shadow-md shadow-orange-200"
              >
                {busy ? 'Läuft…' : 'Übernehmen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-[#c97c0e] to-[#f29411] text-white px-5 pt-12 pb-5 shadow-lg flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-orange-100 -ml-1 mb-3 active:text-white">
          <X size={20} />
          <span className="text-sm font-medium">Abbrechen</span>
        </button>
        <h1 className="text-2xl font-extrabold">Saisonwechsel</h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-orange-200 text-sm">Neue Saison</span>
          <div className="flex items-center gap-2 bg-white/15 rounded-xl px-2 py-1">
            <button onClick={() => setTarget((t) => t - 1)} className="px-2 text-lg font-bold active:opacity-60">−</button>
            <span className="font-extrabold text-lg tabular-nums w-14 text-center">{target}</span>
            <button onClick={() => setTarget((t) => t + 1)} className="px-2 text-lg font-bold active:opacity-60">+</button>
          </div>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {alreadyAssigned > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex gap-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-bold">
                Saison {target} wurde bereits zugeteilt
              </p>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                {alreadyAssigned} Turner {alreadyAssigned === 1 ? 'hat' : 'haben'} für{' '}
                {target} schon eine Stufe. Wenn du fortfährst, wird sie überschrieben.
                Der Wechsel wurde wahrscheinlich schon einmal ausgeführt.
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 mb-4 px-1">
          Die Stufen sind mit der bisherigen Saison vorausgefüllt. Passe nur die
          Aufsteiger an — alle anderen bleiben, wo sie sind.
        </p>

        <div className="space-y-2">
          {active.map((a) => {
            const isLeaving = !!leaving[a.id]
            const from = a.levels?.[String(fromSeason)] ?? '—'
            const to = plan[a.id] || '—'
            const changed = from !== to
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl p-4 shadow-sm transition-opacity ${isLeaving ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{a.name}</p>
                    <p className="text-xs text-slate-400">{GENDER_LABEL[a.gender]}</p>
                  </div>

                  {isLeaving ? (
                    <span className="text-xs font-semibold text-slate-400 flex-shrink-0">
                      Ausgetreten
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm text-slate-400 tabular-nums">{from}</span>
                      <ChevronRight size={14} className="text-slate-300" />
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl">
                        <button onClick={() => bump(a.id, -1)} className="px-2.5 py-1.5 text-slate-500 font-bold active:bg-slate-100 rounded-l-xl">−</button>
                        <span className={`w-9 text-center font-extrabold text-sm ${changed ? 'text-[#f29411]' : 'text-slate-700'}`}>
                          {to}
                        </span>
                        <button onClick={() => bump(a.id, 1)} className="px-2.5 py-1.5 text-slate-500 font-bold active:bg-slate-100 rounded-r-xl">+</button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setLeaving((l) => ({ ...l, [a.id]: !l[a.id] }))}
                  className="text-xs text-slate-400 font-medium mt-2 active:text-slate-600"
                >
                  {isLeaving ? '↩ Doch dabei' : 'Verlässt den Verein'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Apply */}
      <div className="flex-shrink-0 px-4 pb-8 pt-3 bg-white border-t border-slate-100">
        <button
          onClick={() => setConfirming(true)}
          disabled={busy}
          className="w-full bg-[#f29411] disabled:bg-orange-300 text-white font-bold py-4 rounded-2xl shadow-md shadow-orange-200 transition-all"
        >
          Weiter zur Übersicht
        </button>
      </div>
    </div>
  )
}

function SummaryRow({
  label, value, accent, danger,
}: {
  label: string
  value: number
  accent?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`font-extrabold tabular-nums ${
          danger && value > 0
            ? 'text-red-500'
            : accent && value > 0
            ? 'text-[#f29411]'
            : 'text-slate-400'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VerwaltungPage() {
  const router = useRouter()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [season, setSeason] = useState(currentSeason())
  const [editing, setEditing] = useState<Athlete | null | undefined>(undefined)
  const [rollover, setRollover] = useState(false)

  const load = useCallback(async () => {
    try {
      await seedAthletesIfEmpty()
      setAthletes(await fetchAthletes())
    } catch (e) {
      console.error(e)
      setError('Turner konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const quickSetLevel = async (a: Athlete, level: string | null) => {
    await setAthleteLevel(a, season, level)
    setAthletes(await fetchAthletes())
  }

  // group: by level for the selected season, then unassigned, then former members
  const groups = useMemo(() => {
    const act = athletes.filter((a) => a.active)
    const byLevel = LEVELS.map((l) => ({
      key: l,
      title: l,
      list: act.filter((a) => a.levels?.[String(season)] === l),
    })).filter((g) => g.list.length > 0)

    const unassigned = act.filter((a) => !a.levels?.[String(season)])
    const former = athletes.filter((a) => !a.active)

    return { byLevel, unassigned, former }
  }, [athletes, season])

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {editing !== undefined && (
        <AthleteEditor
          athlete={editing}
          season={season}
          allAthletes={athletes}
          onClose={() => setEditing(undefined)}
          onSaved={async () => { setEditing(undefined); setAthletes(await fetchAthletes()) }}
        />
      )}

      {rollover && (
        <SeasonRollover
          athletes={athletes}
          fromSeason={season}
          onClose={() => setRollover(false)}
          onSaved={async () => {
            setRollover(false)
            setAthletes(await fetchAthletes())
          }}
        />
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-[#c97c0e] to-[#f29411] text-white px-5 pt-12 pb-5 shadow-lg">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-orange-100 -ml-1 mb-4 active:text-white">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Übersicht</span>
        </button>
        <h1 className="text-2xl font-extrabold">Turner</h1>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => setSeason((s) => s - 1)} className="bg-white/15 rounded-lg px-2 py-0.5 font-bold active:bg-white/25">−</button>
          <span className="text-orange-100 text-sm font-semibold tabular-nums">Saison {season}</span>
          <button onClick={() => setSeason((s) => s + 1)} className="bg-white/15 rounded-lg px-2 py-0.5 font-bold active:bg-white/25">+</button>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Level groups */}
            {groups.byLevel.map((g) => (
              <section key={g.key} className="mb-5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">
                  {g.title} · {g.list.length} Turner
                </h2>
                <div className="space-y-2">
                  {g.list.map((a) => (
                    <AthleteRow key={a.id} athlete={a} season={season} onEdit={() => setEditing(a)} />
                  ))}
                </div>
              </section>
            ))}

            {/* Unassigned */}
            {groups.unassigned.length > 0 && (
              <section className="mb-5">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 px-1">
                  Ohne Stufe in {season}
                </h2>
                <div className="space-y-2">
                  {groups.unassigned.map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2.5">
                        <div>
                          <p className="font-bold text-slate-800">{a.name}</p>
                          <p className="text-xs text-slate-400">{GENDER_LABEL[a.gender]}</p>
                        </div>
                        <button onClick={() => setEditing(a)} className="text-slate-400 p-2 active:text-slate-600">
                          <Pencil size={15} />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {LEVELS.map((l) => (
                          <button
                            key={l}
                            onClick={() => quickSetLevel(a, l)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold active:bg-orange-50 active:text-[#f29411]"
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Former members */}
            {groups.former.length > 0 && (
              <section className="mb-5">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 px-1">
                  Ehemalige
                </h2>
                <div className="space-y-2">
                  {groups.former.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setEditing(a)}
                      className="bg-white/60 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold text-slate-500">{a.name}</p>
                        <p className="text-xs text-slate-400">
                          {GENDER_LABEL[a.gender]} · nicht mehr im Verein
                        </p>
                      </div>
                      <Pencil size={14} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {athletes.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Users size={36} className="text-orange-300" />
                </div>
                <p className="text-slate-600 font-semibold">Noch keine Turner erfasst</p>
              </div>
            )}

            {/* Actions */}
            <button
              onClick={() => setEditing(null)}
              className="w-full flex items-center justify-center gap-2 bg-[#f29411] text-white font-bold py-4 rounded-2xl shadow-md shadow-orange-200 active:bg-[#c97c0e] transition-all"
            >
              <Plus size={20} strokeWidth={2.5} />
              Turner hinzufügen
            </button>

            <button
              onClick={() => setRollover(true)}
              className="w-full flex items-center justify-center gap-2 mt-3 bg-white border border-slate-200 text-slate-500 font-bold py-4 rounded-2xl active:bg-slate-50 transition-all"
            >
              <CalendarClock size={18} />
              Saisonwechsel
              <Lock size={13} className="text-slate-400" />
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              Einmal pro Jahr — PIN-geschützt
            </p>
          </>
        )}

        <p className="text-center text-xs text-slate-400 py-6">
          App gesponsert durch{' '}
          <a href="https://www.brandarchitects.ch" target="_blank" rel="noopener noreferrer" className="text-[#f29411] font-semibold hover:underline">
            Brand Architects
          </a>
        </p>
      </main>
    </div>
  )
}

function AthleteRow({
  athlete, season, onEdit,
}: {
  athlete: Athlete
  season: number
  onEdit: () => void
}) {
  return (
    <div
      onClick={onEdit}
      className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
    >
      <div className="min-w-0">
        <p className="font-bold text-slate-800 truncate">{athlete.name}</p>
        <p className="text-xs text-slate-400">{GENDER_LABEL[athlete.gender]}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-[#c97c0e]">
          {athlete.levels?.[String(season)]}
        </span>
        <Pencil size={14} className="text-slate-300" />
      </div>
    </div>
  )
}
