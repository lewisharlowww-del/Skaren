'use client'

import { useEffect, useState } from 'react'
import { AppSplash } from '@/components/AppSplash'

/**
 * BootSplash — plays the animated 19A splash once, over everything, at app
 * launch, then fades out and reveals the app.
 *
 * iOS launch screens are a static image (they cannot animate). This overlay
 * takes over the moment the web layer is alive, so the sequence the user sees
 * is: static launch image (dark, assembled Merk) → this animation seamlessly
 * continues it → fade to the app.
 *
 * Shows once per cold launch: a sessionStorage flag stops it replaying on
 * client-side navigation or React remounts within the same session.
 */
const HOLD_MS = 2000 // let the ~1.9s assemble sequence finish
const FADE_MS = 420
const SEEN_KEY = 'skaren:boot-splash-shown'

export function BootSplash() {
  const [phase, setPhase] = useState<'hidden' | 'showing' | 'fading'>('hidden')

  useEffect(() => {
    // Only on a true cold launch, and never during SSR.
    let alreadyShown = false
    try {
      alreadyShown = sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
      /* private mode / storage blocked — just show it */
    }
    if (alreadyShown) return

    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }

    setPhase('showing')
    // Hide the native iOS splash so our animation is visible beneath it.
    hideNativeSplash()

    const fadeTimer = setTimeout(() => setPhase('fading'), HOLD_MS)
    const doneTimer = setTimeout(() => setPhase('hidden'), HOLD_MS + FADE_MS)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  if (phase === 'hidden') return null

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        opacity: phase === 'fading' ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      <AppSplash />
    </div>
  )
}

// Dismiss the Capacitor native SplashScreen (no-op on web). Dynamically
// imported so the web bundle never hard-depends on the native plugin.
async function hideNativeSplash() {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor?.isNativePlatform?.()) return
    const mod = await import('@capacitor/splash-screen')
    await mod.SplashScreen.hide()
  } catch {
    /* plugin absent or web context — ignore */
  }
}
