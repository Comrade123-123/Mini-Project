// Backend contract (to be implemented):
//   POST /api/explain  (multipart: image)
//   -> { prediction: {label, confidence, probs:{label:p}},
//        gradcam: {overlay: <url|dataURL>, heatmap, ms},
//        ig:      {overlay: <url|dataURL>, heatmap, ms, steps},
//        metrics: { agreement, ... } }
// Until the backend exists, a mock generates plausible-looking maps client-side.

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export async function explain(file, { steps = 50 } = {}) {
  if (USE_MOCK) return mockExplain(file, steps)
  const body = new FormData()
  body.append('image', file)
  body.append('ig_steps', steps)
  const res = await fetch('/api/explain', { method: 'POST', body })
  if (!res.ok) throw new Error(`Server error ${res.status}`)
  return res.json()
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Seeded PRNG so the same image gives the same fake output.
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

async function mockExplain(file, steps) {
  const img = await loadImage(file)
  const rand = rng(file.size)
  await new Promise((r) => setTimeout(r, 900))

  const blobs = Array.from({ length: 3 }, () => ({
    x: 0.25 + rand() * 0.5, y: 0.25 + rand() * 0.5, r: 0.1 + rand() * 0.15, w: 0.5 + rand() * 0.5,
  }))
  const field = (x, y) => blobs.reduce((a, b) => a + b.w * Math.exp(-((x - b.x) ** 2 + (y - b.y) ** 2) / (2 * b.r ** 2)), 0)

  const size = 224
  const gradcam = renderMap(img, size, (x, y) => field(x, y), 'smooth')
  const noise = rng(file.size + 7)
  const ig = renderMap(img, size, (x, y) => field(x, y) * (0.3 + 0.7 * noise()) ** 2, 'grain')

  const p = 0.55 + rand() * 0.4
  return {
    prediction: { label: 'Pathology', confidence: p, probs: { Pathology: p, Normal: 1 - p } },
    gradcam: { ...gradcam, ms: 20 + Math.round(rand() * 15) },
    ig: { ...ig, ms: 20 * steps + Math.round(rand() * 100), steps },
    metrics: { agreement: 0.25 + rand() * 0.4 },
    mock: true,
  }
}

function renderMap(img, size, fn, kind) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const m = document.createElement('canvas')
  m.width = m.height = size
  const mg = m.getContext('2d')
  const data = mg.createImageData(size, size)
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const v = Math.min(1, fn(i / size, j / size) / 1.3)
    const [r, gg, b] = jet(v)
    const k = (j * size + i) * 4
    data.data.set([r, gg, b, Math.round(255 * Math.min(1, v * 1.2))], k)
  }
  mg.putImageData(data, 0, 0)
  g.drawImage(img, 0, 0, size, size)
  g.globalAlpha = 1
  g.drawImage(m, 0, 0)
  return { overlay: c.toDataURL('image/png'), heatmap: m.toDataURL('image/png'), kind }
}

// Brand ramp: transparent blue -> royal blue -> cyan -> white.
function jet(v) {
  const f = (t) => Math.max(0, Math.min(1, t))
  const a = f(v * 1.6), b = f((v - 0.55) * 2.2)
  return [29 + 190 * b, 78 + 150 * b + 20 * a, 224 + 30 * b]
}