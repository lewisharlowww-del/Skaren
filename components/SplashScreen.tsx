'use client';

import { useEffect, useRef, useState } from 'react';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const [showScan, setShowScan] = useState(false);
  const [showWordmark, setShowWordmark] = useState(false);
  const [showUnderline, setShowUnderline] = useState(false);
  const [tagline, setTagline] = useState('');

  useEffect(() => {
    setTimeout(() => setShowScan(true), 300);
    setTimeout(() => { setShowWordmark(true); setTimeout(() => setShowUnderline(true), 300); }, 900);
    setTimeout(() => {
      const text = 'Scan smarter. Live cleaner.';
      let i = 0;
      const iv = setInterval(() => {
        setTagline(text.slice(0, ++i));
        if (i >= text.length) clearInterval(iv);
      }, 55);
    }, 1500);
    setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 600);
    }, 3200);
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const c = ctx;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width, H = canvas.height;

    const pts = Array.from({ length: 35 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      a: Math.random() * 0.3 + 0.12,
      warm: Math.random() > 0.55,
    }));

    let raf: number;
    function draw() {
      c.fillStyle = '#e8e0d4';
      c.fillRect(0, 0, W, H);

      c.strokeStyle = 'rgba(29,74,38,0.04)';
      c.lineWidth = 0.5;
      for (let x = 0; x < W; x += 22) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }

      const vg = c.createRadialGradient(W/2, H/2, H*.1, W/2, H/2, H*.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.07)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);

      const cg = c.createRadialGradient(W/2, H*.42, 0, W/2, H*.42, W*.4);
      cg.addColorStop(0, 'rgba(74,140,92,0.09)');
      cg.addColorStop(1, 'rgba(74,140,92,0)');
      c.fillStyle = cg; c.fillRect(0, 0, W, H);

      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fillStyle = p.warm ? `rgba(154,142,126,${p.a})` : `rgba(29,74,38,${p.a})`;
        c.fill();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.6s ease',
      pointerEvents: visible ? 'all' : 'none',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <div style={{
          width: '160px', height: '160px', borderRadius: '50%',
          border: '1.5px solid rgba(29,74,38,0.22)',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '28px',
          opacity: showScan ? 1 : 0, transition: 'opacity 0.7s ease',
        }}>
          <div style={{
            width: '62%', height: '62%', borderRadius: '50%',
            border: '1px solid rgba(29,74,38,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%', background: '#4a8c5c',
              animation: 'skarenShimmer 2s ease-in-out infinite',
            }} />
          </div>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '1.5px',
            background: 'linear-gradient(90deg,transparent,rgba(74,140,92,0.9),transparent)',
            animation: 'skarenScan 2.2s ease-in-out infinite',
          }} />
        </div>

        <div style={{ opacity: showWordmark ? 1 : 0, transition: 'opacity 1s ease' }}>
          <div style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '26px', fontWeight: 800,
            color: '#1a2e18', letterSpacing: '0.26em', textTransform: 'uppercase',
          }}>
            SKAREN
          </div>
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg,transparent,#4a8c5c,transparent)',
            width: showUnderline ? '100%' : '0',
            transition: 'width 1s ease',
            marginTop: '4px',
          }} />
        </div>

        <div style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '8px',
          color: '#9a8e7e', letterSpacing: '0.22em', textTransform: 'uppercase',
          marginTop: '14px', minHeight: '14px',
          opacity: tagline ? 1 : 0, transition: 'opacity 0.8s ease',
        }}>
          {tagline}
        </div>
      </div>

      <style>{`
        @keyframes skarenShimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes skarenScan { 0%{top:15%} 100%{top:85%} }
      `}</style>
    </div>
  );
}
