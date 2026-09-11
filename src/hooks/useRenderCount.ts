import { useRef } from 'react'

// Counts how many times React has called the component this is used in.
//
// It mutates a ref during render, which the React Compiler rules forbid for
// good reason: render must be pure. Here the impurity *is* the instrument —
// the number on screen is the number of renders — so ESLint's
// `react-hooks/refs` is silenced at this one site, and nowhere else. Demo
// instrument, not a pattern to copy.
export function useRenderCount() {
  const renders = useRef(0)
  // eslint-disable-next-line react-hooks/refs -- see above
  return (renders.current += 1)
}
