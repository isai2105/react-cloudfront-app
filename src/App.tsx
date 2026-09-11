import { ContextDemo } from './components/ContextDemo'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Kinds } from './components/Kinds'
import { Ladder } from './components/Ladder'
import { Libraries } from './components/Libraries'
import { Nav } from './components/Nav'
import { ReducerDemo } from './components/ReducerDemo'

function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ladder />
        <Kinds />
        <ReducerDemo />
        <ContextDemo />
        <Libraries />
      </main>
      <Footer />
    </>
  )
}

export default App
