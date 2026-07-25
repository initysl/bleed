'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

// A thin client wrapper so server components (like an async page fetching
// data directly) can still get a fade/slide-in without becoming client
// components themselves — the children passed in stay server-rendered,
// only this wrapper's own mount animation runs client-side.
export function AnimatedIn({
  children,
  delay = 0,
  className,
}: AnimatedInProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
