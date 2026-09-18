/**
 * Erzeugt die App-Icons aus public/icon.svg.
 *
 * Das Vereinslogo ist weiss auf transparent — auf einem hellen Homescreen
 * wäre es unsichtbar. Deshalb wird es hier zentriert auf das orange
 * Markenquadrat gesetzt, mit genug Rand, damit Android es auch rund oder
 * abgerundet maskieren kann, ohne das Logo anzuschneiden.
 *
 * Aufruf:  node scripts/generate-icons.mjs
 * Nur bei einem neuen Logo nötig; die erzeugten PNGs liegen im Repository.
 */
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const BRAND = '#f29411'

// Logo-Inhalt aus der SVG holen und die CSS-Klasse durch ein festes Weiss
// ersetzen — verschachtelte <style>-Blöcke werden nicht zuverlässig vererbt.
const raw = readFileSync(join(root, 'public/icon.svg'), 'utf8')
const viewBox = raw.match(/viewBox="([^"]+)"/)[1]
const [, , vbW, vbH] = viewBox.split(/\s+/).map(Number)
const inner = raw
  .replace(/<\?xml[^>]*\?>/, '')
  .replace(/<defs>[\s\S]*?<\/defs>/, '')
  .replace(/class="cls-1"/g, 'fill="#ffffff"')
  .match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1]

/** @param {number} size @param {number} coverage Anteil der Breite, den das Logo einnimmt */
function square(size, coverage) {
  const w = size * coverage
  const h = (w / vbW) * vbH
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND}"/>
  <svg x="${(size - w) / 2}" y="${(size - h) / 2}" width="${w}" height="${h}" viewBox="${viewBox}">${inner}</svg>
</svg>`
}

// coverage 0.62 hält das Logo innerhalb der sicheren Zone einer runden Maske.
const targets = [
  { file: 'icon-192.png', size: 192, coverage: 0.68 },
  { file: 'icon-512.png', size: 512, coverage: 0.68 },
  { file: 'icon-maskable-512.png', size: 512, coverage: 0.52 },
  { file: 'apple-touch-icon.png', size: 180, coverage: 0.68 },
]

for (const { file, size, coverage } of targets) {
  await sharp(Buffer.from(square(size, coverage)))
    .png()
    .toFile(join(root, 'public', file))
  console.log(`${file}  ${size}×${size}`)
}
