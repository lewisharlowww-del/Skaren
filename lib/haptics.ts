export function vibrate(pattern: number | number[]) {
  if (typeof window === "undefined") return;
  if (!("vibrate" in navigator)) return;

  navigator.vibrate(pattern);
}
