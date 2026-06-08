"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, Flame, BarChart3 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { SkarenLoader } from "@/components/SkarenLoader";
import { useUser } from "@/hooks/useUser";
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

// ── Push helpers ──────────────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function getOrCreateSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  });
}

function subscriptionToRecord(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

async function callSubscribeApi(
  body: Record<string, unknown>
): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.ok;
}

// ── Toggle component ──────────────────────────────────────────────────────────

function NotifRow({
  icon,
  label,
  description,
  enabled,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="w-10 h-10 rounded-xl bg-[#eaf3de] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#2d4a26]">{label}</p>
        <p className="text-[12px] text-[#9a8e7e] mt-0.5 leading-snug">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          enabled ? "bg-[#2d4a26]" : "bg-[#d8d0c4]"
        } ${disabled ? "opacity-40" : ""}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type PermState = "default" | "granted" | "denied" | "unsupported";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [permState, setPermState] = useState<PermState>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [streakEnabled, setStreakEnabled] = useState(true);
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Detect support and current permission
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermState("unsupported");
      setPageLoading(false);
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") { setPermState("denied"); setPageLoading(false); return; }

    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setSubscription(existing);
        setPermState("granted");
        // Load saved prefs from DB
        const token = await getToken();
        if (token) {
          const res = await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: "get", endpoint: existing.endpoint }),
          }).catch(() => null);
          if (res?.ok) {
            const data = await res.json() as { streak_enabled?: boolean; weekly_enabled?: boolean };
            if (data.streak_enabled !== undefined) setStreakEnabled(data.streak_enabled);
            if (data.weekly_enabled !== undefined) setWeeklyEnabled(data.weekly_enabled);
          }
        }
      }
      setPageLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!userLoading && !user) router.push("/login?next=%2Faccount%2Fnotifications");
  }, [user, userLoading, router]);

  if (userLoading || pageLoading) return <SkarenLoader message="Loading notifications" />;

  // Enable notifications (request permission + subscribe)
  async function enableNotifications() {
    setSaving(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setPermState("denied"); return; }

      const sub = await getOrCreateSubscription();
      if (!sub) return;

      const rec = subscriptionToRecord(sub);
      const ok = await callSubscribeApi({
        action: "subscribe",
        ...rec,
        streak_enabled: streakEnabled,
        weekly_enabled: weeklyEnabled,
      });

      if (ok) {
        setSubscription(sub);
        setPermState("granted");
      }
    } finally {
      setSaving(false);
    }
  }

  // Disable all notifications (unsubscribe)
  async function disableNotifications() {
    if (!subscription) return;
    setSaving(true);
    try {
      await callSubscribeApi({ action: "unsubscribe", endpoint: subscription.endpoint });
      await subscription.unsubscribe();
      setSubscription(null);
      setPermState("default");
    } finally {
      setSaving(false);
    }
  }

  // Toggle an individual preference
  async function togglePref(key: "streak" | "weekly", value: boolean) {
    if (key === "streak") setStreakEnabled(value);
    else setWeeklyEnabled(value);

    if (!subscription) return;
    await callSubscribeApi({
      action: "update",
      endpoint: subscription.endpoint,
      streak_enabled: key === "streak" ? value : streakEnabled,
      weekly_enabled: key === "weekly" ? value : weeklyEnabled,
    });
  }

  const isActive = permState === "granted" && !!subscription;

  return (
    <div className="min-h-screen bg-[var(--sk-brand-mist)]">
      <BottomNav />
      <main
        className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden pb-32 pt-4"
        style={{ fontFamily: "Manrope, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-[#e0d8cc] flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-[#2d4a26]" />
          </button>
          <div>
            <h1
              className="text-[22px] font-black text-[#2d4a26] tracking-tight"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              Notifications
            </h1>
            <p className="text-[12px] text-[#9a8e7e]">Reminders &amp; tips</p>
          </div>
        </div>

        {/* Unsupported */}
        {permState === "unsupported" && (
          <div className="mx-4 rounded-2xl bg-white border border-[#e0d8cc] p-5 text-center">
            <BellOff size={32} className="mx-auto mb-3 text-[#c0b8a8]" />
            <p className="text-[14px] font-bold text-[#2d4a26]">Not supported</p>
            <p className="text-[12px] text-[#9a8e7e] mt-1">
              Your browser doesn&apos;t support push notifications. Try Chrome or Safari on iOS 16.4+.
            </p>
          </div>
        )}

        {/* Denied */}
        {permState === "denied" && (
          <div className="mx-4 rounded-2xl bg-[#fff3f0] border border-[#f0c8c0] p-5 text-center">
            <BellOff size={32} className="mx-auto mb-3 text-[#c05040]" />
            <p className="text-[14px] font-bold text-[#8a2010]">Notifications blocked</p>
            <p className="text-[12px] text-[#c05040] mt-1 leading-relaxed">
              You&apos;ve blocked notifications for this site. To re-enable, go to your browser settings and allow notifications for Skaren.
            </p>
          </div>
        )}

        {/* Enable / master toggle */}
        {(permState === "default" || permState === "granted") && (
          <div className="mx-4 mb-4 rounded-2xl bg-white border border-[#e0d8cc] overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isActive ? "#2d4a26" : "#eaf3de" }}
              >
                <Bell size={18} color={isActive ? "#dceedd" : "#2d4a26"} />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-bold text-[#2d4a26]">Push notifications</p>
                <p className="text-[12px] text-[#9a8e7e] mt-0.5">
                  {isActive ? "Enabled — you'll get reminders" : "Off — tap to enable"}
                </p>
              </div>
              {isActive ? (
                <button
                  disabled={saving}
                  onClick={disableNotifications}
                  className="text-[12px] font-semibold text-[#9a3020] border border-[#f0c8c0] rounded-lg px-3 py-1.5 disabled:opacity-50"
                >
                  Turn off
                </button>
              ) : (
                <button
                  disabled={saving}
                  onClick={enableNotifications}
                  className="text-[12px] font-semibold text-white bg-[#2d4a26] rounded-lg px-3 py-1.5 disabled:opacity-50"
                >
                  {saving ? "..." : "Enable"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Individual preferences — only shown when active */}
        {isActive && (
          <div className="mx-4 rounded-2xl bg-white border border-[#e0d8cc] overflow-hidden divide-y divide-[#f0ebe0]">
            <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase text-[#9a8e7e] tracking-widest">
              What to send
            </p>

            <NotifRow
              icon={<Flame size={18} className="text-[#c06020]" />}
              label="Streak reminder"
              description="Daily nudge at 8 pm if you haven't scanned yet"
              enabled={streakEnabled}
              onChange={(v) => togglePref("streak", v)}
            />

            <NotifRow
              icon={<BarChart3 size={18} className="text-[#2d6a4a]" />}
              label="Weekly summary"
              description="Sunday morning overview of your week's scans"
              enabled={weeklyEnabled}
              onChange={(v) => togglePref("weekly", v)}
            />
          </div>
        )}

        {/* Info footer */}
        <p className="mx-4 mt-6 text-[11px] text-[#b0a898] leading-relaxed">
          Notifications are sent from Skaren and never include product advertisements. You can turn them off at any time.
        </p>
      </main>
    </div>
  );
}
