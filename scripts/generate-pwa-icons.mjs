import { copyFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

const root = new URL("..", import.meta.url).pathname;
const iconsDir = join(root, "public", "icons");
const sourcePath = "/Users/hodealucian/Downloads/ChatGPT Image May 27, 2026, 01_13_04 AM.png";
const sourceCopy = join(iconsDir, "skaren-final-source.png");
const squareMaster = join(iconsDir, "skaren-final-square.png");

const sizes = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const cropSize = 660;
const cropX = 182;
const cropY = 405;
const bg = [14, 90, 52, 255];

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
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

function encodePng(width, height, rgba) {
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

function decodePng(path) {
  const bytes = readFileSync(path);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    }
    if (type === "IDAT") idat.push(data);
    if (type === "IEND") break;
  }

  if (colorType !== 6) throw new Error("Icon source must be an RGBA PNG.");

  const channels = 4;
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const rgba = Buffer.alloc(height * stride);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[sourceOffset];
    sourceOffset += 1;

    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? rgba[y * stride + x - channels] : 0;
      const up = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= channels ? rgba[(y - 1) * stride + x - channels] : 0;
      let value = raw[sourceOffset];
      sourceOffset += 1;

      if (filter === 1) value = (value + left) & 255;
      if (filter === 2) value = (value + up) & 255;
      if (filter === 3) value = (value + Math.floor((left + up) / 2)) & 255;
      if (filter === 4) {
        const predictor = left + up - upLeft;
        const leftDistance = Math.abs(predictor - left);
        const upDistance = Math.abs(predictor - up);
        const upLeftDistance = Math.abs(predictor - upLeft);
        value = (value + (leftDistance <= upDistance && leftDistance <= upLeftDistance ? left : upDistance <= upLeftDistance ? up : upLeft)) & 255;
      }

      rgba[y * stride + x] = value;
    }
  }

  return { width, height, rgba };
}

function icoFromPng(pngBytes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const directory = Buffer.alloc(16);
  directory[0] = 32;
  directory[1] = 32;
  directory[2] = 0;
  directory[3] = 0;
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(pngBytes.length, 8);
  directory.writeUInt32LE(22, 12);

  return Buffer.concat([header, directory, pngBytes]);
}

function sips(args) {
  execFileSync("sips", args, { stdio: "ignore" });
}

if (!existsSync(sourcePath)) {
  throw new Error(`Missing Skaren icon source PNG: ${sourcePath}`);
}

mkdirSync(iconsDir, { recursive: true });
copyFileSync(sourcePath, sourceCopy);

// The supplied PNG has the final symbol centered inside a lot of presentation
// space. App launchers need the mark to read clearly at small sizes, so this
// uses a tighter optical crop around the actual symbol and then only resizes it.
const source = decodePng(sourceCopy);
const square = Buffer.alloc(cropSize * cropSize * 4);

for (let y = 0; y < cropSize; y += 1) {
  for (let x = 0; x < cropSize; x += 1) {
    const target = (y * cropSize + x) * 4;
    const sourceIndex = ((y + cropY) * source.width + x + cropX) * 4;
    const alpha = source.rgba[sourceIndex + 3] / 255;

    square[target] = Math.round(source.rgba[sourceIndex] * alpha + bg[0] * (1 - alpha));
    square[target + 1] = Math.round(source.rgba[sourceIndex + 1] * alpha + bg[1] * (1 - alpha));
    square[target + 2] = Math.round(source.rgba[sourceIndex + 2] * alpha + bg[2] * (1 - alpha));
    square[target + 3] = 255;
  }
}

writeFileSync(squareMaster, encodePng(cropSize, cropSize, square));

for (const size of sizes) {
  sips(["-z", String(size), String(size), squareMaster, "--out", join(iconsDir, `icon-${size}.png`)]);
}

copyFileSync(join(iconsDir, "icon-180.png"), join(iconsDir, "apple-touch-icon.png"));
copyFileSync(join(iconsDir, "icon-192.png"), join(iconsDir, "maskable-192.png"));
copyFileSync(join(iconsDir, "icon-512.png"), join(iconsDir, "maskable-512.png"));
copyFileSync(join(iconsDir, "icon-512.png"), join(iconsDir, "maskable-icon-512.png"));

copyFileSync(join(iconsDir, "icon-32.png"), join(root, "public", "favicon-32.png"));
copyFileSync(join(iconsDir, "icon-192.png"), join(root, "public", "favicon-192.png"));
copyFileSync(join(iconsDir, "apple-touch-icon.png"), join(root, "public", "apple-touch-icon.png"));

const faviconIco = icoFromPng(readFileSync(join(iconsDir, "icon-32.png")));
writeFileSync(join(iconsDir, "favicon.ico"), faviconIco);
writeFileSync(join(root, "public", "favicon.ico"), faviconIco);
unlinkSync(sourceCopy);
unlinkSync(squareMaster);
console.log(`Generated Skaren icon assets directly from ${sourcePath}`);
