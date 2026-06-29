#!/usr/bin/env node
// Generates Concept 2 ("Accent dot") native splash PNGs at every required size.
// Renders full-bleed HTML via headless Chrome with Satoshi embedded (offline).
// Writes to .splashtmp/out/ first for review; copying into place is a separate step.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const outDir = join(root, '.splashtmp/out');
mkdirSync(outDir, { recursive: true });

const fontB64 = readFileSync(join(root, 'public/fonts/satoshi/Satoshi-Variable.woff2')).toString('base64');

// Concept 2 — Accent dot
const BG = '#efe9e0';
const INK = '#1f3a16';
const DOT = '#4a8c5c';
const TAG = '#9a8e7c';

function pageHTML(w, h) {
  const vmin = Math.min(w, h);
  const word = Math.round(vmin * 0.155);
  const tag = Math.max(11, Math.round(vmin * 0.034));
  const gap = Math.round(vmin * 0.05);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
@font-face{font-family:"Satoshi";src:url(data:font/woff2;base64,${fontB64}) format("woff2");font-weight:300 900;font-style:normal;font-display:block;}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
.s{width:${w}px;height:${h}px;background:${BG};display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:"Satoshi",sans-serif}
.word{font-weight:700;letter-spacing:-.035em;line-height:1;color:${INK};font-size:${word}px}
.dot{color:${DOT}}
.tag{font-weight:500;color:${TAG};font-size:${tag}px;margin-top:${gap}px;letter-spacing:.005em}
</style></head><body>
<div class="s"><div class="word">skaren<span class="dot">.</span></div>
<div class="tag">Scan smarter. Live cleaner.</div></div>
</body></html>`;
}

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function render(w, h, outPath) {
  return new Promise((resolve) => {
    const tmpHtml = join(outDir, `_r_${w}x${h}.html`);
    writeFileSync(tmpHtml, pageHTML(w, h));
    if (existsSync(outPath)) rmSync(outPath);
    const profile = join(root, '.splashtmp/profile');
    const args = [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
      '--no-first-run', '--no-default-browser-check', '--disable-extensions',
      '--disable-background-networking', '--disable-sync', '--disable-translate',
      '--force-device-scale-factor=1', `--window-size=${w},${h}`,
      '--default-background-color=00000000',
      '--virtual-time-budget=600',
      `--user-data-dir=${profile}`,
      `--screenshot=${outPath}`,
      `file://${tmpHtml}`,
    ];
    const p = spawn(chrome, args, { stdio: 'ignore' });
    // poll for output then kill
    const start = Date.now();
    const iv = setInterval(() => {
      const done = existsSync(outPath) && statSync(outPath).size > 0;
      if (done || Date.now() - start > 12000) {
        clearInterval(iv);
        try { p.kill('SIGKILL'); } catch {}
        setTimeout(() => resolve(existsSync(outPath)), 300);
      }
    }, 200);
  });
}

const targets = [
  // iOS (square, 3 identical)
  { w: 2732, h: 2732, out: 'ios-splash-2732.png' },
  // Android portrait
  { w: 320, h: 480, out: 'and-port-mdpi.png' },
  { w: 480, h: 800, out: 'and-port-hdpi.png' },
  { w: 720, h: 1280, out: 'and-port-xhdpi.png' },
  { w: 960, h: 1600, out: 'and-port-xxhdpi.png' },
  { w: 1280, h: 1920, out: 'and-port-xxxhdpi.png' },
  // Android landscape
  { w: 480, h: 320, out: 'and-land-mdpi.png' },
  { w: 800, h: 480, out: 'and-land-hdpi.png' },
  { w: 1280, h: 720, out: 'and-land-xhdpi.png' },
  { w: 1600, h: 960, out: 'and-land-xxhdpi.png' },
  { w: 1920, h: 1280, out: 'and-land-xxxhdpi.png' },
  // Android default drawable (480x320 landscape)
  { w: 480, h: 320, out: 'and-default.png' },
];

for (const t of targets) {
  const ok = await render(t.w, t.h, join(outDir, t.out));
  console.log((ok ? 'OK  ' : 'FAIL') + ` ${t.w}x${t.h} -> ${t.out}`);
}
console.log('done');
