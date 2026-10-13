"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export const SUPERVISOR_NOTIFICATION_EVENT = "supervisor-notification";

export function useSupervisorNotificationRefresh(onNotification) {
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    function handleNotification(event) {
      callbackRef.current(event.detail);
    }

    window.addEventListener(SUPERVISOR_NOTIFICATION_EVENT, handleNotification);
    return () =>
      window.removeEventListener(
        SUPERVISOR_NOTIFICATION_EVENT,
        handleNotification,
      );
  }, []);
}

export function useUnreadSupervisorNotifications(referenceTypes) {
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const typesKey = referenceTypes.join(",");

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const types = typesKey ? typesKey.split(",") : [];

    async function loadUnread() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("notification_id, reference_type, reference_id")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .in("reference_type", types);

      if (!error && active) setUnreadNotifications(data || []);
    }

    loadUnread();

    function handleNotification(event) {
      const notification = event.detail;
      if (!notification || !types.includes(notification.reference_type)) return;
      setUnreadNotifications((current) => [
        notification,
        ...current.filter(
          (item) => item.notification_id !== notification.notification_id,
        ),
      ]);
    }

    window.addEventListener(SUPERVISOR_NOTIFICATION_EVENT, handleNotification);
    return () => {
      active = false;
      window.removeEventListener(
        SUPERVISOR_NOTIFICATION_EVENT,
        handleNotification,
      );
    };
  }, [typesKey]);

  async function markNotificationRead(referenceType, referenceId) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("reference_type", referenceType)
      .eq("reference_id", referenceId)
      .eq("is_read", false);

    if (!error) {
      setUnreadNotifications((current) =>
        current.filter(
          (item) =>
            !(
              item.reference_type === referenceType &&
              item.reference_id === referenceId
            ),
        ),
      );
    }
  }

  function isUnread(referenceType, referenceId) {
    return unreadNotifications.some(
      (item) =>
        item.reference_type === referenceType &&
        item.reference_id === referenceId,
    );
  }

  return { isUnread, markNotificationRead };
}
