import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Libraries } from './Libraries'

describe('Libraries', () => {
  it('renders one tab per library with the first selected', () => {
    render(<Libraries />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Zustand',
      'Jotai',
      'Redux Toolkit',
      'TanStack Query',
      'XState',
    ])
    expect(screen.getByRole('tab', { name: 'Zustand' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Zustand' })).toBeInTheDocument()
  })

  it('selecting a tab shows that library and labels the panel with it', async () => {
    const user = userEvent.setup()
    render(<Libraries />)

    await user.click(screen.getByRole('tab', { name: 'TanStack Query' }))

    expect(screen.getByRole('tab', { name: 'TanStack Query' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'Zustand' })).toHaveAttribute('aria-selected', 'false')
    const panel = screen.getByRole('tabpanel', { name: 'TanStack Query' })
    expect(panel).toHaveTextContent('Server state as a keyed cache')
    expect(screen.getByRole('heading', { level: 3, name: 'TanStack Query' })).toBeInTheDocument()
  })
})
