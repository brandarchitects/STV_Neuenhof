'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  doc,
  onSnapshot,
  collection,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Competition, ScoresMap, SCORE_KEY, Team } from '@/lib/types'
import {
  ArrowLeft,
  Edit3,
  X,
  Check,
  Users,
  Info,
  Trash2,
  AlertTriangle,
  Medal,
} from 'lucide-react'

// ─── Score Picker ────────────────────────────────────────────────────────────

interface ScorePickerProps {
  athlete: string
  apparatus: string
  currentScore: number | null
  onSave: (score: number) => void
  onClose: () => void
}

function ScorePicker({ athlete, apparatus, currentScore, onSave, onClose }: ScorePickerProps) {
  const [value, setValue] = useState<number | null>(currentScore)
  const [showAll, setShowAll] = useState(false)

  // Round to nearest 0.05 (second decimal only 0 or 5)
  const round2 = (n: number) => Math.round(n * 20) / 20

  const adjust = (delta: number) => {
    const base = value ?? 8.80
    setValue(round2(Math.min(10, Math.max(0, base + delta))))
  }

  const HIGHLIGHTED = [
    8.50, 8.55, 8.60, 8.65,
    8.70, 8.75, 8.80, 8.85,
    8.90, 8.95, 9.00, 9.05,
    9.10, 9.15, 9.20, 9.25,
    9.30, 9.35, 9.40, 9.45,
  ]
  const EXTRA = [
    6.00, 6.25, 6.50, 6.75,
    7.00, 7.25, 7.50, 7.75,
    8.00, 8.05, 8.10, 8.15, 8.20, 8.25, 8.30, 8.35, 8.40, 8.45,
    9.50, 9.55, 9.60, 9.65, 9.70, 9.75, 9.80, 9.85, 9.90, 9.95, 10.00,
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/40 fade-in" />
      <div className="relative bg-white rounded-t-3xl w-full max-w-lg shadow-2xl slide-up">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{apparatus}</p>
            <h2 className="text-lg font-extrabold text-slate-800">{athlete}</h2>
          </div>
          <button onClick={onClose} className="bg-slate-100 rounded-full p-2 active:bg-slate-200">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-5 py-5 bg-slate-50">
          <button
            onClick={() => adjust(-0.05)}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xl font-bold shadow-sm active:bg-slate-100 transition-all flex items-center justify-center"
          >−</button>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-blue-700 tabular-nums w-32 text-center">
              {value != null ? value.toFixed(2) : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Punkte</div>
          </div>
          <button
            onClick={() => adjust(+0.05)}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xl font-bold shadow-sm active:bg-slate-100 transition-all flex items-center justify-center"
          >+</button>
        </div>

        <div className="px-4 pb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5 px-1">
            Schnellauswahl
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {HIGHLIGHTED.map((s) => (
              <button
                key={s}
                onClick={() => setValue(s)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
                  value === s
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-105'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 active:bg-blue-50'
                }`}
              >
                {s.toFixed(2)}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAll((p) => !p)}
            className="w-full mt-2 py-2.5 text-xs font-semibold text-blue-600 active:text-blue-800 flex items-center justify-center gap-1"
          >
            {showAll ? 'Weniger anzeigen ↑' : 'Weitere Noten ↓'}
          </button>

          {showAll && (
            <div className="grid grid-cols-4 gap-1.5 mb-1">
              {EXTRA.map((s) => (
                <button
                  key={s}
                  onClick={() => setValue(s)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    value === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 active:bg-blue-50'
                  }`}
                >
                  {s.toFixed(2)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-4 pt-2 pb-8">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-base active:bg-slate-50 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={() => value != null && onSave(value)}
            disabled={value == null}
            className="flex-[2] py-4 rounded-2xl bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-base shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={3} />
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Judge Name ──────────────────────────────────────────────────────────────

function JudgeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(!value)
  const [draft, setDraft] = useState(value)

  const save = () => {
    if (draft.trim()) {
      onChange(draft.trim())
      setEditing(false)
      localStorage.setItem('stv_judge_name', draft.trim())
    }
  }

  if (!editing) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 fade-in px-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl slide-up">
        <div className="text-center mb-5">
          <div className="bg-blue-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Dein Name</h2>
          <p className="text-slate-400 text-sm mt-1">Damit wird angezeigt, wer welche Note erfasst hat.</p>
        </div>
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Name eingeben..."
          className="w-full border-2 border-slate-200 focus:border-blue-400 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold text-base outline-none transition-colors"
        />
        <button
          onClick={save}
          disabled={!draft.trim()}
          className="w-full mt-3 bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold py-4 rounded-2xl transition-all"
        >
          Weiter
        </button>
      </div>
    </div>
  )
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 fade-in px-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl slide-up">
        <div className="text-center mb-5">
          <div className="bg-red-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Wettkampf löschen?</h2>
          <p className="text-slate-500 text-sm mt-2">
            <span className="font-semibold">«{name}»</span> und alle erfassten Noten werden unwiderruflich gelöscht.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-md shadow-red-100"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Team Results ─────────────────────────────────────────────────────────────

function TeamResults({
  teams,
  athletes,
  apparatuses,
  scores,
}: {
  teams: Team[]
  athletes: string[]
  apparatuses: string[]
  scores: ScoresMap
}) {
  if (!teams || teams.length === 0) return null

  const getScore = (athlete: string, apparatus: string) =>
    scores[SCORE_KEY(athlete, apparatus)]?.score ?? null

  const getAthleteTotal = (athlete: string) =>
    apparatuses.reduce((sum, app) => sum + (getScore(athlete, app) ?? 0), 0)

  const getTeamTotal = (team: Team) =>
    team.athletes.reduce((sum, a) => sum + getAthleteTotal(a), 0)

  const getTeamHasAllScores = (team: Team) =>
    team.athletes.every((a) => apparatuses.every((app) => getScore(a, app) != null))

  const sorted = [...teams].sort((a, b) => getTeamTotal(b) - getTeamTotal(a))

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Medal size={16} className="text-slate-600" />
        <h2 className="font-bold text-slate-800">Mannschaftswertung</h2>
      </div>
      <div className="space-y-3">
        {sorted.map((team, rank) => {
          const total = getTeamTotal(team)
          const hasAll = getTeamHasAllScores(team)
          return (
            <div key={team.name} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{MEDALS[rank] ?? `${rank + 1}.`}</span>
                  <span className="font-bold text-slate-800">{team.name}</span>
                </div>
                {hasAll ? (
                  <span className="text-xl font-extrabold text-blue-700 tabular-nums">
                    {total.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm">läuft...</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {team.athletes.map((athlete) => {
                  const t = getAthleteTotal(athlete)
                  const allDone = apparatuses.every((app) => getScore(athlete, app) != null)
                  return (
                    <span
                      key={athlete}
                      className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {athlete}
                      {allDone && (
                        <span className="ml-1.5 text-blue-600 font-bold">{t.toFixed(2)}</span>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompetitionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [scores, setScores] = useState<ScoresMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editCell, setEditCell] = useState<{ athlete: string; apparatus: string } | null>(null)
  const [judgeName, setJudgeName] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('stv_judge_name') ?? ''
    return ''
  })
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const recentKeys = useRef<Set<string>>(new Set())
  const [, setRecentTick] = useState(0)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'competitions', params.id),
      (snap) => {
        if (!snap.exists()) { setError('Wettkampf nicht gefunden.'); setLoading(false); return }
        setCompetition({ id: snap.id, ...snap.data(), createdAt: snap.data().createdAt?.toDate() ?? new Date() } as Competition)
        setLoading(false)
      },
      () => { setError('Fehler beim Laden.'); setLoading(false) }
    )
    return () => unsub()
  }, [params.id])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'competitions', params.id, 'scores'), (snapshot) => {
      const map: ScoresMap = {}
      snapshot.docs.forEach((d) => {
        const data = d.data()
        map[d.id] = {
          score: data.score,
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          updatedBy: data.updatedBy ?? '',
        }
        const ago = Date.now() - (data.updatedAt?.toDate() ?? new Date()).getTime()
        if (ago < 3000) {
          recentKeys.current.add(d.id)
          setTimeout(() => { recentKeys.current.delete(d.id); setRecentTick((t) => t + 1) }, 3000)
        }
      })
      setScores(map)
    })
    return () => unsub()
  }, [params.id])

  const saveScore = useCallback(
    async (athlete: string, apparatus: string, score: number) => {
      const key = SCORE_KEY(athlete, apparatus)
      const ref = doc(db, 'competitions', params.id, 'scores', key)
      try {
        await updateDoc(ref, { score, updatedAt: serverTimestamp(), updatedBy: judgeName, athlete, apparatus })
      } catch {
        const { setDoc } = await import('firebase/firestore')
        await setDoc(ref, { score, updatedAt: serverTimestamp(), updatedBy: judgeName, athlete, apparatus })
      }
      setEditCell(null)
    },
    [params.id, judgeName]
  )

  const saveName = async () => {
    if (!nameDraft.trim() || !competition) return
    await updateDoc(doc(db, 'competitions', params.id), { name: nameDraft.trim() })
    setEditingName(false)
  }

  const handleDelete = async () => {
    if (!competition) return
    setDeleting(true)
    const scoresSnap = await getDocs(collection(db, 'competitions', params.id, 'scores'))
    await Promise.all(scoresSnap.docs.map((d) => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'competitions', params.id))
    router.push('/')
  }

  const getScore = (athlete: string, apparatus: string) =>
    scores[SCORE_KEY(athlete, apparatus)]?.score ?? null

  const getAthleteTotal = (athlete: string) =>
    (competition?.apparatuses ?? []).reduce((sum, app) => sum + (getScore(athlete, app) ?? 0), 0)

  const athleteHasAll = (athlete: string) =>
    (competition?.apparatuses ?? []).every((app) => getScore(athlete, app) != null)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Lade Wettkampf...</p>
        </div>
      </div>
    )
  }

  if (error || !competition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-100">
        <p className="text-red-600 font-semibold text-center mb-4">{error || 'Wettkampf nicht gefunden'}</p>
        <button onClick={() => router.push('/')} className="text-blue-600 font-bold">Zurück zur Übersicht</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <JudgeInput value={judgeName} onChange={setJudgeName} />

      {showDelete && (
        <DeleteConfirm
          name={competition.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-500 text-white px-5 pt-12 pb-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-blue-100 -ml-1 active:text-white"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Übersicht</span>
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="bg-white/10 rounded-xl p-2 active:bg-white/20"
            title="Wettkampf löschen"
          >
            <Trash2 size={18} className="text-red-300" />
          </button>
        </div>

        {/* Editable name */}
        <div className="flex items-start gap-2">
          {editingName ? (
            <div className="flex-1 flex gap-2">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                className="flex-1 bg-white/20 text-white placeholder:text-white/50 font-bold text-lg rounded-xl px-3 py-2 outline-none border border-white/30"
              />
              <button onClick={saveName} className="bg-white/20 rounded-xl px-3 py-2 active:bg-white/30">
                <Check size={18} />
              </button>
              <button onClick={() => setEditingName(false)} className="bg-white/10 rounded-xl px-3 py-2 active:bg-white/20">
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {competition.level}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  competition.status === 'completed' ? 'bg-emerald-400/30 text-emerald-100' : 'bg-blue-400/30 text-blue-100'
                }`}>
                  {competition.status === 'completed' ? 'Abgeschlossen' : 'Aktiv'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold leading-snug">{competition.name}</h1>
                <button
                  onClick={() => { setNameDraft(competition.name); setEditingName(true) }}
                  className="text-blue-200 active:text-white mt-0.5"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {judgeName && (
          <div className="flex items-center gap-1.5 mt-3 text-blue-200 text-xs">
            <Users size={12} />
            <span>Bewerter: <span className="text-white font-semibold">{judgeName}</span></span>
            <button
              onClick={() => { localStorage.removeItem('stv_judge_name'); setJudgeName('') }}
              className="ml-1 text-blue-300 active:text-white"
            >
              <Edit3 size={11} />
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-5">

        {/* Score table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="table-scroll">
            <table className="w-full border-collapse" style={{ minWidth: 320 }}>
              <thead>
                <tr className="bg-slate-50">
                  <th
                    className="sticky left-0 z-10 bg-slate-50 text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-200"
                    style={{ minWidth: 90 }}
                  >
                    Turner
                  </th>
                  {competition.apparatuses.map((app) => (
                    <th
                      key={app}
                      className="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-200"
                      style={{ minWidth: 68 }}
                    >
                      {app}
                    </th>
                  ))}
                  <th
                    className="text-center px-2 py-3 text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-slate-200 bg-blue-50/50"
                    style={{ minWidth: 68 }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {competition.athletes.map((athlete, ai) => {
                  const total = getAthleteTotal(athlete)
                  const allDone = athleteHasAll(athlete)
                  return (
                    <tr key={athlete} className={ai % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td
                        className="sticky left-0 z-10 px-4 border-b border-r border-slate-100 font-semibold text-slate-700 text-sm"
                        style={{ background: ai % 2 === 0 ? 'white' : '#f8fafc' }}
                      >
                        {athlete}
                      </td>
                      {competition.apparatuses.map((apparatus) => {
                        const key = SCORE_KEY(athlete, apparatus)
                        const score = getScore(athlete, apparatus)
                        const recently = recentKeys.current.has(key)
                        return (
                          <td
                            key={apparatus}
                            onClick={() => setEditCell({ athlete, apparatus })}
                            className={`text-center border-b border-r border-slate-100 cursor-pointer select-none active:bg-blue-50 transition-colors ${recently ? 'bg-blue-50' : ''}`}
                            style={{ minWidth: 68, height: 52 }}
                            title={scores[key]?.updatedBy ? `Erfasst von: ${scores[key].updatedBy}` : ''}
                          >
                            {score != null ? (
                              <span className="font-bold text-blue-700 text-base tabular-nums">
                                {score.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xl">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center border-b border-slate-100 bg-blue-50/50" style={{ minWidth: 68 }}>
                        {allDone ? (
                          <span className="font-extrabold text-blue-700 tabular-nums text-base">
                            {total.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 px-1">
          <Info size={12} className="text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            Tippe auf eine Zelle, um die Note zu erfassen. Startgerät:{' '}
            <span className="font-semibold">{competition.startApparatus ?? competition.apparatuses[0]}</span>
          </p>
        </div>

        {/* Team results */}
        {competition.hasTeams && competition.teams?.length > 0 && (
          <TeamResults
            teams={competition.teams}
            athletes={competition.athletes}
            apparatuses={competition.apparatuses}
            scores={scores}
          />
        )}

        <div className="h-8" />
      </main>

      {editCell && (
        <ScorePicker
          athlete={editCell.athlete}
          apparatus={editCell.apparatus}
          currentScore={getScore(editCell.athlete, editCell.apparatus)}
          onSave={(score) => saveScore(editCell.athlete, editCell.apparatus, score)}
          onClose={() => setEditCell(null)}
        />
      )}
    </div>
  )
}
