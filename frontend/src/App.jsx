import { Footer, Nav } from './components/Chrome.jsx'
import Hero from './components/Hero.jsx'
import Lab from './components/Lab.jsx'
import Stage from './components/Stage.jsx'
import { About, CTA, Explode, Journey, Methods, Results, Trust } from './components/Sections.jsx'
import { useParallax } from './hooks.jsx'

export default function App() {
  useParallax()
  return (
    <>
      <Stage />
      <Nav />
      <main>
        <Hero />
        <About />
        <Explode />
        <Journey />
        <Methods />
        <Lab />
        <Results />
        <Trust />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
