/**
 * Skaren Score · calibration
 *
 * The raw formula does not spread evenly across 0-100. This one monotonic curve,
 * fitted once to the REAL catalogue distribution, spreads it across the usable
 * range WITHOUT changing any product's rank (it is strictly increasing, so order
 * is preserved exactly).
 *
 * Knots are [rawScore, displayedScore]. Fitted from the 13,259-product August
 * 2026 catalogue build (lib/merk/buildStats.ts), whose raw distribution was:
 *   p10 = 31.6, p25 = 44.4, p50 = 59.7, p75 = 74.8, p90 = 83.3
 * so the curve maps p50 → 50 and the p10/p90 → ~20/80, with the endpoints
 * anchored at 0 and 100.
 *
 * Refit whenever the catalogue grows by more than ~20%, and NEVER between app
 * releases — a score that moves without the product changing destroys trust
 * faster than a score that is slightly wrong. Version it and note the release.
 */

// v1 · fitted to the Aug 2026 catalogue (13,259 products).
export const CALIBRATION: Array<[number, number]> = [
  [0, 0],
  [31.6, 20],
  [44.4, 35],
  [59.7, 50],
  [74.8, 68],
  [83.3, 80],
  [92, 90],
  [100, 100],
];

/** Piecewise-linear interpolation over a sorted list of [x, y] knots. */
export function piecewiseLinear(x: number, knots: Array<[number, number]>): number {
  if (knots.length === 0) return x;
  if (x <= knots[0][0]) return knots[0][1];
  const last = knots[knots.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < knots.length; i++) {
    const [x0, y0] = knots[i - 1];
    const [x1, y1] = knots[i];
    if (x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return last[1];
}

/** Map a raw 0-100 score to its displayed 0-100 value. Rank-preserving. */
export const calibrate = (raw: number): number => piecewiseLinear(raw, CALIBRATION);
