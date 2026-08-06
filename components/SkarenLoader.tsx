'use client'

/**
 * SkarenLoader — the splash / full-screen load state (design 19A).
 *
 * Merk assembles himself, reads his own barcode, then hands you the app:
 * the receipt body rises, the folded corner flips down with two sparks, the
 * eyes blink and dart, a smile appears, a green equalizer pulses in his belly
 * and a scan line sweeps him — then the SKAREN wordmark and tagline settle in.
 * A ~1.6s sequence that then holds. Never a spinner.
 *
 * The whole animation is CSS keyframes so it runs with zero JS and paints on
 * the very first frame (this is also the app's cold-start splash via
 * app/loading.tsx).
 */
export function SkarenLoader({ message }: { message?: string }) {
  // One shared timeline. When used as a brief loader the sequence plays once
  // and holds on the assembled state (no exit fade); the review loop in the
  // design canvas is intentionally dropped for production.
  return (
    <div
      className="sk-loader-screen"
      style={{
        position: 'relative',
        height: '100dvh',
        width: '100%',
        background: '#14120C',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'var(--sk-font-ui)',
      }}
    >
      <style>{SPLASH_KEYFRAMES}</style>

      {/* soft green glow behind Merk */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: 520,
          height: 520,
          marginLeft: -260,
          marginTop: '18%',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(143,191,159,0.22) 0%, rgba(143,191,159,0) 68%)',
          animation: 'sp-glow 1.9s ease-in-out 0s 1 both',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* ── Merk (assembles) ─────────────────────────────────────────── */}
        <div
          aria-label="Skaren"
          role="img"
          style={{
            position: 'relative',
            width: 132,
            height: 153,
            animation: 'sp-body 1.9s cubic-bezier(.2,.85,.25,1) 0s 1 both',
          }}
        >
          {/* paper body */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#F7F4EC',
              borderRadius: '27px 5px 27px 27px',
              boxShadow: '0 14px 36px rgba(0,0,0,0.42)',
              clipPath: 'polygon(0 0, 92px 0, 100% 40px, 100% 100%, 0 100%)',
            }}
          />
          {/* paper texture + sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '27px 5px 27px 27px',
              clipPath: 'polygon(0 0, 92px 0, 100% 40px, 100% 100%, 0 100%)',
              background:
                'repeating-linear-gradient(115deg, rgba(32,29,21,0.027) 0px, rgba(32,29,21,0.027) 2px, rgba(32,29,21,0) 2px, rgba(32,29,21,0) 5px), radial-gradient(120% 90% at 30% 12%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 55%)',
            }}
          />
          {/* folded corner */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: 40,
              height: 40,
              background: 'linear-gradient(225deg, #E6DDCA 0%, #CFC7BB 100%)',
              clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
              transformOrigin: '100% 0',
              filter: 'drop-shadow(-2px 2px 2px rgba(32,29,21,0.16))',
              animation: 'sp-fold 1.9s cubic-bezier(.3,1.3,.5,1) 0s 1 both',
            }}
          />
          {/* sparks */}
          <div
            style={{
              position: 'absolute',
              right: -13,
              top: -9,
              width: 11,
              height: 11,
              background: '#8FBF9F',
              borderRadius: 2.5,
              animation: 'sp-spark 1.9s ease-out 0s 1 both',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 8,
              top: -17,
              width: 6,
              height: 6,
              background: '#8FBF9F',
              borderRadius: 1.5,
              animation: 'sp-spark 1.9s ease-out 140ms 1 both',
            }}
          />
          {/* eyes (blink + dart) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              animation: 'sp-look 1.9s ease-in-out 0s 1 both',
            }}
          >
            <div style={eyeStyle(34)} />
            <div style={eyeStyle(84)} />
          </div>
          {/* smile */}
          <div
            style={{
              position: 'absolute',
              left: 55,
              top: 101,
              width: 21,
              height: 10,
              borderWidth: 3,
              borderStyle: 'solid',
              borderColor: 'transparent transparent #201D15',
              borderRadius: '0 0 13px 13px',
              transformOrigin: 'center center',
              animation: 'sp-mouth 1.9s ease-out 0s 1 both',
            }}
          />
          {/* equalizer belly */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 122,
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              alignItems: 'flex-end',
              height: 18,
            }}
            aria-hidden
          >
            {EQ_BARS.map((b, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: b.h,
                  borderRadius: 2,
                  background: '#33684A',
                  transformOrigin: 'center bottom',
                  animation: `sp-bar 1.9s ease-out ${b.d}ms 1 both`,
                }}
              />
            ))}
          </div>
          {/* scan sweep */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: -16,
              right: -16,
              height: 2,
              background: '#8FBF9F',
              boxShadow: '0 0 18px 4px rgba(143,191,159,0.55)',
              animation: 'sp-sweep 1.9s cubic-bezier(.4,0,.6,1) 0s 1 both',
            }}
          />
        </div>

        {/* ── Wordmark ─────────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 44,
            fontFamily: 'var(--sk-font-brand)',
            fontSize: 40,
            fontWeight: 600,
            letterSpacing: '0.08em',
            lineHeight: 1,
            background: 'linear-gradient(100deg, #5FA07B 0%, #8FBF9F 55%, #B6DCC4 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'sp-word 1.9s cubic-bezier(.2,.85,.25,1) 0s 1 both',
          }}
        >
          SKAREN
        </div>

        {/* ── Tagline ──────────────────────────────────────────────────── */}
        <div
          style={{
            fontFamily: 'var(--sk-font-ui)',
            fontSize: 14,
            letterSpacing: '0.02em',
            color: 'rgba(247,244,236,0.5)',
            marginTop: 13,
            animation: 'sp-tag 1.9s ease-out 0s 1 both',
          }}
        >
          {message ?? 'Skann mat. Spis smartere.'}
        </div>
      </div>

      {/* footer mark */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 'max(34px, env(safe-area-inset-bottom))',
          textAlign: 'center',
          fontFamily: 'var(--sk-font-data)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(247,244,236,0.24)',
          animation: 'sp-tag 1.9s ease-out 0s 1 both',
        }}
      >
        Laget i Norge
      </div>
    </div>
  )
}

function eyeStyle(left: number): React.CSSProperties {
  return {
    position: 'absolute',
    left,
    top: 61,
    width: 13,
    height: 32,
    borderRadius: 999,
    background: '#201D15',
    transformOrigin: 'center center',
    animation: 'sp-eye 1.9s ease-out 0s 1 both',
  }
}

// heights + stagger delays for the equalizer belly (from canvas 19A)
const EQ_BARS = [
  { h: 11, d: 0 },
  { h: 18, d: 75 },
  { h: 8, d: 150 },
  { h: 15, d: 225 },
  { h: 10, d: 375 },
  { h: 17, d: 375 },
  { h: 13, d: 450 },
]

// The design's 5.3s review loop remapped to a single 1.9s intro that holds on
// the assembled state (percentages preserved, exit-fade frames dropped).
const SPLASH_KEYFRAMES = `
@keyframes sp-body {
  0%,10%    { transform: translateY(16px) scale(.86); opacity: 0; }
  31%       { transform: translateY(-3px) scale(1.025); opacity: 1; }
  40%       { transform: translateY(0) scale(1); }
  100%      { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes sp-fold {
  0%,30%    { transform: rotate(-70deg) scale(.3); opacity: 0; }
  44%       { transform: rotate(8deg) scale(1.05); opacity: 1; }
  51%       { transform: rotate(0deg) scale(1); }
  100%      { transform: rotate(-14deg); opacity: 1; }
}
@keyframes sp-eye {
  0%,40%    { transform: scaleY(0); opacity: 0; }
  54%       { transform: scaleY(1.08); opacity: 1; }
  60%       { transform: scaleY(1); }
  100%      { transform: scaleY(1); opacity: 1; }
}
@keyframes sp-look {
  0%,60%    { transform: translateX(0); }
  68%       { transform: translateX(-4px); }
  82%       { transform: translateX(4px); }
  92%       { transform: translateX(2px); }
  100%      { transform: translateX(0); }
}
@keyframes sp-mouth {
  0%,60%    { transform: scaleX(0); opacity: 0; }
  72%,100%  { transform: scaleX(1); opacity: 1; }
}
@keyframes sp-spark {
  0%,62%    { transform: scale(0) rotate(0deg); opacity: 0; }
  70%       { transform: scale(1) rotate(25deg); opacity: 1; }
  86%,100%  { transform: scale(0) rotate(50deg); opacity: 0; }
}
@keyframes sp-bar {
  0%,30%    { transform: scaleY(0); opacity: 0; }
  55%,100%  { transform: scaleY(1); opacity: 1; }
}
@keyframes sp-sweep {
  0%,36%    { top: 4%; opacity: 0; }
  42%       { opacity: 1; }
  62%       { opacity: 1; }
  70%,100%  { top: 96%; opacity: 0; }
}
@keyframes sp-word {
  0%,64%    { transform: translateY(10px); opacity: 0; }
  80%,100%  { transform: translateY(0); opacity: 1; }
}
@keyframes sp-tag {
  0%,74%    { opacity: 0; }
  88%,100%  { opacity: 1; }
}
@keyframes sp-glow {
  0%,36%    { opacity: 0; }
  50%       { opacity: .5; }
  64%       { opacity: .2; }
  68%       { opacity: .65; }
  85%,100%  { opacity: .25; }
}
@media (prefers-reduced-motion: reduce) {
  .sk-loader-screen * { animation: none !important; opacity: 1 !important; transform: none !important; }
}
`
