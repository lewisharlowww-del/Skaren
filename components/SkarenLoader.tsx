'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

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
        background: '#faf7f2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        fontFamily: 'Manrope, sans-serif',
      }}
    >
      <Image
        src="/skaren-logo.png?v=2"
        alt="Skaren"
        width={120}
        height={120}
        unoptimized
        style={{
          animation: 'pulse 2s ease-in-out infinite',
          borderRadius: 28,
        }}
      />
      <p style={{
        fontSize: 13,
        fontWeight: 800,
        color: '#2d4a26',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}>
        SKAREN
      </p>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d4a26', animation: 'dotsA 1.4s ease-in-out infinite' }} />
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4a8c5c', animation: 'dotsB 1.4s ease-in-out infinite' }} />
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#88bb88', animation: 'dotsC 1.4s ease-in-out infinite' }} />
      </div>
      <p style={{ fontSize: 12, color: '#b0a898', fontWeight: 500 }}>
        {message}{'.'.repeat(dot)}
      </p>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.94); }
        }
        @keyframes dotsA { 0%, 100% { opacity: 0.3; } 33% { opacity: 1; } }
        @keyframes dotsB { 0%, 33% { opacity: 0.3; } 66% { opacity: 1; } 100% { opacity: 0.3; } }
        @keyframes dotsC { 0%, 66% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  )
}
