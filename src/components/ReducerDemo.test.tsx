import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ReducerDemo } from './ReducerDemo'

describe('ReducerDemo', () => {
  it('starts with an empty cart and a disabled reset', () => {
    render(<ReducerDemo />)

    expect(screen.getByText(/nothing in the cart/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled()
    expect(screen.getByText('0 EUR')).toBeInTheDocument()
  })

  it('adding items updates the lines, the total and the action log', async () => {
    const user = userEvent.setup()
    render(<ReducerDemo />)

    await user.click(screen.getByRole('button', { name: /notebook, dotted/i }))
    await user.click(screen.getByRole('button', { name: /fountain pen/i }))
    await user.click(screen.getByRole('button', { name: 'Increase Notebook, dotted' }))

    const cart = within(screen.getByRole('list', { name: 'Cart' }))
    expect(cart.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('52 EUR')).toBeInTheDocument()

    const log = within(screen.getByRole('list', { name: 'Dispatched actions' }))
    expect(log.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'quantity_changed #1 +1',
      'added #2',
      'added #1',
    ])
  })

  it('reset empties the cart and clears the log', async () => {
    const user = userEvent.setup()
    render(<ReducerDemo />)

    await user.click(screen.getByRole('button', { name: /ink, blue-black/i }))
    await user.click(screen.getByRole('button', { name: /reset/i }))

    expect(screen.getByText(/nothing in the cart/i)).toBeInTheDocument()
    expect(screen.getByText('(empty)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeDisabled()
  })
})
