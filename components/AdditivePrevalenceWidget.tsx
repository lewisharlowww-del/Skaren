'use client';

import { getAdditivePrevalence, getTotalProductsAnalyzed } from '@/lib/additivePrevalence';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface PrevalenceProps {
  code: string;
}

export function AdditivPrevalenceWidget({ code }: PrevalenceProps) {
  const prevalence = getAdditivePrevalence(code);
  const totalProducts = getTotalProductsAnalyzed();

  if (!prevalence) {
    return null;
  }

  const isCommon = prevalence.ranking <= 10;
  const isMostCommon = prevalence.ranking <= 5;

  return (
    <div
      className={`mt-8 rounded-2xl border p-6 ${
        isMostCommon
          ? 'border-amber-200 bg-amber-50'
          : isCommon
          ? 'border-blue-200 bg-blue-50'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <TrendingUp className={`h-5 w-5 mt-1 flex-shrink-0 ${isMostCommon ? 'text-amber-600' : 'text-blue-600'}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${isMostCommon ? 'text-amber-900' : 'text-blue-900'}`}>
            How common is {code} in Norwegian stores?
          </h3>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{prevalence.percentage}%</span>
              <span className="text-slate-600">
                of products analyzed ({prevalence.count.toLocaleString()} of {totalProducts.toLocaleString()})
              </span>
            </div>
            <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${isMostCommon ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(prevalence.percentage, 100)}%` }}
              />
            </div>
            <p className={`text-sm mt-3 ${isMostCommon ? 'text-amber-700' : 'text-blue-700'}`}>
              {isMostCommon ? (
                <>
                  <span className="font-semibold">⭐ This is one of the top 5 most common additives</span> found in Norwegian grocery stores. You&apos;ll find it in everyday products like instant noodles, sauces, and seasoning mixes.
                </>
              ) : isCommon ? (
                <>
                  <span className="font-semibold">This additive appears regularly</span> in Norwegian products, especially in certain categories like {code === 'E250' || code === 'E251' ? 'processed meats' : 'packaged foods'}..
                </>
              ) : (
                <>
                  <span className="font-semibold">This is a less common additive</span> in Norwegian products. You&apos;ll mostly find it in specialized or imported foods.
                </>
              )}
            </p>
          </div>
          {isMostCommon && (
            <div className="mt-4 p-3 bg-amber-100 rounded border border-amber-300 flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Check the <a href="/most-avoided" className="font-semibold hover:underline">full additive analysis</a> to see how {code} ranks compared to other E-numbers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
