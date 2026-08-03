"use client";

import { motion } from "motion/react";

/**
 * Page transition.
 *
 * `template.tsx` remounts on every navigation, which is exactly what a
 * cross-fade needs. Kept deliberately short and subtle — 260 ms of opacity and
 * a few pixels of lift, so it reads as polish rather than as a delay. Reduced
 * motion is honoured by Framer Motion's own `useReducedMotion` handling of
 * transform properties, and opacity alone remains safe.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
