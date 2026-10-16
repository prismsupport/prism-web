"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SupervisorSidebar from "@/components/navigation/SupervisorSidebar";
import SupervisorTopBar from "@/components/navigation/SupervisorTopBar";
import { createClient } from "@/lib/supabase/client";
import { PermissionsProvider, usePermissions } from "@/lib/supervisor/PermissionsContext";
import AccessRestricted from "@/components/ui/AccessRestricted";
import { PageLoading } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";

function RouteGuard({ children }) {
  const pathname = usePathname();
  const { loading, getRestriction } = usePermissions();

  if (loading) return <PageLoading />

  const restriction = getRestriction(pathname);
  if (restriction) {
    return (
      <AccessRestricted
        pageName={restriction.label}
        ownerOnly={restriction.ownerOnly}
      />
    );
  }

  return children;
}

export default function SupervisorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [supervisorName, setSupervisorName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (pathname === "/supervisor/login" || pathname === "/supervisor/register")
      return;
    loadSupervisorName();
  }, [pathname]);

  async function loadSupervisorName() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("first_name, last_name, photo_url")
      .eq("id", user.id)
      .single();

    if (data) {
      setSupervisorName(`${data.first_name} ${data.last_name}`);
      setAvatarUrl(data.photo_url || null);
    }
  }

  if (pathname === "/supervisor/login" || pathname === "/supervisor/register") {
    return children;
  }

  async function handleLogout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logged out");
    router.push("/supervisor/login");
  }

  return (
    <PermissionsProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <SupervisorSidebar />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SupervisorTopBar
            supervisorName={supervisorName}
            avatarUrl={avatarUrl}
            onLogout={handleLogout}
          />
          <main className="min-h-0 flex-1 overflow-y-auto p-8">
            <RouteGuard>{children}</RouteGuard>
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}