'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
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
  ArrowLeft, Edit3, X, Check, Users, Info, Trash2, AlertTriangle, Medal,
} from 'lucide-react'

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316']

function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: ((i * 13.7 + 5) % 100),
        delay: (i % 20) * 0.1,
        duration: 1.6 + (i % 6) * 0.15,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 5) * 2,
        circle: i % 3 === 0,
      })),
    [count]
  )
  return (
    <div className="fixed inset-0 pointer-events-none z-[300] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: -12,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.circle ? '50%' : 3,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Welcome Toast ────────────────────────────────────────────────────────────

function WelcomeToast({ name, onDone }: { name: string; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2400)
    const t2 = setTimeout(onDone, 2900)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <Confetti count={50} />
      <div className={`bg-white rounded-3xl shadow-2xl px-8 py-7 text-center mx-6 pop-in ${leaving ? 'fade-out' : ''}`}>
        <div className="text-5xl mb-3">👋</div>
        <h2 className="text-2xl font-extrabold text-slate-800">Hallo, {name}!</h2>
        <p className="text-[#f29411] font-semibold mt-1">Willkommen zum Wettkampf</p>
        <p className="text-slate-400 text-sm mt-1">Hopp Neuenhof! 💪</p>
      </div>
    </div>
  )
}

// ─── Completion Banner ─────────────────────────────────────────────────────────

function CompletionBanner({ competitionName }: { competitionName: string }) {
  const [showConfetti, setShowConfetti] = useState(true)
  useEffect(() => { const t = setTimeout(() => setShowConfetti(false), 4000); return () => clearTimeout(t) }, [])

  return (
    <>
      {showConfetti && <Confetti count={80} />}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl px-5 py-4 mb-4 shadow-lg shadow-emerald-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎊</span>
          <div>
            <p className="font-extrabold text-lg leading-snug">Wettkampf abgeschlossen!</p>
            <p className="text-emerald-100 text-sm">Herzliche Gratulation – alle Noten sind erfasst!</p>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Score Picker ─────────────────────────────────────────────────────────────

function ScorePicker({
  athlete, apparatus, currentScore, onSave, onClose,
}: {
  athlete: string; apparatus: string; currentScore: number | null
  onSave: (score: number) => void; onClose: () => void
}) {
  const [value, setValue] = useState<number | null>(currentScore)
  const [showAll, setShowAll] = useState(false)

  const round2 = (n: number) => Math.round(n * 20) / 20
  const adjust = (delta: number) => {
    setValue(round2(Math.min(10, Math.max(0, (value ?? 8.80) + delta))))
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
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
          <button onClick={() => adjust(-0.05)} className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xl font-bold shadow-sm active:bg-slate-100 flex items-center justify-center">−</button>
          <div className="text-center">
            <div className="text-5xl font-extrabold text-[#c97c0e] tabular-nums w-32 text-center">
              {value != null ? value.toFixed(2) : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Punkte</div>
          </div>
          <button onClick={() => adjust(+0.05)} className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 text-xl font-bold shadow-sm active:bg-slate-100 flex items-center justify-center">+</button>
        </div>

        <div className="px-4 pb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5 px-1">Schnellauswahl</p>
          <div className="grid grid-cols-4 gap-1.5">
            {HIGHLIGHTED.map((s) => (
              <button key={s} onClick={() => setValue(s)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${value === s ? 'bg-[#f29411] text-white shadow-md shadow-orange-200 scale-105' : 'bg-slate-50 text-slate-700 border border-slate-200 active:bg-orange-50'}`}>
                {s.toFixed(2)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAll(p => !p)} className="w-full mt-2 py-2.5 text-xs font-semibold text-[#f29411] flex items-center justify-center gap-1">
            {showAll ? 'Weniger anzeigen ↑' : 'Weitere Noten ↓'}
          </button>
          {showAll && (
            <div className="grid grid-cols-4 gap-1.5 mb-1">
              {EXTRA.map((s) => (
                <button key={s} onClick={() => setValue(s)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${value === s ? 'bg-[#f29411] text-white' : 'bg-slate-50 text-slate-600 border border-slate-200 active:bg-orange-50'}`}>
                  {s.toFixed(2)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-4 pt-2 pb-8">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold text-base active:bg-slate-50">Abbrechen</button>
          <button onClick={() => value != null && onSave(value)} disabled={value == null}
            className="flex-[2] py-4 rounded-2xl bg-[#f29411] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-base shadow-md shadow-orange-200 flex items-center justify-center gap-2">
            <Check size={18} strokeWidth={3} /> Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Judge Name ───────────────────────────────────────────────────────────────

function JudgeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  if (value) return null

  const save = () => {
    if (!draft.trim()) return
    onChange(draft.trim())
    localStorage.setItem('stv_judge_name', draft.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 fade-in px-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl slide-up">
        <div className="text-center mb-5">
          <div className="bg-orange-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
            <Users size={24} className="text-[#f29411]" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Dein Name</h2>
          <p className="text-slate-400 text-sm mt-1">Damit wird angezeigt, wer welche Note erfasst hat.</p>
        </div>
        <input autoFocus type="text" value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Name eingeben..."
          className="w-full border-2 border-slate-200 focus:border-orange-400 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold text-base outline-none transition-colors" />
        <button onClick={save} disabled={!draft.trim()}
          className="w-full mt-3 bg-[#f29411] disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold py-4 rounded-2xl transition-all">
          Weiter
        </button>
      </div>
    </div>
  )
}

// ─── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [typed, setTyped] = useState('')
  const confirmed = typed === 'Ja'

  if (step === 1) {
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
            <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm">Abbrechen</button>
            <button onClick={() => setStep(2)} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-md shadow-red-100">Löschen</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 fade-in px-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl slide-up">
        <div className="text-center mb-5">
          <div className="bg-red-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Wirklich löschen?</h2>
          <p className="text-slate-500 text-sm mt-2">
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <p className="text-slate-600 text-sm mt-3 font-medium">
            Tippe <span className="font-extrabold text-red-500">Ja</span> um zu bestätigen:
          </p>
        </div>
        <input
          autoFocus
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && confirmed && onConfirm()}
          placeholder="Ja"
          className={`w-full text-center border-2 rounded-2xl px-4 py-3.5 text-slate-800 font-bold text-lg outline-none transition-all ${
            confirmed ? 'border-red-400 bg-red-50' : 'border-slate-200'
          }`}
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm">Abbrechen</button>
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md shadow-red-100 transition-all"
          >
            Endgültig löschen
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Team Results ──────────────────────────────────────────────────────────────

function TeamResults({ teams, athletes, apparatuses, scores }: {
  teams: Team[]; athletes: string[]; apparatuses: string[]; scores: ScoresMap
}) {
  if (!teams?.length) return null
  const g = (a: string, app: string) => scores[SCORE_KEY(a, app)]?.score ?? null
  const athleteTotal = (a: string) => apparatuses.reduce((s, app) => s + (g(a, app) ?? 0), 0)
  const allDone = (t: Team) => t.athletes.every(a => apparatuses.every(app => g(a, app) != null))
  const dropRule = (t: Team) => t.athletes.length >= 4

  // Per apparatus: if team >= 4, drop lowest score
  const apparatusTeamScore = (t: Team, app: string): number => {
    const appScores = t.athletes
      .map(a => g(a, app))
      .filter((s): s is number => s != null)
    if (appScores.length === 0) return 0
    if (dropRule(t) && appScores.length >= 4) {
      const sorted = [...appScores].sort((a, b) => a - b)
      return sorted.slice(1).reduce((s, v) => s + v, 0) // drop lowest
    }
    return appScores.reduce((s, v) => s + v, 0)
  }

  // Which athlete has the lowest score at a given apparatus (to mark it as dropped)
  const droppedAthlete = (t: Team, app: string): string | null => {
    if (!dropRule(t)) return null
    const scored = t.athletes
      .map(a => ({ a, s: g(a, app) }))
      .filter((x): x is { a: string; s: number } => x.s != null)
    if (scored.length < 4) return null
    return scored.reduce((min, x) => (x.s < min.s ? x : min)).a
  }

  // Athlete total excluding any scores that were dropped for their team
  const athleteEffectiveTotal = (t: Team, a: string): number =>
    apparatuses.reduce((sum, app) => {
      const score = g(a, app)
      if (score == null) return sum
      if (droppedAthlete(t, app) === a) return sum // exclude dropped
      return sum + score
    }, 0)

  const teamTotal = (t: Team) => apparatuses.reduce((s, app) => s + apparatusTeamScore(t, app), 0)
  const sorted = [...teams].sort((a, b) => teamTotal(b) - teamTotal(a))
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Medal size={16} className="text-slate-600" />
        <h2 className="font-bold text-slate-800">Mannschaftswertung</h2>
      </div>
      <div className="space-y-3">
        {sorted.map((team, rank) => (
          <div key={team.name} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{MEDALS[rank] ?? `${rank + 1}.`}</span>
                <span className="font-bold text-slate-800">{team.name}</span>
              </div>
              {allDone(team) ? (
                <span className="text-xl font-extrabold text-[#c97c0e] tabular-nums">{teamTotal(team).toFixed(2)}</span>
              ) : (
                <span className="text-slate-400 text-sm">läuft...</span>
              )}
            </div>
            {dropRule(team) && (
              <p className="text-xs text-slate-400 mb-2">
                Tiefste Note je Gerät wird gestrichen
              </p>
            )}
            {/* Per-apparatus breakdown */}
            <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `repeat(${apparatuses.length}, 1fr)` }}>
              {apparatuses.map(app => {
                const appScore = apparatusTeamScore(team, app)
                const hasDrop = dropRule(team) && team.athletes.filter(a => g(a, app) != null).length >= 4
                const done = team.athletes.every(a => g(a, app) != null)
                return (
                  <div key={app} className="text-center bg-slate-50 rounded-lg py-1.5 px-1">
                    <div className="text-xs text-slate-400 font-medium truncate">{app}</div>
                    {done ? (
                      <div className="text-sm font-bold text-slate-700 tabular-nums">
                        {appScore.toFixed(2)}
                        {hasDrop && <span className="text-orange-400 text-xs ml-0.5">*</span>}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-300">—</div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* Athletes with dropped indicator */}
            <div className="flex flex-wrap gap-1.5">
              {team.athletes.map(athlete => {
                const done = apparatuses.every(app => g(athlete, app) != null)
                const droppedApps = apparatuses.filter(app => droppedAthlete(team, app) === athlete)
                const droppedScore = droppedApps.reduce((s, app) => s + (g(athlete, app) ?? 0), 0)
                const effectiveTotal = athleteEffectiveTotal(team, athlete)
                return (
                  <span key={athlete} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                    {athlete}
                    {done && (
                      <>
                        <span className="text-[#f29411] font-bold tabular-nums">{effectiveTotal.toFixed(2)}</span>
                        {droppedApps.length > 0 && (
                          <span
                            className="text-slate-300 line-through tabular-nums text-xs"
                            title={`Gestrichen bei: ${droppedApps.join(', ')}`}
                          >
                            {(effectiveTotal + droppedScore).toFixed(2)}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="text-center py-5 px-4">
      <p className="text-xs text-slate-400">
        App gesponsert durch{' '}
        <a href="https://www.brandarchitects.ch" target="_blank" rel="noopener noreferrer"
          className="text-[#f29411] font-semibold hover:underline">
          Brand Architects
        </a>
      </p>
    </footer>
  )
}

// ─── Rank badge helpers ────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number | null }) {
  if (rank == null) return null
  return (
    <span className="text-slate-400 text-xs font-semibold">
      {rank}.
    </span>
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
  const [judgeName, setJudgeName] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('stv_judge_name') ?? '') : ''
  )
  const [showWelcome, setShowWelcome] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const prevCompleted = useRef(false)
  const [completionBurst, setCompletionBurst] = useState(false)
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
        map[d.id] = { score: data.score, updatedAt: data.updatedAt?.toDate() ?? new Date(), updatedBy: data.updatedBy ?? '' }
        const ago = Date.now() - (data.updatedAt?.toDate() ?? new Date()).getTime()
        if (ago < 3000) {
          recentKeys.current.add(d.id)
          setTimeout(() => { recentKeys.current.delete(d.id); setRecentTick(t => t + 1) }, 3000)
        }
      })
      setScores(map)
    })
    return () => unsub()
  }, [params.id])

  const handleSetJudgeName = useCallback((name: string) => {
    setJudgeName(name)
    setShowWelcome(true)
  }, [])

  const saveScore = useCallback(async (athlete: string, apparatus: string, score: number) => {
    const key = SCORE_KEY(athlete, apparatus)
    const ref = doc(db, 'competitions', params.id, 'scores', key)
    try {
      await updateDoc(ref, { score, updatedAt: serverTimestamp(), updatedBy: judgeName, athlete, apparatus })
    } catch {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(ref, { score, updatedAt: serverTimestamp(), updatedBy: judgeName, athlete, apparatus })
    }
    setEditCell(null)
  }, [params.id, judgeName])

  const saveName = async () => {
    if (!nameDraft.trim()) return
    await updateDoc(doc(db, 'competitions', params.id), { name: nameDraft.trim() })
    setEditingName(false)
  }

  const handleDelete = async () => {
    const scoresSnap = await getDocs(collection(db, 'competitions', params.id, 'scores'))
    await Promise.all(scoresSnap.docs.map(d => deleteDoc(d.ref)))
    await deleteDoc(doc(db, 'competitions', params.id))
    router.push('/')
  }

  const getScore = (athlete: string, apparatus: string) =>
    scores[SCORE_KEY(athlete, apparatus)]?.score ?? null

  const athleteHasAll = (athlete: string) =>
    (competition?.apparatuses ?? []).every(app => getScore(athlete, app) != null)

  const getAthleteTotal = (athlete: string) =>
    (competition?.apparatuses ?? []).reduce((sum, app) => sum + (getScore(athlete, app) ?? 0), 0)

  const hasAllScores = Boolean(
    competition &&
    competition.athletes.every(athleteHasAll)
  )

  // Trigger completion burst once
  useEffect(() => {
    if (hasAllScores && !prevCompleted.current) {
      setCompletionBurst(true)
      prevCompleted.current = true
    }
  }, [hasAllScores])

  // Rank calculation (live)
  const rankings = useMemo<Record<string, number>>(() => {
    if (!competition) return {}
    const completed = competition.athletes
      .filter(a => (competition.apparatuses ?? []).every(app => scores[SCORE_KEY(a, app)] != null))
      .map(a => ({ name: a, total: (competition.apparatuses ?? []).reduce((s, app) => s + (scores[SCORE_KEY(a, app)]?.score ?? 0), 0) }))
      .sort((a, b) => b.total - a.total)

    const map: Record<string, number> = {}
    completed.forEach((a, i) => {
      const tied = i > 0 && a.total === completed[i - 1].total
      map[a.name] = tied ? map[completed[i - 1].name] : i + 1
    })
    return map
  }, [competition, scores])

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
        <button onClick={() => router.push('/')} className="text-[#f29411] font-bold">Zurück zur Übersicht</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <JudgeInput value={judgeName} onChange={handleSetJudgeName} />
      {showWelcome && <WelcomeToast name={judgeName} onDone={() => setShowWelcome(false)} />}
      {showDelete && <DeleteConfirm name={competition.name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />}

      {/* Header */}
      <header className="bg-gradient-to-br from-[#c97c0e] to-[#f29411] text-white px-5 pt-12 pb-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-orange-100 -ml-1 active:text-white">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Übersicht</span>
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="bg-white rounded-xl p-2 active:bg-orange-50 shadow-sm"
            title="Wettkampf löschen"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>

        {editingName ? (
          <div className="flex gap-2">
            <input autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
              className="flex-1 bg-white/20 text-white placeholder:text-white/50 font-bold text-lg rounded-xl px-3 py-2 outline-none border border-white/30" />
            <button onClick={saveName} className="bg-white/20 rounded-xl px-3 active:bg-white/30"><Check size={18} /></button>
            <button onClick={() => setEditingName(false)} className="bg-white/10 rounded-xl px-3 active:bg-white/20"><X size={18} /></button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{competition.level}</span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${competition.status === 'completed' ? 'bg-emerald-400/30 text-emerald-100' : 'bg-orange-400/30 text-orange-100'}`}>
                {competition.status === 'completed' ? 'Abgeschlossen' : 'Aktiv'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold leading-snug">{competition.name}</h1>
              <button onClick={() => { setNameDraft(competition.name); setEditingName(true) }} className="text-orange-200 active:text-white mt-0.5">
                <Edit3 size={16} />
              </button>
            </div>
          </div>
        )}

        {judgeName && (
          <div className="flex items-center gap-1.5 mt-3 text-orange-200 text-xs">
            <Users size={12} />
            <span>Bewerter: <span className="text-white font-semibold">{judgeName}</span></span>
            <button onClick={() => { localStorage.removeItem('stv_judge_name'); setJudgeName('') }} className="ml-1 text-orange-300 active:text-white">
              <Edit3 size={11} />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-5">
        {/* Completion banner */}
        {hasAllScores && completionBurst && (
          <CompletionBanner competitionName={competition.name} />
        )}
        {hasAllScores && !completionBurst && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl px-5 py-4 mb-4 shadow-lg shadow-emerald-100 flex items-center gap-3">
            <span className="text-2xl">🎊</span>
            <div>
              <p className="font-extrabold">Wettkampf abgeschlossen!</p>
              <p className="text-emerald-100 text-sm">Alle Noten sind erfasst.</p>
            </div>
          </div>
        )}

        {/* Score table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="table-scroll">
            <table className="w-full border-collapse" style={{ minWidth: 340 }}>
              <thead>
                <tr className="bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-200" style={{ minWidth: 100 }}>
                    Turner
                  </th>
                  {competition.apparatuses.map(app => (
                    <th key={app} className="text-center px-2 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-r border-slate-200" style={{ minWidth: 68 }}>
                      {app}
                    </th>
                  ))}
                  <th className="text-center px-2 py-3 text-xs font-bold text-[#c97c0e] uppercase tracking-wide border-b bg-orange-50" style={{ minWidth: 80 }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {competition.athletes.map((athlete, ai) => {
                  const total = getAthleteTotal(athlete)
                  const allDone = athleteHasAll(athlete)
                  const rank = rankings[athlete] ?? null
                  return (
                    <tr key={athlete} className={ai % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="sticky left-0 z-10 px-4 border-b border-r border-slate-100 font-semibold text-slate-700 text-sm"
                        style={{ background: ai % 2 === 0 ? 'white' : '#f8fafc' }}>
                        {athlete}
                      </td>
                      {competition.apparatuses.map(apparatus => {
                        const key = SCORE_KEY(athlete, apparatus)
                        const score = getScore(athlete, apparatus)
                        const recently = recentKeys.current.has(key)
                        return (
                          <td key={apparatus}
                            onClick={() => setEditCell({ athlete, apparatus })}
                            className={`text-center border-b border-r border-slate-100 cursor-pointer select-none active:bg-orange-50 transition-colors ${recently ? 'bg-orange-50' : ''}`}
                            style={{ minWidth: 68, height: 52 }}
                            title={scores[key]?.updatedBy ? `Erfasst von: ${scores[key].updatedBy}` : ''}>
                            {score != null ? (
                              <span className="font-bold text-slate-700 text-base tabular-nums">{score.toFixed(2)}</span>
                            ) : (
                              <span className="text-slate-300 text-xl">—</span>
                            )}
                          </td>
                        )
                      })}
                      {/* Total cell with rank */}
                      <td className="text-center border-b bg-orange-50 border-slate-100" style={{ minWidth: 80 }}>
                        {allDone ? (
                          <div className="flex flex-col items-center justify-center gap-0.5 py-1">
                            <RankBadge rank={rank} />
                            <span className="font-extrabold tabular-nums text-base text-slate-800 leading-tight">
                              {total.toFixed(2)}
                            </span>
                          </div>
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
            Tippe auf eine Zelle zum Erfassen. Startgerät:{' '}
            <span className="font-semibold">{competition.startApparatus ?? competition.apparatuses[0]}</span>
          </p>
        </div>

        {/* Team results */}
        {competition.hasTeams && competition.teams?.length > 0 && (
          <TeamResults teams={competition.teams} athletes={competition.athletes} apparatuses={competition.apparatuses} scores={scores} />
        )}

        <Footer />
      </main>

      {editCell && (
        <ScorePicker
          athlete={editCell.athlete}
          apparatus={editCell.apparatus}
          currentScore={getScore(editCell.athlete, editCell.apparatus)}
          onSave={score => saveScore(editCell.athlete, editCell.apparatus, score)}
          onClose={() => setEditCell(null)}
        />
      )}
    </div>
  )
}
