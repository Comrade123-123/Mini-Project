import { createElement, useEffect, useRef, useState } from 'react'

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

export function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen]
}

// 0 to 1 while a tall (sticky) section scrolls past.
export function useScrollProgress() {
  const ref = useRef(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf
    const update = () => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      setP(clamp(total > 0 ? -r.top / total : 0))
    }
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  return [ref, p]
}

// Fade, lift and un-blur on entry.
export function Reveal({ as = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, seen] = useInView(0.15)
  return createElement(as, { ref, className: `reveal ${seen ? 'in' : ''} ${className}`, style: { '--d': `${delay}ms` }, ...rest }, children)
}

// Headline reveal, word by word. "[[word]]" paints a word blue; "|" forces a line break.
export function Headline({ as = 'h2', text, className = '', delay = 0 }) {
  const [ref, seen] = useInView(0.25)
  const plain = text.replace(/\[\[|\]\]|\|/g, '').replace(/\s+/g, ' ').trim()
  let n = 0
  return createElement(as, { ref, className: `hl ${seen ? 'in' : ''} ${className}`, 'aria-label': plain },
    text.split(' ').map((raw, i) => {
      if (raw === '|') return <br key={i} />
      const blue = raw.startsWith('[[')
      const word = raw.replace(/\[\[|\]\]/g, '')
      return (
        <span key={i} className="w" aria-hidden="true">
          <span className={blue ? 'blue' : ''} style={{ transitionDelay: `${delay + n++ * 60}ms` }}>{word}&nbsp;</span>
        </span>
      )
    }))
}

// Elements with data-par="0.1" drift against the scroll for depth.
export function useParallax() {
  useEffect(() => {
    let raf
    const run = () => {
      const vh = window.innerHeight
      document.querySelectorAll('[data-par]').forEach((el) => {
        const r = el.parentElement.getBoundingClientRect()
        const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.par)
        el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`
      })
    }
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(run) }
    run()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
}
