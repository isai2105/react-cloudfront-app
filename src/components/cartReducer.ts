// The cart's state machine, kept apart from the component so it can be
// exercised without rendering anything — which is the section's own claim
// about reducers (see ReducerDemo).

export type Line = { id: number; name: string; qty: number; price: number }

export type State = {
  lines: Line[]
  log: string[]
}

export type Action =
  | { type: 'added'; line: Omit<Line, 'qty'> }
  | { type: 'quantity_changed'; id: number; delta: number }
  | { type: 'removed'; id: number }
  | { type: 'reset' }

export const initial: State = { lines: [], log: [] }

export function cartReducer(state: State, action: Action): State {
  const entry = describeAction(action)
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

export function describeAction(action: Action): string {
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
