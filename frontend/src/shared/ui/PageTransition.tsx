import React from 'react';
import { motion } from 'framer-motion';

type PageTransitionProps = React.PropsWithChildren<React.ComponentProps<typeof motion.div>>;

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.25, ease: 'easeInOut' } },
};

export default function PageTransition({ children, ...rest }: PageTransitionProps) {
  return (
    <motion.div
      {...rest}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
