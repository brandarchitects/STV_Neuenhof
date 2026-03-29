'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Competition } from '@/lib/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  Plus,
  Trophy,
  Calendar,
  Users,
  ChevronRight,
  CheckCircle,
  Circle,
  Dumbbell,
} from 'lucide-react'

const LEVEL_COLORS: Record<string, string> = {
  K1: 'bg-green-100 text-green-700',
  K2: 'bg-blue-100 text-blue-700',
  K3: 'bg-purple-100 text-purple-700',
  K4: 'bg-orange-100 text-orange-700',
  K5: 'bg-red-100 text-red-700',
  K6: 'bg-pink-100 text-pink-700',
  K7: 'bg-slate-100 text-slate-700',
}

export default function HomePage() {
  const router = useRouter()
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = query(collection(db, 'competitions'), orderBy('createdAt', 'desc'))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const comps = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() ?? new Date(),
          })) as Competition[]
          setCompetitions(comps)
          setLoading(false)
        },
        (err) => {
          console.error(err)
          setError('Verbindung zur Datenbank fehlgeschlagen. Bitte Firebase konfigurieren.')
          setLoading(false)
        }
      )
      return () => unsubscribe()
    } catch {
      setError('Firebase nicht konfiguriert. Bitte .env.local einrichten.')
      setLoading(false)
    }
  }, [])

  const toggleStatus = async (comp: Competition, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = comp.status === 'active' ? 'completed' : 'active'
    await updateDoc(doc(db, 'competitions', comp.id), { status: newStatus })
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-500 text-white px-5 pt-12 pb-8 shadow-lg">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-white/20 rounded-xl p-2.5">
            <Dumbbell size={24} />
          </div>
          <div>
            <p className="text-blue-100 text-sm font-medium tracking-wide uppercase">
              Turnverein
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">STV Neuenhof</h1>
          </div>
        </div>
        <p className="text-blue-200 text-sm mt-3">Geräteturnen – Wettkampfbewertung</p>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <p className="text-red-500 text-xs mt-1">
              Erstelle eine Firebase-Projekt und trage die Credentials in .env.local ein.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800">Wettkämpfe</h2>
          <span className="text-sm text-slate-500">{competitions.length} Total</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5 shadow-sm animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Trophy size={36} className="text-blue-300" />
            </div>
            <p className="text-slate-600 font-semibold text-lg">Noch kein Wettkampf</p>
            <p className="text-slate-400 text-sm mt-1">
              Erstelle deinen ersten Wettkampf!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {competitions.map((comp) => (
              <div
                key={comp.id}
                onClick={() => router.push(`/competition/${comp.id}`)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-98 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          LEVEL_COLORS[comp.level] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {comp.level}
                      </span>
                      <button
                        onClick={(e) => toggleStatus(comp, e)}
                        className={`text-xs font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${
                          comp.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {comp.status === 'completed' ? (
                          <>
                            <CheckCircle size={12} /> Abgeschlossen
                          </>
                        ) : (
                          <>
                            <Circle size={12} /> Aktiv
                          </>
                        )}
                      </button>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base leading-snug">
                      {comp.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-2.5 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(comp.date), 'dd. MMM yyyy', { locale: de })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {comp.athletes.length} Turner
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 mt-1 flex-shrink-0" />
                </div>

                {/* Apparatus pills */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {comp.apparatuses.map((a) => (
                    <span
                      key={a}
                      className="text-xs bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-lg font-medium"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <div className="sticky bottom-6 flex justify-center pb-2">
        <button
          onClick={() => router.push('/competition/new')}
          className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-95"
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
            className="text-blue-500 font-semibold hover:underline">
            Brand Architects
          </a>
        </p>
      </footer>
    </div>
  )
}
