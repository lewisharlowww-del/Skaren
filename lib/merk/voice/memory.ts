/**
 * Merk voice engine · memory observations (briefing v2, §11)
 *
 * The cheapest character work in the app. Merk currently says the same thing to
 * a first scan and a two-hundredth. Six templated observations over the local
 * history table close most of that gap — no model, no cost, no latency.
 *
 * Rules (from the briefing):
 *   - At most ONE per session.
 *   - NEVER on the result screen (that space belongs to the product).
 *   - NEVER framed as a judgement of the person. "Third chorizo this month" is
 *     an observation; "that is a lot of chorizo" is a diet coach, and Merk is
 *     not one.
 *
 * Priority is top to bottom: the first observation whose condition is met wins,
 * so a milestone or a fresh habit outranks a bare streak.
 */

import type { ScanRecord } from "@/lib/types";
import { bucketOf } from "@/lib/merk/categories";
import { bucketPresentation } from "@/lib/merk/voice/buckets";

export type MemoryKind = "MILESTONE" | "REPEAT" | "FIRST" | "HABIT" | "IMPROVING" | "STREAK";
export type MemoryObservation = { kind: MemoryKind; text: string };

type Lang = "en" | "no";

const MS_DAY = 24 * 60 * 60 * 1000;

function scanBucket(s: ScanRecord): string {
  return bucketOf({ name: s.product_name ?? null, category: null });
}

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Distinct calendar days present in the scan set, newest first. */
function scanDays(scans: ScanRecord[]): number[] {
  const days = new Set<number>();
  for (const s of scans) {
    if (!s.created_at) continue;
    days.add(startOfDay(new Date(s.created_at).getTime()));
  }
  return Array.from(days).sort((a, b) => b - a);
}

/** Consecutive-day streak ending today (or yesterday). */
function currentStreak(scans: ScanRecord[], now: number): number {
  const days = scanDays(scans);
  if (!days.length) return 0;
  const today = startOfDay(now);
  let expected = today;
  // Allow the streak to "end" yesterday if nothing scanned yet today.
  if (days[0] !== today) {
    if (days[0] !== today - MS_DAY) return 0;
    expected = today - MS_DAY;
  }
  let streak = 0;
  for (const day of days) {
    if (day === expected) {
      streak++;
      expected -= MS_DAY;
    } else if (day < expected) {
      break;
    }
  }
  return streak;
}

const MILESTONES = [250, 100, 50];

/**
 * Pick at most one memory observation for the current session. `scans` is the
 * user's history INCLUDING the product just scanned (newest first is not
 * required). `now` defaults to the current time; injectable for tests.
 *
 * Returns null when nothing is worth noting — silence is a valid answer.
 */
export function pickMemory(
  scans: ScanRecord[],
  scanned: { barcode: string; bucket?: string },
  lang: Lang = "en",
  now: number = Date.now()
): MemoryObservation | null {
  if (!scans.length) return null;
  const no = lang === "no";
  const total = scans.length;

  // MILESTONE — 50 / 100 / 250 scans. The strongest note, so it leads.
  const milestone = MILESTONES.find((m) => total === m);
  if (milestone) {
    return {
      kind: "MILESTONE",
      text: no ? `${milestone} etiketter lest sammen.` : `${milestone} labels read together.`,
    };
  }

  // REPEAT — scanned this exact product before (earlier than this session's one).
  const priorSame = scans.filter((s) => s.barcode === scanned.barcode);
  if (priorSame.length >= 2) {
    return {
      kind: "REPEAT",
      text: no ? "Du så på denne før." : "You have looked at this one before.",
    };
  }

  const bucket = scanned.bucket ?? "unbucketed";
  const monthAgo = now - 30 * MS_DAY;
  const thisMonth = scans.filter((s) => s.created_at && new Date(s.created_at).getTime() >= monthAgo);

  // FIRST — first scan in a new bucket (this is the only one in that bucket).
  if (bucket && bucket !== "unbucketed") {
    const sameBucket = scans.filter((s) => scanBucket(s) === bucket);
    if (sameBucket.length === 1) {
      const noun = bucketNoun(bucket, lang);
      if (noun) {
        return {
          kind: "FIRST",
          text: no ? `Første gang du skanner ${noun}.` : `First time you have scanned ${noun}.`,
        };
      }
    }

    // HABIT — 3+ from one bucket this month.
    const sameBucketMonth = thisMonth.filter((s) => scanBucket(s) === bucket);
    if (sameBucketMonth.length >= 3) {
      const noun = bucketNoun(bucket, lang);
      const nth = ordinal(sameBucketMonth.length, lang);
      if (noun) {
        return {
          kind: "HABIT",
          text: no ? `${cap(nth)} ${noun} denne måneden.` : `${cap(nth)} ${noun} this month.`,
        };
      }
    }
  }

  // IMPROVING — rolling median score up by more than 8 (recent 10 vs prior 10).
  const improving = medianJump(scans);
  if (improving) {
    return {
      kind: "IMPROVING",
      text: no ? "Handlekurven din har blitt renere." : "Your basket has been getting cleaner.",
    };
  }

  // STREAK — n scans across m consecutive days.
  const streak = currentStreak(scans, now);
  if (streak >= 3) {
    return {
      kind: "STREAK",
      text: no ? `${streak} dager på rad nå.` : `${streak} days in a row now.`,
    };
  }

  return null;
}

/** Recent-10 median score minus prior-10 median. > 8 counts as improving. */
function medianJump(scans: ScanRecord[]): boolean {
  const scored = scans
    .filter((s) => typeof s.ecoscan_score === "number")
    .slice()
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
    .map((s) => s.ecoscan_score as number);
  if (scored.length < 12) return false;
  const recent = scored.slice(0, 10);
  const prior = scored.slice(10, 20);
  if (prior.length < 5) return false;
  return median(recent) - median(prior) > 8;
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// A plain noun for a score bucket. Reuses the voice bucket presentation so the
// same human words appear here and in the buy note; never a bucket key.
function bucketNoun(bucket: string, lang: Lang): string | null {
  const p = bucketPresentation(bucket);
  if (!p) return null;
  return lang === "no" ? p.noun.nb : p.noun.en;
}

function ordinal(n: number, lang: Lang): string {
  if (lang === "no") return `${n}.`;
  const map: Record<number, string> = { 1: "first", 2: "second", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth" };
  return map[n] ?? `${n}th`;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
