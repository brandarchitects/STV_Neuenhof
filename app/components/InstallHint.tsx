'use client'

import { useEffect, useState } from 'react'
import { Share, Plus, X, Download, Smartphone } from 'lucide-react'

const DISMISSED_KEY = 'stv_install_dismissed'

/** Chrome-Ereignis, das die Installation anbietet — noch nicht in lib.dom typisiert. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
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
 * Android/Chrome darf die Installation selbst anbieten — dort genügt ein
 * Knopf. iOS kennt kein solches Angebot, deshalb braucht es dort die
 * Anleitung über das Teilen-Menü.
 */
export default function InstallHint() {
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === '1') return
    } catch {
      // privater Modus o. ä. — Hinweis trotzdem zeigen
    }
    if (alreadyInstalled()) return

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIos(true)
      setShow(true)
      return
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as InstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    setShow(false)
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* egal */ }
  }

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    dismiss()
  }

  if (!show) return null

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

          {ios ? (
            <>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                So hast du die App direkt auf dem iPhone — ohne Safari, im
                Vollbild.
              </p>
              <ol className="text-xs text-slate-600 mt-2.5 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <span className="font-bold text-[#f29411]">1.</span>
                  Unten auf
                  <Share size={13} className="text-blue-500" />
                  <span className="font-semibold">Teilen</span> tippen
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="font-bold text-[#f29411]">2.</span>
                  <Plus size={13} className="text-slate-500" />
                  <span className="font-semibold">Zum Home-Bildschirm</span> wählen
                </li>
              </ol>
            </>
          ) : (
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
        </div>
      </div>
    </div>
  )
}
