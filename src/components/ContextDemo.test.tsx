import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ContextDemo } from './ContextDemo'

// The demo shows the render count of each consumer; read it the way a
// person does — the "renders: N" line inside the box with that label.
function rendersOf(label: string): number {
  const box = screen.getByText(label).closest('div')
  if (box === null) throw new Error(`no consumer box labelled "${label}"`)
  const line = within(box).getByText('renders:', { exact: false }).textContent
  return Number(line.replace('renders:', ''))
}

describe('ContextDemo', () => {
  it('starts with one context holding an object, both consumers rendered once', () => {
    render(<ContextDemo />)

    expect(screen.getByRole('radio', { name: 'One context, one object' })).toBeChecked()
    expect(rendersOf('reads theme')).toBe(1)
    expect(rendersOf('reads count')).toBe(1)
  })

  it('with one context, changing count re-renders the consumer that only reads theme', async () => {
    const user = userEvent.setup()
    render(<ContextDemo />)

    await user.click(screen.getByRole('button', { name: 'count' }))

    expect(rendersOf('reads count')).toBe(2)
    expect(rendersOf('reads theme')).toBe(2)
  })

  it('with split contexts, changing count leaves the theme consumer alone', async () => {
    const user = userEvent.setup()
    render(<ContextDemo />)

    await user.click(screen.getByRole('radio', { name: 'Two contexts, one value each' }))
    await user.click(screen.getByRole('button', { name: 'count' }))

    expect(rendersOf('reads count')).toBe(2)
    expect(rendersOf('reads theme')).toBe(1)
  })

  it('the context shape is a keyboard-navigable radio group', async () => {
    const user = userEvent.setup()
    render(<ContextDemo />)

    const group = screen.getByRole('group', { name: 'Context shape' })
    expect(within(group).getAllByRole('radio')).toHaveLength(2)

    await user.click(screen.getByRole('radio', { name: 'One context, one object' }))
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Two contexts, one value each' })).toBeChecked()
    expect(screen.getByText(/only the box that reads count re-renders/i)).toBeInTheDocument()
  })
})
