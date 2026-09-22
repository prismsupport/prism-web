"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SupervisorSidebar from "@/components/navigation/SupervisorSidebar";
import SupervisorTopBar from "@/components/navigation/SupervisorTopBar";
import { createClient } from "@/lib/supabase/client";

export default function SupervisorLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [supervisorName, setSupervisorName] = useState("");

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
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (data) {
      setSupervisorName(`${data.first_name} ${data.last_name}`);
    }
  }

  if (pathname === "/supervisor/login" || pathname === "/supervisor/register") {
    return children;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/supervisor/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <SupervisorSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SupervisorTopBar
          supervisorName={supervisorName}
          onLogout={handleLogout}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
