import { expect, test } from './fixtures'

// The single route this app has today. Deep-link tests (a non-root path
// rewritten to index.html by the edge) join this file when a router does.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('renders the page with one top-level heading', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Most state bugs are placement bugs.',
  )
  await expect(page).toHaveTitle(/./)
})

test('sections animate into view once scrolled to', async ({ page }) => {
  // Reveal starts at opacity 0 and `motion` drives it to 1 through the CSSOM
  // and Web Animations API — under `style-src 'self'`, this is what proves
  // the animation library needs no inline-style allowance.
  const reveal = page
    .getByTestId('reveal')
    .filter({ has: page.getByRole('heading', { level: 2, name: /libraries, by the problem/i }) })
  await reveal.scrollIntoViewIfNeeded()
  await expect(reveal).toHaveCSS('opacity', '1')
})

test('the reducer demo dispatches actions from the cart controls', async ({ page }) => {
  const section = page.locator('#reducer')
  await section.scrollIntoViewIfNeeded()

  await section.getByRole('button', { name: /notebook, dotted/i }).click()
  await section.getByRole('button', { name: 'Increase Notebook, dotted' }).click()

  await expect(section.getByText('18 EUR')).toBeVisible()
  await expect(section.getByRole('list', { name: 'Dispatched actions' })).toContainText(
    'quantity_changed #1 +1',
  )
})

test('the context demo switches shape through the radio group', async ({ page }) => {
  const section = page.locator('#context')
  await section.scrollIntoViewIfNeeded()

  // The input is visually hidden; the styled label is what a person clicks.
  await section.getByText('Two contexts, one value each').click()
  await expect(section.getByRole('radio', { name: 'Two contexts, one value each' })).toBeChecked()
  await section.getByRole('button', { name: 'count' }).click()

  await expect(section.getByText(/only the box that reads count re-renders/i)).toBeVisible()
})

test('the libraries tabs switch the panel', async ({ page }) => {
  const section = page.locator('#libraries')
  await section.scrollIntoViewIfNeeded()

  await section.getByRole('tab', { name: 'XState' }).click()

  await expect(section.getByRole('tabpanel', { name: 'XState' })).toContainText(
    'Explicit states and transitions',
  )
})
