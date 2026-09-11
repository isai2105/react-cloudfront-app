import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Footer } from './Footer'

describe('Footer', () => {
  it('opens every further-reading link in a new tab without leaking the referrer', () => {
    render(<Footer />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('href', expect.stringMatching(/^https:\/\/react\.dev\//))
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    }
  })
})
