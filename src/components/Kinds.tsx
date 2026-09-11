import { CloudArrowDown, Cursor, LinkSimple } from '@phosphor-icons/react'

import { Reveal } from './Reveal'
import { H2, Lede, Section } from './ui'

export function Kinds() {
  return (
    <Section id="kinds" className="border-t border-zinc-200 dark:border-zinc-800">
      <Reveal>
        <H2>Three kinds of state, three different owners.</H2>
        <Lede>
          Before choosing a tool, name which kind you are holding. Each one already has a natural
          home, and putting it anywhere else is where the bugs come from.
        </Lede>
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-2 md:grid-rows-2">
        <Reveal className="rounded-surface bg-accent-100 p-8 md:row-span-2 dark:bg-accent-900/40">
          <Cursor size={28} className="text-accent-700 dark:text-accent-200" />
          <h3 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            UI state
          </h3>
          <p className="mt-3 max-w-[40ch] leading-relaxed text-zinc-700 dark:text-zinc-300">
            Is the menu open. Which tab is selected. What has been typed but not submitted. It is
            born in the browser and dies with the page.
          </p>
          <p className="mt-6 max-w-[40ch] leading-relaxed text-zinc-700 dark:text-zinc-300">
            This is the state React was built for. It belongs in the component that renders it,
            or one level above. It almost never belongs in a global store.
          </p>
          <p className="mt-6 font-mono text-[13px] text-accent-700 dark:text-accent-200">
            useState, useReducer
          </p>
        </Reveal>

        <Reveal
          delay={0.05}
          className="rounded-surface border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <CloudArrowDown size={28} className="text-accent-700 dark:text-accent-200" />
          <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Server state
          </h3>
          <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Owned by an API you do not control. It can be stale the moment it arrives. Treat it as
            a cache with a key, not as a value you set.
          </p>
          <p className="mt-4 font-mono text-[13px] text-accent-700 dark:text-accent-200">
            TanStack Query, SWR, RTK Query
          </p>
        </Reveal>

        <Reveal
          delay={0.1}
          className="rounded-surface border border-zinc-200 bg-zinc-100 p-8 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <LinkSimple size={28} className="text-accent-700 dark:text-accent-200" />
          <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            URL state
          </h3>
          <p className="mt-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
            Filters, page numbers, the selected item. If a link should reproduce it, the address
            bar is the store. Read it from the router, do not copy it.
          </p>
          <p className="mt-4 font-mono text-[13px] text-accent-700 dark:text-accent-200">
            useSearchParams, route params
          </p>
        </Reveal>
      </div>
    </Section>
  )
}
