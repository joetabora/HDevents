import { cn } from '@/lib/utils/cn';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#27272A] bg-[#18181B] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]',
        'transition duration-200 ease-in-out hover:border-[#3f3f46]',
        className
      )}
    >
      {children}
    </div>
  );
}
