import { ArrowUpRightIcon } from '@phosphor-icons/react'

const reading = [
  {
    label: 'Choosing the state structure',
    href: 'https://react.dev/learn/choosing-the-state-structure',
  },
  {
    label: 'Sharing state between components',
    href: 'https://react.dev/learn/sharing-state-between-components',
  },
  {
    label: 'Scaling up with reducer and context',
    href: 'https://react.dev/learn/scaling-up-with-reducer-and-context',
  },
  { label: 'useSyncExternalStore', href: 'https://react.dev/reference/react/useSyncExternalStore' },
]

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 px-4 py-16 dark:border-zinc-800">
      <div className="mx-auto grid w-full max-w-6xl gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Further reading
          </h2>
          <ul className="mt-4 grid gap-2">
            {reading.map((r) => (
              <li key={r.href}>
                <a
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
                >
                  {r.label}
                  <ArrowUpRightIcon size={14} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className="max-w-[48ch] self-end text-sm leading-relaxed text-zinc-500 md:justify-self-end dark:text-zinc-400">
          A single page, built with React, TypeScript, Vite and Tailwind. Every demo on it is real
          component state; nothing is a screenshot.
        </p>
      </div>
    </footer>
  )
}
