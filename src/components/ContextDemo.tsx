import { MoonIcon, PlusIcon, SunIcon } from '@phosphor-icons/react'
import { createContext, memo, useContext, useMemo, useState } from 'react'

import { useRenderCount } from '../hooks/useRenderCount'
import { Reveal } from './Reveal'
import { Button, Code, H2, Lede, Section } from './ui'

type Theme = 'light' | 'dark'
type Mode = 'single' | 'split'

// One context carrying an object...
const SingleContext = createContext<{ theme: Theme; count: number }>({ theme: 'light', count: 0 })
// ...versus two contexts carrying one value each.
const ThemeContext = createContext<Theme>('light')
const CountContext = createContext(0)

// Every consumer below is memoised, so the only thing that can re-render it
// is the context it reads.

function Consumer({ label, value, renders }: { label: string; value: string; renders: number }) {
  return (
    <div className="rounded-surface border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-2 font-mono text-xl text-zinc-900 dark:text-zinc-50">{value}</p>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        renders:{' '}
        <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-50">{renders}</span>
      </p>
    </div>
  )
}

const ThemeReaderSingle = memo(function ThemeReaderSingle() {
  const { theme } = useContext(SingleContext)
  const renders = useRenderCount()
  return <Consumer label="reads theme" value={theme} renders={renders} />
})
const CountReaderSingle = memo(function CountReaderSingle() {
  const { count } = useContext(SingleContext)
  const renders = useRenderCount()
  return <Consumer label="reads count" value={String(count)} renders={renders} />
})
const ThemeReaderSplit = memo(function ThemeReaderSplit() {
  const theme = useContext(ThemeContext)
  const renders = useRenderCount()
  return <Consumer label="reads theme" value={theme} renders={renders} />
})
const CountReaderSplit = memo(function CountReaderSplit() {
  const count = useContext(CountContext)
  const renders = useRenderCount()
  return <Consumer label="reads count" value={String(count)} renders={renders} />
})

function Demo() {
  const [theme, setTheme] = useState<Theme>('light')
  const [count, setCount] = useState(0)
  const [mode, setMode] = useState<Mode>('single')
  // Memoised so the provider's identity only changes when its contents do;
  // both readers still re-render on either change, which is the point.
  const single = useMemo(() => ({ theme, count }), [theme, count])

  const consumers =
    mode === 'single' ? (
      <SingleContext.Provider value={single}>
        <ThemeReaderSingle />
        <CountReaderSingle />
      </SingleContext.Provider>
    ) : (
      <ThemeContext.Provider value={theme}>
        <CountContext.Provider value={count}>
          <ThemeReaderSplit />
          <CountReaderSplit />
        </CountContext.Provider>
      </ThemeContext.Provider>
    )

  return (
    <div className="rounded-surface border border-zinc-200 bg-zinc-100 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Native radios: the browser supplies the group semantics and arrow-key
          navigation that a `role="radio"` button would have to reimplement. */}
      <fieldset className="inline-flex rounded-full border border-zinc-300 p-0.5 dark:border-zinc-700">
        <legend className="sr-only">Context shape</legend>
        {(['single', 'split'] as const).map((m) => (
          <label
            key={m}
            className="cursor-pointer rounded-full px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:text-zinc-900 has-checked:bg-zinc-900 has-checked:text-zinc-50 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 dark:text-zinc-400 dark:hover:text-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
          >
            <input
              type="radio"
              name="context-shape"
              value={m}
              checked={mode === m}
              onChange={() => setMode(m)}
              className="sr-only"
            />
            {m === 'single' ? 'One context, one object' : 'Two contexts, one value each'}
          </label>
        ))}
      </fieldset>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">{consumers}</div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setCount((c) => c + 1)}>
          <PlusIcon size={14} weight="bold" /> count
        </Button>
        <Button
          variant="secondary"
          onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
        >
          {theme === 'light' ? (
            <MoonIcon size={14} weight="bold" />
          ) : (
            <SunIcon size={14} weight="bold" />
          )}{' '}
          theme
        </Button>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {mode === 'single'
          ? 'Press "count". Both boxes re-render, including the one that never reads count. The provider value is a new object every time, so every consumer is told it changed.'
          : 'Press "count". Only the box that reads count re-renders. Each context carries one value, so consumers of the other are left alone.'}
      </p>
    </div>
  )
}

export function ContextDemo() {
  return (
    <Section id="context" className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <H2>Context is a delivery mechanism, not a store.</H2>
          <Lede>
            Every consumer of a context re-renders when its value changes, and there is no way to
            subscribe to part of it. That is fine for a theme. It is expensive for anything that
            updates often.
          </Lede>
          <Code className="mt-8">{`// Every consumer re-renders on any change:
<AppContext.Provider value={{ theme, count }}>

// Consumers of theme are untouched by count:
<ThemeContext.Provider value={theme}>
  <CountContext.Provider value={count}>`}</Code>
          <p className="mt-6 max-w-[60ch] text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            When splitting contexts stops scaling, that is the signal for an external store, whose
            selectors let each component subscribe to exactly the slice it renders.
          </p>
        </Reveal>
        <Reveal delay={0.05} className="lg:col-span-7">
          <Demo />
        </Reveal>
      </div>
    </Section>
  )
}
