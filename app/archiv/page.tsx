'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Competition, currentSeason, normalizeCompetition } from '@/lib/types'
import CompetitionCard from '../components/CompetitionCard'
import { ArrowLeft, Archive as ArchiveIcon } from 'lucide-react'

export default function ArchivPage() {
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const season = currentSeason()

  useEffect(() => {
    const q = query(collection(db, 'competitions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setCompetitions(snap.docs.map((d) => normalizeCompetition(d.id, d.data())))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [])

  // group past seasons, newest first
  const seasons = useMemo(() => {
    const past = competitions.filter((c) => c.season < season)
    const map = new Map<number, Competition[]>()
    past.forEach((c) => {
      if (!map.has(c.season)) map.set(c.season, [])
      map.get(c.season)!.push(c)
    })
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [competitions, season])

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <header className="bg-gradient-to-br from-[#c97c0e] to-[#f29411] text-white px-5 pt-12 pb-5 shadow-lg">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-orange-100 -ml-1 mb-4 active:text-white">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Übersicht</span>
        </button>
        <h1 className="text-2xl font-extrabold">Archiv</h1>
        <p className="text-orange-200 text-sm mt-1">Wettkämpfe vergangener Saisons</p>
      </header>

      <main className="flex-1 px-4 py-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : seasons.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <ArchiveIcon size={34} className="text-orange-300" />
            </div>
            <p className="text-slate-600 font-semibold text-lg">Archiv ist leer</p>
            <p className="text-slate-400 text-sm mt-1 px-8">
              Nach dem Jahreswechsel landen die Wettkämpfe der Saison {season}{' '}
              automatisch hier.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {seasons.map(([year, comps]) => (
              <section key={year}>
                <div className="flex items-baseline justify-between mb-3 px-1">
                  <h2 className="text-lg font-extrabold text-slate-800">Saison {year}</h2>
                  <span className="text-xs text-slate-400">
                    {comps.length} {comps.length === 1 ? 'Wettkampf' : 'Wettkämpfe'}
                  </span>
                </div>
                <div className="space-y-3">
                  {comps.map((c) => (
                    <CompetitionCard
                      key={c.id}
                      competition={c}
                      compact
                      onClick={() => router.push(`/competition/${c.id}`)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 py-8">
          App gesponsert durch{' '}
          <a href="https://www.brandarchitects.ch" target="_blank" rel="noopener noreferrer" className="text-[#f29411] font-semibold hover:underline">
            Brand Architects
          </a>
        </p>
      </main>
    </div>
  )
}
