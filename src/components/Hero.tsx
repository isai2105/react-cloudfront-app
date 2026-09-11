import { ArrowDown, Minus, Plus } from '@phosphor-icons/react'
import { useRef, useState } from 'react'

import { Button, Code, Stat } from './ui'

// A real component preview: this is the component the copy is describing,
// rendered live, not a picture of one.
function StateProbe() {
  const [count, setCount] = useState(0)
  const [tags, setTags] = useState<string[]>(['react', 'state'])
  // Incremented during render on purpose: the number on screen is the number
  // of times React called this function. It is a demo instrument, not a
  // pattern to copy.
  const renders = useRef(0)
  // oxlint-disable-next-line react/refs -- the render count is the demo
  renders.current += 1

  return (
    <div className="rounded-surface border border-zinc-200 bg-white p-5 shadow-[0_1px_0_rgba(24,24,27,0.04),0_12px_32px_-16px_rgba(24,24,27,0.18)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="count" value={count} />
        <Stat label="tags.length" value={tags.length} />
        {/* oxlint-disable-next-line react/refs -- the render count is the demo */}
        <Stat label="renders" value={renders.current} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setCount((c) => c + 1)} aria-label="Increment count">
          <Plus size={16} weight="bold" /> count
        </Button>
        <Button variant="secondary" onClick={() => setCount((c) => c - 1)} aria-label="Decrement count">
          <Minus size={16} weight="bold" /> count
        </Button>
        <Button variant="secondary" onClick={() => setTags((t) => [...t])}>
          setTags([...tags])
        </Button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        The third button changes nothing you can see, yet the render count still moves. React
        compares state with <span className="font-mono text-[13px]">Object.is</span>: a new array is
        a new value, even with the same contents.
      </p>

      <Code className="mt-4">{`setTags(tags)       // same reference: bails out
setTags([...tags])  // new reference: renders`}</Code>
    </div>
  )
}

export function Hero() {
  return (
    <section id="top" className="px-4 pt-28 pb-16 md:pt-32 md:pb-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h1 className="max-w-[16ch] text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl lg:text-6xl dark:text-zinc-50">
            Most state bugs are placement bugs.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            A short, working guide to where React state should live, with live examples you can
            poke at.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => document.getElementById('where')?.scrollIntoView()}>
              Start reading <ArrowDown size={16} weight="bold" />
            </Button>
          </div>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <StateProbe />
        </div>
      </div>
    </section>
  )
}
