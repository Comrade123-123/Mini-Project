// Procedural imagery for the 3D scene and the method cards. No image assets.

function hash(x, y, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x, y, s, oct = 3) {
  let sum = 0, amp = 0.5, f = 1
  for (let i = 0; i < oct; i++) { sum += amp * vnoise(x * f, y * f, s + i * 17); amp *= 0.5; f *= 2 }
  return sum
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }

const LUNG = new Path2D('M282 84 C236 74 178 108 156 176 C138 236 146 306 176 340 C206 368 258 352 276 316 C290 288 284 250 284 214 C284 160 286 120 282 84 Z')

// Stylised chest radiograph, dark navy so it reads like a real scan.
export function makeXray(S = 640) {
  const c = canvas(S), g = c.getContext('2d')
  const k = S / 600
  const bg = g.createLinearGradient(0, 0, 0, S)
  bg.addColorStop(0, '#1d2a55'); bg.addColorStop(1, '#0f1838')
  g.fillStyle = bg; g.fillRect(0, 0, S, S)

  g.save(); g.scale(k, S / 420)
  g.filter = 'blur(4px)'
  g.strokeStyle = 'rgba(190,205,245,.20)'; g.lineWidth = 7
  for (let i = 0; i < 9; i++) {
    for (const m of [1, -1]) {
      g.beginPath(); g.moveTo(300, 70 + i * 32)
      g.bezierCurveTo(300 + m * 60, 60 + i * 32, 300 + m * 130, 80 + i * 32, 300 + m * 180, 120 + i * 28); g.stroke()
    }
  }
  g.fillStyle = 'rgba(175,195,245,.26)'; g.fillRect(282, 40, 36, 340)
  g.filter = 'blur(6px)'; g.fillStyle = 'rgba(5,9,26,.62)'
  g.fill(LUNG)
  g.translate(600, 0); g.scale(-1, 1); g.fill(LUNG)
  g.restore()

  const d = g.getImageData(0, 0, S, S)
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (hash(i, 7, 3) - 0.5) * 14
    d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n
  }
  g.putImageData(d, 0, 0)
  return c
}

// Feature-map tile: a grid of cells with varying activation.
export function makeFeature(n, seed, hot = false, S = 512) {
  const c = canvas(S), g = c.getContext('2d')
  const cell = S / n, gap = Math.max(3, S / 110)
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const v = fbm(i * 0.55 + seed * 3, j * 0.55, seed)
    g.fillStyle = `rgba(${100 + v * 40 | 0},${125 + v * 40 | 0},${200 + v * 40 | 0},${0.16 + v * 0.62})`
    g.beginPath(); g.roundRect(i * cell + gap, j * cell + gap, cell - gap * 2, cell - gap * 2, gap * 1.4); g.fill()
  }
  if (hot) {
    g.fillStyle = '#1d4ee0'
    for (const [i, j] of [[1, 1], [2, 1], [1, 2], [3, 3]]) {
      if (i >= n || j >= n) continue
      g.beginPath(); g.roundRect(i * cell + gap, j * cell + gap, cell - gap * 2, cell - gap * 2, gap * 1.4); g.fill()
    }
  }
  g.strokeStyle = 'rgba(120,140,195,.55)'; g.lineWidth = 3; g.strokeRect(2, 2, S - 4, S - 4)
  return c
}

const BLOBS = [[0.3, 0.5, 0.17, 1], [0.37, 0.73, 0.1, 0.7], [0.68, 0.42, 0.15, 0.9]]
const heat = (u, v) => BLOBS.reduce((a, [x, y, r, w]) => a + w * Math.exp(-((u - x) ** 2 + (v - y) ** 2) / (2 * r * r * 0.5)), 0)

// mode: 'grad' smooth heat, 'ig' pixel grain, 'split' half and half
export function renderExplained(mode = 'split', S = 640, labels = true) {
  const c = canvas(S), g = c.getContext('2d')
  g.drawImage(makeXray(S), 0, 0)

  const smooth = (x0, x1) => {
    g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, S); g.clip()
    g.globalCompositeOperation = 'screen'
    for (const [x, y, r, w] of BLOBS) {
      const gr = g.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S * 1.9)
      gr.addColorStop(0, `rgba(80,150,255,${0.95 * w})`); gr.addColorStop(0.45, `rgba(29,78,224,${0.6 * w})`); gr.addColorStop(1, 'rgba(29,78,224,0)')
      g.fillStyle = gr; g.fillRect(0, 0, S, S)
    }
    g.restore()
  }
  const grain = (x0, x1) => {
    g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, S); g.clip()
    g.globalCompositeOperation = 'screen'
    const st = S / 64
    for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
      const u = (i + 0.5) / 64, v = (j + 0.5) / 64
      const val = heat(u, v) * (0.25 + 0.95 * hash(i, j, 5))
      if (val < 0.2) continue
      g.fillStyle = val > 0.75 ? 'rgba(220,235,255,.95)' : `rgba(90,160,255,${clamp(val)})`
      g.beginPath(); g.arc((i + 0.5) * st, (j + 0.5) * st, st * 0.46 * clamp(val), 0, 6.2832); g.fill()
    }
    g.restore()
  }
  if (mode === 'grad') smooth(0, S)
  else if (mode === 'ig') grain(0, S)
  else {
    smooth(0, S / 2); grain(S / 2, S)
    g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(S / 2 - 1, 0, 2, S)
    if (labels) {
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = `600 ${S * 0.034}px sans-serif`
      g.fillText('GRAD-CAM', S * 0.04, S * 0.96); g.textAlign = 'right'
      g.fillText('INTEGRATED GRADIENTS', S * 0.96, S * 0.96); g.textAlign = 'left'
    }
  }
  return c
}
export const makeResult = (S = 640) => renderExplained('split', S)

export function makeShadow(S = 256) {
  const c = canvas(S), g = c.getContext('2d')
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  gr.addColorStop(0, 'rgba(25,40,95,.30)'); gr.addColorStop(0.6, 'rgba(25,40,95,.08)'); gr.addColorStop(1, 'rgba(25,40,95,0)')
  g.fillStyle = gr; g.fillRect(0, 0, S, S)
  return c
}

export function makeGlow(S = 128) {
  const c = canvas(S), g = c.getContext('2d')
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  gr.addColorStop(0, 'rgba(60,120,255,1)'); gr.addColorStop(0.25, 'rgba(29,78,224,.55)'); gr.addColorStop(1, 'rgba(29,78,224,0)')
  g.fillStyle = gr; g.fillRect(0, 0, S, S)
  return c
}

export const methodImage = (mode, S = 640) => renderExplained(mode, S, false).toDataURL('image/jpeg', 0.88)
