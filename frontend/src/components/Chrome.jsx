import { useEffect, useRef, useState } from 'react'

// Wordmark: the U holds a light that drifts toward the pointer.
export function Logo() {
  const dot = useRef(null)
  useEffect(() => {
    const move = (e) => {
      const el = dot.current
      if (!el) return
      const r = el.ownerSVGElement.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 240) * 1.6
      el.style.transform = `translate(${(dx / d) * k}px, ${Math.max(-1.2, Math.min(2.2, (dy / d) * k))}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <span className="wm" aria-label="Lumen">
      <span aria-hidden="true">L</span>
      <svg className="wu" viewBox="0 0 22 25" aria-hidden="true">
        <path d="M4 0 V14 A7 7 0 0 0 18 14 V0" fill="none" stroke="currentColor" strokeWidth="4.6" />
        <circle ref={dot} cx="11" cy="11" r="2.4" fill="#1d4ee0" className="wd" />
      </svg>
      <span aria-hidden="true">MEN</span>
    </span>
  )
}

export function Nav() {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 30)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <header className={`nav ${solid ? 'solid' : ''}`}>
      <a href="#top" className="logo" aria-label="Lumen, back to top"><Logo /></a>
      <nav className="links" aria-label="Primary">
        <a href="#about">About</a>
        <a href="#technology">Method</a>
        <a href="#lab">Lab</a>
        <a href="#results">Results</a>
        <a href="#trust">Ethics</a>
      </nav>
      <a href="#lab" className="pill">Open the lab <span aria-hidden="true">↗</span></a>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="fcols">
        <div><b>Lumen</b><p>An explainability study comparing Grad-CAM and Integrated Gradients on medical image classifiers.</p></div>
        <div><b>Explore</b><a href="#about">About</a><a href="#technology">Method</a><a href="#lab">Lab</a><a href="#results">Results</a></div>
        <div><b>References</b><span>Selvaraju et al. · Grad-CAM</span><span>Sundararajan et al. · Integrated Gradients</span><span>Adebayo et al. · Sanity checks</span></div>
      </div>
      <p className="disc">Research and educational use only. Lumen is not a diagnostic tool and does not replace qualified clinical judgment.</p>
      <div className="ghost-foot" aria-hidden="true">LUMEN</div>
    </footer>
  )
}
