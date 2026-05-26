"use client";

import { useMemo } from "react";
import type { ScanRecord } from "@/lib/types";

export function useStreak(scans: ScanRecord[]) {
  return useMemo(() => {
    const days = new Set(scans.map((scan) => new Date(scan.created_at ?? "").toDateString()));
    let streak = 0;
    const cursor = new Date();

    while (days.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }, [scans]);
}
