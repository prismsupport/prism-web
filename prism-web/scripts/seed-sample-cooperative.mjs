// scripts/seed-sample-cooperative.mjs

//

// Creates a FICTIONAL sample cooperative ("Banahaw Electric Cooperative") with data on

// every screen, for screenshots. Nothing here touches real cooperatives.

//

//   node scripts/seed-sample-cooperative.mjs             create the sample data

//   node scripts/seed-sample-cooperative.mjs --refresh   refresh live status before screenshots

//   node scripts/seed-sample-cooperative.mjs --cleanup   remove everything this script created

//   (add --no-photos to skip the placeholder photos)

//

// Everything it creates uses an email ending in @sample-coop.test, which is how

// --cleanup finds it. Needs Node 18 or newer.

 

import fs from 'node:fs'

import path from 'node:path'

import zlib from 'node:zlib'

import { randomUUID } from 'node:crypto'

import { createClient } from '@supabase/supabase-js'

 

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

 

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {

  console.error(

    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +

      'Run this from the project folder that contains .env.local.'

  )

  process.exit(1)

}

 

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {

  auth: { autoRefreshToken: false, persistSession: false },

})

 

const args = process.argv.slice(2)

const MODE = args.includes('--cleanup') ? 'cleanup' : args.includes('--refresh') ? 'refresh' : 'seed'

const NO_PHOTOS = args.includes('--no-photos')

 

const MARKER = '@sample-coop.test'

const PASSWORD = 'Sample#2026'

const COOP_NAME = 'Banahaw Electric Cooperative'

const NOW = Date.now()

const MIN = 60000

const DAY = 1440 // minutes in a day

 

// ---------------------------------------------------------------------------

// Small helpers

// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const pad = (n, w = 2) => String(n).padStart(w, '0')

const ago = (min) => new Date(NOW - min * MIN).toISOString()

const at = (ms) => new Date(ms).toISOString()

const point = (lat, lng) => `SRID=4326;POINT(${lng} ${lat})`

const warn = (msg) => console.warn(`  (warning) ${msg}`)

 

function check(res, label) {

  if (res.error) throw new Error(`${label}: ${res.error.message}`)

  return res.data

}

 

// A seeded random number generator, so every run creates the same story

let seedState = 20261020

function rnd() {

  seedState = (seedState * 1664525 + 1013904223) % 4294967296

  return seedState / 4294967296

}

const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

const between = (a, b) => a + rnd() * (b - a)

 

// Philippine time helpers

const manilaNow = new Date(NOW + 8 * 3600 * 1000)

const manilaMinutes = manilaNow.getUTCHours() * 60 + manilaNow.getUTCMinutes()

const hhmm = (offsetMin) => {

  const t = (((manilaMinutes + offsetMin) % 1440) + 1440) % 1440

  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`

}

const manilaDate = (dayOffset = 0) =>

  new Date(NOW + 8 * 3600 * 1000 + dayOffset * 86400 * 1000).toISOString().slice(0, 10)

 

function shiftName(start) {

  const h = Number(start.slice(0, 2))

  if (h >= 5 && h < 12) return 'Morning Duty'

  if (h >= 12 && h < 18) return 'Afternoon Duty'

  if (h >= 18 && h < 22) return 'Evening Duty'

  return 'Night Duty'

}

function relativeShift(startOffset, endOffset) {

  const start = hhmm(startOffset)

  const end = hhmm(endOffset)

  return [{ name: shiftName(start), start, end, days: [0, 1, 2, 3, 4, 5, 6] }]

}

function activeWindow() {

  let start = Math.max(0, manilaMinutes - 60)

  let end = Math.min(1439, manilaMinutes + 180)

  if (start >= end) {

    start = 0

    end = 1439

  }

  const f = (t) => `${pad(Math.floor(t / 60))}:${pad(t % 60)}`

  return { start: f(start), end: f(end) }

}

 

// ---------------------------------------------------------------------------

// Fictional data

// ---------------------------------------------------------------------------

const AREA_OFFICES = ['San Vicente Area Office', 'Santa Lucia Area Office', 'Villa Aurora Area Office']

const HOTLINES = {

  'San Vicente Area Office': '(049) 555-0101',

  'Santa Lucia Area Office': '0917 555 0102',

  'Villa Aurora Area Office': '(049) 555-0103 / 0918 555 0104',

}

 

// office: index into AREA_OFFICES

const AREAS = [

  { sub: 'Banahaw 20 MVA Substation', feeder: 'Feeder 1', barangay: 'Poblacion', municipality: 'San Vicente', office: 0, lat: 14.075, lng: 121.32 },

  { sub: 'Banahaw 20 MVA Substation', feeder: 'Feeder 1', barangay: 'San Roque', municipality: 'San Vicente', office: 0, lat: 14.079, lng: 121.326 },

  { sub: 'Banahaw 20 MVA Substation', feeder: 'Feeder 2', barangay: 'Maligaya', municipality: 'San Vicente', office: 0, lat: 14.069, lng: 121.312 },

  { sub: 'Banahaw 20 MVA Substation', feeder: 'Feeder 2', barangay: 'Bagong Silang', municipality: 'San Vicente', office: 0, lat: 14.064, lng: 121.33 },

  { sub: 'Banahaw 20 MVA Substation', feeder: 'Feeder 2', barangay: 'Santa Cruz', municipality: 'San Vicente', office: 0, lat: 14.071, lng: 121.337 },

  { sub: 'Santa Lucia 10 MVA Substation', feeder: 'Feeder 3', barangay: 'Poblacion', municipality: 'Santa Lucia', office: 1, lat: 14.09, lng: 121.35 },

  { sub: 'Santa Lucia 10 MVA Substation', feeder: 'Feeder 3', barangay: 'Sto. Niño', municipality: 'Santa Lucia', office: 1, lat: 14.095, lng: 121.356 },

  { sub: 'Santa Lucia 10 MVA Substation', feeder: 'Feeder 3', barangay: 'Mabini', municipality: 'Santa Lucia', office: 1, lat: 14.086, lng: 121.36 },

  { sub: 'Villa Aurora 10 MVA Substation', feeder: 'Feeder 4', barangay: 'Poblacion', municipality: 'Villa Aurora', office: 2, lat: 14.05, lng: 121.3 },

  { sub: 'Villa Aurora 10 MVA Substation', feeder: 'Feeder 4', barangay: 'Rizal', municipality: 'Villa Aurora', office: 2, lat: 14.046, lng: 121.306 },

  { sub: 'Villa Aurora 10 MVA Substation', feeder: 'Feeder 4', barangay: 'Del Pilar', municipality: 'Villa Aurora', office: 2, lat: 14.042, lng: 121.296 },

  { sub: 'Villa Aurora 10 MVA Substation', feeder: 'Feeder 4', barangay: 'Burgos', municipality: 'Villa Aurora', office: 2, lat: 14.056, lng: 121.292 },

]

 

// schedule: 'on' = on shift right now, 'off' = scheduled but not now, 'none' = no schedule, 'fixed' = fixed weekly shifts

const LINEMEN = [

  { first: 'Rico', last: 'Dela Peña', office: 0, schedule: 'on', online: true, base: [14.076, 121.321] },

  { first: 'Joel', last: 'Mercado', office: 0, schedule: 'on', online: true, base: [14.07, 121.315] },

  { first: 'Ben', last: 'Navarro', office: 1, schedule: 'on', online: false, base: [14.091, 121.351] },

  { first: 'Mario', last: 'Santos', office: 1, schedule: 'off', online: true, base: [14.088, 121.358] },

  { first: 'Allan', last: 'Ocampo', office: 2, schedule: 'none', online: true, base: [14.051, 121.301] },

  { first: 'Dennis', last: 'Villar', office: 2, schedule: 'fixed', online: true, oncall: true, base: [14.047, 121.304] },

]

function scheduleFor(kind) {

  if (kind === 'on') return relativeShift(-180, 300)

  if (kind === 'off') return relativeShift(180, 660)

  if (kind === 'fixed') {

    return [

      { name: 'Night Duty', start: '22:00', end: '06:00', days: [1, 2] },

      { name: 'Morning Duty', start: '07:30', end: '16:00', days: [0, 5, 6] },

    ]

  }

  return []

}

 

const FIRST = ['Maria', 'Jose', 'Ana', 'Juan', 'Rosa', 'Pedro', 'Luz', 'Ramon', 'Carmen', 'Eduardo', 'Teresa', 'Antonio', 'Elena', 'Miguel', 'Corazon', 'Roberto', 'Lourdes', 'Fernando', 'Gloria', 'Ricardo', 'Josefina', 'Manuel', 'Imelda', 'Gregorio']

const LAST = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Ramos', 'Aquino', 'Castillo', 'Villanueva', 'Domingo', 'Salazar', 'Pascual', 'Soriano', 'Valdez', 'Dizon', 'Padilla', 'Estrada', 'Lim', 'Tan', 'Hernandez']

 

const DETAILS = [

  'Walang kuryente sa buong kalye namin simula pa kaninang hapon.',

  'Power outage in our area since 6 PM. Our neighbors are also affected.',

  'May narinig kaming malakas na pagsabog sa poste, tapos nawalan ng kuryente.',

  'Sparks were seen on the transformer near our house before the lights went out.',

  'Mahina ang boltahe at pumipitik ang ilaw buong gabi.',

  'A fallen tree branch is touching the power lines beside the road.',

  'There is a loose service wire hanging from the pole in front of our house.',

  'No electricity since the storm last night. The whole purok has no power.',

]

const LANDMARKS = ['Beside the barangay hall', 'Near the public market', 'In front of the elementary school', 'Across the parish church', 'Near the basketball court', 'Beside the water refilling station', 'Near the covered court', 'In front of the sari-sari store']

const NOTES = [

  'Replaced the blown fuse cutout and re-energized the line.',

  'Reconnected the loose service drop at the pole and tested the voltage at the meter.',

  'Trimmed the branches touching the line and restored power.',

  'Replaced the damaged lightning arrester on the transformer.',

  'Tightened the loose jumper connection at the transformer tap.',

]

 

const FAQS = [

  { c: 'outages', q: 'What should I do when there is a power outage in my area?', a: 'First check if your neighbors also have no power. If they do, report it in the PRISM app with your location and a photo. A crew will be dispatched as soon as possible.', k: 'walang kuryente, no power, blackout, brownout', qt: 'Ano ang gagawin kapag nawalan ng kuryente sa amin?', at: 'Tingnan muna kung wala ring kuryente ang mga kapitbahay. Kung gayon, i-report ito sa PRISM app kasama ang lokasyon at larawan.' },

  { c: 'outages', q: 'How long does it take to restore power?', a: 'It depends on the cause and the number of affected households. Most reported outages are assigned to a crew within 30 minutes.', k: 'restoration, how long, gaano katagal', qt: 'Gaano katagal bago maibalik ang kuryente?', at: 'Depende ito sa sanhi at sa dami ng apektadong tahanan. Karamihan ng report ay naaasign sa crew sa loob ng 30 minuto.' },

  { c: 'outages', q: 'Where can I see scheduled power interruptions?', a: 'Open the Advisories section of the app. It lists upcoming interruptions for your barangay, municipality or feeder.', k: 'advisory, schedule, maintenance, brownout schedule', qt: null, at: null },

  { c: 'billing', q: 'How do I link my billing account?', a: 'Go to Billing in the app, enter your account number and the account name exactly as it appears on your bill, then wait for your cooperative to approve the request.', k: 'link account, account number, bill', qt: 'Paano ko ili-link ang aking billing account?', at: 'Pumunta sa Billing, ilagay ang account number at pangalan ayon sa bill, at hintayin ang approval ng kooperatiba.' },

  { c: 'billing', q: 'Why is my bill higher this month?', a: 'Your bill depends on your kilowatt-hour consumption and the current generation charge. Compare your meter readings with last month, and contact your area office if you still have concerns.', k: 'mataas na bill, high bill, consumption', qt: null, at: null },

  { c: 'billing', q: 'Where can I pay my electric bill?', a: 'You can pay at any area office, accredited payment centers and partner banks. Please bring your bill or your account number.', k: 'pay bill, payment, bayad', qt: 'Saan ako puwedeng magbayad ng kuryente?', at: 'Puwede kayong magbayad sa area office, payment centers at partner banks. Dalhin lamang ang bill o account number.' },

  { c: 'technical', q: 'Why are my lights flickering?', a: 'Flickering can be caused by a loose connection, a failing transformer, or heavy load on your line. If it happens repeatedly, please file a report so a crew can inspect it.', k: 'flickering, pumipitik, dim lights', qt: null, at: null },

  { c: 'technical', q: 'What causes low voltage?', a: 'Common causes are overloaded lines, long distance from the transformer, or loose connections. Report it so the area office can measure the voltage at your meter.', k: 'low voltage, mahina ang kuryente', qt: 'Ano ang sanhi ng mahinang boltahe?', at: 'Maaaring sanhi ang sobrang karga ng linya, layo sa transformer o maluwag na koneksyon. I-report upang masukat ng area office.' },

  { c: 'technical', q: 'Is it safe to go near a fallen power line?', a: 'No. Stay at least 10 meters away, keep others away, and report it immediately. Never touch a fallen line or anything it touches.', k: 'fallen line, safety, nahulog na kable', qt: null, at: null },

  { c: 'technical', q: 'How do I request a meter inspection?', a: 'Visit your area office or send a question through the FAQ section of the app. A technician will schedule an inspection.', k: 'meter, inspection, metro', qt: null, at: null },

]

 

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

function chunk(type, data) {

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

    chunk('IHDR', ihdr),

    chunk('IDAT', zlib.deflateSync(raw)),

    chunk('IEND', Buffer.alloc(0)),

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

// SEED

// ---------------------------------------------------------------------------

async function seed() {

  console.log('Creating the sample cooperative in 5 seconds. Press Ctrl+C to cancel...')

  await sleep(5000)

 

  const leftoverCoops = check(

    await sb.from('cooperatives').select('id').like('official_email', `%${MARKER}`),

    'look for existing sample data'

  )

  const leftoverUsers = check(

    await sb.from('users').select('id').like('email', `%${MARKER}`),

    'look for existing sample users'

  )

  if (leftoverCoops.length > 0 || leftoverUsers.length > 0) {

    console.error('Sample data already exists. Run with --cleanup first, then try again.')

    process.exit(1)

  }

 

  // ---- 1. Cooperatives --------------------------------------------------

  console.log('1/12  Cooperatives')

  const coop = check(

    await sb

      .from('cooperatives')

      .insert({

        cooperative_name: COOP_NAME,

        office_address: '12 Rizal Street, Poblacion',

        municipality: 'San Vicente',

        province: 'Sample Province',

        contact_number: '(049) 555-0100',

        official_email: `info${MARKER}`,

        created_at: ago(29 * DAY),

      })

      .select()

      .single(),

    'create cooperative'

  )

  const coopId = coop.id

  check(await sb.from('cooperatives').update({ status: 'Active' }).eq('id', coopId), 'activate cooperative')

  check(

    await sb.from('cooperative_status_logs').insert([

      { cooperative_id: coopId, previous_status: null, new_status: 'Pending Approval', changed_at: ago(29 * DAY) },

      { cooperative_id: coopId, previous_status: 'Pending Approval', new_status: 'Active', changed_at: ago(28 * DAY) },

    ]),

    'status history'

  )

 

  // Two more, for the Superadmin screens: one waiting for approval, one rejected

  const pendingCoop = check(

    await sb

      .from('cooperatives')

      .insert({

        cooperative_name: 'Mabuhay Rural Electric Cooperative',

        office_address: '5 Mabini Avenue, Poblacion',

        municipality: 'Mabuhay',

        province: 'Sample Province',

        contact_number: '(049) 555-0200',

        official_email: `mabuhay${MARKER}`,

        created_at: ago(2 * DAY),

      })

      .select()

      .single(),

    'create pending cooperative'

  )

  check(

    await sb.from('cooperative_status_logs').insert({ cooperative_id: pendingCoop.id, previous_status: null, new_status: 'Pending Approval', changed_at: ago(2 * DAY) }),

    'pending history'

  )

 

  const rejectedCoop = check(

    await sb

      .from('cooperatives')

      .insert({

        cooperative_name: 'Sampaguita Electric Cooperative',

        office_address: '8 Bonifacio Street, Poblacion',

        municipality: 'Sampaguita',

        province: 'Sample Province',

        contact_number: '(049) 555-0300',

        official_email: `sampaguita${MARKER}`,

        created_at: ago(9 * DAY),

      })

      .select()

      .single(),

    'create rejected cooperative'

  )

  check(

    await sb

      .from('cooperatives')

      .update({ status: 'Rejected', rejection_reason: 'The registration documents were incomplete. Please attach your business permit and resubmit.' })

      .eq('id', rejectedCoop.id),

    'reject cooperative'

  )

  check(

    await sb.from('cooperative_status_logs').insert([

      { cooperative_id: rejectedCoop.id, previous_status: null, new_status: 'Pending Approval', changed_at: ago(9 * DAY) },

      { cooperative_id: rejectedCoop.id, previous_status: 'Pending Approval', new_status: 'Rejected', changed_at: ago(8 * DAY) },

    ]),

    'rejected history'

  )

 

  // ---- 2. Settings ------------------------------------------------------

  console.log('2/12  Settings, area offices and hotlines')

  check(

    await sb

      .from('cooperative_settings')

      .upsert(

        {

          cooperative_id: coopId,

          area_offices: AREA_OFFICES,

          area_office_hotlines: HOTLINES,

          response_time_threshold_minutes: 180,

        },

        { onConflict: 'cooperative_id' }

      ),

    'save settings'

  )

 

  // ---- 3. Service areas -------------------------------------------------

  console.log('3/12  Service areas')

  check(

    await sb.from('service_areas').insert(

      AREAS.map((a) => ({

        cooperative_id: coopId,

        substation: a.sub,

        feeder: a.feeder,

        barangay: a.barangay,

        municipality: a.municipality,

        province: 'Sample Province',

        area_office: AREA_OFFICES[a.office],

      }))

    ),

    'create service areas'

  )

 

  // ---- 4. People --------------------------------------------------------

  console.log('4/12  Accounts (supervisors, linemen, consumers)')

  let phoneCounter = 0

    async function createUser({ email, first, last, type }) {

    const res = await sb.auth.admin.createUser({

    email,

    password: PASSWORD,

    email_confirm: true,

    user_metadata: {

        cooperative_id: coopId,

        first_name: first,

        last_name: last,

        user_type: type,

        phone_number: `0999${pad(phoneCounter + 1, 7)}`,

    },

    })

 

    if (res.error) {

    console.error('Auth error details:', {

        name: res.error.name,

        message: res.error.message,

        status: res.error.status,

        code: res.error.code,

        details: res.error,

    })

 

    throw new Error(`create login ${email}: ${res.error.message}`)

    }

        const user = check(res, `create login ${email}`).user

        phoneCounter += 1

        check(

        await sb.from('users').upsert({

            id: user.id,

            cooperative_id: coopId,

            first_name: first,

            last_name: last,

            phone_number: `0999${pad(phoneCounter, 7)}`,

            email,

            user_type: type,

            is_active: true,

        }, { onConflict: 'id' }),

        `create profile ${email}`

        )

        return user.id

    }

 

  const ownerId = await createUser({ email: `owner${MARKER}`, first: 'Marissa', last: 'Villanueva', type: 'supervisor' })

  check(await sb.from('supervisor').insert({ profile_id: ownerId, is_owner: true, feature_access: [] }), 'owner role')

  const subId = await createUser({ email: `dispatch${MARKER}`, first: 'Paolo', last: 'Hernandez', type: 'supervisor' })

  check(await sb.from('supervisor').insert({ profile_id: subId, is_owner: false, feature_access: ['dispatch'] }), 'sub-supervisor role')

 

  const linemen = []

  for (let i = 0; i < LINEMEN.length; i++) {

    const L = LINEMEN[i]

    const id = await createUser({ email: `lineman${i + 1}${MARKER}`, first: L.first, last: L.last, type: 'lineman' })

    check(

      await sb.from('lineman').insert({

        profile_id: id,

        assigned_area_office: AREA_OFFICES[L.office],

        company_id_number: `BEC-${pad(i + 1, 4)}`,

        location: point(L.base[0], L.base[1]),

        location_updated_at: L.online ? ago(2) : ago(180),

        schedule: scheduleFor(L.schedule),

        duty_override_until: L.oncall ? at(NOW + 8 * 60 * MIN) : null,

      }),

      `lineman role ${L.first}`

    )

    linemen.push({ id, office: L.office, first: L.first, last: L.last })

  }

 

  const consumers = []

  const consumersByArea = AREAS.map(() => [])

  for (let i = 0; i < 24; i++) {

    const areaIdx = Math.floor(i / 2)

    const area = AREAS[areaIdx]

    const first = FIRST[i]

    const last = LAST[i]

    const id = await createUser({

    email: `consumer${pad(i + 1, 2)}${MARKER}`,

    first,

    last,

    type: 'consumer',

    })

 

    const zone = `Zone ${1 + (i % 5)}`

 

    check(

    await sb.from('consumer').update({

        zone,

        barangay: area.barangay,

        municipality: area.municipality,

        feeder: area.feeder,

    }).eq('profile_id', id),

    `update consumer role ${first} ${last}`

    )

    const consumer = { id, first, last, areaIdx, zone, account: `01-${1000 + i * 7}-${100 + i}` }

    consumers.push(consumer)

    consumersByArea[areaIdx].push(consumer)

    if ((i + 1) % 8 === 0) console.log(`      ${i + 1}/24 consumers`)

  }

 

  const linemanForArea = (areaIdx, n = 0) => {

    const pool = linemen.filter((l) => l.office === AREAS[areaIdx].office)

    return pool[n % pool.length]

  }

 

  // ---- Job order helpers ---------------------------------------------------

  function stepsTo(final, assignedMs, repairMin) {

    const plan = [

      ['on_the_way', assignedMs + between(3, 8) * MIN],

      ['arrived_at_site', assignedMs + between(15, 25) * MIN],

      ['in_progress', assignedMs + between(26, 30) * MIN],

      ['fixed', assignedMs + (repairMin - 2) * MIN],

      ['resolved', assignedMs + repairMin * MIN],

    ]

    const idx = plan.findIndex(([s]) => s === final)

    return plan.slice(0, idx + 1).map(([status, atMs]) => ({ status, atMs }))

  }

 

  async function runJob({ reportId = null, masterId = null, lineman, assignedAgo, final, repairMin = 90, reopen = null, photo = false, note = null }) {

    const assignmentId = randomUUID()

    const assignedMs = NOW - assignedAgo * MIN

    const reachesFixed = final === 'fixed' || final === 'resolved'

    const proofPath = reachesFixed && photo ? await uploadPhoto('assignment-proofs', `${coopId}/${assignmentId}.png`, PNG.proof) : null

 

    const steps = stepsTo(final, assignedMs, repairMin).map((s) => {

      if (s.status === 'fixed') {

        return { ...s, patch: { photo_url: proofPath, repair_note: note || pick(NOTES) } }

      }

      if (s.status === 'resolved') {

        return {

          ...s,

          patch: { completed_at: at(s.atMs) },

          // The web approves in QA first, then marks the job resolved

          before: async (id) => {

            check(

              await sb.from('qa_reviews').insert({ assignment_id: id, reviewer_id: ownerId, reviewer_type: 'supervisor', decision: 'approved' }),

              'QA approval'

            )

          },

        }

      }

      return s

    })

 

    check(

      await sb.from('job_assignments').insert({

        assignment_id: assignmentId,

        report_id: reportId,

        master_id: masterId,

        lineman_id: lineman.id,

        status: 'assigned',

        assigned_at: at(assignedMs),

        ...(reopen ? { reopen_reason: reopen.reason, reopen_source: reopen.source, reopened_by: ownerId } : {}),

      }),

      'create job order'

    )

 

    for (const step of steps) {

      if (step.before) await step.before(assignmentId)

      check(

        await sb.from('job_assignments').update({ status: step.status, ...(step.patch || {}) }).eq('assignment_id', assignmentId),

        `job order -> ${step.status}`

      )

    }

 

    // Give each status-log row the time it should have had

    if (steps.length > 0) {

      const logs = check(

        await sb.from('job_assignment_status_logs').select('id').eq('assignment_id', assignmentId).order('changed_at', { ascending: true }),

        'read status log'

      )

      for (let i = 0; i < logs.length && i < steps.length; i++) {

        check(await sb.from('job_assignment_status_logs').update({ changed_at: at(steps[i].atMs) }).eq('id', logs[i].id), 'time the status log')

      }

    }

    return { assignmentId, completedMs: assignedMs + repairMin * MIN }

  }

 

  async function confirmAndRate(assignmentId, consumer, lineman, completedMs, rating, comment) {

    try {

      const confirmMs = Math.min(completedMs + between(2, 14) * 60 * MIN, NOW - 30 * MIN)

      check(

        await sb.from('qa_reviews').insert({ assignment_id: assignmentId, reviewer_id: consumer.id, reviewer_type: 'consumer', decision: 'approved', reviewed_at: at(confirmMs) }),

        'consumer confirmation'

      )

      check(

        await sb.from('job_ratings').insert({ assignment_id: assignmentId, consumer_id: consumer.id, lineman_id: lineman.id, rating, comment: comment || null, created_at: at(Math.min(confirmMs + 20 * MIN, NOW - 10 * MIN)) }),

        'rating'

      )

    } catch (e) {

      warn(`rating skipped: ${e.message}`)

    }

  }

 

  // ---- 5. Reports and job orders -----------------------------------------

  console.log('5/12  Reports and job orders (this is the long step)')

  const year = new Date(NOW).getUTCFullYear()

  const SPECS = [

    { key: 'R1', kind: 'resolved', area: 0, c: 0, minutesAgo: 27 * DAY, priority: 'medium', assignedAgo: 27 * DAY - 12, repairMin: 95, rating: 5, comment: 'Mabilis ang response ng crew. Salamat po!' },

    { key: 'R2', kind: 'resolved', area: 5, c: 1, minutesAgo: 24 * DAY, priority: 'high', assignedAgo: 24 * DAY - 9, repairMin: 140, rating: 4, comment: 'Okay naman, medyo natagalan lang.' },

    { key: 'R3', kind: 'resolved', area: 8, c: 0, minutesAgo: 21 * DAY, priority: 'low', assignedAgo: 21 * DAY - 30, repairMin: 65, rating: null },

    { key: 'R4', kind: 'resolved', area: 2, c: 1, minutesAgo: 17 * DAY, priority: 'critical', assignedAgo: 17 * DAY - 6, repairMin: 180, rating: 5, comment: 'Very professional crew. They fixed the transformer quickly.' },

    { key: 'R5', kind: 'resolved', area: 6, c: 0, minutesAgo: 14 * DAY, priority: 'medium', assignedAgo: 14 * DAY - 22, repairMin: 110, rating: 3, comment: 'Nawalan ulit ng ilang minuto matapos ayusin.' },

    { key: 'R6', kind: 'resolved', area: 9, c: 1, minutesAgo: 11 * DAY, priority: 'high', assignedAgo: 11 * DAY - 14, repairMin: 75, rating: 5 },

    { key: 'R7', kind: 'resolved', area: 1, c: 0, minutesAgo: 8 * DAY, priority: 'medium', assignedAgo: 8 * DAY - 35, repairMin: 55, rating: null },

    { key: 'R8', kind: 'resolved', area: 11, c: 1, minutesAgo: 5 * DAY, priority: 'low', assignedAgo: 5 * DAY - 18, repairMin: 120, rating: 4, comment: 'Thank you for the quick repair.' },

    { key: 'R9', kind: 'resolved', area: 3, c: 0, minutesAgo: 3 * DAY, priority: 'high', assignedAgo: 3 * DAY - 8, repairMin: 90, rating: 5, comment: 'Maraming salamat po sa mabilis na pag-aayos.' },

    { key: 'R10', kind: 'resolved', area: 4, c: 1, minutesAgo: 29 * 60, priority: 'medium', assignedAgo: 29 * 60 - 10, repairMin: 80, rating: null, reopenRequest: true },

    { key: 'SR', kind: 'sup_reopen', area: 8, c: 0, minutesAgo: 6 * DAY, priority: 'high', assignedAgo: 6 * DAY - 15, repairMin: 100, reopenAgo: 300, fixedAgo2: 60 },

    { key: 'QA1', kind: 'qa_waiting', area: 10, c: 0, minutesAgo: 180, priority: 'critical', assignedAgo: 165, fixedAgo: 40, photo: true },

    { key: 'QAR', kind: 'qa_rejected', area: 2, c: 0, minutesAgo: 600, priority: 'high', assignedAgo1: 585, fixedAgo1: 380, rejectAgo: 340, assignedAgo2: 330 },

    { key: 'IP1', kind: 'in_progress', area: 1, c: 1, minutesAgo: 150, priority: 'high', assignedAgo: 135, photo: true },

    { key: 'IP2', kind: 'in_progress', area: 6, c: 1, minutesAgo: 110, priority: 'medium', assignedAgo: 95 },

    { key: 'IP3', kind: 'in_progress', area: 9, c: 0, minutesAgo: 95, priority: 'critical', assignedAgo: 80 },

    { key: 'D1', kind: 'dispatched', area: 3, c: 1, minutesAgo: 50, priority: 'medium', assignedAgo: 35, state: 'assigned' },

    { key: 'D2', kind: 'dispatched', area: 11, c: 0, minutesAgo: 70, priority: 'low', assignedAgo: 40, state: 'on_the_way' },

    { key: 'X1', kind: 'declined', area: 4, c: 0, minutesAgo: 2 * DAY, declineReason: 'Based on our check, the outage is limited to your household. Please check your main breaker and call the area office if it still has no power.' },

    { key: 'X2', kind: 'declined', area: 7, c: 1, minutesAgo: 6 * 60, declineReason: 'This outage was already reported by your neighbors and is being handled under an existing ticket.' },

    { key: 'P1', kind: 'pending', area: 5, c: 0, minutesAgo: 240, priority: 'medium', details: 'No power in several homes near the area office; this is the single seeded report intended to exceed the response-time threshold.' },

    { key: 'P2', kind: 'pending', area: 10, c: 1, minutesAgo: 75 },

    { key: 'C1', kind: 'pending', area: 0, c: 0, minutesAgo: 17, homes: true, jitter: 0.0008 },

    { key: 'C2', kind: 'pending', area: 0, c: 1, minutesAgo: 14, homes: true, jitter: 0.0008 },

    { key: 'C3', kind: 'pending', area: 0, c: 0, minutesAgo: 12, jitter: 0.0008 },

    { key: 'PM', kind: 'pending', area: 1, c: 0, minutesAgo: 6, homes: true, jitter: 0.0006 },

    // Duplicate-suggestion cluster: ten reports within roughly 25 metres in Poblacion.

    ...Array.from({ length: 10 }, (_, i) => ({

      key: `DUP${String(i + 1).padStart(2, '0')}`,

      kind: 'pending', area: 0, c: i % 2,

      minutesAgo: 2 + i * 2, priority: i < 3 ? 'high' : 'medium',

      homes: true, jitter: 0.00012,

      details: [

        'No electricity along our street near the barangay hall. Several neighboring houses are affected.',

        'Walang kuryente sa Poblacion since a loud pop was heard near the distribution line.',

        'Our whole row of houses lost power at almost the same time. Nearby households are also affected.',

        'Power went out suddenly near the public market; several homes on this block have no electricity.',

        'Several houses on our block are without power. We can hear a transformer humming unusually loudly.',

      ][i % 5],

    })),

    // Two alternate-feeder reports placed immediately beside the main Poblacion cluster

    // (roughly within 50–100 m). Only FAR1 has outage wording similar to the cluster;

    // FAR2 describes voltage fluctuation, so it should not look like another duplicate.

    { key: 'FAR1', kind: 'pending', area: 2, c: 0, minutesAgo: 31, priority: 'medium', homes: true, jitter: 0.00008, centerLat: 14.07535, centerLng: 121.32035, details: 'Several homes just across the feeder boundary near Poblacion lost power around the same time as nearby streets.' },

    { key: 'FAR2', kind: 'pending', area: 2, c: 1, minutesAgo: 24, priority: 'high', homes: true, jitter: 0.00008, centerLat: 14.07555, centerLng: 121.3205, details: 'Lights are flickering and voltage is low on the neighboring feeder near Poblacion; power has not fully gone out in every house.' },

 

    // Consumer walkthrough: Maria Santos (consumer01) has in-progress, resolved-unrated,

    // and resolved-rated outage reports.

    { key: 'CONSIP', kind: 'in_progress', area: 0, c: 0, minutesAgo: 88, priority: 'high', assignedAgo: 73, forceLineman: true, details: 'The service line is sparking intermittently near our meter and the lights keep flickering.' },

    { key: 'CONSNORATE', kind: 'resolved', area: 0, c: 0, minutesAgo: 4 * DAY, priority: 'medium', assignedAgo: 4 * DAY - 10, repairMin: 85, rating: null, details: 'Power was restored after a loose service connection was tightened; awaiting consumer feedback.' },

    { key: 'CONSRATED', kind: 'resolved', area: 0, c: 0, minutesAgo: 2 * DAY, priority: 'high', assignedAgo: 2 * DAY - 12, repairMin: 70, rating: 5, comment: 'The crew arrived quickly, explained the fault, and restored power safely.' },

 

    // Lineman walkthrough: Ben Navarro (lineman3) has a reopened/dispatched job, a fixed job,

    // and three resolved jobs with consumer ratings in his history.

    { key: 'LINEREOPEN', kind: 'lineman_reopened', area: 5, c: 0, minutesAgo: 65, priority: 'high', forceLineman: true, details: 'Power dropped again after an earlier repair; please recheck the service drop and transformer connection.' },

    { key: 'LINEFIXED', kind: 'lineman_fixed', area: 5, c: 1, minutesAgo: 2 * DAY, priority: 'medium', forceLineman: true, details: 'A loose jumper connection caused low voltage at several homes near the barangay hall.' },

    { key: 'LINEHIST1', kind: 'resolved', area: 5, c: 0, minutesAgo: 9 * DAY, priority: 'high', assignedAgo: 9 * DAY - 12, repairMin: 80, rating: 5, comment: 'Mabilis dumating ang crew at maayos ang trabaho. Salamat po!', forceLineman: true },

    { key: 'LINEHIST2', kind: 'resolved', area: 5, c: 1, minutesAgo: 6 * DAY, priority: 'medium', assignedAgo: 6 * DAY - 18, repairMin: 105, rating: 4, comment: 'Maayos ang pagkukumpuni, pero medyo matagal bago dumating.', forceLineman: true },

    { key: 'LINEHIST3', kind: 'resolved', area: 5, c: 0, minutesAgo: 3 * DAY, priority: 'high', assignedAgo: 3 * DAY - 9, repairMin: 70, rating: 5, comment: 'Power was restored quickly and the lineman explained what happened.', forceLineman: true },

 

    // The master ticket must contain exactly eight individual reports.

    ...Array.from({ length: 8 }, (_, i) => ({

      key: `M${i + 1}`, kind: 'master_member', area: 5, c: i % 2,

      minutesAgo: 130 - i * 4, homes: true, jitter: 0.0008,

      priority: i < 3 ? 'high' : 'medium',

      details: [

        'Several houses near the Santa Lucia barangay hall lost power at the same time.',

        'Power is out on our street; nearby households on the same feeder are affected.',

        'Nawalan ng kuryente ang ilang bahay matapos kumislap ang linya malapit sa poste.',

        'Our neighbors and our household have no electricity since the same interruption.',

      ][i % 4],

    })),

  ]

 

  // Fail early if a future edit accidentally removes a required demo scenario.

  const duplicateClusterCount = SPECS.filter((spec) => spec.key.startsWith('DUP')).length

  const masterMemberCount = SPECS.filter((spec) => spec.kind === 'master_member').length

  const nearbyFeederCount = SPECS.filter((spec) => spec.key === 'FAR1' || spec.key === 'FAR2').length

  if (duplicateClusterCount < 10) throw new Error(`Duplicate-suggestion cluster needs at least 10 reports; found ${duplicateClusterCount}.`)

  if (masterMemberCount !== 8) throw new Error(`Master ticket must contain exactly 8 reports; found ${masterMemberCount}.`)

  if (nearbyFeederCount !== 2) throw new Error(`Expected exactly 2 nearby alternate-feeder reports; found ${nearbyFeederCount}.`)

 

  // Oldest first, so ticket numbers run in time order

  const ordered = [...SPECS].sort((a, b) => b.minutesAgo - a.minutesAgo)

  ordered.forEach((s, i) => {

    s.ticket = `BEC-${year}-${pad(i + 1, 4)}`

  })

 

  async function createReport(spec) {

    const consumer = consumersByArea[spec.area][spec.c % 2]

    const area = AREAS[spec.area]

    const jitter = spec.jitter ?? 0.0012

    const centerLat = spec.centerLat ?? area.lat

    const centerLng = spec.centerLng ?? area.lng

    const lat = centerLat + between(-jitter, jitter)

    const lng = centerLng + between(-jitter, jitter)

    const reportId = randomUUID()

    const createdMs = NOW - spec.minutesAgo * MIN

    const photoPath = spec.photo ? await uploadPhoto('report-photos', `${coopId}/${reportId}.png`, PNG.report) : null

    check(

      await sb.from('reports').insert({

        report_id: reportId,

        consumer_id: consumer.id,

        ticket_number: spec.ticket,

        zone: consumer.zone,

        barangay: area.barangay,

        municipality: area.municipality,

        location: point(lat, lng),

        nearest_landmark: pick(LANDMARKS),

        report_details: spec.details || pick(DETAILS),

        photo_url: photoPath,

        upload_at: photoPath ? at(createdMs) : null,

        priority: spec.priority ?? null,

        other_homes_affected: !!spec.homes,

        cooperative_id: coopId,

        account_number: consumer.account,

        created_at: at(createdMs),

      }),

      `create report ${spec.ticket}`

    )

    return { reportId, consumer, area, lat, lng }

  }

 

  const masterMembers = []

  const reportByKey = {}

  let n = 0

  for (const spec of ordered) {

    n += 1

    const rep = await createReport(spec)

    reportByKey[spec.key] = rep

    const lineman = spec.forceLineman ? linemen[2] : linemanForArea(spec.area, n)

 

    if (spec.kind === 'resolved') {

      const job = await runJob({ reportId: rep.reportId, lineman, assignedAgo: spec.assignedAgo, final: 'resolved', repairMin: spec.repairMin, photo: n % 2 === 0 })

      if (spec.rating) await confirmAndRate(job.assignmentId, rep.consumer, lineman, job.completedMs, spec.rating, spec.comment)

      if (spec.reopenRequest) {

        check(

          await sb.from('reopen_requests').insert({

            report_id: rep.reportId,

            assignment_id: job.assignmentId,

            consumer_id: rep.consumer.id,

            description: 'Nawalan ulit ng kuryente ilang oras matapos ayusin. Pakisuri po ulit ang linya sa harap ng bahay namin.',

            status: 'pending',

            requested_at: ago(180),

          }),

          'reopen request'

        )

        check(await sb.from('reports').update({ reopened_at: ago(180) }).eq('report_id', rep.reportId), 'mark reopened')

      }

    } else if (spec.kind === 'sup_reopen') {

      await runJob({ reportId: rep.reportId, lineman, assignedAgo: spec.assignedAgo, final: 'resolved', repairMin: spec.repairMin, photo: true })

      await runJob({

        reportId: rep.reportId,

        lineman,

        assignedAgo: spec.reopenAgo,

        final: 'fixed',

        repairMin: spec.reopenAgo - spec.fixedAgo2 + 2,

        photo: true,

        reopen: { source: 'supervisor', reason: 'The consumer called the office: power went out again after the repair. Please recheck the service drop and the connection at the meter.' },

      })

      check(await sb.from('reports').update({ reopened_at: ago(spec.reopenAgo) }).eq('report_id', rep.reportId), 'mark reopened')

    } else if (spec.kind === 'qa_waiting') {

      await runJob({ reportId: rep.reportId, lineman, assignedAgo: spec.assignedAgo, final: 'fixed', repairMin: spec.assignedAgo - spec.fixedAgo + 2, photo: spec.photo })

    } else if (spec.kind === 'qa_rejected') {

      const first = await runJob({ reportId: rep.reportId, lineman, assignedAgo: spec.assignedAgo1, final: 'fixed', repairMin: spec.assignedAgo1 - spec.fixedAgo1 + 2, photo: true })

      const remarks = 'The photo does not show the replaced fuse cutout. Please retake it and confirm the connection at the transformer.'

      check(

        await sb.from('qa_reviews').insert({ assignment_id: first.assignmentId, reviewer_id: ownerId, reviewer_type: 'supervisor', decision: 'rejected', remarks }),

        'QA rejection'

      )

      await runJob({ reportId: rep.reportId, lineman, assignedAgo: spec.assignedAgo2, final: 'in_progress', reopen: { source: 'qa_rejection', reason: remarks } })

    } else if (spec.kind === 'in_progress') {

      await runJob({ reportId: rep.reportId, lineman, assignedAgo: spec.assignedAgo, final: 'in_progress' })

    } else if (spec.kind === 'dispatched') {

      await runJob({ reportId: rep.reportId, lineman, assignedAgo: spec.assignedAgo, final: spec.state === 'assigned' ? 'assigned' : spec.state })

    } else if (spec.kind === 'lineman_reopened') {

      // A reopened report is re-dispatched after the consumer reports a repeat outage.

      await runJob({

        reportId: rep.reportId,

        lineman,

        assignedAgo: spec.minutesAgo - 15,

        final: 'assigned',

        reopen: { source: 'supervisor', reason: 'The consumer reported that power went out again after the previous repair. Recheck the service drop and transformer connection.' },

      })

      check(await sb.from('reports').update({ reopened_at: ago(spec.minutesAgo - 10) }).eq('report_id', rep.reportId), 'mark lineman report reopened')

    } else if (spec.kind === 'lineman_fixed') {

      await runJob({

        reportId: rep.reportId,

        lineman,

        assignedAgo: spec.minutesAgo - 100,

        final: 'fixed',

        repairMin: 75,

        photo: true,

        note: 'Tightened the jumper connection, checked voltage at nearby service points, and confirmed stable readings.',

      })

    } else if (spec.kind === 'declined') {

      check(await sb.from('reports').update({ status: 'cancelled', decline_reason: spec.declineReason }).eq('report_id', rep.reportId), 'decline report')

    } else if (spec.kind === 'master_member') {

      masterMembers.push(rep)

    }

    // 'pending' needs nothing more

  }

 

  // A Master Ticket that groups eight reports, assigned to Ben Navarro (lineman3)

  {

    const area = AREAS[5]

    const mt = check(

      await sb

        .from('master_tickets')

        .insert({

          master_ticket: `MT-${manilaDate(0).replace(/-/g, '')}-${Math.floor(rnd() * 0xffffff).toString(16).toUpperCase().padStart(6, '0')}`,

          barangay: area.barangay,

          municipality: area.municipality,

          location: point(area.lat, area.lng),

          priority: 'high',

          report_count: 0,

          status: 'pending',

          cooperative_id: coopId,

          created_at: ago(100),

        })

        .select()

        .single(),

      'create master ticket'

    )

    check(await sb.from('reports').update({ master_id: mt.master_id }).in('report_id', masterMembers.map((m) => m.reportId)), 'group reports')

    check(await sb.from('master_tickets').update({ report_count: masterMembers.length, status: 'in_progress' }).eq('master_id', mt.master_id), 'update master ticket count/status')

    await runJob({ masterId: mt.master_id, lineman: linemen[2], assignedAgo: 90, final: 'in_progress' })

  }

 

  // ---- 6. Advisories ----------------------------------------------------

  console.log('6/12  Advisories')

  const win = activeWindow()

  const ADVISORIES = [

    { key: 'adv-active', title: 'Scheduled Maintenance: Feeder 1 Line Upgrade', description: 'Crews are upgrading conductors along Feeder 1. Expect brief interruptions while work is ongoing.', date: manilaDate(0), start: win.start, end: win.end, photo: true, targets: [['feeder', 'Feeder 1']] },

    { key: 'adv-up1', title: 'Power Interruption: San Vicente Line Inspection', description: 'Routine inspection and tightening of line connections in San Vicente. Brief interruptions may occur during the scheduled work.', date: manilaDate(1), start: '08:00', end: '12:00', targets: [['municipality', 'San Vicente']] },

    { key: 'adv-up2', title: 'Pole Replacement in Villa Aurora', description: 'Replacement of aging poles. Please prepare for an interruption during the schedule.', date: manilaDate(3), start: '09:00', end: '15:00', targets: [['barangay', 'Poblacion (Villa Aurora)'], ['barangay', 'Rizal (Villa Aurora)']] },

    { key: 'adv-done1', title: 'Tree Trimming in San Vicente', description: 'Trimming of trees near distribution lines to prevent outages during the rainy season.', date: manilaDate(-3), start: '08:00', end: '11:00', targets: [['municipality', 'San Vicente']] },

    { key: 'adv-done2', title: 'Cooperative-wide System Maintenance', description: 'Scheduled system maintenance across the whole cooperative.', date: manilaDate(-9), start: '22:00', end: '23:59', targets: [['entire_cooperative', null]] },

  ]

  for (const adv of ADVISORIES) {

    const advisoryId = randomUUID()

    const photoPath = adv.photo ? await uploadPhoto('advisory-photos', `${coopId}/${advisoryId}-sample.png`, PNG.advisory) : null

    check(

      await sb.from('advisories').insert({

        advisory_id: advisoryId,

        cooperative_id: coopId,

        created_by: ownerId,

        title: adv.title,

        description: adv.description,

        date: adv.date,

        start_time: adv.start,

        end_time: adv.end,

        photo_url: photoPath,

        created_at: ago(adv.date < manilaDate(0) ? Math.abs((new Date(adv.date) - new Date(manilaDate(0))) / MIN) + 600 : 600),

      }),

      `create advisory ${adv.key}`

    )

    check(

      await sb.from('advisory_target').insert(adv.targets.map(([scope, value]) => ({ advisory_id: advisoryId, scope_type: scope, target_value: value }))),

      `advisory targets ${adv.key}`

    )

  }

 

  // ---- 7. FAQ -----------------------------------------------------------

  console.log('7/12  FAQ')

  check(

    await sb.from('faq_entries').insert(

      FAQS.map((f, i) => ({

        cooperative_id: coopId,

        category: f.c,

        question: f.q,

        answer: f.a,

        keywords: f.k,

        question_tl: f.qt,

        answer_tl: f.at,

        is_active: true,

        created_at: ago((20 - i) * DAY / 2),

        updated_at: ago((20 - i) * DAY / 2),

      }))

    ),

    'create FAQ entries'

  )

  const pendingQuestions = [

    [consumers[3], 'Pwede po bang magpa-reconnect ng kuryente kahit may utang pa po?', 150],

    [consumers[10], 'How do I update the name on my electric account?', 400],

    [consumers[17], 'May schedule po ba ng brownout bukas sa Villa Aurora?', 45],

  ]

  for (const [consumer, question, minutesAgo] of pendingQuestions) {

    check(await sb.from('faq_inquiries').insert({ consumer_id: consumer.id, question, status: 'pending', submitted_at: ago(minutesAgo) }), 'FAQ question')

  }

  const answered = [

    [consumers[6], 'Paano po magpa-transfer ng pangalan sa metro?', 'Magdala po ng valid ID at kopya ng title o kontrata sa inyong area office para maproseso ang transfer.', 3 * DAY],

    [consumers[14], 'Is there a discount for senior citizens?', 'Yes. Senior citizens who meet the requirements may avail of the discount. Please visit your area office with a valid senior citizen ID.', 5 * DAY],

  ]

  for (const [consumer, question, reply, minutesAgo] of answered) {

    const inq = check(await sb.from('faq_inquiries').insert({ consumer_id: consumer.id, question, status: 'pending', submitted_at: ago(minutesAgo) }).select().single(), 'FAQ question')

    check(

      await sb.from('faq_inquiries').update({ status: 'answered', supervisor_answer: reply, supervisor_id: ownerId, answered_at: ago(minutesAgo - 120) }).eq('faq_inquiries_id', inq.faq_inquiries_id),

      'answer FAQ question'

    )

  }

 

  // ---- 8. Billing requests ------------------------------------------------

  console.log('8/12  Billing requests')

  const links = [

    [consumers[0], 'pending', 'residential', 90],

    [consumers[5], 'pending', 'commercial', 600],

    [consumers[8], 'pending', 'residential', 1500],

    [consumers[12], 'approved', 'residential', 4 * DAY],

    [consumers[19], 'approved', 'commercial', 7 * DAY],

    [consumers[22], 'rejected', 'residential', 5 * DAY],

  ]

  for (const [consumer, status, type, minutesAgo] of links) {

    const accountName = `${consumer.last}, ${consumer.first}`.toUpperCase()

    const link = check(

      await sb

        .from('consumer_bill_links')

        .insert({ consumer_id: consumer.id, account_number: consumer.account, account_name: accountName, account_type: type, status: 'pending', approved_by: null, request_at: ago(minutesAgo) })

        .select()

        .single(),

      'bill link request'

    )

    if (status === 'approved') {

      check(await sb.from('consumer_bill_links').update({ status: 'approved', approved_by: ownerId, approved_at: ago(minutesAgo - 240) }).eq('link_id', link.link_id), 'approve bill link')

    } else if (status === 'rejected') {

      check(

        await sb

          .from('consumer_bill_links')

          .update({ status: 'rejected', rejection_reason: 'The account name does not match the name on the billing record. Please check the details and try again.', approved_by: ownerId, approved_at: ago(minutesAgo - 240) })

          .eq('link_id', link.link_id),

        'reject bill link'

      )

    }

  }

 

  // Maria's second request uses the same PRISM account number but a non-matching name.

  // This lets the consumer and supervisor screens demonstrate a name mismatch.

  const maria = consumers[0]

  // Insert the mismatched request directly as rejected. The database enforces

  // one pending billing-link request per account, so inserting this as pending

  // first would conflict with Maria's matched request, which is intentionally pending.

  check(

    await sb.from('consumer_bill_links').insert({

      consumer_id: maria.id,

      account_number: maria.account,

      account_name: 'MARIA A. SANTOS',

      account_type: 'residential',

      status: 'rejected',

      rejection_reason: 'The name entered does not match the PRISM account name SANTOS, MARIA. Please use the exact name shown on your bill.',

      approved_by: ownerId,

      request_at: ago(45),

      approved_at: ago(30),

    }),

    'Maria mismatched bill link request'

  )

 

  // ---- 9. Make the notification bell look natural -------------------------

  console.log('9/12  Notifications')

  for (const userId of [ownerId, subId]) {

    const rows = check(await sb.from('notifications').select('notification_id').eq('user_id', userId).order('created_at', { ascending: false }), 'read notifications')

    for (let i = 0; i < rows.length; i++) {

      const minutesAgo = 12 + i * (60 * 40 / Math.max(rows.length, 1))

      check(

        await sb.from('notifications').update({ created_at: ago(minutesAgo), is_read: i >= 6 }).eq('notification_id', rows[i].notification_id),

        'time notification'

      )

    }

  }

 

  // ---- Summary ------------------------------------------------------------

  console.log('\nDONE. The sample cooperative is ready.\n')

  console.log(`Cooperative : ${COOP_NAME}  (plus Mabuhay: Pending Approval, Sampaguita: Rejected)`)

  console.log(`Password    : ${PASSWORD}   (the same for every account below)`)

  console.log(`Owner       : owner${MARKER}        sign in at /supervisor/login (sees everything)`)

  console.log(`Dispatch-only supervisor : dispatch${MARKER}   (shows the locked sidebar and the restricted notice)`)

  console.log(`Linemen     : lineman1${MARKER} ... lineman6${MARKER}`)

  console.log(`Consumers   : consumer01${MARKER} ... consumer24${MARKER}`)

  console.log(`Reports     : ${SPECS.length} (includes one 10-report duplicate cluster + 2 nearby Feeder 2 reports)` )

  console.log('Consumer demo: consumer01@sample-coop.test (Maria Santos) has upcoming/completed advisories, matched + mismatched billing requests, and in-progress/resolved rated + unrated outages.')

  console.log('Lineman demo : lineman3@sample-coop.test (Ben Navarro) has a reopened dispatched job, an in-progress 8-report master ticket, a fixed job, and rated resolved-job history.')

  console.log('\nBefore taking screenshots, run:  node scripts/seed-sample-cooperative.mjs --refresh')

}

 

// ---------------------------------------------------------------------------

// REFRESH: bring the time-based data back to "now"

// ---------------------------------------------------------------------------

async function refresh() {

  const coop = check(

    await sb.from('cooperatives').select('id').eq('cooperative_name', COOP_NAME).like('official_email', `%${MARKER}`),

    'find sample cooperative'

  )[0]

  if (!coop) throw new Error('No sample cooperative found. Run the script without options first.')

 

  const users = check(await sb.from('users').select('id').eq('cooperative_id', coop.id).eq('user_type', 'lineman'), 'read sample linemen')

  const rows = check(await sb.from('lineman').select('profile_id, company_id_number').in('profile_id', users.map((u) => u.id)), 'read lineman rows')

 

  for (const row of rows) {

    const idx = Number(String(row.company_id_number).split('-')[1]) - 1

    const L = LINEMEN[idx]

    if (!L) continue

    const res = await sb

      .from('lineman')

      .update({

        schedule: scheduleFor(L.schedule),

        location: point(L.base[0], L.base[1]),

        location_updated_at: L.online ? ago(2) : ago(180),

        duty_override_until: L.oncall ? at(NOW + 8 * 60 * MIN) : null,

      })

      .eq('profile_id', row.profile_id)

    if (res.error) warn(`${L.first}: ${res.error.message}`)

  }

 

  const win = activeWindow()

  const res = await sb

    .from('advisories')

    .update({ date: manilaDate(0), start_time: win.start, end_time: win.end })

    .eq('cooperative_id', coop.id)

    .like('title', 'Scheduled Maintenance: Feeder 1%')

  if (res.error) warn(`advisory: ${res.error.message}`)

 

  console.log('Refreshed: linemen are online, on shift or on call as designed, and the active advisory is running now.')

}

 

// ---------------------------------------------------------------------------

// CLEANUP: remove everything the script created

// ---------------------------------------------------------------------------

async function cleanup() {

  console.log('Removing the sample cooperative in 5 seconds. Press Ctrl+C to cancel...')

  await sleep(5000)

 

  const coops = check(await sb.from('cooperatives').select('id').like('official_email', `%${MARKER}`), 'find sample cooperatives')

  const coopIds = coops.map((c) => c.id)

  const users = check(await sb.from('users').select('id').like('email', `%${MARKER}`), 'find sample users')

  const userIds = users.map((u) => u.id)

 

  const del = async (table, column, ids, label) => {

    if (!ids || ids.length === 0) return

    check(await sb.from(table).delete().in(column, ids), `delete ${label}`)

  }

 

  console.log('Removing notifications...')

  await del('notifications', 'user_id', userIds, 'notifications')

  await del('notifications', 'reference_id', coopIds, 'cooperative notifications')

 

  console.log('Removing tickets and job orders...')

  const reportIds = coopIds.length ? check(await sb.from('reports').select('report_id').in('cooperative_id', coopIds), 'read reports').map((r) => r.report_id) : []

  const masterIds = coopIds.length ? check(await sb.from('master_tickets').select('master_id').in('cooperative_id', coopIds), 'read master tickets').map((m) => m.master_id) : []

  let assignmentIds = []

  if (reportIds.length) assignmentIds = assignmentIds.concat(check(await sb.from('job_assignments').select('assignment_id').in('report_id', reportIds), 'read job orders').map((a) => a.assignment_id))

  if (masterIds.length) assignmentIds = assignmentIds.concat(check(await sb.from('job_assignments').select('assignment_id').in('master_id', masterIds), 'read master job orders').map((a) => a.assignment_id))

 

  await del('job_ratings', 'assignment_id', assignmentIds, 'ratings')

  await del('qa_reviews', 'assignment_id', assignmentIds, 'QA reviews')

  await del('job_assignment_status_logs', 'assignment_id', assignmentIds, 'status logs')

  await del('reopen_requests', 'report_id', reportIds, 'reopen requests')

  await del('job_assignments', 'assignment_id', assignmentIds, 'job orders')

  await del('reports', 'report_id', reportIds, 'reports')

  await del('master_tickets', 'master_id', masterIds, 'master tickets')

 

  console.log('Removing advisories, FAQ and billing requests...')

  const advisoryIds = coopIds.length ? check(await sb.from('advisories').select('advisory_id').in('cooperative_id', coopIds), 'read advisories').map((a) => a.advisory_id) : []

  await del('advisory_target', 'advisory_id', advisoryIds, 'advisory targets')

  await del('advisories', 'advisory_id', advisoryIds, 'advisories')

  await del('faq_entries', 'cooperative_id', coopIds, 'FAQ entries')

  await del('faq_inquiries', 'consumer_id', userIds, 'FAQ questions')

  await del('consumer_bill_links', 'consumer_id', userIds, 'billing requests')

 

  console.log('Removing accounts...')

  for (const id of userIds) {

    const res = await sb.auth.admin.deleteUser(id)

    if (res.error) {

      const fallback = await sb.from('users').delete().eq('id', id)

      if (fallback.error) warn(`could not remove ${id}: ${fallback.error.message}`)

    }

  }

 

  console.log('Removing service areas and cooperatives...')

  await del('service_areas', 'cooperative_id', coopIds, 'service areas')

  await del('cooperative_status_logs', 'cooperative_id', coopIds, 'status history')

  await del('cooperative_settings', 'cooperative_id', coopIds, 'settings')

  await del('cooperatives', 'id', coopIds, 'cooperatives')

 

  for (const bucket of ['report-photos', 'assignment-proofs', 'advisory-photos']) {

    for (const id of coopIds) {

      const { data } = await sb.storage.from(bucket).list(id, { limit: 200 })

      if (data && data.length > 0) await sb.storage.from(bucket).remove(data.map((f) => `${id}/${f.name}`))

    }

  }

 

  console.log('\nDONE. All sample data has been removed.')

}

 

// ---------------------------------------------------------------------------

async function main() {

  console.log(`\nProject: ${new URL(SUPABASE_URL).host}`)

  if (MODE === 'cleanup') return cleanup()

  if (MODE === 'refresh') return refresh()

  return seed()

}

 

main().catch((e) => {

  console.error('\nERROR: ' + e.message)

  console.error('If this stopped part-way, run  node scripts/seed-sample-cooperative.mjs --cleanup  and try again.')

  process.exit(1)

})

 

 

async function createUser({ email, first, last, type }) {

  phoneCounter += 1

  const phoneNumber = `0999${pad(phoneCounter, 7)}`

 

  const res = await sb.auth.admin.createUser({

    email,

    password: PASSWORD,

    email_confirm: true,

    user_metadata: {

      cooperative_id: coopId,

      first_name: first,

      last_name: last,

      phone_number: phoneNumber,

      user_type: type,

    },

  })

 

  const user = check(res, `create login ${email}`).user

 

  // The Auth trigger creates consumer profiles automatically.

  // Supervisors and linemen need their profiles created here.

  if (type !== 'consumer') {

    check(

      await sb.from('users').upsert(

        {

          id: user.id,

          cooperative_id: coopId,

          first_name: first,

          last_name: last,

          phone_number: phoneNumber,

          email,

          user_type: type,

          is_active: true,

        },

        { onConflict: 'id' }

      ),

      `create profile ${email}`

    )

  }

 

  return user.id

}