import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const root = new URL("..", import.meta.url).pathname;
const iconsDir = join(root, "public", "icons");

const colors = {
  forest: [26, 92, 58, 255],
  dark: [7, 17, 12, 255],
  mint: [189, 239, 209, 255],
  white: [255, 255, 255, 255]
};

function skarenSvg({ background = "#1A5C3A", mark = "white", cut = "#1A5C3A" } = {}) {
  return `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="18" fill="${background}"/>
  <path d="M32 10.5C41 18 46.25 26.2 46.25 34.6C46.25 43.2 40.13 49.75 32 49.75C23.87 49.75 17.75 43.2 17.75 34.6C17.75 26.2 23 18 32 10.5Z" fill="${mark}"/>
  <path d="M24.8 31.25C26.47 27.87 29.35 25.72 33.78 24.95C35.08 24.72 36.15 25.82 35.92 27.12C35.15 31.55 33 34.43 29.62 36.1" stroke="${cut}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M24.25 38.9H39.75" stroke="${cut}" stroke-width="3.8" stroke-linecap="round"/>
  <path d="M38.2 30.9H42.05" stroke="${cut}" stroke-width="3.1" stroke-linecap="round" opacity="0.82"/>
  <path d="M32 49.4V58.75" stroke="${mark}" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M26.2 58.18H37.8" stroke="${mark}" stroke-width="3.45" stroke-linecap="round" opacity="0.72"/>
</svg>`;
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function png(width, height, rgba) {
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    rgba.copy(row, 1, y * width * 4, (y + 1) * width * 4);
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function blendPixel(buf, width, x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= width || y >= width) return;
  const i = (y * width + x) * 4;
  const a = alpha * (color[3] / 255);
  buf[i] = Math.round(color[0] * a + buf[i] * (1 - a));
  buf[i + 1] = Math.round(color[1] * a + buf[i + 1] * (1 - a));
  buf[i + 2] = Math.round(color[2] * a + buf[i + 2] * (1 - a));
  buf[i + 3] = 255;
}

function roundedRect(buf, size, x, y, w, h, r, color) {
  for (let py = Math.floor(y); py < Math.ceil(y + h); py += 1) {
    for (let px = Math.floor(x); px < Math.ceil(x + w); px += 1) {
      const dx = Math.max(x - px, 0, px - (x + w - 1));
      const dy = Math.max(y - py, 0, py - (y + h - 1));
      const insideCorner = dx * dx + dy * dy <= r * r || (px >= x + r && px <= x + w - r) || (py >= y + r && py <= y + h - r);
      if (insideCorner) blendPixel(buf, size, px, py, color);
    }
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawLine(buf, size, x1, y1, x2, y2, width, color) {
  const minX = Math.floor(Math.min(x1, x2) - width);
  const maxX = Math.ceil(Math.max(x1, x2) + width);
  const minY = Math.floor(Math.min(y1, y2) - width);
  const maxY = Math.ceil(Math.max(y1, y2) + width);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy || 1;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      if ((x - px) ** 2 + (y - py) ** 2 <= (width / 2) ** 2) blendPixel(buf, size, x, y, color);
    }
  }
}

function renderIcon(size, { maskable = false, dark = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const bg = dark ? colors.dark : colors.forest;
  const mark = dark ? colors.mint : colors.white;
  const cut = dark ? colors.dark : colors.forest;

  roundedRect(buf, size, 0, 0, size, size, maskable ? size * 0.18 : size * 0.28, bg);

  const s = size / 64;
  const points = [
    [32, 10.5], [39, 17.2], [44.2, 26.2], [46.25, 34.6], [44.4, 42.9],
    [39.1, 48.1], [32, 49.75], [24.9, 48.1], [19.6, 42.9], [17.75, 34.6],
    [19.8, 26.2], [25, 17.2]
  ].map(([x, y]) => [x * s, y * s]);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (pointInPolygon(x, y, points)) blendPixel(buf, size, x, y, mark);
    }
  }

  drawLine(buf, size, 24.8 * s, 31.25 * s, 33.78 * s, 24.95 * s, 3.8 * s, cut);
  drawLine(buf, size, 33.78 * s, 24.95 * s, 35.92 * s, 27.12 * s, 3.8 * s, cut);
  drawLine(buf, size, 35.92 * s, 27.12 * s, 29.62 * s, 36.1 * s, 3.8 * s, cut);
  drawLine(buf, size, 24.25 * s, 38.9 * s, 39.75 * s, 38.9 * s, 3.8 * s, cut);
  drawLine(buf, size, 38.2 * s, 30.9 * s, 42.05 * s, 30.9 * s, 3.1 * s, cut);
  drawLine(buf, size, 32 * s, 49.4 * s, 32 * s, 58.75 * s, 4.6 * s, mark);
  drawLine(buf, size, 26.2 * s, 58.18 * s, 37.8 * s, 58.18 * s, 3.45 * s, mark);

  return png(size, size, buf);
}

mkdirSync(iconsDir, { recursive: true });

writeFileSync(join(root, "app", "icon.svg"), skarenSvg());
writeFileSync(join(root, "public", "favicon.svg"), skarenSvg());
writeFileSync(join(root, "public", "skaren-symbol-primary.svg"), skarenSvg());
writeFileSync(join(root, "public", "skaren-symbol-dark.svg"), skarenSvg({ background: "#07110C", mark: "#BDEFD1", cut: "#07110C" }));
writeFileSync(join(root, "public", "skaren-symbol-monochrome.svg"), skarenSvg({ background: "transparent", mark: "#1A5C3A", cut: "white" }));
writeFileSync(join(root, "public", "skaren-app-icon.svg"), skarenSvg());

for (const size of [32, 72, 96, 128, 144, 152, 180, 192, 384, 512]) {
  writeFileSync(join(iconsDir, `icon-${size}.png`), renderIcon(size));
}

writeFileSync(join(iconsDir, "maskable-192.png"), renderIcon(192, { maskable: true }));
writeFileSync(join(iconsDir, "maskable-512.png"), renderIcon(512, { maskable: true }));
writeFileSync(join(root, "public", "favicon-32.png"), renderIcon(32));
writeFileSync(join(root, "public", "favicon-192.png"), renderIcon(192));
writeFileSync(join(root, "public", "apple-touch-icon.png"), renderIcon(180));

console.log(`Generated Skaren PWA icons in ${iconsDir}`);
