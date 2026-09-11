import { Reveal } from './Reveal'
import { H2, Lede, Section } from './ui'

const rungs = [
  {
    title: 'Keep it in the component',
    body: 'If only one component reads and writes it, useState there is the whole answer. Most state stops here.',
    code: 'const [open, setOpen] = useState(false)',
  },
  {
    title: 'Lift it to the closest common parent',
    body: 'When two siblings need the same value, move it up one level and pass it down. Not to the root: to the nearest ancestor that owns both.',
    code: '<Filters value={query} onChange={setQuery} />\n<Results query={query} />',
  },
  {
    title: 'Put it in context',
    body: 'When a value is read far below where it is set, and it rarely changes, context removes the prop chain. Theme, locale, the current user.',
    code: 'const user = useContext(UserContext)',
  },
  {
    title: 'Move it to an external store',
    body: 'When many unrelated parts of the tree read and write it at different rates, a store lets each subscriber re-render on its own slice.',
    code: 'const total = useStore((s) => s.cart.total)',
  },
  {
    title: 'Stop owning it: it is server data',
    body: 'If the source of truth is an API, do not copy it into state. Cache it, key it by its inputs, and let a query library handle refetching.',
    code: "useQuery({ queryKey: ['orders', id], queryFn })",
  },
]

export function Ladder() {
  return (
    <Section id="where" className="border-t border-zinc-200 dark:border-zinc-800">
      <Reveal>
        <H2>Start at the bottom of the ladder. Climb only when forced.</H2>
        <Lede>
          Each rung costs more indirection than the one below it. The common mistake is starting at
          the top because it feels future-proof.
        </Lede>
      </Reveal>

      <div className="mt-14 grid gap-y-10 md:grid-cols-[1fr_2fr]">
        {rungs.map((r, i) => (
          <Reveal
            key={r.title}
            delay={i * 0.05}
            className="grid gap-x-12 gap-y-3 md:col-span-2 md:grid-cols-subgrid"
          >
            <div className="flex items-baseline gap-4 md:justify-end md:text-right">
              <span className="font-mono text-sm text-accent-600 dark:text-accent-200">
                {i + 1}
              </span>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">{r.title}</h3>
            </div>
            <div className="border-l border-zinc-200 pl-6 md:border-l-0 md:pl-0 dark:border-zinc-800">
              <p className="max-w-[60ch] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {r.body}
              </p>
              <pre className="mt-3 overflow-x-auto font-mono text-[13px] text-zinc-800 dark:text-zinc-300">
                <code>{r.code}</code>
              </pre>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
