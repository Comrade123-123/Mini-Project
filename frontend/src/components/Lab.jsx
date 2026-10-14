import { useRef, useState } from 'react'
import { explain } from '../api.js'
import { Headline, Reveal } from '../hooks.jsx'

function Upload({ preview, onPick }) {
  const input = useRef()
  const [drag, setDrag] = useState(false)
  const take = (f) => f && f.type.startsWith('image/') && onPick(f)
  return (
    <div
      className={`drop ${drag ? 'drag' : ''}`}
      role="button" tabIndex={0}
      onClick={() => input.current.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]) }}
    >
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => take(e.target.files[0])} />
      {preview
        ? <img src={preview} alt="Selected medical scan" />
        : <p><b>Drop a scan here</b><span>Chest X-ray or skin lesion image, or click to browse</span></p>}
    </div>
  )
}

function Panel({ title, note, src, heatmap, opacity = 1 }) {
  return (
    <figure className="panel">
      <div className="stack">
        <img src={src} alt={title} />
        {heatmap && <img className="heat" src={heatmap} alt={`${title} heatmap`} style={{ opacity }} />}
      </div>
      <figcaption><b>{title}</b><span>{note}</span></figcaption>
    </figure>
  )
}

export default function Lab() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [steps, setSteps] = useState(50)
  const [opacity, setOpacity] = useState(0.7)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pick = (f) => { setFile(f); setResult(null); setError(null); setPreview(URL.createObjectURL(f)) }
  const run = async () => {
    setLoading(true); setError(null)
    try { setResult(await explain(file, { steps })) }
    catch (e) { setError(e.message || 'Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <section id="lab" className="lab solid">
      <span className="eyebrow"><i />The lab</span>
      <Headline text="Try it on your [[own scan.]]" className="h2 left" />

      <Reveal className="labgrid" delay={100}>
        <div className="controls">
          <Upload preview={preview} onPick={pick} />
          <label className="range">
            <span>Integration steps <b>{steps}</b></span>
            <input type="range" min="10" max="300" step="10" value={steps} onChange={(e) => setSteps(+e.target.value)} />
          </label>
          <button className="btn full" disabled={!file || loading} onClick={run}>
            {loading ? 'Analysing…' : 'Classify and explain'} <span aria-hidden="true">↗</span>
          </button>
          {error && <p className="error">{error}</p>}
          <p className="note">Research and educational use only. Not a diagnostic tool.</p>
        </div>

        <div className="out">
          {!result ? (
            <div className="empty"><b>Awaiting a scan</b><span>Prediction, both explanations and a comparison will appear here.</span></div>
          ) : (
            <>
              <div className="pred">
                <small>Prediction{result.mock ? ' · demo data' : ''}</small>
                <h3>{result.prediction.label} <em>{(result.prediction.confidence * 100).toFixed(1)}%</em></h3>
                {Object.entries(result.prediction.probs).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} className="bar-row">
                    <span>{k}</span><div className="bar"><i style={{ width: `${v * 100}%` }} /></div><span>{(v * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <div className="panels">
                <Panel title="Original" note="Input" src={preview} />
                <Panel title="Grad-CAM" note={`Coarse · ${result.gradcam.ms} ms`} src={preview} heatmap={result.gradcam.heatmap} opacity={opacity} />
                <Panel title="Integrated Gradients" note={`${result.ig.steps} steps · ${result.ig.ms} ms`} src={preview} heatmap={result.ig.heatmap} opacity={opacity} />
              </div>
              <label className="range">
                <span>Overlay opacity <b>{Math.round(opacity * 100)}%</b></span>
                <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
              </label>
              {result.metrics?.agreement != null && (
                <p className="agree"><b>{(result.metrics.agreement * 100).toFixed(0)}%</b><span>Method agreement. Low agreement means the two methods highlight different evidence.</span></p>
              )}
            </>
          )}
        </div>
      </Reveal>
    </section>
  )
}
