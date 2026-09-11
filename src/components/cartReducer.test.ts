import { describe, expect, it } from 'vitest'

import { type Action, type State, cartReducer, initial } from './cartReducer'

const notebook = { id: 1, name: 'Notebook, dotted', price: 9 }
const pen = { id: 2, name: 'Fountain pen, fine', price: 34 }

// Reduce a sequence of actions from the empty cart, the way a component would.
function run(...actions: Action[]): State {
  return actions.reduce(cartReducer, initial)
}

describe('cartReducer', () => {
  it('adds a new line with quantity 1', () => {
    expect(run({ type: 'added', line: notebook }).lines).toEqual([{ ...notebook, qty: 1 }])
  })

  it('adding a line that is already in the cart increments its quantity instead', () => {
    const state = run({ type: 'added', line: notebook }, { type: 'added', line: notebook })
    expect(state.lines).toEqual([{ ...notebook, qty: 2 }])
  })

  it('drops a line whose quantity is changed to zero', () => {
    const state = run(
      { type: 'added', line: notebook },
      { type: 'quantity_changed', id: notebook.id, delta: -1 },
    )
    expect(state.lines).toEqual([])
  })

  it('removes only the named line', () => {
    const state = run(
      { type: 'added', line: notebook },
      { type: 'added', line: pen },
      { type: 'removed', id: notebook.id },
    )
    expect(state.lines.map((l) => l.id)).toEqual([pen.id])
  })

  it('writes a human-readable entry for every action, newest first', () => {
    const state = run(
      { type: 'added', line: notebook },
      { type: 'quantity_changed', id: notebook.id, delta: 1 },
      { type: 'quantity_changed', id: notebook.id, delta: -1 },
      { type: 'removed', id: notebook.id },
    )
    expect(state.log).toEqual([
      'removed #1',
      'quantity_changed #1 -1',
      'quantity_changed #1 +1',
      'added #1',
    ])
  })

  it('reset returns to the initial state, log included', () => {
    expect(run({ type: 'added', line: notebook }, { type: 'reset' })).toBe(initial)
  })

  it('never mutates the state it is given', () => {
    const before = run({ type: 'added', line: notebook })
    const snapshot = structuredClone(before)
    cartReducer(before, { type: 'quantity_changed', id: notebook.id, delta: 1 })
    cartReducer(before, { type: 'removed', id: notebook.id })
    expect(before).toEqual(snapshot)
  })
})
