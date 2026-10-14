"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Badge counts for the sidebar. The database's row-level security already limits
// each query to the supervisor's own cooperative.
export default function useNavCounts() {
  const pathname = usePathname();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const [reports, masters, faq] = await Promise.all([
        supabase
          .from("reports")
          .select("report_id", { count: "exact", head: true })
          .is("master_id", null)
          .in("status", ["pending", "qa_review"]),
        supabase
          .from("master_tickets")
          .select("master_id", { count: "exact", head: true })
          .in("status", ["pending", "qa_review"]),
        supabase
          .from("faq_inquiries")
          .select("faq_inquiries_id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      if (!active) return;
      setCounts({
        "/supervisor/dispatch": (reports.count || 0) + (masters.count || 0),
        "/supervisor/faq": faq.count || 0,
      });
    }

    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [pathname]);

  return counts;
}