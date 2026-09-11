import { renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'

import { useRenderCount } from './useRenderCount'

it('reports 1 on the first render and counts each render after it', () => {
  const { result, rerender } = renderHook(() => useRenderCount())
  expect(result.current).toBe(1)

  rerender()
  rerender()
  expect(result.current).toBe(3)
})

it('keeps a separate count per component instance', () => {
  const first = renderHook(() => useRenderCount())
  const second = renderHook(() => useRenderCount())

  first.rerender()
  expect(first.result.current).toBe(2)
  expect(second.result.current).toBe(1)
})
