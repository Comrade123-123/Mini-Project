import { Reveal } from '../hooks.jsx'

export default function Hero() {
  return (
    <section id="top" className="hero">
      <div className="ghost" data-par="0.05" aria-hidden="true">CLARITY<br />REVEALED</div>

      <div className="hero-copy">
        <Reveal as="span" className="eyebrow-s">Next-generation explainable medical AI</Reveal>
        <h1 className="h1">
          <span className="ln"><span>Clarity</span></span>
          <span className="ln"><span>Beyond the</span></span>
          <span className="ln"><span className="blue">Prediction.</span></span>
        </h1>
        <Reveal as="p" className="sub" delay={500}>
          Two explanation methods.<br />One prediction.<br />A clearer view of the evidence.
        </Reveal>
        <Reveal delay={650}><a href="#about" className="round" aria-label="Scroll to about">↘</a></Reveal>
      </div>

      <Reveal className="idx" delay={800} aria-hidden="true"><b>01</b><i /><span>02</span><span>03</span></Reveal>

      <Reveal className="stats" delay={700}>
        <div><b>2</b><span>Methods compared</span></div>
        <div><b>5</b><span>Evaluation criteria</span></div>
        <div><b>1</b><span>Shared CNN</span></div>
      </Reveal>

      <div className="scroll-hint" aria-hidden="true"><span>Scroll to discover</span><i /></div>

      <a href="#explode" className="watch">
        <span>Watch the<br />pipeline</span>
        <i className="play"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg></i>
      </a>
    </section>
  )
}
