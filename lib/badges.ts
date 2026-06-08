export type BadgeId =
  | "first_scan"
  | "scan_10"
  | "scan_25"
  | "scan_50"
  | "scan_100"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "grade_a_1"
  | "grade_a_5"
  | "grade_a_10"
  | "additive_aware"
  | "label_reader"
  | "avoid_expert"
  | "pioneer"
  | "legend";

export type BadgeCategory = "scanning" | "streak" | "health" | "additives" | "special";
export type BadgeColor = "green" | "amber" | "teal" | "blue" | "red" | "special";

export type BadgeDefinition = {
  id: BadgeId;
  emoji: string;
  name: string;
  description: string;
  category: BadgeCategory;
  color: BadgeColor;
};

export type EarnedBadge = BadgeDefinition & { earned: true };
export type LockedBadge = BadgeDefinition & {
  earned: false;
  progress?: number; // 0–1
  progressLabel?: string;
};
export type BadgeResult = EarnedBadge | LockedBadge;

export const BADGE_CATEGORIES: { id: BadgeCategory; label: string }[] = [
  { id: "scanning", label: "Scanning milestones" },
  { id: "streak", label: "Streak & consistency" },
  { id: "health", label: "Health choices" },
  { id: "additives", label: "Additive detective" },
  { id: "special", label: "Rare & special" },
];

export const BADGES: BadgeDefinition[] = [
  // Scanning milestones
  { id: "first_scan", emoji: "🔍", name: "First Scan",    description: "Scan your first product",    category: "scanning",  color: "green" },
  { id: "scan_10",    emoji: "📦", name: "10 Products",   description: "Scan 10 products total",     category: "scanning",  color: "green" },
  { id: "scan_25",    emoji: "🛒", name: "25 Products",   description: "Scan 25 products total",     category: "scanning",  color: "green" },
  { id: "scan_50",    emoji: "💯", name: "50 Products",   description: "Scan 50 products total",     category: "scanning",  color: "green" },
  { id: "scan_100",   emoji: "🎯", name: "100 Products",  description: "Scan 100 products total",    category: "scanning",  color: "teal"  },
  // Streak
  { id: "streak_3",   emoji: "🔥", name: "3-Day Streak",  description: "Scan 3 days in a row",       category: "streak",    color: "amber" },
  { id: "streak_7",   emoji: "⚡", name: "7-Day Streak",  description: "Scan 7 days in a row",       category: "streak",    color: "amber" },
  { id: "streak_30",  emoji: "🌙", name: "30-Day Streak", description: "Scan 30 days in a row",      category: "streak",    color: "amber" },
  { id: "streak_100", emoji: "👑", name: "Century Streak",description: "Scan 100 days in a row",     category: "streak",    color: "special" },
  // Health
  { id: "grade_a_1",  emoji: "🥦", name: "Grade A Find",  description: "Find a Grade A product",     category: "health",    color: "teal" },
  { id: "grade_a_5",  emoji: "🌟", name: "5× Grade A",    description: "Find 5 Grade A products",    category: "health",    color: "teal" },
  { id: "grade_a_10", emoji: "✨", name: "Health Hero",   description: "Find 10 Grade A products",   category: "health",    color: "teal" },
  // Additives
  { id: "additive_aware", emoji: "🧠", name: "Additive Aware", description: "Detect 5 flagged additives",  category: "additives", color: "blue" },
  { id: "label_reader",   emoji: "🔬", name: "Label Reader",   description: "Detect 20 flagged additives", category: "additives", color: "blue" },
  { id: "avoid_expert",   emoji: "🛡️", name: "Avoid Expert",   description: "Flag 10 red-risk additives",  category: "additives", color: "red"  },
  // Special
  { id: "pioneer", emoji: "🌿", name: "Pioneer", description: "Joined Skaren early",    category: "special", color: "special" },
  { id: "legend",  emoji: "🏅", name: "Legend",  description: "Scan 500 products",      category: "special", color: "special" },
];

export type ScanSummary = {
  created_at: string | null;
  health_grade: string | null;
  additives_to_avoid: number | null;
  additives_moderate: number | null;
};

export function computeBadges(params: {
  scans: ScanSummary[];
  streakDays: number;
  joinedAt?: string;
}): BadgeResult[] {
  const { scans, streakDays, joinedAt } = params;

  const scanCount = scans.length;
  const gradeACount = scans.filter((s) => s.health_grade === "A").length;
  const totalFlagged = scans.reduce(
    (sum, s) => sum + (s.additives_to_avoid ?? 0) + (s.additives_moderate ?? 0),
    0
  );
  const totalAvoid = scans.reduce((sum, s) => sum + (s.additives_to_avoid ?? 0), 0);

  // Pioneer = joined before Aug 2026 (early adopter window)
  const isPioneer = joinedAt ? new Date(joinedAt) < new Date("2026-08-01") : false;

  function clamp(v: number) { return Math.min(Math.max(v, 0), 1); }

  const earned: Record<BadgeId, boolean> = {
    first_scan:     scanCount >= 1,
    scan_10:        scanCount >= 10,
    scan_25:        scanCount >= 25,
    scan_50:        scanCount >= 50,
    scan_100:       scanCount >= 100,
    streak_3:       streakDays >= 3,
    streak_7:       streakDays >= 7,
    streak_30:      streakDays >= 30,
    streak_100:     streakDays >= 100,
    grade_a_1:      gradeACount >= 1,
    grade_a_5:      gradeACount >= 5,
    grade_a_10:     gradeACount >= 10,
    additive_aware: totalFlagged >= 5,
    label_reader:   totalFlagged >= 20,
    avoid_expert:   totalAvoid >= 10,
    pioneer:        isPioneer,
    legend:         scanCount >= 500,
  };

  return BADGES.map((badge): BadgeResult => {
    if (earned[badge.id]) return { ...badge, earned: true };

    // Progress hints for locked badges
    let progress: number | undefined;
    let progressLabel: string | undefined;

    switch (badge.id) {
      case "scan_10":   progress = clamp(scanCount / 10);   progressLabel = `${10 - scanCount} to go`;           break;
      case "scan_25":   progress = clamp(scanCount / 25);   progressLabel = `${25 - scanCount} to go`;           break;
      case "scan_50":   progress = clamp(scanCount / 50);   progressLabel = `${50 - scanCount} to go`;           break;
      case "scan_100":  progress = clamp(scanCount / 100);  progressLabel = `${100 - scanCount} to go`;          break;
      case "streak_7":  progress = clamp(streakDays / 7);   progressLabel = `${streakDays} day streak`;          break;
      case "streak_30": progress = clamp(streakDays / 30);  progressLabel = `${streakDays} day streak`;          break;
      case "streak_100":progress = clamp(streakDays / 100); progressLabel = `${streakDays} day streak`;          break;
      case "grade_a_5": progress = clamp(gradeACount / 5);  progressLabel = `${gradeACount}/5 found`;            break;
      case "grade_a_10":progress = clamp(gradeACount / 10); progressLabel = `${gradeACount}/10 found`;           break;
      case "additive_aware": progress = clamp(totalFlagged / 5);  progressLabel = `${totalFlagged}/5 found`;     break;
      case "label_reader":   progress = clamp(totalFlagged / 20); progressLabel = `${totalFlagged}/20 found`;    break;
      case "avoid_expert":   progress = clamp(totalAvoid / 10);   progressLabel = `${totalAvoid}/10 flagged`;    break;
      case "legend":    progress = clamp(scanCount / 500);  progressLabel = `${scanCount}/500 scans`;            break;
    }

    return { ...badge, earned: false, progress, progressLabel };
  });
}

export function earnedCount(badges: BadgeResult[]): number {
  return badges.filter((b) => b.earned).length;
}
