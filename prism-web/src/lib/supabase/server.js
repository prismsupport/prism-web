// Supabase client for Server Components, Server Actions and Route Handlers.
// Reads the visitor's login cookie so queries run as the signed-in user and RLS
// applies to them, not to the anon role. Client Components keep using ./client.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components are not allowed to write cookies. Session
            // refresh is handled by middleware.js, so this is safe to ignore.
          }
        },
      },
    },
  );
}
