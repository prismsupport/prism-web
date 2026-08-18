import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Pages inside the guarded areas that must stay reachable without a session
const publicPages = [
  "/superadmin/login",
  "/supervisor/login",
  "/supervisor/register",
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isSuperadminRoute = pathname.startsWith("/superadmin");
  const isSupervisorRoute = pathname.startsWith("/supervisor");

  if (
    (!isSuperadminRoute && !isSupervisorRoute) ||
    publicPages.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isSupervisorRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/supervisor/login", request.url));
    }

    // Supervisors aren't a separate table like super_admins — the role lives on
    // users.user_type. The login page checks user_type and the cooperative's
    // status too, but those checks are client-side and are bypassed by
    // navigating straight to a supervisor URL, so they are enforced here.
    const { data: account } = await supabase
      .from("users")
      .select("user_type, is_active, cooperatives(status)")
      .eq("id", user.id)
      .single();

    // cooperative_id is a plain FK on users, so PostgREST embeds it as an object
    const cooperative = Array.isArray(account?.cooperatives)
      ? account.cooperatives[0]
      : account?.cooperatives;

    const isActiveSupervisor =
      account?.user_type === "supervisor" &&
      account.is_active === true &&
      cooperative?.status === "Active";

    if (!isActiveSupervisor) {
      return NextResponse.redirect(new URL("/supervisor/login", request.url));
    }

    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/superadmin/login", request.url));
  }

  // Confirm this specific user is an active superadmin, not just any logged-in Supabase user
  const { data: superadmin } = await supabase
    .from("super_admins")
    .select("id, is_active")
    .eq("id", user.id)
    .single();

  if (!superadmin || superadmin.is_active !== true) {
    return NextResponse.redirect(new URL("/superadmin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/superadmin/:path*", "/supervisor/:path*"],
};
