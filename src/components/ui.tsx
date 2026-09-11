import type { ButtonHTMLAttributes, ReactNode } from 'react'

// The small shared vocabulary every section uses. One radius scale, one
// accent, one code-block treatment, so sections cannot drift from each other.

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[transform,background-color] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600'
  const look =
    variant === 'primary'
      ? 'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-500 dark:text-zinc-950 dark:hover:bg-accent-200'
      : 'border border-zinc-300 text-zinc-800 hover:bg-zinc-200/60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800'
  return <button className={`${base} ${look} ${className}`} {...rest} />
}

export function Code({ children, className = '' }: { children: string; className?: string }) {
  return (
    <pre
      className={`overflow-x-auto rounded-surface border border-zinc-200 bg-zinc-100 p-4 font-mono text-[13px] leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 ${className}`}
    >
      <code>{children}</code>
    </pre>
  )
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-mono text-2xl text-zinc-900 tabular-nums dark:text-zinc-50">
        {value}
      </span>
    </div>
  )
}

export function Section({
  id,
  children,
  className = '',
}: {
  id: string
  children: ReactNode
  className?: string
}) {
  return (
    <section id={id} className={`scroll-mt-20 px-4 py-20 md:py-28 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </section>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="max-w-[24ch] text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
      {children}
    </h2>
  )
}

export function Lede({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
      {children}
    </p>
  )
}
