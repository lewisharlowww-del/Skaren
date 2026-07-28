// Skaren 7-day content plan — image renderer
// Brand-accurate: Satoshi font, forest/leaf/cream palette, A–E grades, SKA+REN wordmark.
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const FDIR = path.join(ROOT, "..", "public", "fonts", "satoshi");
const OUT = path.join(ROOT, "images");
fs.mkdirSync(OUT, { recursive: true });

GlobalFonts.registerFromPath(path.join(FDIR, "Satoshi-Light.otf"), "SatoshiLight");
GlobalFonts.registerFromPath(path.join(FDIR, "Satoshi-Regular.otf"), "SatoshiRegular");
GlobalFonts.registerFromPath(path.join(FDIR, "Satoshi-Medium.otf"), "SatoshiMedium");
GlobalFonts.registerFromPath(path.join(FDIR, "Satoshi-Bold.otf"), "SatoshiBold");
GlobalFonts.registerFromPath(path.join(FDIR, "Satoshi-Black.otf"), "SatoshiBlack");

const T = {
  forest: "#2d4a26", leaf: "#4a8c5c", mist: "#f5f0e8", mistDark: "#ede7dc", mistCard: "#f0ebe2",
  ink: "#1e1e18", secondary: "#5a4a38", muted: "#a09080",
  gA: { bg: "#eaf5ec", bd: "#c8e8cc", tx: "#2d4a26" }, gB: { bg: "#f0f8f2", bd: "#c0ddc8", tx: "#4a8c5c" },
  gC: { bg: "#f8f6e8", bd: "#ddd8b0", tx: "#8a7a30" }, gD: { bg: "#fdf0e8", bd: "#f0cdb8", tx: "#b85c2a" },
  gE: { bg: "#fdf0f0", bd: "#f0c8c8", tx: "#9a2a1a" },
  cardGreen: "#f8fdf8", insight: "#f8faf6", borderDef: "#e8e0d4", borderGreen: "#d8eddc"
};
const GR = { A: T.gA, B: T.gB, C: T.gC, D: T.gD, E: T.gE };
const W = 1080, H = 1350, PAD = 84;

function ctx() { const c = createCanvas(W, H); return { c, x: c.getContext("2d") }; }
function rr(x, X, Y, WW, HH, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + WW, Y, X + WW, Y + HH, r); x.arcTo(X + WW, Y + HH, X, Y + HH, r); x.arcTo(X, Y + HH, X, Y, r); x.arcTo(X, Y, X + WW, Y, r); x.closePath(); }
function lsText(x, s, X, Y, ls = 0) { let cx = X; for (const ch of s) { x.fillText(ch, cx, Y); cx += x.measureText(ch).width + ls; } return cx - X - (s ? ls : 0); }
function lsWidth(x, s, ls = 0) { let w = 0; for (const ch of s) w += x.measureText(ch).width + ls; return w - (s ? ls : 0); }
function lsCenter(x, s, cx, Y, ls = 0) { const w = lsWidth(x, s, ls); return lsText(x, s, cx - w / 2, Y, ls); }
function wordmark(x, X, Y, size, color = T.ink, ls = 5) {
  x.textAlign = "left"; x.textBaseline = "alphabetic"; x.fillStyle = color;
  x.font = `${size}px SatoshiMedium`; const w1 = lsText(x, "SKA", X, Y, ls);
  x.font = `${size}px SatoshiBlack`; const w2 = lsText(x, "REN", X + w1 + ls, Y, ls);
  return w1 + ls + w2;
}
function wrap(x, s, maxW) { const words = s.split(" "); const lines = []; let cur = ""; for (const wd of words) { const t = cur ? cur + " " + wd : wd; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = t; } if (cur) lines.push(cur); return lines; }
function vgrad(x, y0, y1, stops) { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rgrad(x, cx, cy, r, stops) { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }

function bg(x, kind = "mist") {
  if (kind === "forest") {
    x.fillStyle = vgrad(x, 0, H, [[0, "#22381d"], [0.55, T.forest], [1, "#1c3018"]]); x.fillRect(0, 0, W, H);
    x.fillStyle = rgrad(x, W * 0.8, H * 0.08, 720, [[0, "rgba(74,140,92,.40)"], [1, "rgba(74,140,92,0)"]]); x.fillRect(0, 0, W, H);
    x.fillStyle = rgrad(x, W * 0.1, H * 0.95, 620, [[0, "rgba(74,140,92,.18)"], [1, "rgba(74,140,92,0)"]]); x.fillRect(0, 0, W, H);
  } else if (kind === "green") {
    x.fillStyle = vgrad(x, 0, H, [[0, T.mistCard], [0.46, T.cardGreen], [1, T.mistCard]]); x.fillRect(0, 0, W, H);
    x.fillStyle = rgrad(x, W * 0.2, 0, 660, [[0, "rgba(76,175,125,.22)"], [1, "rgba(76,175,125,0)"]]); x.fillRect(0, 0, W, H);
  } else {
    x.fillStyle = vgrad(x, 0, H, [[0, T.mist], [1, "#f3eee5"]]); x.fillRect(0, 0, W, H);
    x.fillStyle = rgrad(x, W * 0.2, 0, 620, [[0, "rgba(76,175,125,.18)"], [1, "rgba(76,175,125,0)"]]); x.fillRect(0, 0, W, H);
    x.fillStyle = rgrad(x, W * 0.9, H * 0.06, 540, [[0, "rgba(45,74,38,.10)"], [1, "rgba(45,74,38,0)"]]); x.fillRect(0, 0, W, H);
  }
}
// header wordmark + optional eyebrow chip
function header(x, dark = false, eyebrow) {
  wordmark(x, PAD, 118, 30, dark ? T.mist : T.ink, 5);
  if (eyebrow) {
    x.font = "22px SatoshiBold"; const tw = lsWidth(x, eyebrow.toUpperCase(), 3);
    const bw = tw + 52, bx = W - PAD - bw;
    rr(x, bx, 92, bw, 46, 23); x.fillStyle = dark ? "rgba(245,240,232,.12)" : "rgba(74,140,92,.12)"; x.fill();
    x.fillStyle = dark ? T.mist : T.leaf; x.textBaseline = "middle";
    lsText(x, eyebrow.toUpperCase(), bx + 26, 116, 3); x.textBaseline = "alphabetic";
  }
}
function footer(x, dark = false, cta = "Last ned gratis · iOS") {
  const y = H - 74; x.textAlign = "left";
  x.fillStyle = dark ? "rgba(245,240,232,.72)" : T.muted; x.font = "23px SatoshiBold";
  x.fillText("www.skaren.app", PAD, y);
  x.textAlign = "right"; x.font = "23px SatoshiMedium";
  x.fillStyle = dark ? "rgba(245,240,232,.72)" : T.secondary;
  x.fillText(cta, W - PAD, y); x.textAlign = "left";
}
function gradeBadge(x, letter, X, Y, size) {
  const g = GR[letter]; rr(x, X, Y, size, size, size * 0.22); x.fillStyle = g.bg; x.fill();
  x.lineWidth = 2; x.strokeStyle = g.bd; x.stroke();
  x.fillStyle = g.tx; x.font = `${Math.round(size * 0.56)}px SatoshiBlack`;
  x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(letter, X + size / 2, Y + size / 2 + size * 0.02);
  x.textAlign = "left"; x.textBaseline = "alphabetic";
}

// Phone mockup with a scan result screen
function phone(x, PX, PY, PW, opts = {}) {
  const o = Object.assign({ product: "Havregryn Sval", brand: "Fitness · 500 g", grade: "A", eco: "B", nova: "1" }, opts);
  const PH = PW * 2.02, rad = PW * 0.14;
  x.save(); x.shadowColor = "rgba(16,21,18,.32)"; x.shadowBlur = 90; x.shadowOffsetY = 44;
  rr(x, PX, PY, PW, PH, rad); x.fillStyle = "#0e130f"; x.fill(); x.restore();
  const m = PW * 0.028, SX = PX + m, SY = PY + m, SW = PW - 2 * m, SH = PH - 2 * m, srad = rad - m * 0.6;
  rr(x, SX, SY, SW, SH, srad); x.save(); x.clip();
  x.fillStyle = vgrad(x, SY, SY + SH, [[0, "#f8fdf8"], [1, "#f0ebe2"]]); x.fillRect(SX, SY, SW, SH);
  x.fillStyle = "#0e130f"; rr(x, SX + SW / 2 - 52, SY + 20, 104, 30, 15); x.fill();
  wordmark(x, SX + 34, SY + 94, 23, T.ink, 3.5);
  const gx = SX + SW / 2, gy = SY + SH * 0.29, gr = SW * 0.20, gc = GR[o.grade];
  x.beginPath(); x.arc(gx, gy, gr, 0, 7); x.fillStyle = gc.bg; x.fill(); x.lineWidth = 6; x.strokeStyle = gc.bd; x.stroke();
  x.fillStyle = gc.tx; x.font = `${Math.round(gr * 1.15)}px SatoshiBlack`; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(o.grade, gx, gy + gr * 0.06); x.textBaseline = "alphabetic";
  x.fillStyle = T.ink; x.font = `${Math.round(SW * 0.064)}px SatoshiBold`; x.fillText(o.product, gx, gy + gr + 66);
  x.fillStyle = T.muted; x.font = `${Math.round(SW * 0.042)}px SatoshiRegular`; x.fillText(o.brand, gx, gy + gr + 104);
  x.textAlign = "left";
  const chipY = gy + gr + 150, cw = (SW - 68 - 24) / 2, ch = 96;
  function chip(cxp, label, val, sub, col) {
    rr(x, cxp, chipY, cw, ch, 20); x.fillStyle = "rgba(255,255,255,.92)"; x.fill(); x.lineWidth = 2; x.strokeStyle = T.borderGreen; x.stroke();
    x.fillStyle = T.muted; x.font = `${Math.round(SW * 0.032)}px SatoshiBold`; lsText(x, label.toUpperCase(), cxp + 22, chipY + 36, 1);
    x.fillStyle = col || T.ink; x.font = `${Math.round(SW * 0.062)}px SatoshiBold`; x.fillText(val, cxp + 22, chipY + 78);
    if (sub) { x.fillStyle = T.muted; x.font = `${Math.round(SW * 0.034)}px SatoshiRegular`; x.fillText(sub, cxp + 22 + x.measureText(val).width + 8, chipY + 78); }
  }
  chip(SX + 34, "Øko", o.eco, "", GR[o.eco].tx);
  chip(SX + 34 + cw + 24, "NOVA", o.nova, "/4", T.leaf);
  let ly = chipY + ch + 54;
  x.fillStyle = T.muted; x.font = `${Math.round(SW * 0.032)}px SatoshiBold`; lsText(x, "TILSETNINGSSTOFFER · 4", SX + 34, ly, 1);
  const adds = [["E330", "Sitronsyre", "Trygt", T.gA.tx], ["E322", "Lecitin", "Trygt", T.gA.tx], ["E202", "Kaliumsorbat", "Moderat", T.gC.tx]];
  for (const [code, nm, st, col] of adds) {
    ly += 56; rr(x, SX + 34, ly - 40, SW - 68, 48, 14); x.fillStyle = "rgba(255,255,255,.78)"; x.fill();
    x.fillStyle = T.ink; x.font = `${Math.round(SW * 0.04)}px SatoshiBold`; x.fillText(code, SX + 52, ly - 8);
    x.fillStyle = T.secondary; x.font = `${Math.round(SW * 0.038)}px SatoshiRegular`; x.fillText(nm, SX + 52 + 74, ly - 8);
    x.fillStyle = col; x.font = `${Math.round(SW * 0.036)}px SatoshiBold`; x.textAlign = "right"; x.fillText(st, SX + SW - 52, ly - 8); x.textAlign = "left";
  }
  x.restore();
}

function save(name, c) { const f = path.join(OUT, name + ".png"); fs.writeFileSync(f, c.toBuffer("image/png")); console.log("saved", name); }

// ---------------- DAY 1 — Brand intro (hero + phone) ----------------
function day1() {
  const { c, x } = ctx(); bg(x, "mist"); header(x, false, "Ny i Norge");
  x.fillStyle = T.leaf; x.font = "26px SatoshiBold"; lsText(x, "SPIS SMARTERE", PAD, 250, 4);
  x.fillStyle = T.ink; x.font = "104px SatoshiMedium";
  x.save(); // tight display
  x.fillText("Skann", PAD, 372);
  x.fillStyle = T.leaf; x.fillText("strekkoden.", PAD, 476);
  x.restore();
  x.fillStyle = T.secondary; x.font = "34px SatoshiMedium";
  wrap(x, "Se umiddelbart hvor sunt og miljøvennlig et produkt er — i én tydelig karakter.", 560).forEach((l, i) => x.fillText(l, PAD, 560 + i * 46));
  phone(x, 610, 486, 400, { product: "Havregryn Sval", brand: "Fitness · 500 g", grade: "A", eco: "B", nova: "1" });
  footer(x); save("dag-1", c);
}

// ---------------- DAY 2 — A–E grades ----------------
function day2() {
  const { c, x } = ctx(); bg(x, "green"); header(x, false, "Helse & Øko");
  x.fillStyle = T.ink; x.font = "88px SatoshiMedium"; x.save();
  x.fillText("To karakterer.", PAD, 300);
  x.fillStyle = T.leaf; x.fillText("Null gjetting.", PAD, 396); x.restore();
  x.fillStyle = T.secondary; x.font = "32px SatoshiMedium";
  wrap(x, "Hvert produkt får en øyeblikkelig A–E vurdering på både næring og miljø.", 900).forEach((l, i) => x.fillText(l, PAD, 470 + i * 44));
  // two big grade cards
  const cy = 600, cw = (W - 2 * PAD - 40) / 2, chh = 470;
  function card(cx0, title, letter, note) {
    x.save(); x.shadowColor = "rgba(26,92,58,.12)"; x.shadowBlur = 50; x.shadowOffsetY = 26;
    rr(x, cx0, cy, cw, chh, 34); x.fillStyle = "#ffffff"; x.fill(); x.restore();
    x.fillStyle = T.muted; x.font = "24px SatoshiBold"; lsText(x, title.toUpperCase(), cx0 + 40, cy + 62, 2);
    gradeBadge(x, letter, cx0 + cw / 2 - 95, cy + 100, 190);
    x.fillStyle = T.secondary; x.font = "28px SatoshiMedium"; x.textAlign = "center";
    wrap(x, note, cw - 80).forEach((l, i) => x.fillText(l, cx0 + cw / 2, cy + 360 + i * 38)); x.textAlign = "left";
  }
  card(PAD, "Helse", "A", "Sterkt næringsinnhold, lite tilsatt sukker.");
  card(PAD + cw + 40, "Øko", "B", "Lav miljøpåvirkning for kategorien.");
  footer(x, false, "Se karakteren din"); save("dag-2", c);
}

// ---------------- DAY 3 — E-numbers ----------------
function day3() {
  const { c, x } = ctx(); bg(x, "mist"); header(x, false, "300+ E-numre");
  x.fillStyle = T.ink; x.font = "92px SatoshiMedium"; x.fillText("Vet du hva", PAD, 300);
  x.fillStyle = T.leaf; x.font = "92px SatoshiBlack"; x.fillText("E202 er?", PAD, 398);
  x.fillStyle = T.secondary; x.font = "32px SatoshiMedium";
  wrap(x, "Hvert tilsetningsstoff er merket Trygt, Moderat eller Unngå — før du handler.", 900).forEach((l, i) => x.fillText(l, PAD, 476 + i * 44));
  const rows = [
    ["E330", "Sitronsyre", "Trygt", T.gA], ["E322", "Lecitin", "Trygt", T.gA],
    ["E202", "Kaliumsorbat", "Moderat", T.gC], ["E951", "Aspartam", "Unngå", T.gE]
  ];
  let ry = 610; const rw = W - 2 * PAD;
  for (const [code, nm, st, g] of rows) {
    x.save(); x.shadowColor = "rgba(26,92,58,.08)"; x.shadowBlur = 34; x.shadowOffsetY = 16;
    rr(x, PAD, ry, rw, 128, 26); x.fillStyle = "#ffffff"; x.fill(); x.restore();
    rr(x, PAD + 28, ry + 30, 120, 68, 18); x.fillStyle = g.bg; x.fill(); x.lineWidth = 2; x.strokeStyle = g.bd; x.stroke();
    x.fillStyle = g.tx; x.font = "34px SatoshiBold"; x.textAlign = "center"; x.fillText(code, PAD + 88, ry + 74); x.textAlign = "left";
    x.fillStyle = T.ink; x.font = "38px SatoshiBold"; x.fillText(nm, PAD + 180, ry + 76);
    const tw = lsWidth(x, st.toUpperCase(), 2) + 52; rr(x, W - PAD - 28 - tw, ry + 38, tw, 52, 26); x.fillStyle = g.bg; x.fill();
    x.fillStyle = g.tx; x.font = "24px SatoshiBold"; x.textBaseline = "middle"; lsText(x, st.toUpperCase(), W - PAD - 28 - tw + 26, ry + 65, 2); x.textBaseline = "alphabetic";
    ry += 148;
  }
  footer(x, false, "Slå opp et E-nummer"); save("dag-3", c);
}

// ---------------- DAY 4 — NOVA ----------------
function day4() {
  const { c, x } = ctx(); bg(x, "forest"); header(x, true, "NOVA-skala");
  x.fillStyle = T.mist; x.font = "92px SatoshiMedium"; x.fillText("Hvor bearbeidet", PAD, 300);
  x.fillStyle = "#9fd6ad"; x.fillText("er maten din?", PAD, 398);
  x.fillStyle = "rgba(245,240,232,.82)"; x.font = "32px SatoshiMedium";
  wrap(x, "NOVA deler mat i fire nivåer — fra ubearbeidet til ultraprosessert.", 900).forEach((l, i) => x.fillText(l, PAD, 476 + i * 44));
  const levels = [
    ["1", "Ubearbeidet", "Havre, egg, grønnsaker", 1],
    ["2", "Kulinariske ingredienser", "Olje, smør, salt", 0.78],
    ["3", "Bearbeidet mat", "Ost, hermetikk, brød", 0.56],
    ["4", "Ultraprosessert", "Brus, snacks, ferdigmat", 0.34]
  ];
  let ly = 596; const rw = W - 2 * PAD;
  for (const [n, title, ex, tone] of levels) {
    x.save(); rr(x, PAD, ly, rw, 128, 26);
    x.fillStyle = `rgba(245,240,232,${0.06 + (1 - tone) * 0.02})`; x.fill();
    x.lineWidth = 1.5; x.strokeStyle = "rgba(159,214,173,.28)"; x.stroke(); x.restore();
    // number disc
    const dc = `rgba(159,214,173,${0.28 + tone * 0.55})`;
    x.beginPath(); x.arc(PAD + 78, ly + 64, 44, 0, 7); x.fillStyle = dc; x.fill();
    x.fillStyle = T.forest; x.font = "44px SatoshiBlack"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(n, PAD + 78, ly + 66); x.textAlign = "left"; x.textBaseline = "alphabetic";
    x.fillStyle = T.mist; x.font = "38px SatoshiBold"; x.fillText(title, PAD + 156, ly + 58);
    x.fillStyle = "rgba(245,240,232,.6)"; x.font = "26px SatoshiRegular"; x.fillText(ex, PAD + 156, ly + 98);
    ly += 148;
  }
  footer(x, true, "Sjekk NOVA-nivået"); save("dag-4", c);
}

// ---------------- DAY 5 — Comparison ----------------
function day5() {
  const { c, x } = ctx(); bg(x, "mist"); header(x, false, "Sammenlign");
  x.fillStyle = T.ink; x.font = "96px SatoshiMedium"; x.fillText("Denne", PAD, 300);
  x.fillStyle = T.muted; x.font = "44px SatoshiMedium"; x.fillText("eller", PAD + x.measureText("Denne ").width + 10, 300);
  x.fillStyle = T.leaf; x.font = "96px SatoshiMedium"; x.fillText("denne?", PAD, 400);
  x.fillStyle = T.secondary; x.font = "32px SatoshiMedium";
  wrap(x, "To like produkter i hylla. Karakterene forteller en annen historie.", 900).forEach((l, i) => x.fillText(l, PAD, 474 + i * 44));
  const cy = 592, cw = (W - 2 * PAD - 40) / 2, chh = 500;
  function prod(cx0, name, sub, letter, kcal, sugar, hi) {
    x.save(); x.shadowColor = hi ? "rgba(74,140,92,.22)" : "rgba(26,92,58,.10)"; x.shadowBlur = 50; x.shadowOffsetY = 26;
    rr(x, cx0, cy, cw, chh, 34); x.fillStyle = "#ffffff"; x.fill();
    if (hi) { x.lineWidth = 3; x.strokeStyle = T.gA.bd; x.stroke(); } x.restore();
    gradeBadge(x, letter, cx0 + 40, cy + 40, 130);
    if (hi) { const bw = lsWidth(x, "BEDRE VALG", 2) + 40; rr(x, cx0 + cw - 40 - bw, cy + 54, bw, 46, 23); x.fillStyle = T.gA.bg; x.fill(); x.fillStyle = T.gA.tx; x.font = "22px SatoshiBold"; x.textBaseline = "middle"; lsText(x, "BEDRE VALG", cx0 + cw - 40 - bw + 20, cy + 78, 2); x.textBaseline = "alphabetic"; }
    x.fillStyle = T.ink; x.font = "40px SatoshiBold"; wrap(x, name, cw - 80).forEach((l, i) => x.fillText(l, cx0 + 40, cy + 236 + i * 44));
    x.fillStyle = T.muted; x.font = "26px SatoshiRegular"; x.fillText(sub, cx0 + 40, cy + 320);
    function stat(sy, label, val, col) { x.fillStyle = T.muted; x.font = "24px SatoshiBold"; lsText(x, label.toUpperCase(), cx0 + 40, sy, 1); x.fillStyle = col; x.font = "30px SatoshiBold"; x.textAlign = "right"; x.fillText(val, cx0 + cw - 40, sy); x.textAlign = "left"; }
    stat(cy + 388, "Kalorier", kcal, T.ink); stat(cy + 440, "Tilsatt sukker", sugar, col2(sugar));
  }
  function col2(s) { const n = parseInt(s); return n <= 2 ? T.gA.tx : n <= 8 ? T.gC.tx : T.gE.tx; }
  prod(PAD, "Yoghurt Naturell", "Tine · 150 g", "A", "89 kcal", "2 g", true);
  prod(PAD + cw + 40, "Yoghurt Frukt & Sukker", "Merke · 150 g", "D", "142 kcal", "16 g", false);
  footer(x, false, "Sammenlign to produkter"); save("dag-5", c);
}

// ---------------- DAY 6 — AI insight ----------------
function day6() {
  const { c, x } = ctx(); bg(x, "green"); header(x, false, "AI-innsikt");
  x.fillStyle = T.ink; x.font = "84px SatoshiMedium"; x.fillText("Det viktigste,", PAD, 300);
  x.fillStyle = T.leaf; x.fillText("i tre setninger.", PAD, 392);
  x.fillStyle = T.secondary; x.font = "32px SatoshiMedium";
  wrap(x, "Skaren fremhever det som faktisk betyr noe — skreddersydd for hvert produkt.", 900).forEach((l, i) => x.fillText(l, PAD, 466 + i * 44));
  // insight card
  const cx0 = PAD, cy = 588, cw = W - 2 * PAD, chh = 540;
  x.save(); x.shadowColor = "rgba(26,92,58,.12)"; x.shadowBlur = 56; x.shadowOffsetY = 28;
  rr(x, cx0, cy, cw, chh, 34); x.fillStyle = "#ffffff"; x.fill(); x.restore();
  x.fillStyle = T.leaf; x.font = "30px SatoshiBold"; x.fillText("✦", cx0 + 44, cy + 74);
  x.fillStyle = T.muted; lsText(x, "NØKKELINNSIKT", cx0 + 84, cy + 72, 3);
  const items = [
    ["Høyt proteininnhold", "18 g per porsjon støtter daglig behov.", T.gA],
    ["Inneholder tilsatt sukker", "12 % av daglig referanseinntak.", T.gC],
    ["God kilde til kalsium", "Dekker 30 % av daglig behov.", T.gA]
  ];
  let iy = cy + 130;
  for (const [t, d, g] of items) {
    x.beginPath(); x.arc(cx0 + 60, iy + 22, 9, 0, 7); x.fillStyle = g.tx; x.fill();
    x.fillStyle = T.ink; x.font = "38px SatoshiBold"; x.fillText(t, cx0 + 90, iy + 34);
    x.fillStyle = T.secondary; x.font = "30px SatoshiRegular"; x.fillText(d, cx0 + 90, iy + 82);
    if (iy + 150 < cy + chh - 40) { x.strokeStyle = T.borderDef; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx0 + 44, iy + 120); x.lineTo(cx0 + cw - 44, iy + 120); x.stroke(); }
    iy += 140;
  }
  footer(x, false, "Få innsikten"); save("dag-6", c);
}

// ---------------- DAY 7 — Social proof ----------------
function day7() {
  const { c, x } = ctx(); bg(x, "forest"); header(x, true, "Bygget for Norge");
  x.fillStyle = T.mist; x.font = "96px SatoshiMedium"; x.fillText("250 000+", PAD, 322);
  x.fillStyle = "#9fd6ad"; x.font = "60px SatoshiMedium"; x.fillText("matvarer. Én app.", PAD, 402);
  x.fillStyle = "rgba(245,240,232,.82)"; x.font = "32px SatoshiMedium";
  wrap(x, "Data fra norske dagligvarekjeder — oppdatert løpende. Smartere valg i lomma.", 900).forEach((l, i) => x.fillText(l, PAD, 476 + i * 44));
  const stats = [["250k+", "Matvarer"], ["300+", "E-numre"], ["A–E", "Karakterer"], ["NOVA", "Bearbeiding"]];
  const gy = 600, gw = (W - 2 * PAD - 40) / 2, gh = 220;
  stats.forEach((s, i) => {
    const gx0 = PAD + (i % 2) * (gw + 40), gyy = gy + Math.floor(i / 2) * (gh + 36);
    rr(x, gx0, gyy, gw, gh, 30); x.fillStyle = "rgba(245,240,232,.07)"; x.fill(); x.lineWidth = 1.5; x.strokeStyle = "rgba(159,214,173,.28)"; x.stroke();
    x.fillStyle = T.mist; x.font = "76px SatoshiBold"; x.fillText(s[0], gx0 + 40, gyy + 116);
    x.fillStyle = "rgba(245,240,232,.62)"; x.font = "30px SatoshiMedium"; lsText(x, s[1].toUpperCase(), gx0 + 40, gyy + 166, 2);
  });
  footer(x, true, "Last ned gratis · iOS"); save("dag-7", c);
}

day1(); day2(); day3(); day4(); day5(); day6(); day7();
console.log("ALL DONE ->", OUT);
