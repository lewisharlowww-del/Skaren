'use client'

import { useEffect, useState } from 'react'
import { Merk } from '@/components/Merk'

/**
 * SkarenLoader — the splash / full-screen load state.
 *
 * Per the redesign spec, loading is never a spinner: Merk reads the label while
 * you wait. The wordmark sits in JetBrains Mono, and a barcode-style row of bars
 * pulses beneath instead of a circular indicator.
 */
export function SkarenLoader({ message }: { message?: string }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => (t + 1) % 100), 90)
    return () => clearInterval(timer)
  }, [])

  // Barcode row: bar opacities sweep left→right like a scan.
  const bars = [3, 2, 4, 2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 2]

  return (
    <div
      className="sk-loader-screen"
      style={{
        height: '100dvh',
        background: 'var(--sk-brand-mist)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 26,
        fontFamily: 'var(--sk-font-ui)',
      }}
    >
      <Merk expression="scanning" size={168} aria-label="Skaren" />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <p
          style={{
            fontFamily: 'var(--sk-font-data)',
            fontSize: 11,
            color: 'var(--sk-brand-forest)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          SKAREN
        </p>

        {/* Barcode loading row — bars, never a circle. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 20 }} aria-hidden>
          {bars.map((w, i) => {
            const phase = (tick + i * 6) % 100
            const lit = phase < 50
            return (
              <span
                key={i}
                style={{
                  width: w,
                  height: 20,
                  borderRadius: 0.5,
                  background: 'var(--sk-brand-forest)',
                  opacity: lit ? 1 : 0.28,
                  transition: 'opacity 220ms ease-out',
                }}
              />
            )
          })}
        </div>

        {message ? (
          <p style={{ fontSize: 12.5, color: 'var(--sk-text-muted)', marginTop: 2 }}>
            {message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
