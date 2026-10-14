import { useEffect, useRef } from 'react'
import { createStage } from '../three/stage.js'
import { clamp } from '../hooks.jsx'

const lerp = (a, b, t) => a + (b - a) * t
const smooth = (t) => t * t * (3 - 2 * t)

const CALLS = [
  { key: 'air', focus: 1, num: '02', title: 'Airways', sub: 'Anatomical landmark' },
  { key: 'gradcam', focus: 2, num: '03', title: 'Grad-CAM', sub: 'Smooth, region-level' },
  { key: 'ig', focus: 2, num: '03', title: 'Integrated Gradients', sub: 'Fine, pixel-level' },
]

// Fixed full-screen 3D canvas. Scroll position decides how the glass stack sits, explodes and fades.
export default function Stage() {
  const canvas = useRef(null)
  const els = useRef([])

  useEffect(() => {
    let stage
    try { stage = createStage(canvas.current) } catch { document.documentElement.classList.add('no-gl'); return }

    const mouse = { x: 0, y: 0 }
    const cur = { x: 0, y: 0, s: 1, e: 0, tilt: 0.5, rotY: 0.6, o: 1 }
    const onMove = (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5 }
    const onResize = () => stage.resize()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', onResize)

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf, visible = true
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const ex = document.getElementById('explode')
      if (!ex || document.hidden) return

      const vh = innerHeight, sy = scrollY
      const top = ex.offsetTop, len = Math.max(1, ex.offsetHeight - vh)
      const pE = clamp((sy - top) / len)
      const pre = clamp(sy / Math.max(1, top))
      const after = clamp((sy - (top + len)) / (vh * 0.7))
      const e = smooth(clamp(pE / 0.28))
      const narrow = innerWidth < 900
      const hw = stage.halfWidth()

      const tgt = {
        x: lerp(narrow ? 0 : hw * 0.42, narrow ? 0 : hw * 0.34, e),
        y: lerp(narrow ? -0.9 + pre * 0.2 : -0.15 + pre * 0.25, 0, e) + after * 5,
        s: lerp((narrow ? 0.72 : 1.1) - pre * 0.06, narrow ? 0.46 : 0.6, e),
        e,
        tilt: lerp(0.1, 0.04, e),
        rotY: 0.3 + (still ? 0 : Math.sin(t * 0.00028) * 0.12) + mouse.x * 0.4 - e * 0.2 + pre * 0.15,
        o: 1 - clamp(after * 1.5),
      }
      const k = 0.085
      for (const key in tgt) cur[key] += (tgt[key] - cur[key]) * k
      const focus = pE < 0.34 ? -1 : pE < 0.57 ? 0 : pE < 0.79 ? 1 : 2

      visible = cur.o > 0.02
      canvas.current.style.opacity = cur.o.toFixed(3)
      canvas.current.style.visibility = visible ? 'visible' : 'hidden'
      if (!visible) { els.current.forEach((el) => el && (el.style.opacity = 0)); return }

      stage.render({ ...cur, focus }, t)

      CALLS.forEach((c, i) => {
        const el = els.current[i]
        if (!el) return
        const p = stage.project(c.key)
        const dim = focus < 0 || c.focus === focus ? 1 : 0.25
        el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`
        el.style.opacity = (cur.o * dim).toFixed(3)
      })
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      stage.dispose()
    }
  }, [])

  return (
    <>
      <canvas ref={canvas} className="stage" aria-hidden="true" />
      <div className="calls" aria-hidden="true">
        {CALLS.map((c, i) => (
          <div key={c.title} className="co" ref={(el) => (els.current[i] = el)}>
            <i /><span className="ln" />
            <div><small>{c.num}</small><b>{c.title}</b><em>{c.sub}</em></div>
          </div>
        ))}
      </div>
    </>
  )
}
