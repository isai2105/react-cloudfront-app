import { ArrowCounterClockwiseIcon, MinusIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { useReducer } from 'react'

import { Reveal } from './Reveal'
import { Button, Code, H2, Lede, Section } from './ui'

type Line = { id: number; name: string; qty: number; price: number }

type State = {
  lines: Line[]
  log: string[]
}

type Action =
  | { type: 'added'; line: Omit<Line, 'qty'> }
  | { type: 'quantity_changed'; id: number; delta: number }
  | { type: 'removed'; id: number }
  | { type: 'reset' }

const catalogue: Omit<Line, 'qty'>[] = [
  { id: 1, name: 'Notebook, dotted', price: 9 },
  { id: 2, name: 'Fountain pen, fine', price: 34 },
  { id: 3, name: 'Ink, blue-black', price: 12 },
]

const initial: State = { lines: [], log: [] }

function reducer(state: State, action: Action): State {
  const entry = describe(action)
  switch (action.type) {
    case 'added': {
      const existing = state.lines.find((l) => l.id === action.line.id)
      const lines = existing
        ? state.lines.map((l) => (l.id === action.line.id ? { ...l, qty: l.qty + 1 } : l))
        : [...state.lines, { ...action.line, qty: 1 }]
      return { lines, log: [entry, ...state.log] }
    }
    case 'quantity_changed': {
      const lines = state.lines
        .map((l) => (l.id === action.id ? { ...l, qty: l.qty + action.delta } : l))
        .filter((l) => l.qty > 0)
      return { lines, log: [entry, ...state.log] }
    }
    case 'removed':
      return { lines: state.lines.filter((l) => l.id !== action.id), log: [entry, ...state.log] }
    case 'reset':
      return initial
  }
}

function describe(action: Action): string {
  switch (action.type) {
    case 'added':
      return `added #${action.line.id}`
    case 'quantity_changed':
      return `quantity_changed #${action.id} ${action.delta > 0 ? '+' : ''}${action.delta}`
    case 'removed':
      return `removed #${action.id}`
    case 'reset':
      return 'reset'
  }
}

function Cart() {
  const [state, dispatch] = useReducer(reducer, initial)
  const total = state.lines.reduce((sum, l) => sum + l.qty * l.price, 0)

  return (
    <div className="grid gap-6 rounded-surface border border-zinc-200 bg-white p-5 md:grid-cols-[1.2fr_1fr] dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex flex-wrap gap-2">
          {catalogue.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              onClick={() => dispatch({ type: 'added', line: item })}
            >
              <PlusIcon size={14} weight="bold" /> {item.name}
            </Button>
          ))}
        </div>

        <div className="mt-5 min-h-32">
          {state.lines.length === 0 ? (
            <p className="rounded-surface border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Nothing in the cart. Add an item to dispatch the first action.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {state.lines.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-zinc-800 dark:text-zinc-200">{l.name}</span>
                  <span className="flex items-center gap-1">
                    <button
                      aria-label={`Decrease ${l.name}`}
                      className="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      onClick={() => dispatch({ type: 'quantity_changed', id: l.id, delta: -1 })}
                    >
                      <MinusIcon size={14} weight="bold" />
                    </button>
                    <span className="w-6 text-center font-mono tabular-nums">{l.qty}</span>
                    <button
                      aria-label={`Increase ${l.name}`}
                      className="rounded-full p-1.5 text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      onClick={() => dispatch({ type: 'quantity_changed', id: l.id, delta: 1 })}
                    >
                      <PlusIcon size={14} weight="bold" />
                    </button>
                    <button
                      aria-label={`Remove ${l.name}`}
                      className="ml-2 rounded-full p-1.5 text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      onClick={() => dispatch({ type: 'removed', id: l.id })}
                    >
                      <TrashIcon size={14} weight="bold" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Total</span>
          <span className="font-mono text-lg text-zinc-900 tabular-nums dark:text-zinc-50">
            {total} EUR
          </span>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Dispatched actions</span>
          <Button
            variant="secondary"
            className="px-3 py-1 text-xs"
            onClick={() => dispatch({ type: 'reset' })}
            disabled={state.log.length === 0}
          >
            <ArrowCounterClockwiseIcon size={12} weight="bold" /> reset
          </Button>
        </div>
        <ol className="mt-3 max-h-56 flex-1 overflow-y-auto rounded-surface bg-zinc-100 p-3 font-mono text-[13px] leading-6 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
          {state.log.length === 0 ? (
            <li className="text-zinc-400 dark:text-zinc-600">(empty)</li>
          ) : (
            state.log.map((entry, i) => <li key={`${state.log.length - i}-${entry}`}>{entry}</li>)
          )}
        </ol>
      </div>
    </div>
  )
}

export function ReducerDemo() {
  return (
    <Section id="reducer" className="border-t border-zinc-200 dark:border-zinc-800">
      <Reveal>
        <H2>When several updates touch the same object, describe events, not edits.</H2>
        <Lede>
          A reducer turns a pile of setState calls into one function you can read top to bottom and
          test without rendering anything. Every change to the cart below is an action.
        </Lede>
      </Reveal>

      <Reveal delay={0.05} className="mt-12">
        <Cart />
      </Reveal>

      <Reveal delay={0.1} className="mt-8 grid gap-6 md:grid-cols-2">
        <Code>{`type Action =
  | { type: 'added'; line: Line }
  | { type: 'quantity_changed'; id: number; delta: number }
  | { type: 'removed'; id: number }
  | { type: 'reset' }

const [state, dispatch] = useReducer(reducer, initial)`}</Code>
        <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <p>
            The rule of thumb: reach for <span className="font-mono text-[13px]">useReducer</span>{' '}
            when the next state depends on the previous one in more than one way, or when two fields
            must change together. Otherwise <span className="font-mono text-[13px]">useState</span>{' '}
            is shorter and just as correct.
          </p>
          <p className="mt-4">
            Name actions after what happened, in the past tense. A reducer that receives{' '}
            <span className="font-mono text-[13px]">set_quantity</span> is a setter with extra
            steps; one that receives <span className="font-mono text-[13px]">quantity_changed</span>{' '}
            can decide what that means.
          </p>
        </div>
      </Reveal>
    </Section>
  )
}
