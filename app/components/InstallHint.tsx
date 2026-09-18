'use client'

import { useEffect, useState } from 'react'
import { Share, Plus, X, Download, Smartphone, MoreVertical } from 'lucide-react'

const DISMISSED_KEY = 'stv_install_dismissed'

/** Chrome-Ereignis, das die Installation anbietet — noch nicht in lib.dom typisiert. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __stvInstall: InstallPromptEvent | null
  }
}

function alreadyInstalled() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS meldet den Homescreen-Start über ein eigenes Flag
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Hinweis zum Hinzufügen auf den Startbildschirm.
 *
 * Drei Fälle, weil sich die Plattformen unterschiedlich verhalten:
 *  - `ios`    — iOS bietet keine Installation an, es braucht die Anleitung
 *  - `prompt` — Chrome hat die Installation angeboten, ein Knopf genügt
 *  - `manual` — sonst: Anleitung übers Browsermenü
 *
 * `manual` ist der Ausgangszustand, damit immer etwas sichtbar ist. Meldet sich
 * Chrome später doch noch, wird auf `prompt` hochgestuft.
 */
type Mode = 'ios' | 'prompt' | 'manual' | null

export default function InstallHint() {
  const [mode, setMode] = useState<Mode>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') return
    } catch {
      // privater Modus o. ä. — Hinweis trotzdem zeigen
    }
    if (alreadyInstalled()) return

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setMode('ios')
      return
    }

    setMode(window.__stvInstall ? 'prompt' : 'manual')

    const onReady = () => setMode('prompt')
    window.addEventListener('stv-install-ready', onReady)
    return () => window.removeEventListener('stv-install-ready', onReady)
  }, [])

  const dismiss = () => {
    setMode(null)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* egal */ }
  }

  const install = async () => {
    const evt = window.__stvInstall
    if (!evt) return
    await evt.prompt()
    await evt.userChoice
    dismiss()
  }

  if (!mode) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-200 mb-5 relative">
      <button
        onClick={dismiss}
        aria-label="Hinweis schliessen"
        className="absolute top-3 right-3 text-slate-300 active:text-slate-500 p-1"
      >
        <X size={16} />
      </button>

      <div className="flex gap-3">
        <div className="bg-orange-50 rounded-xl p-2.5 h-fit flex-shrink-0">
          <Smartphone size={18} className="text-[#f29411]" />
        </div>

        <div className="min-w-0 pr-5">
          <p className="font-bold text-slate-800 text-sm">Auf den Startbildschirm</p>

          {mode === 'ios' && (
            <>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                So hast du die App direkt auf dem iPhone — ohne Safari, im Vollbild.
              </p>
              <ol className="text-xs text-slate-600 mt-2.5 space-y-1.5">
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#f29411]">1.</span>
                  Unten auf
                  <Share size={13} className="text-blue-500" />
                  <span className="font-semibold">Teilen</span> tippen
                </li>
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#f29411]">2.</span>
                  <Plus size={13} className="text-slate-500" />
                  <span className="font-semibold">Zum Home-Bildschirm</span> wählen
                </li>
              </ol>
            </>
          )}

          {mode === 'prompt' && (
            <>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Installiere die App, um sie direkt vom Startbildschirm zu öffnen.
              </p>
              <button
                onClick={install}
                className="mt-3 inline-flex items-center gap-2 bg-[#f29411] text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-orange-200 active:bg-[#c97c0e]"
              >
                <Download size={15} />
                Installieren
              </button>
            </>
          )}

          {mode === 'manual' && (
            <>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                So hast du die App direkt auf dem Handy — ohne Browserleiste, im
                Vollbild.
              </p>
              <ol className="text-xs text-slate-600 mt-2.5 space-y-1.5">
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#f29411]">1.</span>
                  Im Browser oben rechts auf
                  <MoreVertical size={13} className="text-slate-500" />
                  tippen
                </li>
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#f29411]">2.</span>
                  <span className="font-semibold">App installieren</span> wählen
                </li>
              </ol>
              <p className="text-slate-400 text-[11px] mt-2">
                Je nach Browser heisst es «Zum Startbildschirm hinzufügen».
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
