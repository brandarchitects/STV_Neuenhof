'use client'

import { Competition, GENDER_LABEL } from '@/lib/types'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar, Users, ChevronRight, CheckCircle, Circle } from 'lucide-react'

export const LEVEL_COLORS: Record<string, string> = {
  K1: 'bg-green-100 text-green-700',
  K2: 'bg-orange-100 text-[#c97c0e]',
  K3: 'bg-purple-100 text-purple-700',
  K4: 'bg-amber-100 text-amber-700',
  K5: 'bg-red-100 text-red-700',
  K6: 'bg-pink-100 text-pink-700',
  K7: 'bg-slate-100 text-slate-700',
}

export default function CompetitionCard({
  competition,
  onClick,
  onToggleStatus,
  compact = false,
}: {
  competition: Competition
  onClick: () => void
  onToggleStatus?: (e: React.MouseEvent) => void
  compact?: boolean
}) {
  const comp = competition

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-98 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                LEVEL_COLORS[comp.level] ?? 'bg-slate-100 text-slate-600'
              }`}
            >
              {comp.level}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {GENDER_LABEL[comp.gender]}
            </span>
            {onToggleStatus ? (
              <button
                onClick={onToggleStatus}
                className={`text-xs font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-colors ${
                  comp.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-orange-50 text-[#f29411]'
                }`}
              >
                {comp.status === 'completed' ? (
                  <><CheckCircle size={12} /> Abgeschlossen</>
                ) : (
                  <><Circle size={12} /> Aktiv</>
                )}
              </button>
            ) : (
              comp.status === 'completed' && (
                <span className="text-xs font-medium flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle size={12} /> Abgeschlossen
                </span>
              )
            )}
          </div>

          <h3 className="font-bold text-slate-800 text-base leading-snug truncate">
            {comp.name}
          </h3>

          <div className="flex items-center gap-4 mt-2.5 text-slate-400 text-xs">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {comp.date
                ? format(new Date(comp.date), 'dd. MMM yyyy', { locale: de })
                : '—'}
            </span>
            <span className="flex items-center gap-1">
              <Users size={12} />
              {comp.athletes.length} Turner
            </span>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-300 mt-1 flex-shrink-0" />
      </div>

      {!compact && (
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
      )}
    </div>
  )
}
