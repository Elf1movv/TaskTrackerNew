// Makes the test-site (staging) app icons: the same icons as public/icons, with
// the navy background turned orange, so the installed test app can't be
// mistaken for the real one on a phone's home screen (owner, 2026-11-15).
// Run once after changing public/icons:  node scripts/make-staging-icons.mjs
// Output goes to staging-icons/; vite.config.ts swaps them in for staging builds.
// No image library — 8-bit RGB/RGBA non-interlaced PNGs are decoded with zlib.
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

const NAVY = [0x1c, 0x30, 0x49]
const ORANGE = [0xc2, 0x5a, 0x1a]
const SRC = "public/icons"
const OUT = "staging-icons"

function crc32(buf) {
  let c = ~0
  for (const byte of buf) {
    c ^= byte
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function recolor(file) {
  const png = fs.readFileSync(file)
  let pos = 8
  let width, height, colorType
  const idat = []
  while (pos < png.length) {
    const len = png.readUInt32BE(pos)
    const type = png.toString("ascii", pos + 4, pos + 8)
    const data = png.subarray(pos + 8, pos + 8 + len)
    if (type === "IHDR") {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      if (data[8] !== 8 || data[12] !== 0) throw new Error(`${file}: only 8-bit non-interlaced`)
      colorType = data[9]
    }
    if (type === "IDAT") idat.push(data)
    pos += 12 + len
  }
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0
  if (!bpp) throw new Error(`${file}: only RGB/RGBA`)
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const stride = width * bpp
  const pixels = Buffer.alloc(height * stride)
  // Undo the per-row PNG filters.
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x]
      const a = x >= bpp ? pixels[y * stride + x - bpp] : 0
      const b = y > 0 ? pixels[(y - 1) * stride + x] : 0
      const c = x >= bpp && y > 0 ? pixels[(y - 1) * stride + x - bpp] : 0
      let p
      if (filter === 0) p = 0
      else if (filter === 1) p = a
      else if (filter === 2) p = b
      else if (filter === 3) p = (a + b) >> 1
      else {
        const pa = Math.abs(b - c),
          pb = Math.abs(a - c),
          pc = Math.abs(a + b - 2 * c)
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      pixels[y * stride + x] = (v + p) & 0xff
    }
  }
  // Every pixel is navy blended with white (the check mark); keep the blend,
  // swap navy for orange.
  for (let i = 0; i < pixels.length; i += bpp) {
    const t = Math.min(1, Math.max(0, (pixels[i + 2] - NAVY[2]) / (255 - NAVY[2])))
    for (let ch = 0; ch < 3; ch++) pixels[i + ch] = Math.round(ORANGE[ch] * (1 - t) + 255 * t)
  }
  const out = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) pixels.copy(out, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = colorType
  return Buffer.concat([
    png.subarray(0, 8),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(out, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

fs.mkdirSync(path.join(OUT, "icons"), { recursive: true })
for (const name of fs.readdirSync(SRC).filter(n => n.endsWith(".png"))) {
  fs.writeFileSync(path.join(OUT, "icons", name), recolor(path.join(SRC, name)))
  console.log("icons/" + name)
}
const favicon = fs.readFileSync("public/favicon.svg", "utf8").replace("#1c3049", "#c25a1a")
fs.writeFileSync(path.join(OUT, "favicon.svg"), favicon)
console.log("favicon.svg")
