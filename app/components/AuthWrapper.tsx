'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

const AUTH_KEY = 'stv_auth'
const PASSWORD = 'stvneuenhof'

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  const handleLogin = () => {
    if (password === PASSWORD) {
      localStorage.setItem(AUTH_KEY, '1')
      onLogin()
    } else {
      setError(true)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setTimeout(() => setError(false), 2500)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-gradient-to-br from-[#c97c0e] to-[#f29411] px-6">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Logo + title */}
      <div className="text-center mb-10">
        <img
          src="/icon.svg"
          alt="STV Neuenhof"
          className="h-16 w-auto mx-auto mb-6 drop-shadow-lg"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <h1 className="text-3xl font-extrabold text-white tracking-tight">STV Neuenhof</h1>
        <p className="text-orange-100 text-sm mt-1 font-medium">Geräteturnen – Wettkampfbewertung</p>
      </div>

      {/* Login card */}
      <div className={`bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl shadow-orange-900/30 pop-in ${shaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-orange-50 rounded-full p-2.5">
            <Lock size={20} className="text-[#f29411]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Zugang</h2>
            <p className="text-slate-400 text-xs">Bitte Passwort eingeben</p>
          </div>
        </div>

        <div className="relative">
          <input
            autoFocus
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Passwort"
            className={`w-full pr-12 border-2 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold text-base outline-none transition-all ${
              error
                ? 'border-red-400 bg-red-50 placeholder:text-red-300'
                : 'border-slate-200 focus:border-[#f29411] placeholder:text-slate-300'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPw(p => !p)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 active:text-slate-600"
          >
            {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-medium mt-2 text-center fade-in">
            Falsches Passwort. Bitte nochmals versuchen.
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={!password}
          className="w-full mt-4 bg-[#f29411] hover:bg-[#d4820e] active:bg-[#c97c0e] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-md shadow-orange-200 transition-all text-base"
        >
          Einloggen
        </button>
      </div>

      {/* Footer */}
      <p className="text-orange-200/70 text-xs mt-8">
        Gesponsert durch{' '}
        <a href="https://www.brandarchitects.ch" target="_blank" rel="noopener noreferrer" className="text-white/80 font-semibold hover:text-white">
          Brand Architects
        </a>
      </p>
    </div>
  )
}

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    setAuthed(localStorage.getItem(AUTH_KEY) === '1')
  }, [])

  // Avoid flash on initial render
  if (authed === null) return null

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return <>{children}</>
}
