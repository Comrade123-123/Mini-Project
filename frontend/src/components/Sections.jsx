import { useEffect, useMemo, useState } from 'react'
import { Headline, Reveal, useScrollProgress } from '../hooks.jsx'
import { methodImage } from '../three/textures.js'

const Eyebrow = ({ children }) => <span className="eyebrow"><i />{children}</span>

// ---------- About ----------
export function About() {
  return (
    <section id="about" className="about">
      <div className="ghost g2" data-par="-0.06" aria-hidden="true">EXPLAINED</div>
      <Eyebrow>About Lumen</Eyebrow>
      <Headline text="Designed for research that cannot compromise on [[rigor.]]" className="h2 left" />
      <Reveal className="two" delay={150}>
        <p>Lumen trains a CNN on medical images, then asks it why. Grad-CAM and Integrated Gradients explain the same prediction on the same image, so the two views can be compared fairly.</p>
        <p>The goal is not a better score. It is a clearer answer to a harder question: which evidence did the model actually use?</p>
      </Reveal>
    </section>
  )
}

// ---------- Exploded view (pinned, driven by the same scroll as the 3D stack) ----------
const PARTS = [
  { n: '01', t: 'The lungs', d: 'Both lung fields enter the model as one image. This is the territory it has to localize.' },
  { n: '02', t: 'The airways', d: 'Trachea and bronchi give anatomical landmarks for judging whether a map makes sense.' },
  { n: '03', t: 'The evidence', d: 'Grad-CAM paints smooth regions, Integrated Gradients paints fine grain, on the same lungs.' },
]

export function Explode() {
  const [ref, p] = useScrollProgress()
  const active = p < 0.34 ? -1 : p < 0.57 ? 0 : p < 0.79 ? 1 : 2
  return (
    <section id="explode" className="explode" ref={ref}>
      <div className="sticky">
        <div className="ex-left">
          <Eyebrow>The pipeline</Eyebrow>
          <Headline text="Explanation becomes [[understandable.]]" className="h2 left" />
          <p className="lede">An exploded view turns an invisible decision into a simple story. Three steps, one question: why did the model say that?</p>
          <div className="parts">
            {PARTS.map((x, i) => (
              <div key={x.n} className={`part ${active === i ? 'on' : ''}`}>
                <span className="num">{x.n}</span>
                <h3>{x.t}</h3><hr /><p>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------- Journey ----------
const STEPS = [
  { n: '01', t: 'Train the CNN', d: 'One classifier on one medical dataset, shared by both methods.' },
  { n: '02', t: 'Explain two ways', d: 'Grad-CAM and Integrated Gradients on the same predictions.' },
  { n: '03', t: 'Compare fairly', d: 'Localization, consistency, cost and clinical usefulness, side by side.' },
  { n: '04', t: 'Interpret with care', d: 'Neither map alone proves trust. Read them together, sceptically.' },
]

export function Journey() {
  const [on, setOn] = useState(1)
  useEffect(() => {
    const t = setInterval(() => setOn((i) => (i + 1) % STEPS.length), 3600)
    return () => clearInterval(t)
  }, [])
  return (
    <section className="journey solid">
      <div className="jhead">
        <Reveal as="p" className="small">The study mirrors how a careful reader decides: reduce doubt, build understanding, prove the method, and make the next step safe.</Reveal>
        <Headline text="From uncertainty to | informed [[confidence.]]" className="h2 right" />
      </div>
      <div className="ghost g3" data-par="0.05" aria-hidden="true">CONFIDENCE</div>
      <div className="steps">
        {STEPS.map((s, i) => (
          <article key={s.n} className={`step ${on === i ? 'on' : ''}`} onMouseEnter={() => setOn(i)}>
            <span className="bignum" aria-hidden="true">{s.n}</span>
            <h3>{s.t}</h3><hr /><p>{s.d}</p>
          </article>
        ))}
      </div>
      <Reveal className="flow">
        {['Uncertainty', 'Clarity', 'Proof', 'Confidence', 'Action'].map((w, i, a) => <span key={w}>{w}{i < a.length - 1 && <em>→</em>}</span>)}
      </Reveal>
    </section>
  )
}

// ---------- Methods ----------
export function Methods() {
  const imgs = useMemo(() => ({ grad: methodImage('grad'), ig: methodImage('ig'), split: methodImage('split') }), [])
  const cards = [
    { n: '01', t: 'Grad-CAM', d: 'Gradients flow into the last convolutional layer and become a coarse, class-specific heatmap. One backward pass.', img: imgs.grad },
    { n: '02', t: 'Integrated Gradients', d: 'Gradients accumulate along a path from a baseline to the real image, giving pixel-level credit. Many steps.', img: imgs.ig },
    { n: '03', t: 'Side by side', d: 'The same prediction, explained twice. Where the two agree is stronger evidence than either alone.', img: imgs.split },
  ]
  return (
    <section id="technology" className="methods solid soft">
      <div className="ghost g4" data-par="-0.04" aria-hidden="true">DIGITAL</div>
      <Eyebrow>Method</Eyebrow>
      <div className="mhead">
        <Headline text="Every clear read starts with the right [[method.]]" className="h2 left" />
        <Reveal as="p" className="small" delay={150}>Both techniques are post-hoc: no change to the trained network. They differ in resolution, cost and what they are sensitive to.</Reveal>
      </div>
      <div className="cards">
        {cards.map((c, i) => (
          <Reveal key={c.n} className="mcard" delay={i * 100}>
            <div className="mimg"><img src={c.img} alt={`${c.t} explanation on a chest X-ray`} loading="lazy" /></div>
            <div className="mtxt">
              <div><span className="num">{c.n}</span><h3>{c.t}</h3><i className="u" /></div>
              <p>{c.d}</p>
            </div>
            <a href="#lab" className="round sm" aria-label={`Try ${c.t} in the lab`}>↗</a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ---------- Results ----------
const CRIT = ['Localization', 'Interpretability', 'Consistency', 'Compute cost', 'Clinical usefulness']
const ROWS = [
  ['Output resolution', 'Coarse, feature-map level, upsampled', 'Fine, pixel level'],
  ['Mechanism', 'Gradient-weighted conv feature maps', 'Path-integrated input gradients'],
  ['Compute cost', 'Low: one backward pass', 'Higher: many integration steps'],
  ['Model access', 'Conv activations and gradients', 'Input gradients only'],
  ['Main knob', 'Which conv layer', 'Baseline and step count'],
  ['Ease of reading', 'Broad regions, easier', 'Granular, can look noisy'],
]

export function Results() {
  return (
    <section id="results" className="results solid">
      <Eyebrow>Results</Eyebrow>
      <Headline text="Real criteria. Real comparison. [[Real limits.]]" className="h2 left" />
      <Reveal className="crit" delay={100}>
        {CRIT.map((c, i) => <div key={c}><b>0{i + 1}</b><span>{c}</span></div>)}
      </Reveal>
      <Reveal className="table" delay={150}>
        <div className="tr th"><span>Criterion</span><span>Grad-CAM</span><span>Integrated Gradients</span></div>
        {ROWS.map(([a, b, c]) => <div className="tr" key={a}><span>{a}</span><span>{b}</span><span>{c}</span></div>)}
      </Reveal>
      <p className="foot-note">Quantitative results depend on the dataset and are filled in from experiments, never assumed.</p>
    </section>
  )
}

// ---------- Trust ----------
export function Trust() {
  return (
    <section id="trust" className="trust solid soft">
      <Eyebrow>Trust and limits</Eyebrow>
      <Headline text="Evidence, [[not a verdict.]]" className="h2 left" />
      <Reveal className="quote" delay={100}>
        <span className="qm" aria-hidden="true">“</span>
        <p>Grad-CAM and Integrated Gradients offer complementary rather than strictly comparable views of model behavior, and neither technique alone is sufficient to establish clinical trustworthiness.</p>
        <small>From the Lumen research paper, conclusion</small>
      </Reveal>
      <div className="three">
        {[
          ['Not a diagnostic tool', 'A research and educational artifact. It never replaces qualified clinical judgment.'],
          ['Dataset-bound', 'Results depend on the data, the architecture and the layer or baseline chosen.'],
          ['Plausible is not faithful', 'A convincing heatmap can still be wrong. Sanity checks matter as much as pictures.'],
        ].map(([t, d], i) => <Reveal key={t} className="tcard" delay={i * 90}><h3>{t}</h3><p>{d}</p></Reveal>)}
      </div>
    </section>
  )
}

// ---------- CTA ----------
export function CTA() {
  return (
    <section className="cta solid">
      <div className="ghost g5" data-par="0.04" aria-hidden="true">LUMEN</div>
      <Headline text="See what your model [[actually sees.]]" className="h2 center" />
      <Reveal as="p" className="small c" delay={150}>Upload a scan and watch both explanation methods work on the same prediction.</Reveal>
      <Reveal delay={250}><a href="#lab" className="btn">Open the lab <span aria-hidden="true">↗</span></a></Reveal>
    </section>
  )
}
