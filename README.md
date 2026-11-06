# PRISM Web

PRISM Web is a Next.js dashboard for electric cooperative operations. It supports
supervisor workflows for reports, dispatch, advisories, FAQs, users, billing, and
performance, plus superadmin workflows for cooperative administration.

## Stack

- Next.js 16 and React 19
- Next.js App Router
- Supabase Auth and PostgreSQL
- Tailwind CSS 4
- Leaflet
- Biome

## Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project with the application tables, policies, and authentication
  configuration

## Getting started

Run these commands from the `prism-web` directory:

```bash
npm install
```

Create a `.env.local` file in the same directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BILLING_CONFIG_SECRET=64-character-hex-secret
```

The public Supabase variables are used by the browser client and middleware.
`SUPABASE_SERVICE_ROLE_KEY` is used only by server-side API routes and scripts.
`BILLING_CONFIG_SECRET` must be exactly 64 hexadecimal characters when billing
configuration encryption is enabled. Never expose these server-only values or
commit `.env.local`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to
the supervisor login page.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server after a build. |
| `npm run lint` | Run Biome checks. |
| `npm run format` | Format supported files with Biome. |

## Main routes

### Supervisor

- `/supervisor/login` - Sign in
- `/supervisor/register` - Register a cooperative and supervisor
- `/supervisor/dashboard` - View operational metrics
- `/supervisor/dispatch` - Manage dispatch queues and tickets
- `/supervisor/advisories` - Manage service advisories
- `/supervisor/faq` - Manage FAQs and inquiries
- `/supervisor/users` - Manage consumers, linemen, offices, and billing requests
- `/supervisor/billing` - Configure billing integration
- `/supervisor/reports` - Review reports
- `/supervisor/lineman-performance` - Review lineman performance

### Superadmin

- `/superadmin/login` - Sign in
- `/superadmin/cooperatives` - Review and manage cooperatives
- `/superadmin/cooperatives/[id]` - View cooperative details and status history

## Sample data

The seed script creates fictional data for screenshots and local testing. It
requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in
`.env.local`.

```bash
node scripts/seed-sample-cooperative.mjs
node scripts/seed-sample-cooperative.mjs --refresh
node scripts/seed-sample-cooperative.mjs --cleanup
```

Use `--no-photos` with the seed command to skip placeholder photos. The seed
script uses `@sample-coop.test` accounts so its records can be identified and
removed safely with `--cleanup`. Do not run it against a production project.

## Project structure

```text
src/
  app/          Routes, layouts, and API handlers
  components/   Reusable UI and feature components
  lib/          Supabase clients and shared utilities
scripts/        Local data and maintenance scripts
public/         Static assets
```

Authentication middleware is in `src/middleware.js`. The browser Supabase
client is in `src/lib/supabase/client.js`. Server-only API handlers are under
`src/app/api/`.

## Production

Build and run the application with:

```bash
npm run build
npm run start
```

Configure the environment variables in the hosting provider. Vercel is a
suitable deployment target, but any platform that supports a Node.js Next.js
server can be used. Ensure the production Supabase project has the required
tables, policies, roles, and authentication settings.
