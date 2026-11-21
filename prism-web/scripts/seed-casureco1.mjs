// scripts/seed-casureco1.mjs
//
// Creates a realistic, FICTIONAL demo dataset for CASURECO I (Camarines Sur I Electric
// Cooperative): seven of the towns in the franchise area around Libmanan, four area offices, 13 feeders,
// 15 linemen, ~170 consumers, 5 weeks of outage reports with storm events, Master Tickets,
// QA rejections and reopen requests, ratings, and a month of scheduled-interruption advisories.
//
// It is independent from seed-sample-cooperative.mjs (Banahaw). It uses its own email domain,
// ticket numbers, phone numbers, account numbers and cleanup, so both can live in the same
// database and --cleanup only ever removes what THIS script created.
//
//   node scripts/seed-casureco1.mjs --dry-run         build the data in memory and print a summary (no database)
//   node scripts/seed-casureco1.mjs                   create the demo data (about 10-20 minutes)
//   node scripts/seed-casureco1.mjs --refresh         re-time linemen duty/location and today's advisory
//   node scripts/seed-casureco1.mjs --cleanup         remove everything this script created
//
//   options: --days=35 (history length, 30 to 120; use --days=65 so "Compare with previous period" has data)
//            --no-photos (skip the placeholder photos)
//
// Everything it creates uses an email ending in @casureco1-demo.test. Needs Node 18 or newer.
//
// .env.local (besides the usual Supabase keys):
//   BILLING_CONFIG_SECRET=<64 hex characters, same as the web app>
//   SAMPLE_BILLING_URL=https://your-simulated-billing-service.example.com
//   SAMPLE_BILLING_KEY=<API key of that service>
//   SAMPLE_BILLING_HEADER=X-api-key          (optional)
//   SEED_COOP_NAME=CASURECO I                (optional: change it if a cooperative with that name already exists)
//   SEED_TICKET_BASE=1000                    (optional: first ticket number is RPT-<year>-<base+1>)
//
// Notes on realism: town and barangay names come from public lists of the CASURECO I franchise
// area; coordinates are APPROXIMATE placements around each town, and the area offices, substations
// and feeders are illustrative, not CASURECO I's actual network. Phone numbers are fictional.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { createClient } from '@supabase/supabase-js'
import { randomUUID, randomBytes, createHash, createCipheriv } from 'node:crypto'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
function loadEnvFile() {
  const file = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    let value = m[2]
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = value
  }
}
loadEnvFile()
const args = process.argv.slice(2)
const MODE = args.includes('--cleanup') ? 'cleanup' : args.includes('--refresh') ? 'refresh' : 'seed'
const DRY_RUN = args.includes('--dry-run')
const NO_PHOTOS = args.includes('--no-photos')
const daysArg = args.find((a) => a.startsWith('--days='))
const DAYS = daysArg ? Math.max(30, Math.min(120, parseInt(daysArg.split('=')[1], 10) || 35)) : 35

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
let sb = null
if (!DRY_RUN) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Run this from the project folder that contains .env.local.'
    )
    process.exit(1)
  }
  sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const MARKER = '@casureco1-demo.test'
const PASSWORD = 'Casureco1#2026'
const COOP_NAME = process.env.SEED_COOP_NAME || 'CASURECO I'
const NOW = Date.now()
const M = 60000
const HOURMS = 3600000
const DAYMS = 86400000
const RESPONSE_TIME_THRESHOLD_MINUTES = 30
const RESOLUTION_TARGET_MINUTES = 240
const CONSUMER_TARGET = 170
const TICKET_BASE = parseInt(process.env.SEED_TICKET_BASE || '1000', 10)
const YEAR = new Date(NOW).getUTCFullYear()
const TODAY_ADVISORY_FEEDER = 'Feeder 13'

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pad = (n, w = 2) => String(n).padStart(w, '0')
const ago = (min) => new Date(NOW - min * M).toISOString()
const at = (ms) => new Date(ms).toISOString()
const point = (lat, lng) => `SRID=4326;POINT(${lng} ${lat})`
const warnedKeys = new Set()
const warn = (msg) => console.warn(`  (warning) ${msg}`)
const warnOnce = (msg) => {
  if (warnedKeys.has(msg)) return
  warnedKeys.add(msg)
  warn(msg)
}
function check(res, label) {
  if (res.error) throw new Error(`${label}: ${res.error.message}`)
  return res.data
}
// A seeded random number generator, so every run tells the same story
let seedState = 20261114
function rnd() {
  seedState = (seedState * 1664525 + 1013904223) % 4294967296
  return seedState / 4294967296
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const between = (a, b) => a + rnd() * (b - a)
const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
function gauss() {
  let u = 0
  let v = 0
  while (u === 0) u = rnd()
  while (v === 0) v = rnd()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const logn = (median, sigma) => median * Math.exp(sigma * gauss())
function poisson(mean) {
  const L = Math.exp(-mean)
  let k = 0
  let p = 1
  do {
    k += 1
    p *= rnd()
  } while (p > L)
  return k - 1
}
function weighted(items, getW) {
  const total = items.reduce((s, it) => s + getW(it), 0)
  let r = rnd() * total
  for (const it of items) {
    r -= getW(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}
function chunks(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}
// Philippine time helpers
const manilaParts = (ms) => {
  const d = new Date(ms + 8 * HOURMS)
  return { dow: d.getUTCDay(), h: d.getUTCHours(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() }
}
const manilaDayStart = (ms) => Math.floor((ms + 8 * HOURMS) / DAYMS) * DAYMS - 8 * HOURMS
const manilaDateOf = (ms) => new Date(ms + 8 * HOURMS).toISOString().slice(0, 10)
const manilaDate = (dayOffset = 0) => manilaDateOf(NOW + dayOffset * DAYMS)
const manilaMinutes = manilaParts(NOW).minutes
const toMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
const hhmmOf = (t) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
function activeWindow() {
  let start = Math.max(0, manilaMinutes - 60)
  let end = Math.min(1439, manilaMinutes + 180)
  if (start >= end) {
    start = 0
    end = 1439
  }
  return { start: hhmmOf(start), end: hhmmOf(end) }
}
function haversineKm(a, b) {
  const R = 6371
  const rad = (x) => (x * Math.PI) / 180
  const dLat = rad(b[0] - a[0])
  const dLng = rad(b[1] - a[1])
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// ---------------------------------------------------------------------------
// Billing connection (same encryption the web app uses: AES-256-GCM, iv.tag.data in base64)
// ---------------------------------------------------------------------------
function encryptSecret(plainText, secretHex) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(secretHex, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map((part) => part.toString('base64')).join('.')
}
function billingSettings() {
  const rawUrl = process.env.SAMPLE_BILLING_URL
  const apiKey = process.env.SAMPLE_BILLING_KEY
  const headerName = process.env.SAMPLE_BILLING_HEADER || 'X-api-key'
  const secret = process.env.BILLING_CONFIG_SECRET
  if (!rawUrl || !apiKey) {
    warn('SAMPLE_BILLING_URL / SAMPLE_BILLING_KEY are not set, so no billing connection was saved. The Owner will see the billing setup popup.')
    return {}
  }
  if (!secret || !/^[0-9a-fA-F]{64}$/.test(secret)) {
    warn('BILLING_CONFIG_SECRET is missing or is not 64 hex characters, so no billing connection was saved.')
    return {}
  }
  let origin
  try {
    origin = new URL(rawUrl).origin
  } catch {
    warn('SAMPLE_BILLING_URL is not a valid URL, so no billing connection was saved.')
    return {}
  }
  return {
    billing_api_url: origin,
    billing_api_header: headerName,
    billing_api_key_encrypted: encryptSecret(apiKey, secret),
    billing_enabled: true,
    billing_last_tested_at: new Date().toISOString(),
    billing_last_test_status: 'connected',
  }
}

// ---------------------------------------------------------------------------
// Geography: CASURECO I franchise area (towns and barangays are real; coordinates, area offices,
// substations and feeders are illustrative)
// ---------------------------------------------------------------------------
const AREA_OFFICES = ['CAO 1 - Sipocot', 'CAO 2 - Libmanan', 'CAO 3 - Pamplona', 'CAO 4 - Pasacao']
const HOTLINES = {
  'CAO 1 - Sipocot': '(054) 555-0101',
  'CAO 2 - Libmanan': '(054) 555-0102 / 0917 555 0102',
  'CAO 3 - Pamplona': '(054) 555-0103',
  'CAO 4 - Pasacao': '(054) 555-0104 / 0918 555 0104',
}
const OFFICE_HUBS = [
  [13.7667, 122.9833], // Sipocot
  [13.697, 123.061], // Libmanan
  [13.596, 123.082], // Pamplona
  [13.506, 123.046], // Pasacao
]
// barangay row: [name, feeder, dLat, dLng, weight]
const MUNICIPALITIES = [
  {
    name: 'Libmanan',
    center: [13.697, 123.061],
    substation: 'Libmanan 20 MVA Substation',
    office: 1,
    barangays: [
      ['Poblacion', 'Feeder 1', 0, 0, 5],
      ['Bahay', 'Feeder 1', 0.012, 0.01, 4],
      ['Puro-Batia', 'Feeder 1', -0.01, 0.008, 2],
      ['Mambulo Nuevo', 'Feeder 1', 0.02, -0.012, 5],
      ['Mambulo Viejo', 'Feeder 1', 0.026, -0.016, 2],
      ['Station-Church Site', 'Feeder 1', 0.004, -0.006, 2],
      ['Bagumbayan', 'Feeder 2', -0.022, -0.02, 3],
      ['San Juan', 'Feeder 2', -0.028, -0.03, 2],
      ['San Pablo', 'Feeder 2', -0.034, -0.024, 2],
      ['Tinalmud Nuevo', 'Feeder 2', -0.04, -0.036, 2],
      ['Bagacay', 'Feeder 2', -0.018, -0.044, 2],
      ['San Isidro', 'Feeder 3', -0.0282, -0.0512, 4],
      ['Tarum', 'Feeder 3', -0.045, -0.062, 2],
      ['Sibujo', 'Feeder 3', -0.052, -0.07, 1],
      ['Aslong', 'Feeder 3', -0.01, -0.068, 2],
      ['Awayan', 'Feeder 3', 0.006, -0.08, 1],
      ['Bahao', 'Feeder 4', 0.043, 0.049, 3],
      ['Cambalidio', 'Feeder 4', 0.03, 0.03, 3],
      ['Tampuhan', 'Feeder 4', 0.036, 0.02, 1],
      ['Patag', 'Feeder 4', 0.022, 0.036, 1],
      ['Udok', 'Feeder 4', 0.05, 0.036, 1],
    ],
  },
  {
    name: 'Pamplona',
    center: [13.596, 123.082],
    substation: 'Pamplona 10 MVA Substation',
    office: 2,
    barangays: [
      ['Poblacion', 'Feeder 5', 0, 0, 5],
      ['Del Rosario', 'Feeder 5', 0.01, 0.012, 3],
      ['Patong', 'Feeder 5', -0.008, 0.008, 2],
      ['Salvacion', 'Feeder 5', 0.006, -0.026, 1],
      ['San Gabriel', 'Feeder 6', -0.02, -0.014, 3],
      ['San Isidro', 'Feeder 6', 0.018, -0.018, 3],
      ['San Rafael', 'Feeder 6', 0.026, 0.004, 1],
      ['San Ramon', 'Feeder 6', -0.026, 0.02, 2],
    ],
  },
  {
    name: 'Camaligan',
    center: [13.622, 123.172],
    substation: 'Camaligan 5 MVA Substation',
    office: 2,
    barangays: [
      ['Sua', 'Feeder 7', 0, 0, 3],
      ['San Roque', 'Feeder 7', 0.004, -0.006, 2],
      ['Santo Tomas', 'Feeder 7', -0.006, 0.006, 2],
      ['Tarosanan', 'Feeder 7', 0.008, 0.01, 2],
      ['San Lucas', 'Feeder 7', -0.01, -0.004, 2],
      ['San Marcos', 'Feeder 7', 0.002, 0.014, 1],
      ['San Mateo', 'Feeder 7', -0.004, -0.012, 1],
      ['Santo Domingo', 'Feeder 7', 0.012, -0.01, 2],
    ],
  },
  {
    name: 'San Fernando',
    center: [13.569, 123.144],
    substation: 'Pamplona 10 MVA Substation',
    office: 2,
    barangays: [
      ['Pamukid', 'Feeder 8', 0, 0, 4],
      ['Lupi', 'Feeder 8', 0.008, 0.01, 2],
      ['Beberon', 'Feeder 8', -0.008, 0.012, 2],
      ['Grijalvo', 'Feeder 8', 0.01, -0.01, 2],
      ['Planza', 'Feeder 8', -0.012, -0.008, 2],
    ],
  },
  {
    name: 'Pasacao',
    center: [13.506, 123.046],
    substation: 'Pasacao 10 MVA Substation',
    office: 3,
    barangays: [
      ['San Cirilo (Pob.)', 'Feeder 9', 0, 0, 3],
      ['Santa Rosa Del Norte (Pob.)', 'Feeder 9', 0.004, 0.006, 3],
      ['Santa Rosa Del Sur (Pob.)', 'Feeder 9', -0.004, 0.004, 2],
      ['Tinalmud', 'Feeder 9', 0.03, -0.03, 1],
      ['Caranan', 'Feeder 10', 0.02, 0.03, 5],
      ['Balogo', 'Feeder 10', 0.014, -0.016, 4],
      ['Dalupaon', 'Feeder 10', -0.02, -0.012, 3],
      ['Itulan', 'Feeder 10', -0.026, 0.02, 1],
      ['Odicon', 'Feeder 10', -0.032, -0.026, 1],
    ],
  },
  {
    name: 'Cabusao',
    center: [13.718, 123.115],
    substation: 'Cabusao 5 MVA Substation',
    office: 0,
    barangays: [
      ['Castillo', 'Feeder 11', 0, 0, 4],
      ['Pandan', 'Feeder 11', 0.006, -0.008, 3],
      ['Barcelonita', 'Feeder 11', -0.006, 0.006, 2],
      ['San Pedro', 'Feeder 11', 0.01, 0.01, 2],
      ['Biong', 'Feeder 11', -0.01, -0.008, 2],
      ['New Poblacion', 'Feeder 11', 0.002, 0.004, 2],
      ['Camagong', 'Feeder 11', -0.012, 0.012, 1],
    ],
  },
  {
    name: 'Sipocot',
    center: [13.7667, 122.9833],
    substation: 'Sipocot 10 MVA Substation',
    office: 0,
    barangays: [
      ['South Centro (Pob.)', 'Feeder 12', 0, 0, 4],
      ['North Centro (Pob.)', 'Feeder 12', 0.004, 0.002, 3],
      ['Impig', 'Feeder 12', -0.012, 0.016, 3],
      ['Tara', 'Feeder 12', 0.014, -0.012, 2],
      ['Cabuyao', 'Feeder 12', 0.02, 0.01, 1],
      ['Mangapo', 'Feeder 13', -0.02, -0.02, 1],
      ['Malubago', 'Feeder 13', 0.028, 0.026, 1],
      ['Vigaan', 'Feeder 13', -0.03, 0.03, 1],
      ['Azucena', 'Feeder 13', 0.008, -0.03, 1],
    ],
  },
]
const AREAS = []
for (const mun of MUNICIPALITIES) {
  for (const b of mun.barangays) {
    AREAS.push({
      barangay: b[0],
      feeder: b[1],
      municipality: mun.name,
      substation: mun.substation,
      office: mun.office,
      lat: Math.round((mun.center[0] + b[2]) * 1e6) / 1e6,
      lng: Math.round((mun.center[1] + b[3]) * 1e6) / 1e6,
      weight: b[4],
    })
  }
}
const AREA_INDEX = new Map(AREAS.map((a, i) => [`${a.barangay}|${a.municipality}`, i]))
function areaOf(barangay, municipality) {
  const i = AREA_INDEX.get(`${barangay}|${municipality}`)
  if (i === undefined) throw new Error(`Unknown area ${barangay} (${municipality})`)
  return i
}
const FEEDERS = [...new Set(AREAS.map((a) => a.feeder))]

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
const FIRST = ['Maria', 'Jose', 'Ana', 'Juan', 'Rosa', 'Pedro', 'Luz', 'Ramon', 'Carmen', 'Eduardo', 'Teresa', 'Antonio', 'Elena', 'Miguel', 'Corazon', 'Roberto', 'Lourdes', 'Fernando', 'Gloria', 'Ricardo', 'Josefina', 'Manuel', 'Imelda', 'Gregorio', 'Rowena', 'Danilo', 'Marites', 'Jerome', 'Analyn', 'Rodel', 'Lorna', 'Erwin', 'Cristina', 'Alvin', 'Maribel', 'Noel', 'Gemma', 'Arnel', 'Joselito', 'Aileen', 'Rommel', 'Divina', 'Reynaldo', 'Cecilia', 'Efren', 'Vilma', 'Leonardo', 'Mylene', 'Bernardo', 'Annabelle', 'Orlando', 'Jocelyn', 'Felix', 'Dolores', 'Nestor', 'Rebecca', 'Ernesto', 'Marilou', 'Benjie', 'Shiela']
const LAST = ['Abad', 'Abella', 'Aguilar', 'Alcantara', 'Almonte', 'Arcilla', 'Bacolod', 'Barcelona', 'Belleza', 'Bonaobra', 'Buenaflor', 'Cabrera', 'Camacho', 'Clemente', 'Dayao', 'De Jesus', 'Del Castillo', 'Dimaano', 'Esplana', 'Estrella', 'Fajardo', 'Gabito', 'Garcia', 'Hernandez', 'Imperial', 'Jacinto', 'Lagman', 'Llaneta', 'Macaraig', 'Madrid', 'Mendoza', 'Nacario', 'Navarro', 'Obias', 'Ocampo', 'Pacia', 'Padilla', 'Pascual', 'Quiambao', 'Ramos', 'Reyes', 'Rivera', 'Rosales', 'Salazar', 'Samson', 'Santos', 'Sarmiento', 'Tabuzo', 'Tolentino', 'Torres', 'Valencia', 'Valdez', 'Velasco', 'Villafuerte', 'Villanueva', 'Yap', 'Zamora', 'Bello', 'Dela Cruz']

const SUPERVISORS = [
  { key: 'owner', first: 'Marilou', last: 'Esplana', access: [], owner: true },
  { key: 'dispatch1', first: 'Dennis', last: 'Tolentino', access: ['dispatch'], owner: false },
  { key: 'dispatch2', first: 'Joanna', last: 'Quiambao', access: ['dispatch'], owner: false },
  { key: 'isd', first: 'Katrina', last: 'Dimaano', access: ['advisories', 'faq'], owner: false },
]
const REVIEWER_SUPERVISORS = [0, 1, 2] // owner and the two dispatch supervisors review QA and reopen requests
const pickReviewerIdx = () => weighted(REVIEWER_SUPERVISORS, (i) => (i === 0 ? 2 : 4))

// kind: day (Mon-Sat 07-16), swing (14-22 daily), night (22-06 daily), rotating, none (no schedule)
const LINEMEN_DEFS = [
  // CAO 1 - Sipocot
  { first: 'Rolando', last: 'Abella', office: 0, sched: 'day', speed: 0.95, bias: 0.3 },
  { first: 'Jerome', last: 'Camacho', office: 0, sched: 'swing', speed: 1.1, bias: -0.1 },
  { first: 'Alvin', last: 'Pacia', office: 0, sched: 'rotating', speed: 1.0, bias: 0.1 },
  // CAO 2 - Libmanan
  { first: 'Rico', last: 'Dela Cruz', office: 1, sched: 'day', speed: 0.9, bias: 0.5 },
  { first: 'Joel', last: 'Mercado', office: 1, sched: 'day', speed: 1.0, bias: 0.2 },
  { first: 'Ben', last: 'Navarro', office: 1, sched: 'swing', speed: 1.05, bias: 0.0 },
  { first: 'Noel', last: 'Obias', office: 1, sched: 'night', speed: 1.1, bias: -0.2 },
  { first: 'Arnel', last: 'Reyes', office: 1, sched: 'none', speed: 0.85, bias: 0.4, oncall: true },
  // CAO 3 - Pamplona
  { first: 'Mario', last: 'Santos', office: 2, sched: 'day', speed: 1.0, bias: 0.1 },
  { first: 'Danilo', last: 'Salazar', office: 2, sched: 'day', speed: 1.15, bias: -0.4 },
  { first: 'Erwin', last: 'Valdez', office: 2, sched: 'swing', speed: 0.95, bias: 0.2 },
  { first: 'Rodel', last: 'Villafuerte', office: 2, sched: 'night', speed: 1.05, bias: 0.0 },
  // CAO 4 - Pasacao
  { first: 'Allan', last: 'Ocampo', office: 3, sched: 'day', speed: 1.0, bias: 0.2 },
  { first: 'Dennis', last: 'Villar', office: 3, sched: 'swing', speed: 1.2, bias: -0.3 },
  { first: 'Rommel', last: 'Bonaobra', office: 3, sched: 'rotating', speed: 0.95, bias: 0.3 },
]
function scheduleFor(kind) {
  if (kind === 'day') return [{ name: 'Morning Duty', start: '07:00', end: '16:00', days: [1, 2, 3, 4, 5, 6] }]
  if (kind === 'swing') return [{ name: 'Afternoon Duty', start: '14:00', end: '22:00', days: [0, 1, 2, 3, 4, 5, 6] }]
  if (kind === 'night') return [{ name: 'Night Duty', start: '22:00', end: '06:00', days: [0, 1, 2, 3, 4, 5, 6] }]
  if (kind === 'rotating') {
    return [
      { name: 'Morning Duty', start: '07:00', end: '16:00', days: [1, 2, 3] },
      { name: 'Night Duty', start: '22:00', end: '06:00', days: [4, 5, 6] },
    ]
  }
  return []
}
const LINEMEN = LINEMEN_DEFS.map((l, idx) => ({ ...l, idx, schedule: scheduleFor(l.sched) }))
function isOnDuty(schedule, ms) {
  if (!schedule || schedule.length === 0) return true
  const p = manilaParts(ms)
  return schedule.some((b) => {
    const s = toMin(b.start)
    const e = toMin(b.end)
    if (s < e) return b.days.includes(p.dow) && p.minutes >= s && p.minutes < e
    return (b.days.includes(p.dow) && p.minutes >= s) || (b.days.includes((p.dow + 6) % 7) && p.minutes < e)
  })
}

// Consumers: at least one per barangay, the rest in proportion to the barangay's weight
function buildConsumers(total) {
  const sumW = AREAS.reduce((s, a) => s + a.weight, 0)
  const counts = AREAS.map((a) => 1 + Math.floor(((total - AREAS.length) * a.weight) / sumW))
  let used = counts.reduce((s, c) => s + c, 0)
  const order = AREAS.map((_, i) => i).sort((a, b) => AREAS[b].weight - AREAS[a].weight)
  let k = 0
  while (used < total) {
    counts[order[k % order.length]] += 1
    used += 1
    k += 1
  }
  const list = []
  AREAS.forEach((a, areaIdx) => {
    for (let c = 0; c < counts[areaIdx]; c++) {
      const idx = list.length
      list.push({
        idx,
        areaIdx,
        first: FIRST[(idx * 7 + 3) % FIRST.length],
        last: LAST[(idx * 11 + 5) % LAST.length],
        zone: `Zone ${1 + (idx % 6)}`,
        account: `03-${pad(1100 + idx * 3, 4)}-${pad(200 + ((idx * 7) % 800), 3)}`,
        email: `consumer${pad(idx + 1, 3)}${MARKER}`,
      })
    }
  })
  return list
}
const CONSUMERS = buildConsumers(CONSUMER_TARGET)
const CONSUMERS_BY_AREA = AREAS.map((_, i) => CONSUMERS.filter((c) => c.areaIdx === i))

// ---------------------------------------------------------------------------
// Text pools
// ---------------------------------------------------------------------------
const ISSUE_LABELS = {
  no_power: 'No Power / Total Power Interruption',
  partial_power: 'Partial Power Interruption',
  frequent_interruptions: 'Frequent Power Interruptions',
  low_voltage: 'Low Voltage / Weak Power Supply',
  damaged_power_lines: 'Damaged Power Lines',
  damaged_electric_post: 'Fallen or Damaged Electric Post',
  sparks_or_unusual_sounds: 'Sparks or Unusual Equipment Sounds',
  other: 'Other Concern',
}
const ISSUE_WEIGHTS = {
  no_power: 36,
  partial_power: 13,
  frequent_interruptions: 8,
  low_voltage: 15,
  damaged_power_lines: 11,
  damaged_electric_post: 6,
  sparks_or_unusual_sounds: 7,
  other: 4,
}
const ISSUE_KEYS = Object.keys(ISSUE_WEIGHTS)
const pickIssue = () => weighted(ISSUE_KEYS, (k) => ISSUE_WEIGHTS[k])
const REPAIR_MEDIAN_MIN = {
  no_power: 55,
  partial_power: 45,
  frequent_interruptions: 70,
  low_voltage: 60,
  damaged_power_lines: 75,
  damaged_electric_post: 150,
  sparks_or_unusual_sounds: 80,
  other: 35,
}
const PHOTO_REQUIRED = new Set(['damaged_power_lines', 'damaged_electric_post', 'sparks_or_unusual_sounds'])
const ISSUE_DETAILS = {
  no_power: [
    'Walang kuryente sa buong purok namin simula pa kanina. Pati mga kapitbahay po namin wala rin.',
    'No electricity in our area since a few minutes ago. Our neighbors on the same street are also affected.',
    'Mayong kuryente digdi sa samuyang purok. Pakipuntahan po kami agad.',
    'Biglang nawalan ng kuryente matapos ang malakas na ulan. Buong barangay po ba ang apektado?',
    'The whole block lost power after a loud bang near the transformer.',
  ],
  partial_power: [
    'Half of our house has no power while the other circuits still work.',
    'Ang ilang saksakan lang ang may kuryente, yung iba wala. Baka po service line.',
    'One phase seems to be down. Lights are on but the refrigerator and the aircon will not run.',
    'Dalawang bahay lang po sa tabi namin ang may kuryente, kami wala.',
  ],
  frequent_interruptions: [
    'The power keeps going off and on several times a day this week.',
    'Paulit-ulit na namamatay ang kuryente ngayong linggo, minsan umaabot ng ilang minuto.',
    'Brownout every afternoon for the past three days, usually around 3 PM.',
    'Pumipitik at namamatay ang kuryente kapag umuulan.',
  ],
  low_voltage: [
    'Mahina ang boltahe at pumipitik ang ilaw buong gabi.',
    'Voltage is very low. Our refrigerator and fan barely run.',
    'Dim ang ilaw at hindi gumagana ang water pump namin dahil mahina ang kuryente.',
    'Appliances keep shutting off because of low voltage, especially in the evening.',
  ],
  damaged_power_lines: [
    'There is a loose service wire hanging from the pole in front of our house.',
    'A fallen tree branch is touching the power lines beside the road.',
    'Nakalaylay po ang kable ng kuryente sa tabi ng kalsada, delikado po sa mga bata.',
    'The service drop to our house is sagging very low after the wind.',
  ],
  damaged_electric_post: [
    'The electric post in front of our house is leaning after the strong wind.',
    'May nabaling poste ng kuryente sa tabi ng kalsada.',
    'A pole was hit by a truck and is now tilted over the road.',
    'Ang poste po sa harap ng paaralan ay nakatagilid na at parang babagsak.',
  ],
  sparks_or_unusual_sounds: [
    'Sparks were seen on the transformer near our house before the lights went out.',
    'May narinig kaming malakas na pagsabog sa poste, tapos may kislap.',
    'The transformer is humming loudly and there is a burning smell.',
    'May umuusok po sa poste malapit sa amin, delikado po.',
  ],
  other: [
    'The streetlight in front of our house stays on all day and does not turn off.',
    'Our meter display is blank even though the lights are working.',
    'Maluwag po ang metro namin at may naririnig na kaluskos sa loob.',
    'The meter seat has a broken cover and wires are exposed.',
  ],
}
const LANDMARKS = ['Beside the barangay hall', 'Near the public market', 'In front of the elementary school', 'Across the chapel', 'Near the basketball court', 'Beside the rice mill', 'Near the covered court', 'In front of the sari-sari store', 'Near the barangay health center', 'Beside the vulcanizing shop', 'Near the fish landing', 'Along the national highway']
const REPAIR_NOTES = [
  'Replaced the blown fuse cutout and re-energized the line.',
  'Reconnected the loose service drop at the pole and tested the voltage at the meter.',
  'Trimmed the branches touching the line and restored power.',
  'Replaced the damaged lightning arrester on the transformer.',
  'Tightened the loose jumper connection at the transformer tap.',
  'Replaced the burnt service entrance cable and checked the meter base.',
  'Re-tied the sagging line and checked clearances along the span.',
  'Replaced the defective insulator on the crossarm and tested the feeder.',
]
const DECLINE_REASONS = [
  'Based on our check, the outage is limited to your household. Please check your main breaker and call the area office if it still has no power.',
  'This outage was already reported by your neighbors and is being handled under an existing ticket.',
  'The location is outside the CASURECO I franchise area. Please contact your local electric cooperative.',
  'Your account has a scheduled disconnection notice. Please settle it at the area office to restore service.',
  'The report was a duplicate of a ticket that was filed a few minutes ago.',
]
const QA_REMARKS = [
  'The photo does not show the replaced fuse cutout. Please retake it and confirm the connection at the transformer.',
  'Voltage at the meter was not recorded. Please recheck and attach a clear photo of the repair.',
  'The report says the line was re-tied but the photo still shows the sag. Please recheck the span.',
  'No photo of the repaired connection was attached. Please resubmit with proof of completion.',
]
const REOPEN_TEXT = [
  'Nawalan ulit ng kuryente ilang oras matapos ayusin. Pakisuri po ulit ang linya sa harap ng bahay namin.',
  'The power went out again the same evening. Please check the service drop again.',
  'Mahina pa rin ang boltahe kahit na-repair na raw. Pakitingnan po ulit.',
  'Still flickering after the repair. Please have the lineman come back.',
]
const REOPEN_REJECT_NOTES = [
  'Our crew checked the line and found no fault on our side. Please have your wiring inspected.',
  'The interruption you described was part of a scheduled advisory, so no new job order was needed.',
]
const SUP_REOPEN_TEXT = [
  'The consumer called the office: power went out again after the repair. Please recheck the service drop and the connection at the meter.',
  'Follow-up complaint received at the area office. Please verify the transformer tap and re-test the voltage.',
  'Neighbors reported the same fault again. Please inspect the line segment once more.',
]
const OVERDUE_TEXT = 'Ito po ay follow-up report; wala pa rin pong crew na dumarating.'
const RATING_COMMENTS = {
  5: ['Mabilis ang crew at maayos ang trabaho. Salamat po!', 'Very professional. They explained what caused the outage.', 'Maraming salamat po sa mabilis na pagkumpuni.', 'Dumating agad ang lineman at naibalik ang kuryente.', 'Magalang at maayos ang mga lineman.'],
  4: ['Okay naman, medyo natagalan lang.', 'Thank you for the quick repair.', 'Maayos ang pagkukumpuni, pero medyo matagal bago dumating.'],
  3: ['Naayos naman pero natagalan bago dumating ang crew.', 'It took hours before anyone arrived.', 'Okay lang, sana may update habang naghihintay.'],
  2: ['Nawalan ulit ng ilang minuto matapos ayusin.', 'Matagal ang paghihintay at walang abiso.'],
  1: ['Napakatagal ng response at paulit-ulit na lang ang brownout.', 'Hindi pa rin naayos nang maayos, nawalan ulit.'],
}

// ---------------------------------------------------------------------------
// Placeholder photos (a plain drawing of a utility pole, no image library needed)
// ---------------------------------------------------------------------------
function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
  }
  return (crc ^ 0xffffffff) >>> 0
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function makePng(width, height, sky, ground) {
  const stride = width * 3 + 1
  const raw = Buffer.alloc(stride * height)
  const horizon = Math.floor(height * 0.78)
  const cx = Math.floor(width * 0.55)
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0
    for (let x = 0; x < width; x++) {
      let r = ground[0]
      let g = ground[1]
      let b = ground[2]
      if (y < horizon) {
        const t = y / horizon
        r = Math.round(sky[0] * (1 - t * 0.3))
        g = Math.round(sky[1] * (1 - t * 0.2))
        b = Math.round(sky[2] * (1 - t * 0.1))
      }
      const onPole = Math.abs(x - cx) <= 5 && y > height * 0.12
      const onArm = y >= height * 0.2 && y <= height * 0.2 + 7 && Math.abs(x - cx) <= 90
      if (onPole || onArm) {
        r = 55
        g = 45
        b = 40
      }
      const o = y * stride + 1 + x * 3
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}
const PNG = {
  report: makePng(640, 360, [150, 170, 200], [90, 100, 85]),
  proof: makePng(640, 360, [170, 195, 220], [95, 110, 90]),
  advisory: makePng(640, 360, [200, 205, 215], [110, 115, 100]),
}
let photoWarned = false
async function uploadPhoto(bucket, filePath, buffer) {
  if (NO_PHOTOS) return null
  const { error } = await sb.storage.from(bucket).upload(filePath, buffer, { contentType: 'image/png', upsert: true })
  if (error) {
    if (!photoWarned) {
      warn(`photo upload skipped (${error.message}). The screens will say "No photo submitted".`)
      photoWarned = true
    }
    return null
  }
  return filePath
}

// ---------------------------------------------------------------------------
// ADVISORIES (a month of scheduled interruptions: CASURECO I maintenance and NGCP schedules)
// ---------------------------------------------------------------------------
const MAINTENANCE_REASONS = [
  'Replacement of defective crossarms and insulators.',
  'Line clearing and tree trimming along the distribution line.',
  'Replacement of aging poles and conductors.',
  'Installation of new sectionalizing switches to improve reliability.',
  'Transformer replacement and load balancing.',
  'Reconductoring and tightening of line connections.',
  'Preventive maintenance and thermal scanning of the feeder.',
]
function scheduleMs(date, hhmm) {
  return Date.parse(`${date}T${hhmm}:00+08:00`)
}
function buildAdvisories() {
  const list = []
  const offsets = []
  for (let d = -(DAYS - 2); d < 0; d += 2 + Math.floor(rnd() * 3)) offsets.push(d)
  const futures = [2, 4, 7, 10, 13]
  const windows = [['08:00', '12:00'], ['08:00', '17:00'], ['09:00', '15:00'], ['13:00', '17:00'], ['05:00', '09:00'], ['08:00', '16:00']]
  let ngcpPast = 0
  let feederCursor = 0
  const feederList = FEEDERS.filter((f) => f !== TODAY_ADVISORY_FEEDER)

  const make = (dayOffset, index) => {
    const date = manilaDate(dayOffset)
    const r = rnd()
    const isNgcp = (dayOffset < 0 && ngcpPast === 0 && index === 5) || (dayOffset > 0 && index === 9)
    const win = pick(windows)
    let adv
    if (isNgcp) {
      if (dayOffset < 0) ngcpPast += 1
      adv = {
        by: 'NGCP',
        title: 'NGCP Scheduled Power Interruption: Entire CASURECO I Franchise Area',
        description:
          'NGCP will conduct preventive maintenance and line upgrades on the transmission facilities serving the Bicol grid. All CASURECO I consumers will be without power during the schedule. Power will be restored as soon as the work is completed.',
        start: '06:00',
        end: '18:00',
        targets: [['entire_cooperative', null]],
        lead: 7,
      }
    } else if (r < 0.45) {
      const feeder = feederList[feederCursor % feederList.length]
      feederCursor += 1
      const names = AREAS.filter((a) => a.feeder === feeder).map((a) => a.barangay)
      adv = {
        by: 'CASURECO I',
        title: `Scheduled Power Interruption: ${feeder} (${[...new Set(AREAS.filter((a) => a.feeder === feeder).map((a) => a.municipality))].join(', ')})`,
        description: `${pick(MAINTENANCE_REASONS)} Affected barangays: ${names.slice(0, 8).join(', ')}${names.length > 8 ? ', and nearby areas' : ''}. Power will be restored as soon as the work is done.`,
        start: win[0],
        end: win[1],
        targets: [['feeder', feeder]],
        lead: 3,
      }
    } else if (r < 0.8) {
      const mun = pick(MUNICIPALITIES)
      const chosen = [...mun.barangays].sort(() => rnd() - 0.5).slice(0, 2 + Math.floor(rnd() * 3))
      adv = {
        by: 'CASURECO I',
        title: `Power Interruption in ${mun.name}: ${chosen.map((b) => b[0]).join(', ')}`,
        description: `${pick(MAINTENANCE_REASONS)} Consumers in ${chosen.map((b) => b[0]).join(', ')}, ${mun.name} will experience a power interruption during the schedule.`,
        start: win[0],
        end: win[1],
        targets: chosen.map((b) => ['barangay', `${b[0]} (${mun.name})`]),
        lead: 3,
      }
    } else {
      const mun = pick(MUNICIPALITIES)
      adv = {
        by: 'CASURECO I',
        title: `Line Upgrade and Pole Replacement in ${mun.name}`,
        description: `${pick(MAINTENANCE_REASONS)} Brief interruptions are expected in ${mun.name} while crews work. We apologize for the inconvenience.`,
        start: win[0],
        end: win[1],
        targets: [['municipality', mun.name]],
        lead: 3,
      }
    }
    const startMs = scheduleMs(date, adv.start)
    const endMs = scheduleMs(date, adv.end)
    const createdMs = Math.min(scheduleMs(date, '14:00') - adv.lead * DAYMS, NOW - Math.round(between(2, 30) * HOURMS))
    return { ...adv, date, startMs, endMs, createdMs, photo: false, archivedMs: null, isToday: false }
  }

  offsets.forEach((d, i) => list.push(make(d, i)))
  // Today's advisory is active right now (its window is re-timed by --refresh)
  const win = activeWindow()
  list.push({
    by: 'CASURECO I',
    title: `Scheduled Maintenance: ${TODAY_ADVISORY_FEEDER} Line Upgrade (Sipocot)`,
    description: 'Crews are upgrading conductors along Feeder 13 in Sipocot. Expect brief interruptions while work is ongoing.',
    date: manilaDate(0),
    start: win.start,
    end: win.end,
    startMs: scheduleMs(manilaDate(0), win.start),
    endMs: scheduleMs(manilaDate(0), win.end),
    targets: [['feeder', TODAY_ADVISORY_FEEDER]],
    lead: 3,
    createdMs: NOW - 3 * DAYMS,
    photo: true,
    archivedMs: null,
    isToday: true,
  })
  futures.forEach((d, i) => list.push(make(d, 9 + i === 9 ? 9 : i)))
  // Two touches: an advisory with a photo and one that was archived after a correction
  const past = list.filter((a) => a.startMs < NOW - DAYMS && !a.isToday)
  if (past.length > 3) {
    past[2].photo = true
    past[3].archivedMs = past[3].createdMs + 3 * HOURMS
  }
  return list
}
const ADVISORIES = buildAdvisories()
function advisoryCovers(adv, area, ms) {
  if (ms < adv.startMs || ms > adv.endMs) return false
  return adv.targets.some(([scope, value]) => {
    if (scope === 'entire_cooperative') return true
    if (scope === 'feeder') return value === area.feeder
    if (scope === 'municipality') return value === area.municipality
    if (scope === 'barangay') return value === `${area.barangay} (${area.municipality})`
    return false
  })
}
// A consumer cannot file a report while a scheduled interruption covers the area, so the
// history leaves those hours empty for the affected barangays.
function coveredByAdvisory(areaIdx, ms) {
  const area = AREAS[areaIdx]
  return ADVISORIES.some((adv) => !adv.isToday && !adv.archivedMs && advisoryCovers(adv, area, ms))
}

// ---------------------------------------------------------------------------
// SIMULATION: every ticket's whole story is decided here, in memory, before anything is written
// ---------------------------------------------------------------------------
const HOUR_WEIGHTS = [1, 0.6, 0.5, 0.5, 0.7, 1.5, 3.5, 4.5, 4, 3.5, 3, 3, 3.2, 3.5, 4, 4, 4.5, 6.5, 8, 8.5, 7, 5, 3, 2]
const weightedHour = () => weighted(HOUR_WEIGHTS.map((w, h) => ({ h, w })), (x) => x.w).h
const STATUS_ORDER = ['assigned', 'on_the_way', 'arrived_at_site', 'in_progress', 'fixed', 'resolved']
const TICKET_STATUS_FOR = {
  assigned: 'dispatched',
  on_the_way: 'dispatched',
  arrived_at_site: 'in_progress',
  in_progress: 'in_progress',
  fixed: 'qa_review',
  resolved: 'resolved',
}
const HOTSPOTS = [
  { areaIdx: areaOf('Bahao', 'Libmanan'), issue: 'low_voltage', w: 3 },
  { areaIdx: areaOf('Caranan', 'Pasacao'), issue: 'frequent_interruptions', w: 3 },
  { areaIdx: areaOf('Castillo', 'Cabusao'), issue: 'no_power', w: 2 },
  { areaIdx: areaOf('Cambalidio', 'Libmanan'), issue: 'partial_power', w: 2 },
  { areaIdx: areaOf('Pamukid', 'San Fernando'), issue: 'damaged_power_lines', w: 2 },
  { areaIdx: areaOf('Sua', 'Camaligan'), issue: 'low_voltage', w: 2 },
]

function dispatchDelayMin(createdMs, factor) {
  const p = manilaParts(createdMs)
  const working = p.dow !== 0 && p.h >= 7 && p.h < 17
  let d
  if (working) d = logn(9, 0.75)
  else if (p.dow === 0 && p.h >= 7 && p.h < 17) d = logn(20, 0.7)
  else if (p.h >= 17 && p.h < 22) d = logn(18, 0.7)
  else d = logn(42, 0.85)
  if (rnd() < 0.08) d += between(20, 45)
  return clamp(d * factor, 2, 360)
}
function qaWaitMin(fixedMs) {
  const p = manilaParts(fixedMs)
  const office = p.dow !== 0 && p.h >= 7 && p.h < 17
  if (office) return clamp(logn(24, 0.7), 4, 240)
  if (rnd() < 0.55) {
    let t = manilaDayStart(fixedMs) + 7.5 * HOURMS + between(0, 90) * M
    if (t <= fixedMs) t += DAYMS
    return (t - fixedMs) / M
  }
  return clamp(logn(55, 0.6), 8, 300)
}
function travelMinutes(lineman, area) {
  const km = haversineKm(OFFICE_HUBS[lineman.office], [area.lat, area.lng])
  return clamp(km * 2.3 + between(3, 12), 5, 90)
}
function pickPriority(issue, factor) {
  const r = rnd()
  if (issue === 'sparks_or_unusual_sounds' || issue === 'damaged_power_lines' || issue === 'damaged_electric_post') return r < 0.45 ? 'critical' : 'high'
  if (issue === 'no_power') return r < (factor > 1.3 ? 0.75 : 0.5) ? 'high' : 'medium'
  if (issue === 'low_voltage' || issue === 'frequent_interruptions') return r < 0.7 ? 'medium' : 'low'
  if (issue === 'partial_power') return r < 0.6 ? 'medium' : r < 0.8 ? 'high' : 'low'
  return 'low'
}

const loadLog = LINEMEN.map(() => [])
function chooseLineman(area, ms, forcedIdx) {
  if (forcedIdx !== undefined) {
    loadLog[forcedIdx].push(ms)
    return LINEMEN[forcedIdx]
  }
  const sameOffice = LINEMEN.filter((l) => l.office === area.office)
  const neighbors = LINEMEN.filter((l) => Math.abs(l.office - area.office) === 1)
  let pool = sameOffice.filter((l) => isOnDuty(l.schedule, ms))
  if (pool.length === 0 || rnd() < 0.08) pool = neighbors.filter((l) => isOnDuty(l.schedule, ms)).concat(pool)
  if (pool.length === 0) pool = sameOffice
  const load = (l) => loadLog[l.idx].filter((x) => x > ms - 4 * HOURMS && x <= ms).length
  const minLoad = Math.min(...pool.map(load))
  const best = pool.filter((l) => load(l) === minLoad)
  const chosen = best[Math.floor(rnd() * best.length)]
  loadLog[chosen.idx].push(ms)
  return chosen
}

function simulateAttemptSteps({ startMs, area, issue, lineman, factor, quick }) {
  const onWay = startMs + clamp(logn(quick ? 3 : 5, 0.5), 1, 25) * M
  const travel = quick ? between(6, 20) : travelMinutes(lineman, area)
  const arrived = onWay + travel * M
  const inProg = arrived + between(2, 6) * M
  const onSiteMin = quick
    ? clamp(logn(35, 0.5), 12, 150)
    : clamp(logn(REPAIR_MEDIAN_MIN[issue] * lineman.speed * factor, 0.45), 15, 480)
  const fixed = Math.max(inProg + 4 * M, arrived + onSiteMin * M)
  const resolved = fixed + qaWaitMin(fixed) * M
  return [
    { status: 'on_the_way', atMs: Math.round(onWay) },
    { status: 'arrived_at_site', atMs: Math.round(arrived) },
    { status: 'in_progress', atMs: Math.round(inProg) },
    { status: 'fixed', atMs: Math.round(fixed) },
    { status: 'resolved', atMs: Math.round(resolved) },
  ]
}
const hasStep = (steps, s) => steps.some((x) => x.status === s)
const stepAt = (steps, s) => steps.find((x) => x.status === s)?.atMs

// Plays one ticket's job orders (and any QA rejection / reopen) forward from the dispatch time,
// stopping wherever "now" falls.
function buildAttempts({ assignedMs, area, issue, lineman, factor = 1, chain = 'none', forced = {}, allowReopenRequest = true }) {
  const mkSteps = (startMs, quick, opts = {}) => {
    let steps = simulateAttemptSteps({ startMs, area, issue, lineman, factor, quick })
    if (opts.offsets) {
      steps = steps.map((s) => (opts.offsets[s.status] !== undefined ? { ...s, atMs: Math.round(startMs + opts.offsets[s.status] * M) } : s))
    }
    if (opts.excludeResolved) steps = steps.filter((s) => s.status !== 'resolved')
    steps = steps.filter((s) => s.atMs <= NOW - M)
    if (opts.upTo) {
      const lim = STATUS_ORDER.indexOf(opts.upTo)
      steps = steps.filter((s) => STATUS_ORDER.indexOf(s.status) <= lim)
    }
    return steps
  }
  const mkAttempt = (startMs, steps, reopen) => ({
    linemanIdx: lineman.idx,
    assignedMs: startMs,
    steps,
    qa: null,
    reopen,
    photo: rnd() < 0.7,
    note: pick(REPAIR_NOTES),
  })
  const approve = (att) => {
    if (hasStep(att.steps, 'resolved')) att.qa = { decision: 'approved', atMs: stepAt(att.steps, 'resolved'), reviewerIdx: pickReviewerIdx() }
  }

  const attempts = []
  let reopenRequest = null
  const a1Steps = mkSteps(assignedMs, false, { offsets: forced.offsets, upTo: forced.upTo, excludeResolved: chain === 'qa_reject' })
  const a1 = mkAttempt(assignedMs, a1Steps, null)
  approve(a1)
  attempts.push(a1)

  if (chain === 'qa_reject' && hasStep(a1Steps, 'fixed')) {
    const rejectMs = Math.round(stepAt(a1Steps, 'fixed') + clamp(logn(28, 0.6), 6, 240) * M)
    const a2Start = rejectMs + Math.round(between(1, 4) * M)
    if (a2Start <= NOW - 2 * M) {
      const remarks = pick(QA_REMARKS)
      const rv = pickReviewerIdx()
      a1.qa = { decision: 'rejected', atMs: rejectMs, reviewerIdx: rv, remarks }
      const a2 = mkAttempt(a2Start, mkSteps(a2Start, true), { source: 'qa_rejection', reason: remarks, byIdx: rv })
      approve(a2)
      attempts.push(a2)
    }
  } else if (hasStep(a1Steps, 'resolved') && allowReopenRequest && ['consumer_approved', 'consumer_rejected', 'consumer_pending'].includes(chain)) {
    const resolvedMs = stepAt(a1Steps, 'resolved')
    const reqMs = Math.round(forced.requestMs || resolvedMs + between(120, 1700) * M)
    if (reqMs <= NOW - 5 * M) {
      reopenRequest = { atMs: reqMs, description: pick(REOPEN_TEXT), status: 'pending', reviewedMs: null, reviewerIdx: null, note: null }
      if (chain !== 'consumer_pending') {
        const revMs = Math.round(reqMs + clamp(logn(70, 0.7), 10, 600) * M)
        if (revMs <= NOW - 2 * M) {
          const rv = pickReviewerIdx()
          if (chain === 'consumer_rejected') {
            reopenRequest = { ...reopenRequest, status: 'rejected', reviewedMs: revMs, reviewerIdx: rv, note: pick(REOPEN_REJECT_NOTES) }
          } else {
            const a2Start = revMs + Math.round(between(1, 5) * M)
            if (a2Start <= NOW - 2 * M) {
              reopenRequest = { ...reopenRequest, status: 'approved', reviewedMs: revMs, reviewerIdx: rv }
              const a2 = mkAttempt(a2Start, mkSteps(a2Start, true), { source: 'consumer', reason: reopenRequest.description, byIdx: rv })
              approve(a2)
              attempts.push(a2)
            }
          }
        }
      }
    }
  } else if (hasStep(a1Steps, 'resolved') && chain === 'supervisor') {
    const reopenMs = Math.round(stepAt(a1Steps, 'resolved') + between(60, 2800) * M)
    const a2Start = reopenMs + Math.round(between(1, 3) * M)
    if (a2Start <= NOW - 2 * M) {
      const a2 = mkAttempt(a2Start, mkSteps(a2Start, true), { source: 'supervisor', reason: pick(SUP_REOPEN_TEXT), byIdx: pickReviewerIdx() })
      approve(a2)
      attempts.push(a2)
    }
  }

  const last = attempts[attempts.length - 1]
  const lastStatus = last.steps.length ? last.steps[last.steps.length - 1].status : 'assigned'
  let lastMs = assignedMs
  attempts.forEach((a) => {
    lastMs = Math.max(lastMs, a.assignedMs, ...a.steps.map((s) => s.atMs), a.qa ? a.qa.atMs : 0)
  })
  if (reopenRequest) lastMs = Math.max(lastMs, reopenRequest.atMs, reopenRequest.reviewedMs || 0)
  const resolvedStep = lastStatus === 'resolved' ? stepAt(last.steps, 'resolved') : null
  const firstA2 = attempts[1]
  let reopenedAtMs = null
  if (firstA2) reopenedAtMs = firstA2.assignedMs
  else if (reopenRequest && reopenRequest.status === 'pending') reopenedAtMs = reopenRequest.atMs
  return {
    attempts,
    reopenRequest,
    finalStatus: TICKET_STATUS_FOR[lastStatus],
    lastMs,
    resolvedMs: resolvedStep,
    reopenedAtMs,
  }
}
const rollChain = () => {
  const r = rnd()
  if (r < 0.07) return 'qa_reject'
  if (r < 0.1) return 'consumer_approved'
  if (r < 0.115) return 'consumer_rejected'
  if (r < 0.135) return 'supervisor'
  return 'none'
}
// Confirmation and rating after the final resolution
function planFeedback(resolvedMs, linemanIdx, dispatchDelayMinutes) {
  if (resolvedMs === null || rnd() >= 0.72) return { confirm: null, rating: null }
  const cm = Math.round(resolvedMs + clamp(logn(95, 1.0), 3, 2000) * M)
  if (cm > NOW - 5 * M) return { confirm: null, rating: null }
  const confirm = { atMs: cm }
  if (rnd() >= 0.58) return { confirm, rating: null }
  const rm = Math.round(cm + between(1, 400) * M)
  if (rm > NOW - M) return { confirm, rating: null }
  const penalty = dispatchDelayMinutes > 60 ? -0.08 : 0
  const u = clamp(rnd() + LINEMEN[linemanIdx].bias * 0.12 + penalty, 0, 0.9999)
  const value = u < 0.03 ? 1 : u < 0.08 ? 2 : u < 0.2 ? 3 : u < 0.48 ? 4 : 5
  return { confirm, rating: { value, comment: rnd() < 0.55 ? pick(RATING_COMMENTS[value]) : null, atMs: rm } }
}

function makeTicket({ consumer, areaIdx, createdMs, issue, text, homes = false, jitter = 0.006, centerLat, centerLng }) {
  const baseDetail = text || pick(ISSUE_DETAILS[issue])
  return {
    createdMs,
    areaIdx,
    consumerIdx: consumer.idx,
    issue,
    details: `${ISSUE_LABELS[issue]}. ${baseDetail}`,
    homes,
    jitter,
    centerLat,
    centerLng,
    photo: PHOTO_REQUIRED.has(issue) || rnd() < 0.28,
    landmark: pick(LANDMARKS),
    priority: null,
    declined: null,
    attempts: [],
    reopenRequest: null,
    reopenedAtMs: null,
    confirm: null,
    rating: null,
    finalStatus: 'pending',
    lastMs: createdMs,
    endMs: Infinity,
    group: null,
    dispatchDelay: null,
  }
}

function simulateTicket(t, { factor = 1, forced = {} } = {}) {
  const area = AREAS[t.areaIdx]
  if (!forced.pending && !forced.assignedMs && !forced.chain && rnd() < 0.045) {
    const dm = Math.round(t.createdMs + clamp(logn(16, 0.7), 4, 120) * M)
    if (dm <= NOW - M) {
      t.declined = { atMs: dm, reason: pick(DECLINE_REASONS) }
      t.finalStatus = 'cancelled'
      t.lastMs = dm
      t.endMs = dm
      return
    }
  }
  let assignedMs
  if (forced.pending) assignedMs = Infinity
  else if (forced.assignedMs) assignedMs = forced.assignedMs
  else assignedMs = Math.round(t.createdMs + dispatchDelayMin(t.createdMs, factor) * M)
  if (assignedMs > NOW - 2 * M) return // still pending
  t.dispatchDelay = (assignedMs - t.createdMs) / M
  t.priority = forced.priority || pickPriority(t.issue, factor)
  const lineman = chooseLineman(area, assignedMs, forced.linemanIdx)
  const chain = forced.chain || rollChain()
  const built = buildAttempts({ assignedMs, area, issue: t.issue, lineman, factor, chain, forced })
  t.attempts = built.attempts
  t.reopenRequest = built.reopenRequest
  t.reopenedAtMs = built.reopenedAtMs
  t.finalStatus = built.finalStatus
  t.lastMs = built.lastMs
  t.endMs = built.finalStatus === 'resolved' ? built.lastMs : Infinity
  const fb = planFeedback(built.resolvedMs, lineman.idx, t.dispatchDelay)
  t.confirm = fb.confirm
  t.rating = fb.rating
  t.linemanIdx = lineman.idx
}

function planAll() {
  const st = { busy: new Array(CONSUMERS.length).fill(0), tickets: [], groups: [], order: [] }
  const slots = []
  const day0 = manilaDayStart(NOW)

  // Everyday volume: about 5 to 6 reports on a weekday, fewer on weekends
  for (let k = DAYS; k >= 0; k--) {
    const dayStart = day0 - k * DAYMS
    const dow = manilaParts(dayStart + 12 * HOURMS).dow
    const mean = dow === 0 ? 3.8 : dow === 6 ? 4.6 : 5.6
    const n = poisson(mean)
    for (let i = 0; i < n; i++) {
      const ms = dayStart + weightedHour() * HOURMS + Math.floor(rnd() * HOURMS)
      if (ms < NOW - DAYS * DAYMS || ms > NOW - 3 * HOURMS) continue
      slots.push({ type: 'normal', createdMs: ms, factor: 1 })
    }
  }

  // Storm and fault events
  const events = [
    { day: -26, startH: 15, endH: 19, municipalities: ['Libmanan'], extra: 9, groups: [{ feeder: 'Feeder 2', size: 7 }], factor: 1.8 },
    { day: -17, startH: 12, endH: 23, municipalities: ['Pasacao', 'Libmanan', 'San Fernando'], extra: 20, groups: [{ feeder: 'Feeder 10', size: 9 }, { feeder: 'Feeder 3', size: 6 }], factor: 2.2, issuePool: ['no_power', 'no_power', 'damaged_electric_post', 'damaged_power_lines', 'partial_power', 'sparks_or_unusual_sounds'] },
    { day: -9, startH: 8, endH: 11, municipalities: ['Sipocot', 'Cabusao'], extra: 4, groups: [{ feeder: 'Feeder 11', size: 6 }], factor: 1.5 },
    { day: -3, startH: 19, endH: 22, municipalities: ['Pamplona'], extra: 3, groups: [{ feeder: 'Feeder 5', size: 5 }], factor: 1.4 },
  ]
  if (DAYS >= 45) {
    events.push({ day: -33, startH: 10, endH: 14, municipalities: ['Camaligan'], extra: 3, groups: [{ feeder: 'Feeder 7', size: 5 }], factor: 1.4 })
    events.push({ day: -41, startH: 16, endH: 20, municipalities: ['Pasacao'], extra: 4, groups: [{ feeder: 'Feeder 9', size: 6 }], factor: 1.6 })
  }
  for (const ev of events) {
    if (-ev.day > DAYS - 1) continue
    const dayStart = manilaDayStart(NOW + ev.day * DAYMS)
    const startMs = dayStart + ev.startH * HOURMS
    const endMs = dayStart + ev.endH * HOURMS
    if (endMs > NOW - 3 * HOURMS) continue
    const areaPool = AREAS.map((a, i) => i).filter((i) => ev.municipalities.includes(AREAS[i].municipality))
    for (let i = 0; i < ev.extra; i++) {
      slots.push({ type: 'normal', createdMs: Math.round(startMs + rnd() * (endMs - startMs)), factor: ev.factor, areaPool, issuePool: ev.issuePool || ['no_power', 'no_power', 'no_power', 'partial_power', 'damaged_power_lines'] })
    }
    for (const g of ev.groups) {
      const times = []
      for (let i = 0; i < g.size; i++) times.push(Math.round(startMs + between(0, 20) * M + i * between(1, 9) * M))
      times.sort((a, b) => a - b)
      slots.push({ type: 'group', createdMs: times[0], spec: { feeder: g.feeder, size: g.size, memberTimes: times, factor: ev.factor, forced: {} } })
    }
  }

  // What the Dispatch page should look like right now
  const nowSlot = (minAgo, areaKey, issue, forced, extra = {}) => ({
    type: 'normal',
    createdMs: NOW - minAgo * M,
    area: areaOf(areaKey[0], areaKey[1]),
    issue,
    forced,
    factor: 1,
    ...extra,
  })
  slots.push(nowSlot(42, ['Poblacion', 'Libmanan'], 'no_power', { pending: true }, { text: OVERDUE_TEXT, homes: true }))
  slots.push(nowSlot(21, ['Castillo', 'Cabusao'], 'no_power', { pending: true }))
  slots.push(nowSlot(9, ['Balogo', 'Pasacao'], 'low_voltage', { pending: true }))
  ;[6, 9, 13, 17, 24, 33].forEach((min) => {
    slots.push(nowSlot(min, ['Caranan', 'Pasacao'], 'no_power', { pending: true }, { homes: true, jitter: 0.00015, text: 'Walang kuryente sa buong kalye namin. Maraming bahay sa paligid ang apektado rin.' }))
  })
  ;[22, 11].forEach((min) => {
    slots.push(nowSlot(min, ['San Gabriel', 'Pamplona'], 'no_power', { pending: true }, { homes: true, jitter: 0.0002, text: 'Nawalan din po kami ng kuryente, kasama ang mga kapitbahay sa tabi.' }))
  })
  slots.push(nowSlot(62, ['Sua', 'Camaligan'], 'partial_power', { assignedMs: NOW - 41 * M, upTo: 'assigned', chain: 'none', priority: 'medium' }))
  slots.push(nowSlot(80, ['Impig', 'Sipocot'], 'low_voltage', { assignedMs: NOW - 50 * M, offsets: { on_the_way: 6 }, upTo: 'on_the_way', chain: 'none', priority: 'medium' }))
  slots.push(nowSlot(125, ['Pandan', 'Cabusao'], 'no_power', { assignedMs: NOW - 104 * M, offsets: { on_the_way: 5, arrived_at_site: 42, in_progress: 47 }, upTo: 'in_progress', chain: 'none', priority: 'high' }))
  slots.push(nowSlot(100, ['Pamukid', 'San Fernando'], 'damaged_power_lines', { assignedMs: NOW - 79 * M, offsets: { on_the_way: 6, arrived_at_site: 38, in_progress: 43 }, upTo: 'in_progress', chain: 'none', priority: 'critical' }, { homes: false }))
  slots.push(nowSlot(215, ['Bahay', 'Libmanan'], 'damaged_power_lines', { assignedMs: NOW - 198 * M, offsets: { on_the_way: 5, arrived_at_site: 48, in_progress: 52, fixed: 167 }, upTo: 'fixed', chain: 'none', priority: 'high' }))
  slots.push(nowSlot(170, ['Mambulo Nuevo', 'Libmanan'], 'no_power', { assignedMs: NOW - 150 * M, offsets: { on_the_way: 5, arrived_at_site: 38, in_progress: 42, fixed: 137 }, upTo: 'fixed', chain: 'none', priority: 'critical' }, { homes: true }))
  // A resolved ticket whose consumer asked for a reopen a couple of hours ago
  slots.push(nowSlot(31 * 60, ['San Isidro', 'Libmanan'], 'low_voltage', { assignedMs: NOW - 31 * 60 * M + 10 * M, offsets: { on_the_way: 6, arrived_at_site: 36, in_progress: 41, fixed: 95, resolved: 115 }, chain: 'consumer_pending', requestMs: NOW - 150 * M, priority: 'medium' }))
  // An outage that is being worked on right now: a Master Ticket of seven reports on Feeder 6
  slots.push({
    type: 'group',
    createdMs: NOW - 150 * M,
    spec: {
      feeder: 'Feeder 6',
      size: 7,
      memberTimes: [150, 146, 141, 136, 131, 126, 120].map((x) => NOW - x * M),
      factor: 1,
      priority: 'high',
      forced: { masterMs: NOW - 100 * M, assignedMs: NOW - 92 * M, offsets: { on_the_way: 5, arrived_at_site: 34, in_progress: 40 }, upTo: 'in_progress', chain: 'none' },
    },
  })

  slots.sort((a, b) => a.createdMs - b.createdMs)
  for (const slot of slots) {
    if (slot.type === 'group') processGroup(slot, st)
    else processNormal(slot, st)
  }

  // Ticket numbers run in time order
  const all = [...st.tickets].sort((a, b) => a.createdMs - b.createdMs)
  all.forEach((t, i) => {
    t.ticket = `RPT-${YEAR}-${pad(TICKET_BASE + i + 1, 4)}`
  })
  st.groups.forEach((g, i) => {
    g.ticket = `MT-${manilaDateOf(g.createdMs).replace(/-/g, '')}-C1${pad(i + 1, 4)}`
  })
  return st
}

function chooseConsumer({ areaIdx, createdMs, taken, allow }) {
  const free = (c) => planState.busy[c.idx] <= createdMs && !taken.has(c.idx) && (!allow || allow(c))
  let pool = CONSUMERS_BY_AREA[areaIdx].filter(free)
  if (!pool.length && !allow) pool = CONSUMERS.filter((c) => AREAS[c.areaIdx].municipality === AREAS[areaIdx].municipality && free(c))
  if (!pool.length && !allow) pool = CONSUMERS.filter(free)
  if (!pool.length) return null
  return pool[Math.floor(rnd() * pool.length)]
}
let planState = null

function avoidToday(areaIdx, ms) {
  return AREAS[areaIdx].feeder === TODAY_ADVISORY_FEEDER && ms > NOW - 10 * HOURMS
}
function processNormal(slot, st) {
  planState = st
  let areaIdx = -1
  let issue = null
  for (let tries = 0; tries < 15; tries++) {
    let a
    let iss
    if (slot.area !== undefined) {
      a = slot.area
      iss = slot.issue || pickIssue()
    } else if (!slot.areaPool && rnd() < 0.17) {
      const h = weighted(HOTSPOTS, (x) => x.w)
      a = h.areaIdx
      iss = h.issue
    } else {
      const pool = slot.areaPool || AREAS.map((_, i) => i)
      a = weighted(pool, (i) => AREAS[i].weight)
      iss = slot.issue || (slot.issuePool ? pick(slot.issuePool) : pickIssue())
    }
    if (slot.area !== undefined || (!coveredByAdvisory(a, slot.createdMs) && !avoidToday(a, slot.createdMs))) {
      areaIdx = a
      issue = iss
      break
    }
  }
  if (areaIdx < 0) return
  const c = chooseConsumer({ areaIdx, createdMs: slot.createdMs, taken: new Set() })
  if (!c) return
  const t = makeTicket({
    consumer: c,
    areaIdx: c.areaIdx,
    createdMs: slot.createdMs,
    issue,
    text: slot.text,
    homes: slot.homes !== undefined ? slot.homes : issue === 'no_power' && rnd() < 0.55,
    jitter: slot.jitter,
  })
  simulateTicket(t, { factor: slot.factor || 1, forced: slot.forced || {} })
  st.busy[c.idx] = t.endMs
  st.tickets.push(t)
  st.order.push({ type: 'ticket', t })
}

function processGroup(slot, st) {
  planState = st
  const spec = slot.spec
  const feederAreas = AREAS.map((_, i) => i).filter((i) => AREAS[i].feeder === spec.feeder)
  const taken = new Set()
  const members = []
  for (let i = 0; i < spec.size; i++) {
    const ms = spec.memberTimes[i]
    const areaIdx = weighted(feederAreas, (x) => AREAS[x].weight)
    const c = chooseConsumer({ areaIdx, createdMs: ms, taken, allow: (cc) => AREAS[cc.areaIdx].feeder === spec.feeder })
    if (!c) continue
    taken.add(c.idx)
    const issue = rnd() < 0.82 ? 'no_power' : pick(['partial_power', 'low_voltage', 'sparks_or_unusual_sounds'])
    members.push(makeTicket({ consumer: c, areaIdx: c.areaIdx, createdMs: ms, issue, homes: true, jitter: 0.004 }))
  }
  if (members.length < 2) return
  const forced = spec.forced || {}
  const first = members[0]
  const area = AREAS[first.areaIdx]
  const masterMs = Math.round(forced.masterMs || first.createdMs + clamp(logn(32, 0.4), 15, 75) * M)
  const assignedMs = Math.round(forced.assignedMs || masterMs + between(4, 15) * M)
  const priority = spec.priority || (rnd() < 0.6 ? 'high' : 'critical')
  const lineman = chooseLineman(area, assignedMs)
  const chain = forced.chain || (rnd() < 0.06 ? 'qa_reject' : 'none')
  const built = buildAttempts({ assignedMs, area, issue: 'no_power', lineman, factor: (spec.factor || 1) * 1.5, chain, forced, allowReopenRequest: false })
  const g = {
    members,
    areaIdx: first.areaIdx,
    createdMs: masterMs,
    priority,
    attempts: built.attempts,
    reopenedAtMs: built.reopenedAtMs,
    finalStatus: built.finalStatus,
    lastMs: built.lastMs,
    confirm: null,
    rating: null,
    ratingMember: 0,
    linemanIdx: lineman.idx,
    dispatchDelay: (assignedMs - first.createdMs) / M,
  }
  const fb = planFeedback(built.resolvedMs, lineman.idx, g.dispatchDelay)
  g.confirm = fb.confirm
  g.rating = fb.rating
  g.ratingMember = Math.floor(rnd() * members.length)
  members.forEach((m) => {
    m.priority = priority
    m.finalStatus = built.finalStatus
    m.lastMs = built.lastMs
    m.endMs = built.finalStatus === 'resolved' ? built.lastMs : Infinity
    m.group = g
    m.dispatchDelay = g.dispatchDelay
    st.busy[m.consumerIdx] = m.endMs
    st.tickets.push(m)
  })
  st.groups.push(g)
  st.order.push({ type: 'group', g })
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
const FAQS = [
  { c: 'outages', q: 'What should I do when there is a power outage in my area?', a: 'First check if your neighbors also have no power. If they do, report it in the PRISM app with your location and a photo. A crew will be dispatched as soon as possible.', k: 'walang kuryente, mayong kuryente, no power, blackout, brownout', qt: 'Ano ang gagawin kapag nawalan ng kuryente sa amin?', at: 'Tingnan muna kung wala ring kuryente ang mga kapitbahay. Kung gayon, i-report ito sa PRISM app kasama ang lokasyon at larawan.' },
  { c: 'outages', q: 'How long does it take to restore power?', a: 'It depends on the cause and the number of affected households. Most reported outages are assigned to a crew within 30 minutes.', k: 'restoration, how long, gaano katagal', qt: 'Gaano katagal bago maibalik ang kuryente?', at: 'Depende ito sa sanhi at sa dami ng apektadong tahanan. Karamihan ng report ay naaasign sa crew sa loob ng 30 minuto.' },
  { c: 'outages', q: 'Where can I see scheduled power interruptions?', a: 'Open the Advisories section of the app. It lists upcoming interruptions for your barangay, municipality or feeder.', k: 'advisory, schedule, maintenance, brownout schedule', qt: 'Saan ko makikita ang schedule ng brownout?', at: 'Buksan ang Advisories sa app. Nakalista roon ang mga paparating na interruption sa inyong barangay, bayan o feeder.' },
  { c: 'outages', q: 'Why can I not file a report right now?', a: 'Reporting is temporarily unavailable while a scheduled interruption is ongoing in your area, or outside the cooperative office hours. The app shows your area office hotline instead.', k: 'cannot report, reporting closed, hotline', qt: null, at: null },
  { c: 'billing', q: 'How do I link my billing account?', a: 'Go to Billing in the app and enter your account number. Your cooperative verifies it against its billing records before you can view your bills.', k: 'link account, account number, bill', qt: 'Paano ko ili-link ang aking billing account?', at: 'Pumunta sa Billing at ilagay ang account number. Bine-verify ito ng kooperatiba bago ninyo makita ang inyong bill.' },
  { c: 'billing', q: 'Why is my bill higher this month?', a: 'Your bill depends on your kilowatt-hour consumption and the current generation charge. Compare your meter readings with last month, and contact your area office if you still have concerns.', k: 'mataas na bill, high bill, consumption', qt: null, at: null },
  { c: 'billing', q: 'Where can I pay my electric bill?', a: 'You can pay at any CASURECO I office, accredited payment centers and partner banks. Please bring your bill or your account number.', k: 'pay bill, payment, bayad', qt: 'Saan ako puwedeng magbayad ng kuryente?', at: 'Puwede kayong magbayad sa tanggapan ng CASURECO I, payment centers at partner banks. Dalhin lamang ang bill o account number.' },
  { c: 'billing', q: 'What is the due date of my bill?', a: 'The due date is printed on your bill and shown in the Billing section of the app for linked accounts.', k: 'due date, deadline, petsa', qt: null, at: null },
  { c: 'technical', q: 'Why are my lights flickering?', a: 'Flickering can be caused by a loose connection, a failing transformer, or heavy load on your line. If it happens repeatedly, please file a report so a crew can inspect it.', k: 'flickering, pumipitik, dim lights', qt: null, at: null },
  { c: 'technical', q: 'What causes low voltage?', a: 'Common causes are overloaded lines, long distance from the transformer, or loose connections. Report it so the area office can measure the voltage at your meter.', k: 'low voltage, mahina ang kuryente', qt: 'Ano ang sanhi ng mahinang boltahe?', at: 'Maaaring sanhi ang sobrang karga ng linya, layo sa transformer o maluwag na koneksyon. I-report upang masukat ng area office.' },
  { c: 'technical', q: 'Is it safe to go near a fallen power line?', a: 'No. Stay at least 10 meters away, keep others away, and report it immediately. Never touch a fallen line or anything it touches.', k: 'fallen line, safety, nahulog na kable', qt: 'Ligtas bang lumapit sa nahulog na kable?', at: 'Hindi. Lumayo nang hindi bababa sa 10 metro, pigilan ang iba, at i-report agad. Huwag hawakan ang kable o anumang nakadikit dito.' },
  { c: 'technical', q: 'How do I request a meter inspection?', a: 'Visit your area office or send a question through the FAQ section of the app. A technician will schedule an inspection.', k: 'meter, inspection, metro', qt: null, at: null },
  { c: 'technical', q: 'Can I report an outage without internet?', a: 'Yes. The app saves your report on the phone and sends it automatically when the connection returns. You will see the ticket number right away.', k: 'offline, no signal, walang signal', qt: 'Puwede bang mag-report kahit walang internet?', at: 'Oo. Sine-save ng app ang report sa telepono at awtomatikong ipapadala kapag may koneksyon na. Makikita agad ang ticket number.' },
]
const PENDING_INQUIRIES = [
  ['Pwede po bang magpa-reconnect ng kuryente kahit may utang pa po?', 150],
  ['How do I update the name on my electric account?', 400],
  ['May schedule po ba ng brownout bukas sa Pasacao?', 45],
  ['Paano po mag-apply ng bagong koneksyon ng kuryente?', 1300],
]
const ANSWERED_INQUIRIES = [
  ['Paano po magpa-transfer ng pangalan sa metro?', 'Magdala po ng valid ID at kopya ng title o kontrata sa inyong area office para maproseso ang transfer.', 3 * 1440],
  ['Is there a discount for senior citizens?', 'Yes. Senior citizens who meet the requirements may avail of the discount. Please visit your area office with a valid senior citizen ID.', 5 * 1440],
  ['Bakit po dalawang beses akong nabisita ng lineman?', 'Maaaring nagkaroon ng follow-up job order matapos ang unang pag-aayos. Makikita po ninyo ang kasaysayan ng ticket sa app.', 9 * 1440],
  ['Saan po ang pinakamalapit na tanggapan sa Camaligan?', 'Maaari po kayong magtungo sa CAO 3 - Pamplona. Nakalista ang hotline sa app kapag sarado ang pag-uulat.', 12 * 1440],
  ['Can I get a copy of my previous bills?', 'Yes. After your account is linked, open Billing in the app to see your billing history, or request copies at your area office.', 16 * 1440],
  ['Ilang araw bago maayos ang nabaling poste?', 'Depende po sa lawak ng pinsala. Ipapaalam po sa inyo sa app ang bawat hakbang ng pag-aayos.', 22 * 1440],
]

// ---------------------------------------------------------------------------
// DRY RUN: a summary of the generated data, no database needed
// ---------------------------------------------------------------------------
function summarize(st) {
  const tickets = st.tickets
  const count = (fn) => tickets.filter(fn).length
  const byStatus = {}
  tickets.forEach((t) => {
    byStatus[t.finalStatus] = (byStatus[t.finalStatus] || 0) + 1
  })
  const perDay = {}
  tickets.forEach((t) => {
    const key = manilaDateOf(t.createdMs)
    perDay[key] = (perDay[key] || 0) + 1
  })
  const days = Object.keys(perDay).sort()
  const delays = tickets.filter((t) => t.dispatchDelay !== null).map((t) => t.dispatchDelay)
  const within = delays.filter((d) => d <= RESPONSE_TIME_THRESHOLD_MINUTES).length
  const ratings = tickets.map((t) => t.rating).filter(Boolean)
  const ratingSeen = new Set()
  const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  st.order.forEach((item) => {
    const r = item.type === 'ticket' ? item.t.rating : item.g.rating
    if (r) ratingDist[r.value] += 1
  })
  void ratings
  void ratingSeen
  const byMuni = {}
  tickets.forEach((t) => {
    const m = AREAS[t.areaIdx].municipality
    byMuni[m] = (byMuni[m] || 0) + 1
  })
  const byIssue = {}
  tickets.forEach((t) => {
    byIssue[t.issue] = (byIssue[t.issue] || 0) + 1
  })
  const attempts = st.order.reduce((n, i) => n + (i.type === 'ticket' ? i.t.attempts.length : i.g.attempts.length), 0)
  const reqs = tickets.filter((t) => t.reopenRequest)
  console.log(`\nDRY RUN (no database was touched). History: ${DAYS} days.\n`)
  console.log(`Cooperative            ${COOP_NAME}  (${MUNICIPALITIES.length} towns, ${AREAS.length} barangays, ${FEEDERS.length} feeders, ${AREA_OFFICES.length} area offices)`)
  console.log(`Accounts               ${SUPERVISORS.length} supervisors, ${LINEMEN.length} linemen, ${CONSUMERS.length} consumers`)
  console.log(`Reports                ${tickets.length} (${(tickets.length / DAYS).toFixed(1)} per day)`)
  console.log(`  by status now        ${Object.entries(byStatus).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  console.log(`  declined             ${count((t) => t.declined)}`)
  console.log(`  Master Tickets       ${st.groups.length} (${st.groups.reduce((n, g) => n + g.members.length, 0)} reports merged)`)
  console.log(`  job orders           ${attempts} (${attempts - st.order.length + st.order.filter((i) => i.type === 'ticket' && !i.t.attempts.length && !i.t.declined).length} extra attempts after rejections/reopens)`)
  console.log(`  reopen requests      ${reqs.length} (${reqs.filter((t) => t.reopenRequest.status === 'pending').length} pending)`)
  console.log(`  QA rejections        ${st.order.reduce((n, i) => n + (i.type === 'ticket' ? i.t.attempts : i.g.attempts).filter((a) => a.qa && a.qa.decision === 'rejected').length, 0)}`)
  console.log(`Response time          dispatched within ${RESPONSE_TIME_THRESHOLD_MINUTES} min: ${delays.length ? Math.round((within / delays.length) * 100) : 0}% (avg ${delays.length ? Math.round(delays.reduce((s, d) => s + d, 0) / delays.length) : 0} min)`)
  console.log(`Ratings                ${Object.values(ratingDist).reduce((s, v) => s + v, 0)} (1:${ratingDist[1]} 2:${ratingDist[2]} 3:${ratingDist[3]} 4:${ratingDist[4]} 5:${ratingDist[5]})`)
  console.log(`By town                ${Object.entries(byMuni).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  console.log(`By category            ${Object.entries(byIssue).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  console.log(`Advisories             ${ADVISORIES.length} (${ADVISORIES.filter((a) => a.startMs < NOW && a.endMs < NOW).length} past, 1 active today, ${ADVISORIES.filter((a) => a.startMs > NOW).length} upcoming, ${ADVISORIES.filter((a) => a.archivedMs).length} archived)`)
  console.log('\nReports per day (oldest first):')
  console.log(days.map((d) => `${d.slice(5)} ${'#'.repeat(perDay[d])} ${perDay[d]}`).join('\n'))
  console.log('')
}

// ---------------------------------------------------------------------------
// SEED (database)
// ---------------------------------------------------------------------------
let phoneCounter = 0

async function findAuthUserByEmail(email) {
  for (let page = 1; page <= 10; page++) {
    const res = await sb.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    if (res.error) return null

    const existing = res.data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    )

    if (existing) return existing

    if (res.data.users.length < 1000) break
  }

  return null
}

async function authCreate(params) {
  const MAX_ATTEMPTS = 5

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await sb.auth.admin.createUser(params)

    if (!res.error) {
      // Small pause to avoid overwhelming the Auth API.
      await sleep(200)
      return res
    }

    const msg = String(res.error.message || '')
    const isTransient =
      res.error.status === 0 ||
      res.error.status === 429 ||
      res.error.name === 'AuthRetryableFetchError' ||
      /fetch failed|network|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|rate limit|too many/i.test(msg)

    if (!isTransient) return res

    // A failed fetch can happen even if Supabase already created
    // the account but the response never reached this script.
    const existing = await findAuthUserByEmail(params.email)

    if (existing) {
      console.log(`      Recovered existing Auth account: ${params.email}`)
      return {
        data: { user: existing },
        error: null,
      }
    }

    if (attempt === MAX_ATTEMPTS) return res

    const delay = 2000 * attempt

    console.warn(
      `      Temporary Auth error for ${params.email}. ` +
      `Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`
    )

    await sleep(delay)
  }

  return { error: { message: 'could not create login after retries' } }
}


async function createRegistrationClaimWithRetry(claimData, email) {
  const MAX_ATTEMPTS = 5
  const tokenHash = claimData.token_hash

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let insertError = null

    try {
      const result = await sb
        .from('consumer_registration_claims')
        .insert(claimData)

      if (!result.error) return

      insertError = result.error
    } catch (error) {
      insertError = error
    }

    // Check whether the claim was saved despite a lost response.
    try {
      const existing = await sb
        .from('consumer_registration_claims')
        .select('token_hash')
        .eq('token_hash', tokenHash)
        .maybeSingle()

      if (existing.data?.token_hash) {
        console.log(`      Recovered saved registration claim: ${email}`)
        return
      }

      if (existing.error) {
        const lookupMessage = String(existing.error.message || '')
        const lookupTransient =
          existing.error.status === 0 ||
          /fetch failed|network|timeout|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(lookupMessage)

        if (!lookupTransient) {
          throw new Error(`verify registration claim ${email}: ${lookupMessage}`)
        }
      }
    } catch (error) {
      if (error.message?.startsWith('verify registration claim')) throw error
      // The lookup itself may have encountered a temporary network failure.
    }

    const message = String(insertError?.message || insertError || '')
    const isTransient =
      insertError?.status === 0 ||
      insertError?.status === 429 ||
      /fetch failed|network|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|rate limit|too many/i.test(message)

    if (!isTransient || attempt === MAX_ATTEMPTS) {
      throw new Error(`create registration claim ${email}: ${message}`)
    }

    const delay = 2000 * attempt

    console.warn(
      `      Temporary network error creating registration claim for ${email}. ` +
      `Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`
    )

    await sleep(delay)
  }
}


async function createUser(ex, { email, first, last, type, areaIdx = 0, zone = 'Zone 1', accountNumber = null }) {
  phoneCounter += 1
  const area = AREAS[areaIdx]
  const phoneNumber = `0998${pad(phoneCounter, 7)}`
  const claimToken = randomUUID() + randomUUID()
  const claimAccountNumber = accountNumber || `CS1STAFF-${pad(phoneCounter, 4)}`
  const normalizedAccountNumber = claimAccountNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

  // The signup trigger turns a registration claim into a consumer profile and its billing link
  await createRegistrationClaimWithRetry({
    token_hash: createHash('sha256').update(claimToken).digest('hex'),
    cooperative_id: ex.coopId,
    normalized_account_number: normalizedAccountNumber,
    account_number: claimAccountNumber,
    account_id: randomUUID(),
    meter_number: `C1M-${pad(phoneCounter, 6)}`,
    first_name: first,
    last_name: last,
    municipality: area.municipality,
    barangay: area.barangay,
    zone,
    account_type: 'residential',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * M).toISOString(),
  }, email)

  const res = await authCreate({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      cooperative_id: ex.coopId,
      first_name: first,
      last_name: last,
      phone_number: phoneNumber,
      user_type: 'consumer',
      registration_claim_token: claimToken,
    },
  })
  if (res.error) {
    console.error('Auth error details:', { name: res.error.name, message: res.error.message, status: res.error.status, code: res.error.code })
    throw new Error(`create login ${email}: ${res.error.message}`)
  }
  const user = check(res, `create login ${email}`).user

  // Staff accounts are promoted after the trigger has created their first (consumer) profile
  if (type !== 'consumer') {
    check(await sb.from('consumer_bill_links').delete().eq('consumer_id', user.id), `remove temporary consumer bill link ${email}`)
    check(await sb.from('consumer').delete().eq('profile_id', user.id), `remove temporary consumer role ${email}`)
    check(
      await sb.from('users').update({ user_type: type, updated_at: new Date().toISOString() }).eq('id', user.id),
      `promote profile ${email} to ${type}`
    )
  }
  return user.id
}

async function backdate(refIds, ms) {
  if (!refIds.length) return
  const r = await sb.from('notifications').update({ created_at: at(ms) }).in('reference_id', refIds)
  if (r.error) warnOnce(`could not backdate notifications: ${r.error.message}`)
}
async function touch(table, idCol, id, ms) {
  const r = await sb.from(table).update({ updated_at: at(ms) }).eq(idCol, id)
  if (r.error) warnOnce(`could not set updated_at on ${table}: ${r.error.message}`)
}
async function syncStatus(table, idCol, id, expected) {
  const r = await sb.from(table).select('status').eq(idCol, id).single()
  if (r.error || !r.data) {
    warnOnce(`could not read ${table}.status: ${r.error ? r.error.message : 'no row'}`)
    return
  }
  if (r.data.status !== expected) {
    const u = await sb.from(table).update({ status: expected }).eq(idCol, id)
    if (u.error) warnOnce(`could not set ${table}.status to ${expected}: ${u.error.message}`)
  }
}


async function insertReport(t, ex) {
  const consumer = CONSUMERS[t.consumerIdx]
  const area = AREAS[t.areaIdx]
  const reportId = randomUUID()
  const lat = (t.centerLat !== undefined ? t.centerLat : area.lat) + between(-t.jitter, t.jitter)
  const lng = (t.centerLng !== undefined ? t.centerLng : area.lng) + between(-t.jitter, t.jitter)

  const photoPath = t.photo
    ? await uploadPhoto('report-photos', `${ex.coopId}/${reportId}.png`, PNG.report)
    : null

  const reportData = {
    report_id: reportId,
    consumer_id: ex.consumerIds[t.consumerIdx],
    ticket_number: t.ticket,
    zone: consumer.zone,
    barangay: area.barangay,
    municipality: area.municipality,
    location: point(lat, lng),
    nearest_landmark: t.landmark,
    report_details: t.details,
    issue_code: t.issue,
    photo_url: photoPath,
    upload_at: photoPath ? at(t.createdMs) : null,
    priority: t.priority,
    other_homes_affected: !!t.homes,
    cooperative_id: ex.coopId,
    account_number: consumer.account,
    created_at: at(t.createdMs),
  }

  const MAX_ATTEMPTS = 5

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let insertError = null

    try {
      const result = await sb.from('reports').insert(reportData)

      if (!result.error) {
        return reportId
      }

      insertError = result.error
    } catch (error) {
      insertError = error
    }

    // The request may have succeeded even if its response was lost.
    // Check using the same UUID before attempting another insert.
    try {
      const existing = await sb
        .from('reports')
        .select('report_id')
        .eq('report_id', reportId)
        .maybeSingle()

      if (existing.data?.report_id) {
        console.log(`      Recovered saved report ${t.ticket}`)
        return reportId
      }
    } catch {
      // A temporary network failure may also affect this lookup.
      // Continue to the retry handling below.
    }

    const message = String(insertError?.message || insertError || '')
    const isTransient =
      insertError?.status === 0 ||
      insertError?.status === 429 ||
      /fetch failed|network|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|rate limit|too many/i.test(message)

    if (!isTransient || attempt === MAX_ATTEMPTS) {
      throw new Error(`create report ${t.ticket}: ${message}`)
    }

    const delay = 2000 * attempt

    console.warn(
      `      Temporary network error creating ${t.ticket}. ` +
      `Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`
    )

    await sleep(delay)
  }

  throw new Error(`create report ${t.ticket}: failed after retries`)
}

async function updateStatusLogWithRetry(logId, changedAt) {
  const MAX_ATTEMPTS = 5

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let error = null

    try {
      const result = await sb
        .from('job_assignment_status_logs')
        .update({ changed_at: changedAt })
        .eq('id', logId)

      if (!result.error) return

      error = result.error
    } catch (err) {
      error = err
    }

    const message = String(error?.message || error || '')
    const isTransient =
      error?.status === 0 ||
      error?.status === 429 ||
      /fetch failed|network|timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|rate limit|too many/i.test(message)

    if (!isTransient || attempt === MAX_ATTEMPTS) {
      throw new Error(`time the status log: ${message}`)
    }

    const delay = 2000 * attempt

    console.warn(
      `      Temporary network error updating a status log. ` +
      `Retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`
    )

    await sleep(delay)
  }
}

// One job order: the same step-by-step walk the apps do (QA approval first, then "resolved")
async function runAttempt({ reportId, masterId, att, ex }) {
  const assignmentId = randomUUID()
  const lineman = ex.linemanIds[att.linemanIdx]
  const reachesFixed = att.steps.some((s) => s.status === 'fixed' || s.status === 'resolved')
  const proofPath = reachesFixed && att.photo ? await uploadPhoto('assignment-proofs', `${ex.coopId}/${assignmentId}.png`, PNG.proof) : null
  check(
    await sb.from('job_assignments').insert({
      assignment_id: assignmentId,
      report_id: reportId,
      master_id: masterId,
      lineman_id: lineman,
      status: 'assigned',
      assigned_at: at(att.assignedMs),
      ...(att.reopen ? { reopen_reason: att.reopen.reason, reopen_source: att.reopen.source, reopened_by: ex.supervisorIds[att.reopen.byIdx] } : {}),
    }),
    'create job order'
  )
  for (const step of att.steps) {
    const patch = {}
    if (step.status === 'fixed') {
      patch.photo_url = proofPath
      patch.repair_note = att.note
    }
    if (step.status === 'resolved') {
      patch.completed_at = at(step.atMs)
      check(
        await sb.from('qa_reviews').insert({
          assignment_id: assignmentId,
          reviewer_id: ex.supervisorIds[att.qa ? att.qa.reviewerIdx : 0],
          reviewer_type: 'supervisor',
          decision: 'approved',
          reviewed_at: at(step.atMs),
        }),
        'QA approval'
      )
    }
    check(await sb.from('job_assignments').update({ status: step.status, ...patch }).eq('assignment_id', assignmentId), `job order -> ${step.status}`)
  }
  // Give each status-log row the time it should have had
  if (att.steps.length > 0) {
    const logs = check(
      await sb.from('job_assignment_status_logs').select('id').eq('assignment_id', assignmentId).order('changed_at', { ascending: true }),
      'read status log'
    )
    for (let i = 0; i < logs.length && i < att.steps.length; i++) {
      await updateStatusLogWithRetry(
        logs[i].id,
        at(att.steps[i].atMs)
      )
    }
  }
  if (att.qa && att.qa.decision === 'rejected') {
    check(
      await sb.from('qa_reviews').insert({
        assignment_id: assignmentId,
        reviewer_id: ex.supervisorIds[att.qa.reviewerIdx],
        reviewer_type: 'supervisor',
        decision: 'rejected',
        remarks: att.qa.remarks,
        reviewed_at: at(att.qa.atMs),
      }),
      'QA rejection'
    )
  }
  return assignmentId
}

async function recordFeedback({ assignmentId, consumerId, linemanId, confirm, rating }, ex) {
  if (!confirm) return
  let confirmed = false
  try {
    if (rating) {
      // The database only accepts a rating shortly after the confirmation, so both rows are written
      // with real timestamps first and moved back in time afterwards.
      check(
        await sb.from('qa_reviews').insert({ assignment_id: assignmentId, reviewer_id: consumerId, reviewer_type: 'consumer', decision: 'approved', reviewed_at: new Date().toISOString() }),
        'consumer confirmation'
      )
      confirmed = true
      check(
        await sb.from('job_ratings').insert({ assignment_id: assignmentId, consumer_id: consumerId, lineman_id: linemanId, rating: rating.value, comment: rating.comment || null }),
        'rating'
      )
      check(
        await sb.from('qa_reviews').update({ reviewed_at: at(confirm.atMs) }).eq('assignment_id', assignmentId).eq('reviewer_id', consumerId).eq('reviewer_type', 'consumer'),
        'time the confirmation'
      )
      check(await sb.from('job_ratings').update({ created_at: at(rating.atMs) }).eq('assignment_id', assignmentId), 'time the rating')
      ex.stats.ratings += 1
    } else {
      check(
        await sb.from('qa_reviews').insert({ assignment_id: assignmentId, reviewer_id: consumerId, reviewer_type: 'consumer', decision: 'approved', reviewed_at: at(confirm.atMs) }),
        'consumer confirmation'
      )
      ex.stats.confirmations += 1
    }
  } catch (e) {
    ex.stats.feedbackSkipped += 1
    warnOnce(`a rating or confirmation was skipped (${e.message})`)
    if (confirmed) {
      await sb.from('qa_reviews').update({ reviewed_at: at(confirm.atMs) }).eq('assignment_id', assignmentId).eq('reviewer_id', consumerId).eq('reviewer_type', 'consumer')
    }
  }
}

async function execTicket(t, ex) {
  const consumerId = ex.consumerIds[t.consumerIdx]
  const reportId = await insertReport(t, ex)
  if (t.declined) {
    check(await sb.from('reports').update({ status: 'cancelled', decline_reason: t.declined.reason }).eq('report_id', reportId), 'decline report')
    await touch('reports', 'report_id', reportId, t.declined.atMs)
    await backdate([reportId], t.createdMs + M)
    return
  }
  const assignmentIds = []
  for (let i = 0; i < t.attempts.length; i++) {
    const att = t.attempts[i]
    const aid = await runAttempt({ reportId, masterId: null, att, ex })
    assignmentIds.push(aid)
    if (i === 0 && t.reopenRequest) {
      const rq = t.reopenRequest
      check(
        await sb.from('reopen_requests').insert({
          report_id: reportId,
          assignment_id: aid,
          consumer_id: consumerId,
          description: rq.description,
          status: rq.status,
          requested_at: at(rq.atMs),
          ...(rq.reviewedMs ? { reviewed_by: ex.supervisorIds[rq.reviewerIdx], reviewed_at: at(rq.reviewedMs) } : {}),
          ...(rq.note ? { review_note: rq.note } : {}),
        }),
        'reopen request'
      )
    }
  }
  if (t.reopenedAtMs) check(await sb.from('reports').update({ reopened_at: at(t.reopenedAtMs) }).eq('report_id', reportId), 'mark reopened')
  if (assignmentIds.length > 0) {
    await recordFeedback(
      { assignmentId: assignmentIds[assignmentIds.length - 1], consumerId, linemanId: ex.linemanIds[t.linemanIdx], confirm: t.confirm, rating: t.rating },
      ex
    )
  }
  // Same final state the apps would have left, then the times
  await syncStatus('reports', 'report_id', reportId, t.finalStatus)
  for (let i = 0; i < assignmentIds.length; i++) {
    const att = t.attempts[i]
    const last = Math.max(att.assignedMs, ...att.steps.map((s) => s.atMs), att.qa ? att.qa.atMs : 0)
    await touch('job_assignments', 'assignment_id', assignmentIds[i], last)
  }
  await touch('reports', 'report_id', reportId, t.lastMs)
  await backdate([reportId], t.createdMs + M)
  for (let i = 0; i < assignmentIds.length; i++) await backdate([assignmentIds[i]], t.attempts[i].assignedMs + 2 * M)
}

async function execGroup(g, ex) {
  const reportIds = []
  for (const m of g.members) reportIds.push(await insertReport(m, ex))
  const area = AREAS[g.areaIdx]
  const mt = check(
    await sb
      .from('master_tickets')
      .insert({
        master_ticket: g.ticket,
        barangay: area.barangay,
        municipality: area.municipality,
        location: point(area.lat, area.lng),
        priority: g.priority,
        report_count: 0,
        status: 'pending',
        cooperative_id: ex.coopId,
        created_at: at(g.createdMs),
      })
      .select()
      .single(),
    'create master ticket'
  )
  check(await sb.from('reports').update({ master_id: mt.master_id }).in('report_id', reportIds), 'group reports')
  check(await sb.from('master_tickets').update({ report_count: reportIds.length }).eq('master_id', mt.master_id), 'update master ticket count')
  const assignmentIds = []
  for (const att of g.attempts) assignmentIds.push(await runAttempt({ reportId: null, masterId: mt.master_id, att, ex }))
  if (g.reopenedAtMs) check(await sb.from('master_tickets').update({ reopened_at: at(g.reopenedAtMs) }).eq('master_id', mt.master_id), 'mark master reopened')
  if (assignmentIds.length > 0 && g.confirm) {
    const member = g.members[g.ratingMember]
    await recordFeedback(
      { assignmentId: assignmentIds[assignmentIds.length - 1], consumerId: ex.consumerIds[member.consumerIdx], linemanId: ex.linemanIds[g.linemanIdx], confirm: g.confirm, rating: g.rating },
      ex
    )
  }
  await syncStatus('master_tickets', 'master_id', mt.master_id, g.finalStatus)
  for (const rid of reportIds) await syncStatus('reports', 'report_id', rid, g.finalStatus)
  if (g.finalStatus === 'resolved') {
    const r = await sb.from('master_tickets').update({ resolved_at: at(g.lastMs) }).eq('master_id', mt.master_id)
    if (r.error) warnOnce(`could not set resolved_at on master tickets: ${r.error.message}`)
  }
  for (let i = 0; i < assignmentIds.length; i++) {
    const att = g.attempts[i]
    const last = Math.max(att.assignedMs, ...att.steps.map((s) => s.atMs), att.qa ? att.qa.atMs : 0)
    await touch('job_assignments', 'assignment_id', assignmentIds[i], last)
  }
  for (let i = 0; i < reportIds.length; i++) {
    await touch('reports', 'report_id', reportIds[i], g.lastMs)
    await backdate([reportIds[i]], g.members[i].createdMs + M)
  }
  await backdate([mt.master_id], g.createdMs + M)
  for (let i = 0; i < assignmentIds.length; i++) await backdate([assignmentIds[i]], g.attempts[i].assignedMs + 2 * M)
}

async function seed() {
  const st = planAll()
  summarize(st)
  console.log('Creating the CASURECO I demo cooperative in 5 seconds. Press Ctrl+C to cancel...')
  await sleep(5000)

  // ---- Safety checks: never touch or collide with other data ---------------
  const leftoverCoops = check(await sb.from('cooperatives').select('id').like('official_email', `%${MARKER}`), 'look for existing demo data')
  const leftoverUsers = check(await sb.from('users').select('id').like('email', `%${MARKER}`).limit(1), 'look for existing demo users')
  if (leftoverCoops.length > 0 || leftoverUsers.length > 0) {
    console.error('CASURECO I demo data already exists. Run with --cleanup first, then try again.')
    process.exit(1)
  }
  const sameName = check(await sb.from('cooperatives').select('id').eq('cooperative_name', COOP_NAME), 'check the cooperative name')
  if (sameName.length > 0) {
    console.error(
      `A cooperative named "${COOP_NAME}" already exists and was not created by this script.\n` +
        'Add SEED_COOP_NAME=CASURECO I (Demo) (or any other name) to .env.local and run again.'
    )
    process.exit(1)
  }
  const planned = st.tickets.map((t) => t.ticket)
  for (const part of chunks(planned, 100)) {
    const taken = check(await sb.from('reports').select('ticket_number').in('ticket_number', part), 'check ticket numbers')
    if (taken.length > 0) {
      console.error(`Ticket numbers like ${taken[0].ticket_number} are already used. Set SEED_TICKET_BASE (for example 3000) in .env.local and run again.`)
      process.exit(1)
    }
  }

  const ex = {
    coopId: null,
    supervisorIds: [],
    linemanIds: [],
    consumerIds: [],
    stats: { ratings: 0, confirmations: 0, feedbackSkipped: 0 },
  }

  // ---- 1. Cooperative ------------------------------------------------------
  console.log('1/9  Cooperative')
  const coop = check(
    await sb
      .from('cooperatives')
      .insert({
        cooperative_name: COOP_NAME,
        office_address: 'Poblacion, Libmanan',
        municipality: 'Libmanan',
        province: 'Camarines Sur',
        contact_number: '(054) 555-0100',
        official_email: `info${MARKER}`,
        created_at: ago((DAYS + 10) * 1440),
      })
      .select()
      .single(),
    'create cooperative'
  )
  ex.coopId = coop.id
  check(await sb.from('cooperatives').update({ status: 'Active' }).eq('id', ex.coopId), 'activate cooperative')
  check(
    await sb.from('cooperative_status_logs').insert([
      { cooperative_id: ex.coopId, previous_status: null, new_status: 'Pending Approval', changed_at: ago((DAYS + 10) * 1440) },
      { cooperative_id: ex.coopId, previous_status: 'Pending Approval', new_status: 'Active', changed_at: ago((DAYS + 9) * 1440) },
    ]),
    'status history'
  )

  // ---- 2. Settings ---------------------------------------------------------
  console.log('2/9  Settings, area offices, hotlines and billing connection')
  check(
    await sb.from('cooperative_settings').upsert(
      {
        cooperative_id: ex.coopId,
        area_offices: AREA_OFFICES,
        area_office_hotlines: HOTLINES,
        response_time_threshold_minutes: RESPONSE_TIME_THRESHOLD_MINUTES,
        resolution_target_minutes: RESOLUTION_TARGET_MINUTES,
        ...billingSettings(),
      },
      { onConflict: 'cooperative_id' }
    ),
    'save settings'
  )

  // ---- 3. Service areas ----------------------------------------------------
  console.log('3/9  Service areas')
  check(
    await sb.from('service_areas').insert(
      AREAS.map((a) => ({
        cooperative_id: ex.coopId,
        substation: a.substation,
        feeder: a.feeder,
        barangay: a.barangay,
        municipality: a.municipality,
        province: 'Camarines Sur',
        area_office: AREA_OFFICES[a.office],
      }))
    ),
    'create service areas'
  )

  // ---- 4. People -----------------------------------------------------------
  console.log('4/9  Accounts (supervisors, linemen, consumers)')
  for (const s of SUPERVISORS) {
    const id = await createUser(ex, { email: `${s.key}${MARKER}`, first: s.first, last: s.last, type: 'supervisor' })
    check(await sb.from('supervisor').insert({ profile_id: id, is_owner: s.owner, feature_access: s.access }), `supervisor role ${s.key}`)
    ex.supervisorIds.push(id)
  }
  for (let i = 0; i < LINEMEN.length; i++) {
    const L = LINEMEN[i]
    const id = await createUser(ex, { email: `lineman${pad(i + 1, 2)}${MARKER}`, first: L.first, last: L.last, type: 'lineman', areaIdx: AREAS.findIndex((a) => a.office === L.office) })
    const hub = OFFICE_HUBS[L.office]
    check(
      await sb.from('lineman').insert({
        profile_id: id,
        assigned_area_office: AREA_OFFICES[L.office],
        company_id_number: `CS1-${pad(i + 1, 4)}`,
        location: point(hub[0], hub[1]),
        location_updated_at: ago(180),
        schedule: L.schedule,
        duty_override_until: L.oncall ? at(NOW + 8 * HOURMS) : null,
      }),
      `lineman role ${L.first}`
    )
    ex.linemanIds.push(id)
  }
  for (const c of CONSUMERS) {
    const id = await createUser(ex, { email: c.email, first: c.first, last: c.last, type: 'consumer', areaIdx: c.areaIdx, zone: c.zone, accountNumber: c.account })
    const area = AREAS[c.areaIdx]
    check(
      await sb.from('consumer').update({ zone: c.zone, barangay: area.barangay, municipality: area.municipality, feeder: area.feeder }).eq('profile_id', id),
      `update consumer role ${c.first} ${c.last}`
    )
    ex.consumerIds.push(id)
    if ((c.idx + 1) % 25 === 0) console.log(`      ${c.idx + 1}/${CONSUMERS.length} consumers`)
  }
  const links = await sb.from('consumer_bill_links').select('link_id', { count: 'exact', head: true }).eq('cooperative_id', ex.coopId)
  if (links.error) warn(`could not check billing links: ${links.error.message}`)
  else if ((links.count ?? 0) === 0) warn('no billing account links exist for the demo consumers, so the Consumer Accounts tab will show no account numbers.')
  else console.log(`      ${links.count} billing account links were created by the signup trigger`)

  // ---- 5. Advisories -------------------------------------------------------
  console.log('5/9  Advisories')
  const isdId = ex.supervisorIds[SUPERVISORS.findIndex((s) => s.key === 'isd')]
  for (const adv of ADVISORIES) {
    const advisoryId = randomUUID()
    const photoPath = adv.photo ? await uploadPhoto('advisory-photos', `${ex.coopId}/${advisoryId}-sample.png`, PNG.advisory) : null
    check(
      await sb.from('advisories').insert({
        advisory_id: advisoryId,
        cooperative_id: ex.coopId,
        created_by: isdId,
        title: adv.title,
        description: adv.description,
        date: adv.date,
        start_time: adv.start,
        end_time: adv.end,
        photo_url: photoPath,
        created_at: at(adv.createdMs),
        archived_at: adv.archivedMs ? at(adv.archivedMs) : null,
      }),
      `create advisory ${adv.title}`
    )
    check(
      await sb.from('advisory_target').insert(adv.targets.map(([scope, value]) => ({ advisory_id: advisoryId, scope_type: scope, target_value: value }))),
      'advisory targets'
    )
    await backdate([advisoryId], adv.createdMs + 2 * M)
  }

  // ---- 6. FAQ --------------------------------------------------------------
  console.log('6/9  FAQ')
  check(
    await sb.from('faq_entries').insert(
      FAQS.map((f, i) => ({
        cooperative_id: ex.coopId,
        category: f.c,
        question: f.q,
        answer: f.a,
        keywords: f.k,
        question_tl: f.qt,
        answer_tl: f.at,
        is_active: true,
        created_at: ago((DAYS - i) * 1440),
        updated_at: ago((DAYS - i) * 1440),
      }))
    ),
    'create FAQ entries'
  )
  for (let i = 0; i < PENDING_INQUIRIES.length; i++) {
    const [question, minutesAgo] = PENDING_INQUIRIES[i]
    check(await sb.from('faq_inquiries').insert({ consumer_id: ex.consumerIds[(i * 17 + 3) % ex.consumerIds.length], question, status: 'pending', submitted_at: ago(minutesAgo) }), 'FAQ question')
  }
  for (let i = 0; i < ANSWERED_INQUIRIES.length; i++) {
    const [question, reply, minutesAgo] = ANSWERED_INQUIRIES[i]
    const inq = check(
      await sb.from('faq_inquiries').insert({ consumer_id: ex.consumerIds[(i * 23 + 9) % ex.consumerIds.length], question, status: 'pending', submitted_at: ago(minutesAgo) }).select().single(),
      'FAQ question'
    )
    check(
      await sb.from('faq_inquiries').update({ status: 'answered', supervisor_answer: reply, supervisor_id: isdId, answered_at: ago(minutesAgo - 150) }).eq('faq_inquiries_id', inq.faq_inquiries_id),
      'answer FAQ question'
    )
  }

  // ---- 7. Reports and job orders --------------------------------------------
  console.log(`7/9  Reports and job orders (${st.order.length} tickets, this is the long step)`)
  let done = 0
  for (const item of st.order) {
    if (item.type === 'ticket') await execTicket(item.t, ex)
    else await execGroup(item.g, ex)
    done += 1
    if (done % 10 === 0 || done === st.order.length) console.log(`      ${done}/${st.order.length} tickets`)
  }

  // ---- 8. Reopen requests that are still pending are already in; tidy notifications
  console.log('8/9  Notifications')
  const nonStaff = [...ex.linemanIds, ...ex.consumerIds]
  for (const part of chunks(nonStaff, 40)) {
    const r = await sb.from('notifications').update({ is_read: true }).in('user_id', part).lt('created_at', ago(1440))
    if (r.error) warnOnce(`could not mark old notifications as read: ${r.error.message}`)
  }
  for (const supId of ex.supervisorIds) {
    const all = await sb.from('notifications').update({ is_read: true }).eq('user_id', supId)
    if (all.error) warnOnce(`could not mark supervisor notifications as read: ${all.error.message}`)
    const newest = await sb.from('notifications').select('notification_id').eq('user_id', supId).order('created_at', { ascending: false }).limit(6)
    if (newest.error) {
      warnOnce(`could not read supervisor notifications: ${newest.error.message}`)
      continue
    }
    const ids = (newest.data || []).map((n) => n.notification_id)
    if (ids.length) {
      const u = await sb.from('notifications').update({ is_read: false }).in('notification_id', ids)
      if (u.error) warnOnce(`could not mark the newest notifications as unread: ${u.error.message}`)
    }
  }

  // ---- 9. Summary ------------------------------------------------------------
  console.log('9/9  Done')
  console.log('\nDONE. The CASURECO I demo cooperative is ready.\n')
  console.log(`Cooperative : ${COOP_NAME}  (Libmanan main office, ${MUNICIPALITIES.length} towns, ${AREAS.length} barangays)`)
  console.log(`Password    : ${PASSWORD}   (the same for every account below)`)
  console.log(`Owner       : owner${MARKER}        sign in at /supervisor/login (sees everything)`)
  console.log(`Dispatch    : dispatch1${MARKER}, dispatch2${MARKER}   (Dispatch only)`)
  console.log(`ISD         : isd${MARKER}   (Advisories + FAQ only)`)
  console.log(`Linemen     : lineman01${MARKER} ... lineman${pad(LINEMEN.length, 2)}${MARKER}`)
  console.log(`Consumers   : consumer001${MARKER} ... consumer${pad(CONSUMERS.length, 3)}${MARKER}`)
  console.log(`Reports     : ${st.tickets.length} over ${DAYS} days, ${st.groups.length} Master Tickets, ${ADVISORIES.length} advisories`)
  console.log(`Feedback    : ${ex.stats.ratings} ratings, ${ex.stats.confirmations} confirmations without a rating, ${ex.stats.feedbackSkipped} skipped`)
  console.log('\nThe timeline is anchored to the moment you ran this script. For screenshots on a later day, run:')
  console.log('  node scripts/seed-casureco1.mjs --refresh   (re-times linemen duty/location and the active advisory)')
  console.log('or run --cleanup and seed again right before the screenshots, so the "right now" tickets are fresh.')
}

// ---------------------------------------------------------------------------
// REFRESH: bring the time-based data back to "now"
// ---------------------------------------------------------------------------
async function refresh() {
  const found = check(await sb.from('cooperatives').select('id').like('official_email', `%${MARKER}`).limit(1), 'find demo cooperative')
  const coop = found[0]
  if (!coop) throw new Error('No CASURECO I demo cooperative found. Run the script without options first.')
  const users = check(await sb.from('users').select('id').eq('cooperative_id', coop.id).eq('user_type', 'lineman'), 'read demo linemen')
  const rows = check(await sb.from('lineman').select('profile_id, company_id_number').in('profile_id', users.map((u) => u.id)), 'read lineman rows')
  const bucket = Math.floor(NOW / (10 * M))
  for (const row of rows) {
    const idx = Number(String(row.company_id_number).split('-')[1]) - 1
    const L = LINEMEN[idx]
    if (!L) continue
    const onDuty = isOnDuty(L.schedule, NOW) || !!L.oncall
    const officeAreas = AREAS.filter((a) => a.office === L.office)
    const spot = officeAreas[(bucket + idx * 7) % officeAreas.length]
    const hub = OFFICE_HUBS[L.office]
    const res = await sb
      .from('lineman')
      .update({
        schedule: L.schedule,
        location: onDuty ? point(spot.lat, spot.lng) : point(hub[0], hub[1]),
        location_updated_at: onDuty ? ago(1 + Math.floor(rnd() * 6)) : ago(180 + Math.floor(rnd() * 400)),
        duty_override_until: L.oncall ? at(NOW + 8 * HOURMS) : null,
      })
      .eq('profile_id', row.profile_id)
    if (res.error) warn(`${L.first}: ${res.error.message}`)
  }
  const win = activeWindow()
  const adv = await sb
    .from('advisories')
    .update({ date: manilaDate(0), start_time: win.start, end_time: win.end })
    .eq('cooperative_id', coop.id)
    .like('title', `Scheduled Maintenance: ${TODAY_ADVISORY_FEEDER}%`)
  if (adv.error) warn(`advisory: ${adv.error.message}`)
  const settingsRes = await sb
    .from('cooperative_settings')
    .update({ response_time_threshold_minutes: RESPONSE_TIME_THRESHOLD_MINUTES, ...billingSettings() })
    .eq('cooperative_id', coop.id)
  if (settingsRes.error) warn(`settings: ${settingsRes.error.message}`)
  console.log('Refreshed: linemen duty status and location signals, today\'s advisory window and the billing connection are current.')
  console.log('Tickets keep the times they were seeded with. For fresh "right now" tickets, run --cleanup and seed again.')
}

// ---------------------------------------------------------------------------
// CLEANUP: remove everything this script created (and nothing else)
// ---------------------------------------------------------------------------
async function fetchAll(build) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}
async function cleanup() {
  console.log('Removing the CASURECO I demo cooperative in 5 seconds. Press Ctrl+C to cancel...')
  await sleep(5000)
  const coops = check(await sb.from('cooperatives').select('id').like('official_email', `%${MARKER}`), 'find demo cooperatives')
  const coopIds = coops.map((c) => c.id)
  const users = await fetchAll(() => sb.from('users').select('id').like('email', `%${MARKER}`).order('id', { ascending: true }))
  const userIds = users.map((u) => u.id)
  const del = async (table, column, ids, label) => {
    for (const part of chunks(ids || [], 60)) {
      check(await sb.from(table).delete().in(column, part), `delete ${label}`)
    }
  }
  // Bookkeeping rows: a failure is reported but does not stop the cleanup
  const delSoft = async (table, column, ids, label) => {
    for (const part of chunks(ids || [], 60)) {
      const res = await sb.from(table).delete().in(column, part)
      if (res.error) warn(`could not delete ${label}: ${res.error.message}`)
    }
  }
  console.log('Removing notifications...')
  await del('notifications', 'user_id', userIds, 'notifications')
  await delSoft('notifications', 'reference_id', coopIds, 'cooperative notifications')
  console.log('Removing tickets and job orders...')
  const reportIds = coopIds.length
    ? (await fetchAll(() => sb.from('reports').select('report_id').in('cooperative_id', coopIds).order('report_id', { ascending: true }))).map((r) => r.report_id)
    : []
  const masterIds = coopIds.length
    ? (await fetchAll(() => sb.from('master_tickets').select('master_id').in('cooperative_id', coopIds).order('master_id', { ascending: true }))).map((m) => m.master_id)
    : []
  let assignmentIds = []
  for (const part of chunks(reportIds, 60)) {
    assignmentIds = assignmentIds.concat(check(await sb.from('job_assignments').select('assignment_id').in('report_id', part), 'read job orders').map((a) => a.assignment_id))
  }
  for (const part of chunks(masterIds, 60)) {
    assignmentIds = assignmentIds.concat(check(await sb.from('job_assignments').select('assignment_id').in('master_id', part), 'read master job orders').map((a) => a.assignment_id))
  }
  await del('job_ratings', 'assignment_id', assignmentIds, 'ratings')
  await del('qa_reviews', 'assignment_id', assignmentIds, 'QA reviews')
  await del('job_assignment_status_logs', 'assignment_id', assignmentIds, 'status logs')
  await del('reopen_requests', 'report_id', reportIds, 'reopen requests')
  await del('job_assignments', 'assignment_id', assignmentIds, 'job orders')
  await del('reports', 'report_id', reportIds, 'reports')
  await del('master_tickets', 'master_id', masterIds, 'master tickets')
  console.log('Removing advisories, FAQ and billing links...')
  const advisoryIds = coopIds.length ? (await fetchAll(() => sb.from('advisories').select('advisory_id').in('cooperative_id', coopIds).order('advisory_id', { ascending: true }))).map((a) => a.advisory_id) : []
  await del('advisory_target', 'advisory_id', advisoryIds, 'advisory targets')
  await del('advisories', 'advisory_id', advisoryIds, 'advisories')
  await del('faq_entries', 'cooperative_id', coopIds, 'FAQ entries')
  await del('faq_inquiries', 'consumer_id', userIds, 'FAQ questions')
  await del('consumer_bill_links', 'consumer_id', userIds, 'billing links')
  await delSoft('consumer_bill_links', 'cooperative_id', coopIds, 'remaining billing links')
  console.log('Removing registration claims and push tokens...')
  // The claims point at the cooperative and at the consumer, so they must go before the accounts
  await delSoft('consumer_registration_claims', 'cooperative_id', coopIds, 'registration claims')
  await delSoft('registration_verification_limits', 'cooperative_id', coopIds, 'registration rate limits')
  await delSoft('push_tokens', 'user_id', userIds, 'push tokens')
  console.log('Removing accounts...')
  for (let i = 0; i < userIds.length; i++) {
    const res = await sb.auth.admin.deleteUser(userIds[i])
    if (res.error) {
      const fallback = await sb.from('users').delete().eq('id', userIds[i])
      if (fallback.error) warn(`could not remove ${userIds[i]}: ${fallback.error.message}`)
    }
    if ((i + 1) % 50 === 0) console.log(`      ${i + 1}/${userIds.length} accounts`)
  }
  console.log('Removing service areas and the cooperative...')
  await del('service_areas', 'cooperative_id', coopIds, 'service areas')
  await del('cooperative_status_logs', 'cooperative_id', coopIds, 'status history')
  await del('cooperative_settings', 'cooperative_id', coopIds, 'settings')
  // The audit trigger writes a row for each change above, so clear it last, right before the cooperative
  await delSoft('audit_logs', 'cooperative_id', coopIds, 'audit log rows')
  await del('cooperatives', 'id', coopIds, 'cooperatives')
  for (const bucket of ['report-photos', 'assignment-proofs', 'advisory-photos']) {
    for (const id of coopIds) {
      for (let guard = 0; guard < 50; guard++) {
        const { data } = await sb.storage.from(bucket).list(id, { limit: 1000 })
        if (!data || data.length === 0) break
        await sb.storage.from(bucket).remove(data.map((f) => `${id}/${f.name}`))
        if (data.length < 1000) break
      }
    }
  }
  console.log('\nDONE. All CASURECO I demo data has been removed. Banahaw and any other data were not touched.')
}

// ---------------------------------------------------------------------------
async function main() {
  if (DRY_RUN) {
    summarize(planAll())
    return
  }
  console.log(`\nProject: ${new URL(SUPABASE_URL).host}`)
  if (MODE === 'cleanup') return cleanup()
  if (MODE === 'refresh') return refresh()
  return seed()
}
main().catch((e) => {
  console.error('\nERROR: ' + e.message)
  console.error('If this stopped part-way, run  node scripts/seed-casureco1.mjs --cleanup  and try again.')
  process.exit(1)
})
