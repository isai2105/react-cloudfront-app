import { useState } from 'react'

import { Reveal } from './Reveal'
import { Code, H2, Lede, Section } from './ui'

type Lib = {
  name: string
  fit: string
  reach: string
  skip: string
  code: string
}

// A non-empty tuple type: `libraries[0]` narrows to `Lib` under
// `noUncheckedIndexedAccess`, so the fallback below needs no assertion.
const libraries = [
  {
    name: 'Zustand',
    fit: 'Small external store with selectors',
    reach:
      'Several distant parts of the tree read and write the same client state, and you want each to re-render only on its slice.',
    skip: 'The state is only needed by one subtree. Lift it or use context instead.',
    code: `const useCart = create((set) => ({
  lines: [],
  add: (line) => set((s) => ({ lines: [...s.lines, line] })),
}))

const count = useCart((s) => s.lines.length)`,
  },
  {
    name: 'Jotai',
    fit: 'Atoms, composed bottom-up',
    reach:
      'State is many small independent values, and derived values should recompute only when their inputs change.',
    skip: 'State is one large object updated by a fixed set of events. A reducer reads better.',
    code: `const queryAtom = atom('')
const resultsAtom = atom((get) =>
  search(get(queryAtom)),
)

const [query, setQuery] = useAtom(queryAtom)`,
  },
  {
    name: 'Redux Toolkit',
    fit: 'Event log with devtools',
    reach:
      'A large team needs one predictable place for client state, replayable actions, and middleware for cross-cutting concerns.',
    skip: 'The app is small, or most of the state is server data. RTK Query alone may be the part you want.',
    code: `const cart = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    added(state, action) { state.lines.push(action.payload) },
  },
})`,
  },
  {
    name: 'TanStack Query',
    fit: 'Server state as a keyed cache',
    reach:
      'Data comes from an API. You want caching, deduplication, background refetch, and loading and error states without writing them.',
    skip: 'The value never leaves the browser. A cache for UI state is a store with extra steps.',
    code: `const { data, isPending, error } = useQuery({
  queryKey: ['orders', customerId],
  queryFn: () => fetchOrders(customerId),
})`,
  },
  {
    name: 'XState',
    fit: 'Explicit states and transitions',
    reach:
      'A flow has named states and illegal transitions: checkout, media playback, a multi-step upload. Boolean flags have started to contradict each other.',
    skip: 'The state is a value, not a mode. A counter does not need a state chart.',
    code: `const upload = createMachine({
  initial: 'idle',
  states: {
    idle: { on: { SELECT: 'ready' } },
    ready: { on: { START: 'uploading' } },
    uploading: { on: { DONE: 'idle', FAIL: 'failed' } },
    failed: { on: { RETRY: 'uploading' } },
  },
})`,
  },
] as const satisfies readonly [Lib, ...Lib[]]

export function Libraries() {
  const [active, setActive] = useState(0)
  const lib = libraries[active] ?? libraries[0]

  return (
    <Section id="libraries" className="border-t border-zinc-200 dark:border-zinc-800">
      <Reveal>
        <H2>Libraries, by the problem they were built for.</H2>
        <Lede>
          None of these replaces the ladder. Each one is a good answer to one rung, and a poor
          answer to the others.
        </Lede>
      </Reveal>

      <Reveal delay={0.05} className="mt-12">
        <div
          role="tablist"
          aria-label="State libraries"
          className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]"
        >
          {libraries.map((l, i) => (
            <button
              key={l.name}
              role="tab"
              id={`lib-tab-${i}`}
              aria-selected={active === i}
              aria-controls="lib-panel"
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                active === i
                  ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500 dark:text-zinc-950'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-200/60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div
          id="lib-panel"
          role="tabpanel"
          aria-labelledby={`lib-tab-${active}`}
          className="mt-6 grid gap-8 rounded-surface border border-zinc-200 bg-white p-6 md:grid-cols-2 md:p-8 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {lib.name}
            </h3>
            <p className="mt-1 font-mono text-[13px] text-accent-700 dark:text-accent-200">{lib.fit}</p>
            <dl className="mt-6 grid gap-5 text-sm leading-relaxed">
              <div>
                <dt className="font-medium text-zinc-900 dark:text-zinc-50">Reach for it when</dt>
                <dd className="mt-1 text-zinc-600 dark:text-zinc-400">{lib.reach}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-900 dark:text-zinc-50">Skip it when</dt>
                <dd className="mt-1 text-zinc-600 dark:text-zinc-400">{lib.skip}</dd>
              </div>
            </dl>
          </div>
          <Code>{lib.code}</Code>
        </div>
      </Reveal>
    </Section>
  )
}
