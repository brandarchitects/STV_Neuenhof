'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection, onSnapshot, query, orderBy, doc, updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Competition, currentSeason, normalizeCompetition } from '@/lib/types'
import CompetitionCard from './components/CompetitionCard'
import { Plus, Trophy, Users, Archive } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const season = currentSeason()

  useEffect(() => {
    try {
      const q = query(collection(db, 'competitions'), orderBy('createdAt', 'desc'))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setCompetitions(
            snapshot.docs.map((d) => normalizeCompetition(d.id, d.data()))
          )
          setLoading(false)
        },
        (err) => {
          console.error(err)
          setError('Verbindung zur Datenbank fehlgeschlagen.')
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } catch {
      setError('Firebase nicht konfiguriert.')
      setLoading(false)
    }
  }, [])

  const toggleStatus = async (comp: Competition) => {
    const newStatus = comp.status === 'active' ? 'completed' : 'active'
    await updateDoc(doc(db, 'competitions', comp.id), { status: newStatus })
  }

  const thisSeason = useMemo(
    () => competitions.filter((c) => c.season === season),
    [competitions, season]
  )
  const archivedCount = competitions.length - thisSeason.length

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#c97c0e] to-[#f29411] text-white px-5 pt-12 pb-8 shadow-lg">
        <div className="flex items-center gap-4 mb-1">
          <img
            src="/icon.svg"
            alt="STV Neuenhof"
            className="h-12 w-auto object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div>
            <p className="text-orange-100 text-xs font-semibold tracking-widest uppercase">
              Turnverein
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight leading-tight">STV Neuenhof</h1>
          </div>
        </div>
        <p className="text-orange-200 text-sm mt-3">Geräteturnen – Wettkampfbewertung</p>
      </header>

      {/* Quick nav */}
      <div className="px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/verwaltung')}
            className="bg-white rounded-2xl px-4 py-3.5 shadow-md flex items-center gap-2.5 active:bg-slate-50 transition-colors"
          >
            <div className="bg-orange-50 rounded-xl p-2">
              <Users size={17} className="text-[#f29411]" />
            </div>
            <span className="font-bold text-slate-700 text-sm">Turner</span>
          </button>
          <button
            onClick={() => router.push('/archiv')}
            className="bg-white rounded-2xl px-4 py-3.5 shadow-md flex items-center gap-2.5 active:bg-slate-50 transition-colors"
          >
            <div className="bg-slate-100 rounded-xl p-2">
              <Archive size={17} className="text-slate-500" />
            </div>
            <div className="text-left min-w-0">
              <span className="font-bold text-slate-700 text-sm block leading-tight">Archiv</span>
              {archivedCount > 0 && (
                <span className="text-xs text-slate-400">{archivedCount} Wettkämpfe</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Saison {season}</h2>
          <span className="text-sm text-slate-400">
            {thisSeason.length} {thisSeason.length === 1 ? 'Wettkampf' : 'Wettkämpfe'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : thisSeason.length === 0 ? (
          <div className="text-center py-14">
            <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Trophy size={36} className="text-orange-300" />
            </div>
            <p className="text-slate-600 font-semibold text-lg">
              Noch kein Wettkampf in {season}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {archivedCount > 0
                ? 'Frühere Wettkämpfe findest du im Archiv.'
                : 'Erstelle deinen ersten Wettkampf!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {thisSeason.map((comp) => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                onClick={() => router.push(`/competition/${comp.id}`)}
                onToggleStatus={(e) => { e.stopPropagation(); toggleStatus(comp) }}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="sticky bottom-6 flex justify-center pb-2">
        <button
          onClick={() => router.push('/competition/new')}
          className="flex items-center gap-2.5 bg-[#f29411] hover:bg-[#c97c0e] active:bg-[#b87212] text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-orange-200 transition-all active:scale-95"
        >
          <Plus size={22} strokeWidth={2.5} />
          Neuer Wettkampf
        </button>
      </div>

      {/* Footer */}
      <footer className="text-center pb-6 pt-2">
        <p className="text-xs text-slate-400">
          App gesponsert durch{' '}
          <a href="https://www.brandarchitects.ch" target="_blank" rel="noopener noreferrer"
            className="text-[#f29411] font-semibold hover:underline">
            Brand Architects
          </a>
        </p>
      </footer>
    </div>
  )
}
