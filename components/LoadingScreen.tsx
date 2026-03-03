'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const TOTAL_VISIBLE_MS = 1500;

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, TOTAL_VISIBLE_MS);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'linear' }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0B0B0D]"
        >
          <div className="flex flex-col items-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: 'linear' }}
              className="text-sm font-semibold tracking-[0.35em] text-[#FAFAFA]"
            >
              RALLY OPS
            </motion.p>

            <div className="relative mt-5 h-[2px] w-56 overflow-hidden bg-[#FF6A00]/20">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: 'linear', delay: 0.15 }}
                style={{ transformOrigin: 'left center' }}
                className="h-full w-full bg-[#FF6A00] shadow-[0_0_15px_rgba(255,106,0,0.4)]"
              />

              <motion.div
                initial={{ x: '-120%' }}
                animate={{ x: '240%' }}
                transition={{ duration: 0.45, ease: 'linear', delay: 0.85 }}
                className="pointer-events-none absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[#FAFAFA]/50 to-transparent"
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
