import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  delay?: number
}

// Enter-on-scroll for section content. Motivation: sequence, so the reader's
// eye lands on the headline before the demo. Collapses to static under
// prefers-reduced-motion.
//
// The wrapper is not a landmark and has no accessible role of its own, so
// `data-testid` is the honest hook: e2e/preview asserts the animation
// reaches opacity 1 under the CSP, and nothing semantic identifies "the
// thing being animated".
export function Reveal({ children, className, delay = 0 }: Props) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      data-testid="reveal"
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
