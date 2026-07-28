/**
 * Load additive prevalence data (how many products contain each E-number)
 * Used on E-number pages to show real-world statistics
 */

import frequencyData from '@/lib/data/additive-frequency.json';

export interface AdditivePrevalence {
  code: string;
  count: number;
  percentage: number;
  ranking: number;
}

const frequencyMap = new Map<string, AdditivePrevalence>();

// Build map on first import
frequencyData.additives.forEach((additive, idx) => {
  frequencyMap.set(additive.code, {
    code: additive.code,
    count: additive.count,
    percentage: parseFloat(additive.percentage),
    ranking: idx + 1,
  });
});

export function getAdditivePrevalence(code: string): AdditivePrevalence | null {
  return frequencyMap.get(code) || null;
}

export function getTotalProductsAnalyzed(): number {
  return frequencyData.totalProductsAnalyzed;
}
