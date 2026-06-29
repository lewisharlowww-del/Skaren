#!/usr/bin/env node
// Offline render harness: screenshots splash-lab.html with Satoshi embedded.
// Usage: node scripts/splash-render.mjs <input.html> <output.png>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const input = process.argv[2] || 'splash-lab.html';
const output = process.argv[3] || '.splashtmp/lab.png';

// embed Satoshi variable font as data URL so no network is needed
const fontB64 = readFileSync(join(root, 'public/fonts/satoshi/Satoshi-Variable.woff2')).toString('base64');
const fontFace = `@font-face{font-family:"Satoshi";src:url(data:font/woff2;base64,${fontB64}) format("woff2");font-weight:300 900;font-style:normal;font-display:block;}`;

let html = readFileSync(join(root, input), 'utf8');
// strip any google fonts <link> to avoid network hang, inject local font
html = html.replace(/<link[^>]*fonts\.googleapis[^>]*>/g, '')
           .replace(/<link[^>]*fonts\.gstatic[^>]*>/g, '');
html = html.replace('</head>', `<style>${fontFace}</style></head>`);

mkdirSync(join(root, '.splashtmp'), { recursive: true });
const tmpHtml = join(root, '.splashtmp/_render.html');
writeFileSync(tmpHtml, html);

const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = join(root, '.splashtmp/profile');
mkdirSync(profile, { recursive: true });

const args = [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--disable-background-networking', '--disable-sync', '--disable-translate',
  '--force-device-scale-factor=2', '--window-size=1340,920',
  '--virtual-time-budget=2500',
  `--user-data-dir=${profile}`,
  `--screenshot=${join(root, output)}`,
  `file://${tmpHtml}`,
];

const p = spawn(chrome, args, { stdio: 'ignore' });
const killer = setTimeout(() => { try { p.kill('SIGKILL'); } catch {} }, 25000);
p.on('exit', (code) => {
  clearTimeout(killer);
  console.log('rendered', output, 'exit', code);
});
