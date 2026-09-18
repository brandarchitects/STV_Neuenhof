'use client'

import { Gender } from '@/lib/types'

/**
 * Jede Wettkampfstufe hat eine eigene Farbe, damit bei mehreren Riegen auf
 * einen Blick klar ist, welcher Wettkampf welcher ist. Die Klassennamen stehen
 * bewusst ausgeschrieben da — Tailwind entfernt sonst ungenutzte Farben.
 */
export const LEVEL_SOLID: Record<string, string> = {
  K1: 'bg-emerald-500',
  K2: 'bg-sky-500',
  K3: 'bg-violet-500',
  K4: 'bg-amber-500',
  K5: 'bg-rose-500',
  K6: 'bg-teal-600',
  K7: 'bg-slate-500',
}

export const LEVEL_SOFT: Record<string, string> = {
  K1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  K2: 'bg-sky-50 text-sky-700 border-sky-200',
  K3: 'bg-violet-50 text-violet-700 border-violet-200',
  K4: 'bg-amber-50 text-amber-700 border-amber-200',
  K5: 'bg-rose-50 text-rose-700 border-rose-200',
  K6: 'bg-teal-50 text-teal-700 border-teal-200',
  K7: 'bg-slate-100 text-slate-600 border-slate-200',
}

/** Farbiger Streifen am Kartenrand */
export const LEVEL_BAR: Record<string, string> = {
  K1: 'bg-emerald-500',
  K2: 'bg-sky-500',
  K3: 'bg-violet-500',
  K4: 'bg-amber-500',
  K5: 'bg-rose-500',
  K6: 'bg-teal-600',
  K7: 'bg-slate-400',
}

const FALLBACK_SOLID = 'bg-slate-500'
const FALLBACK_SOFT = 'bg-slate-100 text-slate-600 border-slate-200'

export function LevelBadge({
  level,
  variant = 'solid',
  size = 'md',
}: {
  level: string
  variant?: 'solid' | 'soft'
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  if (variant === 'soft') {
    return (
      <span className={`font-extrabold rounded-lg border ${pad} ${LEVEL_SOFT[level] ?? FALLBACK_SOFT}`}>
        {level}
      </span>
    )
  }
  return (
    <span className={`font-extrabold rounded-lg text-white ${pad} ${LEVEL_SOLID[level] ?? FALLBACK_SOLID}`}>
      {level}
    </span>
  )
}

/**
 * Das Geschlecht bekommt bewusst eine andere Machart als die Stufe — helles
 * Feld mit Symbol statt gefüllter Fläche —, damit die beiden Kennzeichen
 * nebeneinander nicht miteinander verwechselt werden.
 */
export const GENDER_STYLE: Record<Gender, { soft: string; onDark: string; symbol: string; label: string }> = {
  m: {
    soft: 'bg-blue-50 text-blue-700 border-blue-200',
    onDark: 'bg-blue-400/25 text-blue-50',
    symbol: '♂',
    label: 'Jungen',
  },
  w: {
    soft: 'bg-pink-50 text-pink-700 border-pink-200',
    onDark: 'bg-pink-400/25 text-pink-50',
    symbol: '♀',
    label: 'Mädchen',
  },
}

export function GenderBadge({
  gender,
  onDark = false,
  showLabel = true,
  size = 'md',
}: {
  gender: Gender
  onDark?: boolean
  showLabel?: boolean
  size?: 'sm' | 'md'
}) {
  const s = GENDER_STYLE[gender]
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg ${pad} ${
        onDark ? s.onDark : `border ${s.soft}`
      }`}
    >
      <span className="text-sm leading-none">{s.symbol}</span>
      {showLabel && s.label}
    </span>
  )
}
