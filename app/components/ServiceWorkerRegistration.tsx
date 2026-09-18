'use client'

import { useEffect } from 'react'

/**
 * Registriert den Service Worker. Ohne ihn bietet Chrome die Installation
 * nicht an (siehe public/sw.js).
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker konnte nicht registriert werden:', err)
      })
    }
    // Nach dem Laden registrieren, damit die erste Anzeige nicht verzögert wird
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
