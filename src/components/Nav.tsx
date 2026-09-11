const links = [
  { href: '#where', label: 'Where it lives' },
  { href: '#kinds', label: 'Kinds of state' },
  { href: '#reducer', label: 'Reducers' },
  { href: '#context', label: 'Context' },
  { href: '#libraries', label: 'Libraries' },
]

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-20 h-16 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4">
        <a href="#top" className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          React state, explained
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
