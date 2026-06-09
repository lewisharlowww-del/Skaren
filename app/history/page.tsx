'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Crown, Ellipsis, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { SkarenLoader } from '@/components/SkarenLoader'
import { useScans } from '@/hooks/useScans'
import { useUser } from '@/hooks/useUser'
import { t } from '@/lib/i18n'
import { useLang } from '@/lib/language-context'
import { getUserPremiumStatus } from '@/lib/premium'
import { readLocalProduct } from '@/lib/localProducts'
import { supabase } from '@/lib/supabase'
import type { GradeLetter, ScanRecord } from '@/lib/types'

// ── Types & constants ─────────────────────────────────────────────────────────

type Grade = GradeLetter

type Filter = 'all' | 'today' | 'week' | 'ab'

type CollapsedScan = {
  scan: ScanRecord
  count: number
}

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

function getEcoGrade(scan: ScanRecord): Grade | null {
  if (scan.environmental_grade) return scan.environmental_grade
  const eco = scan.eco_score_grade
  if (eco && eco !== 'unknown') return eco.toUpperCase() as Grade
  return null
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

function GradeBadge({
  grade,
  label,
}: {
  grade: Grade
  label: string
}) {
  const s = GRADE_STYLES[grade]
  return (
    <span
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-black leading-none"
      style={{ background: s.bg, color: s.color }}
      aria-label={`${label}: ${grade}`}
      title={`${label}: ${grade}`}
    >
      {grade}
    </span>
  )
}

function ScanRow({
  item,
  isLast,
  lang,
}: {
  item: CollapsedScan
  isLast: boolean
  lang: 'no' | 'en'
}) {
  const { scan, count } = item
  const healthGrade = getHealthGrade(scan)
  const ecoGrade = getEcoGrade(scan)
  const time = formatTime(scan.created_at)
  const initial = (scan.product_name ?? '?')[0].toUpperCase()
  const image = scan.product_image ?? readLocalProduct(scan.barcode)?.displayImage ?? null

  return (
    <Link
      href={`/product/${scan.barcode}`}
      className={`flex items-center gap-3 px-4 py-3.5 active:bg-[#f7f2ea] transition-colors ${
        !isLast ? 'border-b border-[#f0ebe0]' : ''
      }`}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl bg-[#eaf3de] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
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
        <p className="text-[12px] text-[#9a8e7e] mt-0.5">
          {scan.brand ?? scan.barcode}
        </p>
      </div>

      {/* Grades + time */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex gap-1.5">
          <GradeBadge
            grade={healthGrade}
            label={t('product_health', lang)}
          />
          {ecoGrade ? (
            <GradeBadge
              grade={ecoGrade}
              label={t('product_eco', lang)}
            />
          ) : null}
        </div>
        <span className="text-[12px] text-[var(--sk-text-secondary)]">
          {count > 1 ? `${count} ${lang === 'no' ? 'visninger' : 'views'} · ` : ''}
          {time}
        </span>
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
  const { scans, loading: scansLoading, clearHistory } = useScans(user)
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [isPremium, setIsPremium] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!menuOpen) return

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

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
    const map = new Map<string, CollapsedScan[]>()
    for (const scan of filteredScans) {
      const label = getDateLabel(scan.created_at ?? '', todayLabel, yesterdayLabel)
      if (!map.has(label)) map.set(label, [])
      const group = map.get(label)!
      const existing = group.find((item) => item.scan.barcode === scan.barcode)
      if (existing) {
        existing.count += 1
      } else {
        group.push({ scan, count: 1 })
      }
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, scans: items }))
  }, [filteredScans, lang])

  async function handleClearHistory() {
    setClearing(true)
    setClearError(false)
    const cleared = await clearHistory()
    setClearing(false)

    if (cleared) {
      setConfirmClear(false)
      setMenuOpen(false)
      return
    }
    setClearError(true)
  }

  if (loading) return <SkarenLoader message="Loading history" />

  return (
    <div className="min-h-screen bg-[var(--sk-brand-mist)]">
      <BottomNav />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-36 bg-gradient-to-t from-[var(--sk-brand-mist)] via-[var(--sk-brand-mist)]/85 to-transparent sm:hidden" />
      <main className="mx-auto min-h-screen w-full max-w-[430px] overflow-x-hidden bg-[var(--sk-brand-mist)] pb-48 pt-safe sm:max-w-lg sm:pb-32">
        {/* Page title */}
        <div className="flex items-start justify-between gap-4 px-5 pb-3">
          <div>
            <h1
              className="text-[28px] font-black text-[#2d4a26] tracking-tight"
              style={{ fontFamily: 'Satoshi, sans-serif' }}
            >
              {t('history_title', lang)}
            </h1>
            <p className="text-[12px] text-[#9a8e7e] mt-0.5" style={{ fontFamily: "Manrope, sans-serif" }}>
              {monthlyCount > 0
                ? `${monthlyCount} ${lang === 'no' ? 'produktvisninger denne måneden' : 'product views this month'}`
                : lang === 'no'
                  ? 'Ingen produktvisninger denne måneden'
                  : 'No product views yet this month'}
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-[#e0d8cc] bg-white text-[#2d4a26]"
              aria-label={t('history_options', lang)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <Ellipsis className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-[#e0d8cc] bg-white p-1.5 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={scans.length === 0}
                  onClick={() => {
                    setMenuOpen(false)
                    setConfirmClear(true)
                  }}
                  className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-semibold text-[#9a2a1a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('history_clear', lang)}
                </button>
              </div>
            ) : null}
          </div>
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
          {groupedScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-5xl">🌿</span>
              <p className="text-[15px] font-bold text-[#2d4a26]">
                {lang === 'no' ? 'Ingen produktvisninger funnet' : 'No product views found'}
              </p>
              <p className="text-[13px] text-[#9a8e7e] max-w-[240px]">
                {activeFilter === 'all'
                  ? lang === 'no'
                    ? 'Skann eller søk etter produkter for å bygge historikken.'
                    : 'Scan or search for products to build your history.'
                  : t('history_filter_hint', lang)}
              </p>
            </div>
          ) : (
            groupedScans.map((group) => (
              <section key={group.label} aria-labelledby={`history-${group.label.replace(/\W+/g, '-').toLowerCase()}`}>
                <div className="sticky top-0 z-20 -mx-1 mb-2 bg-[var(--sk-brand-mist)]/95 px-2 py-2 backdrop-blur-md">
                  <h2
                    id={`history-${group.label.replace(/\W+/g, '-').toLowerCase()}`}
                    className="text-[12px] font-bold uppercase"
                    style={{ color: "var(--sk-text-muted)", letterSpacing: "0.12em", fontFamily: "Manrope, sans-serif" }}
                  >
                    {group.label}
                  </h2>
                </div>
                <div className="bg-white rounded-2xl border border-[#e0d8cc] overflow-hidden">
                  {group.scans.map((item, i) => (
                    <ScanRow
                      key={item.scan.id ?? `${item.scan.barcode}-${item.scan.created_at}`}
                      item={item}
                      isLast={i === group.scans.length - 1}
                      lang={lang}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {confirmClear ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/30 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !clearing) setConfirmClear(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-history-title"
            className="w-full max-w-sm rounded-2xl border border-[#e0d8cc] bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="clear-history-title" className="text-[20px] font-bold text-[#1e1e18]">
                  {t('history_clear_title', lang)}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-[#7f7466]">
                  {t('history_clear_body', lang)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f0e8] text-[#5a4a38]"
                aria-label={t('cancel', lang)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {clearError ? (
              <p className="mt-3 rounded-lg bg-[#fdf0f0] px-3 py-2 text-[12px] text-[#9a2a1a]">
                {t('history_clear_failed', lang)}
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="focus-ring rounded-xl border border-[#e0d8cc] px-4 py-3 text-[13px] font-semibold text-[#5a4a38]"
              >
                {t('cancel', lang)}
              </button>
              <button
                type="button"
                onClick={() => void handleClearHistory()}
                disabled={clearing}
                className="focus-ring rounded-xl bg-[#9a2a1a] px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {clearing ? t('loading', lang) : t('history_clear_confirm', lang)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
