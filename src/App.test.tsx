import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('has exactly one top-level heading', () => {
    render(<App />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('every section link in the navigation points at a section on the page', () => {
    const { container } = render(<App />)
    const nav = within(screen.getByRole('navigation', { name: 'Sections' }))

    const links = nav.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      const hash = link.getAttribute('href') ?? ''
      expect(hash).toMatch(/^#[a-z-]+$/)
      expect(container.querySelector(hash), `target of ${hash}`).not.toBeNull()
    }
  })
})
