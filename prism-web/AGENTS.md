# PRISM Web — AI Coding Instructions

Read by Cursor, Devin, Claude Code, Windsurf, etc. via the AGENTS.md convention. Copilot needs the same content copied into `.github/copilot-instructions.md`.

## Project

PRISM (RondaMapa) — Integrated Consumer Service and Outage Management System for CASURECO I. This is the **web** counterpart to the PRISM mobile app (React Native + Expo), sharing the same Supabase backend.

Stack: Next.js (React), JSX only (no TypeScript), Tailwind CSS, shadcn/ui, Supabase (PostgreSQL, PostGIS, Storage, Realtime), Biome (lint/format).

Roles: Superadmin, Supervisor. (Consumer/Lineman are mobile-app roles — confirm before assuming the web app needs to serve them too.)

Structure:
* `src/app/` — Next.js App Router routes only, grouped by role:
  * `app/api/` — route handlers
  * `app/superadmin/` — e.g. `cooperatives/`, `login/`, `layout.js`
  * `app/supervisor/` — e.g. `dispatch/` (`page.jsx`, `layout.jsx`), `layout.js`, `page.js`, `globals.css`
* `src/assets/image/` — static images (e.g. `logo.png`)
* `src/components/` — shared components
  * `src/components/ui/` — shadcn primitives (generated, don't hand-edit — regenerate via shadcn CLI instead)
  * other shared components live directly under `src/components/` (e.g. `sidebar.jsx`, `StatusBadge.js`)
* `src/hooks/` — shared custom hooks (data fetching, form logic, reusable stateful behavior)
* `src/services/` — Supabase query functions, grouped by domain (e.g. one file per resource/table). This is the layer that talks to Supabase — components and hooks call into `services`, not the Supabase client directly.
* `src/lib/` — shared low-level logic, including the Supabase client setup itself and other framework-agnostic utilities
* `middleware.js` — auth/session/routing middleware at project root of `src/`
* `components.json` — shadcn config
* No Zustand, no Gluestack. State is local (`useState`) or server-derived via hooks/services — check for an existing shared-state pattern before introducing one.
* Don't duplicate logic across route folders. If a component/hook/service already exists in `src/components`, `src/hooks`, `src/services`, `src/lib`, or elsewhere in `src/`, reuse it — don't recreate it locally inside a route folder.

## Core Rule

Simple code first. Reuse existing code. Don't over-engineer. Don't introduce complexity unless it solves an actual problem.

No unnecessary abstractions, helper layers, design patterns, generic wrappers, complex hooks, or dependencies. Comments: plain and only when non-obvious — no JSDoc (`@param`/`@return`/`@description`) unless explicitly requested. Clear variable names over short/unclear ones. `.jsx`/`.js` only — do not introduce TypeScript or `.tsx`/`.ts` files.

## Next.js Specifics

* Default to Server Components; only add `"use client"` when the component needs interactivity, hooks, or browser APIs.
* Keep data fetching close to where it's needed — server-side fetch/Server Actions over client-side `useEffect` fetching where practical.
* Route handlers go in `src/app/api/`, following whatever pattern already exists there.
* Respect `middleware.js` for auth/role-gating — don't duplicate that logic inside individual pages.

## UI (Tailwind + shadcn)

* Use existing shadcn components from `src/components/ui/` before building a new one. Add new shadcn components via the CLI (keeps `components.json` and primitives consistent) rather than hand-rolling equivalents.
* Style with Tailwind utility classes, following patterns already in the codebase (e.g. `globals.css`, existing component classNames). No inline styles or ad hoc CSS files unless the codebase already does this elsewhere.
* Reuse shared components like `sidebar.jsx` and `StatusBadge.js` rather than duplicating markup per route.

## Supabase

Before writing a query: check existing schema, existing functions in `src/services`, table/column names, and relationships. Reuse the Supabase client from `src/lib`. Query logic belongs in `src/services` (grouped by domain), not scattered inline in components or route files — components/hooks call `services` functions. Prefer simple client queries over raw SQL. Never expose service-role credentials client-side (no service-role key in anything shipped to the browser or in `NEXT_PUBLIC_*` vars). Never bypass or disable RLS.

## Security & Permissions

* Superadmin: cooperative management, system-level configuration, account/user management
* Supervisor: reports, assignments, consumer management, dispatch, system management within their scope

Never bypass auth/RLS. No secrets in client-side code, `.env` values shipped to the browser, or `NEXT_PUBLIC_*` vars. `.env` is gitignored — never commit real values into it or hardcode them elsewhere.

## Every User-Facing Operation Needs

Loading, success, empty, and error states — no silent failures, no exposing raw technical errors to users. Validate input before submitting.

## Before Writing New Code

Search the project first. Reuse existing components/hooks/services/shadcn primitives. Don't duplicate. Only modify files required for the requested feature — don't refactor unrelated code or change architecture without explaining why.

## Feature Workflow

1. Understand: feature, role (superadmin/supervisor), route, data needed, success/failure behavior.
2. Inspect: search `src/app/`, `src/components/`, `src/hooks/`, `src/services/`, `src/lib/` for existing screens, components, hooks, services, similar features. Reuse over rebuild.
3. Scope: identify the smallest set of affected files — route (`page.jsx`/`layout.jsx`), component, hook, service function, Supabase table/RLS, middleware. Don't touch more than needed.
4. Check the database: table/column names, relationships, RLS policies, storage policies — don't guess.
5. Plan briefly: what changes, whether DB/RLS is affected, whether it's a Server or Client Component, whether routing/middleware is affected.
6. Implement: smallest working solution, following existing patterns. No new library without clear reason. Use shadcn CLI for new UI primitives.
7. Handle all states: loading, success, empty, error.
8. Keep it simple: no unneeded abstractions/wrappers/complex SQL.
9. Comment sparingly: plain comments only where non-obvious.
10. Run Biome (lint/format) before finishing, matching the project's existing config.
11. Review before finishing:
    * No duplicate/unused imports
    * No hardcoded secrets
    * Loading / error / empty states work
    * Routing works, middleware/role-gating respected
    * Server vs Client Component boundary is correct
    * DB query matches schema
    * RLS allows the intended role
    * Existing features still work
    * No unrelated files touched
    * `.jsx`/`.js` only — no TypeScript introduced
12. Report: what changed, why, any DB/RLS changes required, what to test manually. Keep it concise.