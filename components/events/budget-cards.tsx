'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';

function AnimatedCurrency({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (current) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(current)
  );

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: 'easeOut' });
    return () => controls.stop();
  }, [motionValue, value]);

  return <motion.span>{display}</motion.span>;
}

export function BudgetCards({
  totalBudget,
  allocated,
  remaining
}: {
  totalBudget: number;
  allocated: number;
  remaining: number;
}) {
  const cards = [
    { title: 'Total Budget', value: totalBudget, remaining: false },
    { title: 'Allocated', value: allocated, remaining: false },
    { title: 'Remaining', value: remaining, remaining: true }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => {
        const isNegative = card.remaining && card.value < 0;
        const isPositiveRemaining = card.remaining && card.value >= 0;

        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            <Card
              className={`group relative overflow-hidden ${
                isPositiveRemaining ? 'shadow-[0_0_24px_rgba(255,106,0,0.14)]' : ''
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A1A1AA]">{card.title}</p>
              <p className={`mt-3 text-3xl font-bold ${isNegative ? 'text-rose-400' : 'text-[#FAFAFA]'}`}>
                <AnimatedCurrency value={card.value} />
              </p>
              <span className="absolute bottom-0 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#FF6A00] transition duration-200 ease-in-out group-hover:scale-x-100" />
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
