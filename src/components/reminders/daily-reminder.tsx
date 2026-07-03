"use client";

import { Bell, BellOff, BellRing } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

const ENABLED_KEY = "englishai:reminder:enabled";
const HOUR_KEY = "englishai:reminder:hour";
const LAST_KEY = "englishai:reminder:last";
const DEFAULT_HOUR = 19;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Lightweight daily reminder. Because we have no push backend, this fires a
 * local browser Notification while the app is open (or running as an installed
 * PWA): once per day, after the chosen hour, only if today's goal isn't met yet.
 */
export function DailyReminder({ goalReached }: { goalReached: boolean }) {
  const [enabled, setEnabled] = React.useState(false);
  const [permission, setPermission] =
    React.useState<NotificationPermission>("default");
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);
    setEnabled(window.localStorage.getItem(ENABLED_KEY) === "1");
  }, []);

  // While mounted, check every minute whether it's time to nudge the learner.
  React.useEffect(() => {
    if (!enabled || goalReached || permission !== "granted") return;

    const check = () => {
      const hour = Number(
        window.localStorage.getItem(HOUR_KEY) ?? DEFAULT_HOUR,
      );
      const now = new Date();
      if (now.getHours() < hour) return;
      if (window.localStorage.getItem(LAST_KEY) === todayKey()) return;

      window.localStorage.setItem(LAST_KEY, todayKey());
      new Notification("Time for your English", {
        body: "A few minutes of comprehensible input keeps your streak and your acquisition growing.",
        icon: "/logo192.png",
        badge: "/logo96.png",
        tag: "englishai-daily",
      });
    };

    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, goalReached, permission]);

  if (!supported) return null;

  async function toggle() {
    if (enabled) {
      setEnabled(false);
      window.localStorage.setItem(ENABLED_KEY, "0");
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
    }
    setPermission(perm);
    if (perm !== "granted") return;
    setEnabled(true);
    window.localStorage.setItem(ENABLED_KEY, "1");
    if (!window.localStorage.getItem(HOUR_KEY)) {
      window.localStorage.setItem(HOUR_KEY, String(DEFAULT_HOUR));
    }
  }

  const blocked = permission === "denied";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={blocked}
      className="gap-1.5 text-muted-foreground"
      aria-label={enabled ? "Turn off daily reminder" : "Turn on daily reminder"}
      title={
        blocked
          ? "Notifications are blocked in your browser settings."
          : `Daily reminder around ${DEFAULT_HOUR}:00`
      }
    >
      {blocked ? (
        <BellOff className="size-4" />
      ) : enabled ? (
        <BellRing className="size-4 text-primary" />
      ) : (
        <Bell className="size-4" />
      )}
      {blocked ? "Blocked" : enabled ? "Reminder on" : "Remind me"}
    </Button>
  );
}
