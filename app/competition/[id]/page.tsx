'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  doc,
  onSnapshot,
  collection,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Competition, ScoresMap, SCORE_KEY, QUICK_SCORES } from '@/lib/types'
import { ArrowLeft, Edit3, X, Check, Users, Info } from 'lucide-react'

// ─── Score Picker ────────────────────────────────────────────────────────────

interface ScorePickerProps {
  athlete: string
  apparatus: string
  currentScore: number | null
  judgeId: string
  onSave: (score: number) => void
  onClose: () => void
}

function ScorePicker({
  athlete,
  apparatus,
  currentScore,
  onSave,
  onClose,
}: ScorePickerProps) {
  const [value, setValue] = useState<number | null>(currentScore)
  const [showAll, setShowAll] = useState(false)

  const round2 = (n: number) => Math.round(n * 100) / 100

  const adjust = (delta: number) => {
    const base = value ?? 8.80
    const next = round2(Math.min(10, Math.max(0, base + delta)))
    setValue(next)
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
    8.00, 8.10, 8.20, 8.30, 8.40,
    9.50, 9.60, 9.70, 9.80, 9.90, 10.00,
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 fade-in" />

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl w-full max-w-lg shadow-2xl slide-up">
        {/* Handle */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
              {apparatus}
            </p>
            <h2 className="text-lg font-extrabold text-slate-800">{athlete}</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-100 rounded-full p-2 active:bg-slate-200"
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Score display */}
        <div className="flex items-center justify-center gap-5 py-5 bg-slate-50">
          <button
            onClick={() => adjust(-0.05)}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xl font-bold shadow-sm active:bg-slate-100 transition-all flex items-center justify-center"
          >
            −
          </button>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-blue-700 tabular-nums w-32 text-center">
              {value != null ? value.toFixed(2) : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Punkte</div>
          </div>
          <button
            onClick={() => adjust(+0.05)}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xl font-bold shadow-sm active:bg-slate-100 transition-all flex items-center justify-center"
          >
            +
          </button>
        </div>

        {/* Quick scores */}
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

          {/* Extra scores toggle */}
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

        {/* Action buttons */}
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
            className="flex-2 flex-[2] py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-base shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={3} />
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Judge Name Input ────────────────────────────────────────────────────────

function JudgeInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [editing, setEditing] = useState(!value)
  const [draft, setDraft] = useState(value)

  const save = () => {
    if (draft.trim()) {
      onChange(draft.trim())
      setEditing(false)
      localStorage.setItem('stv_judge_name', draft.trim())
    }
  }

  if (editing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 fade-in px-6">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl slide-up">
          <div className="text-center mb-5">
            <div className="bg-blue-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800">Dein Name</h2>
            <p className="text-slate-400 text-sm mt-1">
              Damit wird angezeigt, wer welche Note erfasst hat.
            </p>
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
  return null
}

// ─── Score Cell ───────────────────────────────────────────────────────────────

function ScoreCell({
  score,
  recently,
  onClick,
}: {
  score: number | null
  recently: boolean
  onClick: () => void
}) {
  return (
    <td
      onClick={onClick}
      className={`text-center border-b border-r border-slate-100 cursor-pointer select-none transition-colors ${
        recently ? 'score-updated' : ''
      }`}
      style={{ minWidth: 64, height: 52 }}
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
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompetitionPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [scores, setScores] = useState<ScoresMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editCell, setEditCell] = useState<{
    athlete: string
    apparatus: string
  } | null>(null)
  const [judgeName, setJudgeName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stv_judge_name') ?? ''
    }
    return ''
  })
  const recentKeys = useRef<Set<string>>(new Set())
  const [recentTick, setRecentTick] = useState(0)

  // Load competition
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'competitions', params.id),
      (snap) => {
        if (!snap.exists()) {
          setError('Wettkampf nicht gefunden.')
          setLoading(false)
          return
        }
        setCompetition({
          id: snap.id,
          ...snap.data(),
          createdAt: snap.data().createdAt?.toDate() ?? new Date(),
        } as Competition)
        setLoading(false)
      },
      (err) => {
        setError('Fehler beim Laden.')
        setLoading(false)
      }
    )
    return () => unsub()
  }, [params.id])

  // Load scores realtime
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'competitions', params.id, 'scores'),
      (snapshot) => {
        const map: ScoresMap = {}
        snapshot.docs.forEach((d) => {
          const data = d.data()
          const key = d.id
          map[key] = {
            score: data.score,
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            updatedBy: data.updatedBy ?? '',
          }
          // Mark as recently updated if within 3s
          const ago = Date.now() - (data.updatedAt?.toDate() ?? new Date()).getTime()
          if (ago < 3000) {
            recentKeys.current.add(key)
            setTimeout(() => {
              recentKeys.current.delete(key)
              setRecentTick((t) => t + 1)
            }, 3000)
          }
        })
        setScores(map)
      }
    )
    return () => unsub()
  }, [params.id])

  const saveScore = useCallback(
    async (athlete: string, apparatus: string, score: number) => {
      const key = SCORE_KEY(athlete, apparatus)
      const ref = doc(db, 'competitions', params.id, 'scores', key)
      await updateDoc(ref, {
        score,
        updatedAt: serverTimestamp(),
        updatedBy: judgeName,
        athlete,
        apparatus,
      }).catch(async () => {
        // Doc might not exist yet — use setDoc via updateDoc fallback
        const { setDoc } = await import('firebase/firestore')
        await setDoc(ref, {
          score,
          updatedAt: serverTimestamp(),
          updatedBy: judgeName,
          athlete,
          apparatus,
        })
      })
      setEditCell(null)
    },
    [params.id, judgeName]
  )

  const getScore = (athlete: string, apparatus: string): number | null => {
    const entry = scores[SCORE_KEY(athlete, apparatus)]
    return entry?.score ?? null
  }

  const getAthleteTotal = (athlete: string): number => {
    if (!competition) return 0
    return competition.apparatuses.reduce((sum, app) => {
      const s = getScore(athlete, app)
      return sum + (s ?? 0)
    }, 0)
  }

  const getApparatusTotal = (apparatus: string): number => {
    if (!competition) return 0
    return competition.athletes.reduce((sum, ath) => {
      const s = getScore(ath, apparatus)
      return sum + (s ?? 0)
    }, 0)
  }

  const grandTotal = (): number => {
    if (!competition) return 0
    return competition.athletes.reduce((sum, ath) => sum + getAthleteTotal(ath), 0)
  }

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
        <p className="text-red-600 font-semibold text-center mb-4">
          {error || 'Wettkampf nicht gefunden'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 font-bold"
        >
          Zurück zur Übersicht
        </button>
      </div>
    )
  }

  const hasAllScores = competition.athletes.every((ath) =>
    competition.apparatuses.every((app) => getScore(ath, app) != null)
  )

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <JudgeInput
        value={judgeName}
        onChange={setJudgeName}
      />

      {/* Header */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-500 text-white px-5 pt-12 pb-5 shadow-lg">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-blue-100 mb-4 -ml-1 active:text-white"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Übersicht</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {competition.level}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  competition.status === 'completed'
                    ? 'bg-emerald-400/30 text-emerald-100'
                    : 'bg-blue-400/30 text-blue-100'
                }`}
              >
                {competition.status === 'completed' ? 'Abgeschlossen' : 'Aktiv'}
              </span>
            </div>
            <h1 className="text-xl font-extrabold leading-snug">{competition.name}</h1>
          </div>
        </div>
        {judgeName && (
          <div className="flex items-center gap-1.5 mt-3 text-blue-200 text-xs">
            <Users size={12} />
            <span>
              Bewerter: <span className="text-white font-semibold">{judgeName}</span>
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('stv_judge_name')
                setJudgeName('')
              }}
              className="ml-1 text-blue-300 active:text-white"
            >
              <Edit3 size={11} />
            </button>
          </div>
        )}
      </header>

      {/* Score table */}
      <main className="flex-1 px-4 py-5">
        {/* Completion indicator */}
        {hasAllScores && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <p className="text-emerald-700 text-sm font-semibold">
              Alle Noten erfasst! Total: {grandTotal().toFixed(2)} Punkte
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="table-scroll">
            <table className="w-full border-collapse" style={{ minWidth: 320 }}>
              <thead>
                <tr className="bg-slate-50">
                  {/* Name column header */}
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
                      style={{ minWidth: 64 }}
                    >
                      {app}
                    </th>
                  ))}
                  <th
                    className="text-center px-2 py-3 text-xs font-bold text-blue-600 uppercase tracking-wide border-b border-slate-200 bg-blue-50/50"
                    style={{ minWidth: 64 }}
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {competition.athletes.map((athlete, ai) => {
                  const athleteTotal = getAthleteTotal(athlete)
                  const hasAllForAthlete = competition.apparatuses.every(
                    (app) => getScore(athlete, app) != null
                  )
                  return (
                    <tr
                      key={athlete}
                      className={ai % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    >
                      {/* Name */}
                      <td
                        className="sticky left-0 z-10 px-4 border-b border-r border-slate-100 font-semibold text-slate-700 text-sm"
                        style={{
                          background: ai % 2 === 0 ? 'white' : '#f8fafc',
                        }}
                      >
                        {athlete}
                      </td>
                      {/* Scores */}
                      {competition.apparatuses.map((apparatus) => {
                        const key = SCORE_KEY(athlete, apparatus)
                        const score = getScore(athlete, apparatus)
                        const recently = recentKeys.current.has(key)
                        const lastBy = scores[key]?.updatedBy
                        return (
                          <td
                            key={apparatus}
                            onClick={() => setEditCell({ athlete, apparatus })}
                            className={`text-center border-b border-r border-slate-100 cursor-pointer select-none transition-colors active:bg-blue-50 ${
                              recently ? 'bg-blue-50' : ''
                            }`}
                            style={{ minWidth: 64, height: 52 }}
                            title={lastBy ? `Erfasst von: ${lastBy}` : ''}
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
                      {/* Row total */}
                      <td
                        className="text-center border-b border-slate-100 bg-blue-50/50"
                        style={{ minWidth: 64 }}
                      >
                        {hasAllForAthlete ? (
                          <span className="font-extrabold text-blue-700 tabular-nums text-base">
                            {athleteTotal.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="bg-slate-700">
                  <td className="sticky left-0 z-10 px-4 py-3 text-xs font-bold text-slate-300 uppercase tracking-wide bg-slate-700">
                    Total
                  </td>
                  {competition.apparatuses.map((app) => {
                    const total = getApparatusTotal(app)
                    const allEntered = competition.athletes.every(
                      (ath) => getScore(ath, app) != null
                    )
                    return (
                      <td
                        key={app}
                        className="text-center py-3 border-r border-slate-600"
                      >
                        {allEntered ? (
                          <span className="font-extrabold text-white tabular-nums">
                            {total.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-center py-3">
                    {hasAllScores ? (
                      <span className="font-extrabold text-emerald-400 tabular-nums">
                        {grandTotal().toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">—</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 px-1">
          <Info size={12} className="text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            Tippe auf eine Zelle, um die Note zu erfassen oder zu ändern.
            Alle Änderungen werden sofort für alle synchronisiert.
          </p>
        </div>

        <div className="h-8" />
      </main>

      {/* Score Picker Modal */}
      {editCell && (
        <ScorePicker
          athlete={editCell.athlete}
          apparatus={editCell.apparatus}
          currentScore={getScore(editCell.athlete, editCell.apparatus)}
          judgeId={judgeName}
          onSave={(score) => saveScore(editCell.athlete, editCell.apparatus, score)}
          onClose={() => setEditCell(null)}
        />
      )}
    </div>
  )
}
