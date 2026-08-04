'use client'

import { useEffect, useState } from 'react'
import { Merk } from '@/components/Merk'

export function SkarenLoader({ message = 'Loading' }: { message?: string }) {
  const [dot, setDot] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setDot(d => (d + 1) % 4), 450)
    return () => clearInterval(timer)
  }, [])
  return (
    <div
      className="sk-loader-screen"
      style={{
        height: '100dvh',
        background: '#F6F3EC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 22,
        fontFamily: 'var(--font-dm-sans), sans-serif',
      }}
    >
      <Merk expression="scanning" size={190} aria-label="Skaren" />
      <p style={{
        fontSize: 13,
        fontWeight: 800,
        color: '#33684A',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        marginTop: 4,
      }}>
        SKAREN
      </p>
      <p style={{ fontSize: 12, color: '#b0a898', fontWeight: 500, marginTop: -8 }}>
        {message}{'.'.repeat(dot)}
      </p>
    </div>
  )
}
