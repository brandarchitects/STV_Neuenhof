/**
 * Service Worker der Wettkampf-App.
 *
 * Zwei Gründe, warum es ihn gibt:
 *  1. Chrome bietet die Installation nur an, wenn ein Service Worker mit
 *     fetch-Handler registriert ist — ohne ihn erscheint kein Installieren-Knopf.
 *  2. In Turnhallen ist der Empfang oft schlecht. Die App-Hülle kommt dann aus
 *     dem Cache, statt dass eine leere Seite erscheint.
 *
 * Strategie: immer zuerst das Netz, Cache nur als Rückfall. Damit kann nach
 * einem Deployment nie eine veraltete Version hängen bleiben, solange jemand
 * online ist.
 */

const CACHE = 'stv-neuenhof-v1'
const SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // allSettled: eine einzelne fehlschlagende Datei darf die Installation
      // nicht verhindern
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  // Firestore und Google-APIs laufen über eigene Hosts und müssen unangetastet
  // bleiben — sonst bricht die Echtzeit-Synchronisation.
  if (new URL(request.url).origin !== self.location.origin) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
        }
        return response
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || caches.match('/'))
      )
  )
})
