'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { useScans } from '@/hooks/useScans'
import { useUser } from '@/hooks/useUser'
import { t } from '@/lib/i18n'
import { useLang } from '@/lib/language-context'
import { getUserPremiumStatus } from '@/lib/premium'
import { supabase } from '@/lib/supabase'
import type { GradeLetter, ScanRecord } from '@/lib/types'

// ── Types & constants ─────────────────────────────────────────────────────────

type Grade = GradeLetter

type Filter = 'all' | 'today' | 'week' | 'ab'

const FILTER_KEYS: { key: Filter; translationKey: 'history_filter_all' | 'history_filter_today' | 'history_filter_week' | 'history_filter_ab' }[] = [
  { key: 'all',   translationKey: 'history_filter_all' },
  { key: 'today', translationKey: 'history_filter_today' },
  { key: 'week',  translationKey: 'history_filter_week' },
  { key: 'ab',    translationKey: 'history_filter_ab' },
]

const GRADE_STYLES: Record<Grade, { bg: string; color: string }> = {
  A: { bg: '#ddeedd', color: '#2a5030' },
  B: { bg: '#e8f0dc', color: '#486020' },
  C: { bg: '#f0e8d0', color: '#706030' },
  D: { bg: '#ece0d4', color: '#704830' },
  E: { bg: '#e8d8d4', color: '#703030' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreToGrade(score: number): Grade {
  if (score >= 80) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  if (score >= 20) return 'D'
  return 'E'
}

function getHealthGrade(scan: ScanRecord): Grade {
  return scan.health_grade ?? scoreToGrade(scan.ecoscan_score)
}

function getEcoGrade(scan: ScanRecord): Grade {
  if (scan.environmental_grade) return scan.environmental_grade
  const eco = scan.eco_score_grade
  if (eco && eco !== 'unknown') return eco.toUpperCase() as Grade
  return scoreToGrade(scan.ecoscan_score)
}

function getDateLabel(dateStr: string, todayLabel: string, yesterdayLabel: string): string {
  const scanDate = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (scanDate.toDateString() === today.toDateString()) return todayLabel
  if (scanDate.toDateString() === yesterday.toDateString()) return yesterdayLabel

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (scanDate >= weekAgo) {
    return scanDate
      .toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })
      .toUpperCase()
  }
  return scanDate
    .toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase()
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateStr))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: Grade }) {
  const s = GRADE_STYLES[grade]
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black"
      style={{ background: s.bg, color: s.color }}
    >
      {grade}
    </span>
  )
}

function ScanRow({ scan, isLast }: { scan: ScanRecord; isLast: boolean }) {
  const healthGrade = getHealthGrade(scan)
  const ecoGrade = getEcoGrade(scan)
  const time = formatTime(scan.created_at)
  const initial = (scan.product_name ?? '?')[0].toUpperCase()

  return (
    <Link
      href={`/product/${scan.barcode}`}
      className={`flex items-center gap-3 px-4 py-3.5 active:bg-[#f7f2ea] transition-colors ${
        !isLast ? 'border-b border-[#f0ebe0]' : ''
      }`}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl bg-[#eaf3de] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {scan.product_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={scan.product_image}
            alt={scan.product_name}
            className="w-full h-full object-contain p-0.5"
            loading="lazy"
          />
        ) : (
          <span className="text-[15px] font-black text-[#2d4a26]">{initial}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-[#2d4a26] truncate leading-tight">
          {scan.product_name}
        </p>
        <p className="text-[11px] text-[#9a8e7e] mt-0.5">
          {scan.brand ?? scan.barcode}
        </p>
      </div>

      {/* Grades + time */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex gap-1.5">
          <GradeBadge grade={healthGrade} />
          <GradeBadge grade={ecoGrade} />
        </div>
        <span className="text-[10px] text-[#b0a090]">{time}</span>
      </div>
    </Link>
  )
}

function SkeletonGroup() {
  return (
    <div>
      <div className="h-3 w-16 rounded bg-[#e0d8cc] mb-2 mx-1 animate-pulse" />
      <div className="bg-white rounded-2xl border border-[#e0d8cc] overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3.5 animate-pulse ${i < 3 ? 'border-b border-[#f0ebe0]' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#eaf3de] flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-36 rounded bg-[#e8e2d8]" />
              <div className="h-2.5 w-20 rounded bg-[#eaf3de]" />
            </div>
            <div className="flex gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#e8e2d8]" />
              <div className="w-7 h-7 rounded-lg bg-[#eaf3de]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const router = useRouter()
  const { lang } = useLang()
  const { user, loading: userLoading, isConfigured } = useUser()
  const { scans, loading: scansLoading } = useScans(user)
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    if (!userLoading && (!isConfigured || !user)) {
      router.push('/login?next=%2Fhistory')
    }
  }, [isConfigured, router, user, userLoading])

  useEffect(() => {
    if (!user || !supabase) return
    getUserPremiumStatus(supabase)
      .then((premium) => setIsPremium(premium))
      .catch(() => setIsPremium(false))
  }, [user])

  const loading = userLoading || scansLoading

  // Free users see only the last 30 days
  const displayScans = useMemo(() => {
    if (isPremium) return scans
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return scans.filter((s) => new Date(s.created_at ?? '') >= cutoff)
  }, [scans, isPremium])

  const monthlyCount = useMemo(() => {
    const now = new Date()
    return displayScans.filter((s) => {
      const d = new Date(s.created_at ?? '')
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  }, [displayScans])

  const filteredScans = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    if (activeFilter === 'today') {
      return displayScans.filter((s) => new Date(s.created_at ?? '') >= startOfToday)
    }
    if (activeFilter === 'week') {
      return displayScans.filter((s) => new Date(s.created_at ?? '') >= startOfWeek)
    }
    if (activeFilter === 'ab') {
      return displayScans.filter((s) => {
        const g = getHealthGrade(s)
        return g === 'A' || g === 'B'
      })
    }
    return displayScans
  }, [displayScans, activeFilter])

  const groupedScans = useMemo(() => {
    const todayLabel = t('history_today', lang)
    const yesterdayLabel = t('history_yesterday', lang)
    const map = new Map<string, ScanRecord[]>()
    for (const scan of filteredScans) {
      const label = getDateLabel(scan.created_at ?? '', todayLabel, yesterdayLabel)
      if (!map.has(label)) map.set(label, [])
      map.get(label)!.push(scan)
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, scans: items }))
  }, [filteredScans, lang])

  return (
    <>
      <BottomNav />
      <main className="mx-auto w-full max-w-[430px] overflow-x-hidden pb-32 pt-4 sm:max-w-lg sm:pt-8" style={{ background: "#faf7f2", minHeight: "100dvh" }}>
        {/* Page title */}
        <div className="px-5 pb-3">
          <h1
            className="text-[28px] font-black text-[#2d4a26] tracking-tight"
            style={{ fontFamily: 'Satoshi, sans-serif' }}
          >
            {t('history_title', lang)}
          </h1>
          {!loading && (
            <p className="text-[12px] text-[#9a8e7e] mt-0.5" style={{ fontFamily: "Manrope, sans-serif" }}>
              {monthlyCount > 0
                ? `${monthlyCount} ${t('history_scans_this_month', lang)}`
                : t('history_no_scans_this_month', lang)}
            </p>
          )}
          {loading && <div className="mt-1 h-3 w-32 rounded bg-[#e8e2d8] animate-pulse" />}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTER_KEYS.map(({ key, translationKey }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors whitespace-nowrap flex-shrink-0 ${
                activeFilter === key
                  ? 'bg-[#2d4a26] text-[#dceedd] border-[#2d4a26]'
                  : 'bg-white text-[#9a8e7e] border-[#e0d8cc]'
              }`}
            >
              {t(translationKey, lang)}
            </button>
          ))}
        </div>

        {/* Free-tier history limit banner */}
        {!loading && !isPremium && scans.length > displayScans.length && (
          <Link
            href="/pricing"
            className="mx-4 mb-2 flex items-center gap-3 rounded-2xl border border-[#e8d080] bg-[#fff8e6] px-4 py-3"
          >
            <Crown className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[12px] text-[#9a7830] flex-1">
              <span className="font-bold text-[#7a5800]">Last 30 days shown.</span>
              {' '}{scans.length - displayScans.length} older scan{scans.length - displayScans.length === 1 ? '' : 's'} hidden — upgrade to Pro for full history.
            </p>
          </Link>
        )}

        {/* Content */}
        <div className="px-4 flex flex-col gap-5">
          {loading ? (
            <>
              <SkeletonGroup />
              <SkeletonGroup />
            </>
          ) : groupedScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-5xl">🌿</span>
              <p className="text-[15px] font-bold text-[#2d4a26]">{t('history_no_scans', lang)}</p>
              <p className="text-[13px] text-[#9a8e7e] max-w-[240px]">
                {activeFilter === 'all'
                  ? t('history_no_scans_sub', lang)
                  : t('history_filter_hint', lang)}
              </p>
            </div>
          ) : (
            groupedScans.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-bold uppercase mb-2 px-1" style={{ color: "#9a8e7e", letterSpacing: "0.1em", fontFamily: "Manrope, sans-serif" }}>
                  {group.label}
                </p>
                <div className="bg-white rounded-2xl border border-[#e0d8cc] overflow-hidden">
                  {group.scans.map((scan, i) => (
                    <ScanRow
                      key={scan.id ?? `${scan.barcode}-${scan.created_at}`}
                      scan={scan}
                      isLast={i === group.scans.length - 1}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}
