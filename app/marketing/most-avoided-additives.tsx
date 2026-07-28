'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface Additive {
  code: string;
  name: string;
  count: number;
  percentage: string;
  category: string;
  safety: 'safe' | 'moderate' | 'avoid';
  why?: string;
}

interface Summary {
  totalProductsAnalyzed: number;
  uniqueAdditivesFound: number;
  stats: {
    safe: number;
    moderate: number;
    avoid: number;
  };
  mostCommon: Additive & { foundInProducts: string };
  topTenToAvoid: Additive[];
  topTenCommon: Additive[];
  keyInsights: Array<{
    title: string;
    description: string;
  }>;
}

const safetyColors = {
  safe: 'bg-green-50 border-green-200',
  moderate: 'bg-amber-50 border-amber-200',
  avoid: 'bg-red-50 border-red-200',
};

const safetyIcons = {
  safe: <CheckCircle className="w-5 h-5 text-green-600" />,
  moderate: <AlertCircle className="w-5 h-5 text-amber-600" />,
  avoid: <AlertCircle className="w-5 h-5 text-red-600" />,
};

const safetyLabels = {
  safe: 'Safe',
  moderate: 'Moderate',
  avoid: 'Avoid',
};

export default function MostAvoidedAdditivesPage({ data }: { data: Summary }) {
  const [activeTab, setActiveTab] = useState<'insights' | 'toavoid' | 'common'>('insights');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                What's Really in Norwegian Products?
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl">
                We analyzed {data.totalProductsAnalyzed.toLocaleString()} products from Norwegian grocery
                stores. Here's what we found.
              </p>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-4xl font-bold text-blue-600">{data.uniqueAdditivesFound}</div>
              <div className="text-sm text-slate-600">unique E-numbers found</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${safetyColors.safe}`}>
              <div className="flex items-center gap-2 mb-2">
                {safetyIcons.safe}
                <span className="font-semibold text-green-900">Safe</span>
              </div>
              <div className="text-2xl font-bold text-green-700">{data.stats.safe}</div>
              <div className="text-sm text-green-600">additives are safe</div>
            </div>

            <div className={`p-4 rounded-lg border ${safetyColors.moderate}`}>
              <div className="flex items-center gap-2 mb-2">
                {safetyIcons.moderate}
                <span className="font-semibold text-amber-900">Moderate</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{data.stats.moderate}</div>
              <div className="text-sm text-amber-600">to be aware of</div>
            </div>

            <div className={`p-4 rounded-lg border ${safetyColors.avoid}`}>
              <div className="flex items-center gap-2 mb-2">
                {safetyIcons.avoid}
                <span className="font-semibold text-red-900">Avoid</span>
              </div>
              <div className="text-2xl font-bold text-red-700">{data.stats.avoid}</div>
              <div className="text-sm text-red-600">to minimize</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-200">
          {(['insights', 'toavoid', 'common'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'insights' && '💡 Key Insights'}
              {tab === 'toavoid' && '❌ Most Problematic'}
              {tab === 'common' && '📊 Most Common'}
            </button>
          ))}
        </div>

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.keyInsights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition"
              >
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{insight.title}</h3>
                <p className="text-slate-600">{insight.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* To Avoid Tab */}
        {activeTab === 'toavoid' && (
          <div className="space-y-4">
            <div className={`p-6 rounded-lg border-2 ${safetyColors.avoid} mb-6`}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Top Additives to Minimize</h3>
                  <p className="text-red-800 text-sm">
                    These additives are rated as "avoid" and should be limited in your diet.
                  </p>
                </div>
              </div>
            </div>

            {data.topTenToAvoid.map((additive, idx) => (
              <Link href={`/additives/${additive.code}`} key={additive.code}>
                <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md hover:border-red-300 transition cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl font-bold text-red-600 min-w-fit">{idx + 1}.</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900">{additive.code}</h3>
                        <p className="text-slate-600">{additive.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{additive.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{additive.percentage}%</div>
                      <div className="text-xs text-slate-500">
                        {additive.count.toLocaleString()} products
                      </div>
                    </div>
                  </div>
                  {additive.why && (
                    <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
                      <span className="font-semibold">Why avoid:</span> {additive.why}
                    </p>
                  )}
                  <div className="flex items-center justify-end mt-3 text-blue-600 text-sm font-medium">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Common Tab */}
        {activeTab === 'common' && (
          <div className="space-y-4">
            <div className={`p-6 rounded-lg border-2 border-blue-200 bg-blue-50 mb-6`}>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Most Common Additives</h3>
                  <p className="text-blue-800 text-sm">
                    These E-numbers appear in the most Norwegian products. Many are safe, but it's
                    good to know what you're consuming.
                  </p>
                </div>
              </div>
            </div>

            {data.topTenCommon.map((additive, idx) => (
              <Link href={`/additives/${additive.code}`} key={additive.code}>
                <div className={`rounded-lg border p-6 hover:shadow-md transition cursor-pointer ${safetyColors[additive.safety]}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl font-bold text-blue-600 min-w-fit">{idx + 1}.</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-slate-900">{additive.code}</h3>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded ${
                              additive.safety === 'safe'
                                ? 'bg-green-100 text-green-700'
                                : additive.safety === 'moderate'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {safetyLabels[additive.safety]}
                          </span>
                        </div>
                        <p className="text-slate-600">{additive.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{additive.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{additive.percentage}%</div>
                      <div className="text-xs text-slate-500">
                        {additive.count.toLocaleString()} products
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end text-blue-600 text-sm font-medium">
                    Learn more <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Download Skaren & Start Scanning</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            See which E-numbers are in your products instantly. Get personalized recommendations based
            on your health preferences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://apps.apple.com/no/app/skaren/id1234567890">
              <button className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition">
                Download iOS App
              </button>
            </Link>
            <button className="bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-400 transition">
              Join Android Waitlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
