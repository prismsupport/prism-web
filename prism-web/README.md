
# PRISM Web

PRISM Web is a web dashboard for managing cooperative operations, service reports, dispatch work, advisories, FAQs, and user accounts. The application has separate supervisor and superadmin areas and uses Supabase for authentication and data access.

## Technology

- [Next.js](https://nextjs.org/) 16 with the App Router
- React 19
- [Supabase](https://supabase.com/) for authentication and PostgreSQL access
- Tailwind CSS 4
- Leaflet for report maps
- Biome for formatting and linting

## Requirements

- Node.js with npm
- A Supabase project with the required application tables, policies, and authentication configuration

## Local Setup

Install dependencies from the project directory:

```bash
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by the browser client and middleware. `SUPABASE_SERVICE_ROLE_KEY` is used only by server-side API routes. Never expose the service-role key to client-side code or commit `.env.local`.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to the supervisor login page.

## Available Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server after a build. |
| `npm run lint` | Run Biome checks. |
| `npm run format` | Format supported files with Biome. |

## Application Areas

### Supervisor

- `/supervisor/login` - Supervisor sign-in
- `/supervisor/register` - Cooperative and supervisor registration
- `/supervisor/dashboard` - Operational overview
- `/supervisor/dispatch` - Dispatch queue and ticket management
- `/supervisor/advisories` - Create and manage service advisories
- `/supervisor/faq` - Manage FAQ entries and inquiries
- `/supervisor/users` - Manage consumers, linemen, offices, and billing requests
- `/supervisor/search` - Search reports, tickets, and users

### Superadmin

- `/superadmin/login` - Superadmin sign-in
- `/superadmin/cooperatives` - Review and manage cooperatives
- `/superadmin/cooperatives/[id]` - View cooperative details and status history

Dispatch also includes dynamic report, master-ticket, cluster, join, and reopen routes. These are reached from the dispatch queue and search results rather than from the main navigation.

## Project Structure

```text
src/
	app/          Next.js routes, layouts, and API handlers
	components/   Reusable UI and feature components
	lib/          Supabase clients and shared utilities
```

The browser Supabase client is in `src/lib/supabase/client.js`. Authentication middleware is configured in `src/middleware.js`. Server-only operations that require the service-role key live under `src/app/api/`.

## Production

Build and run the application with:

```bash
npm run build
npm run start
```

Configure the same environment variables in the hosting provider. Vercel is a suitable deployment target for the Next.js application, but any platform that supports a Node.js Next.js server can be used.

## Development Notes

- Keep secrets in environment variables; do not commit `.env.local`.
- Changes to Supabase tables, policies, or roles may require corresponding updates to the queries and route handlers in `src/`.
- Dynamic routes in the App Router are framework entry points and should not be removed just because they have no direct imports.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
