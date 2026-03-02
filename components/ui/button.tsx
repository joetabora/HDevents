'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient';

type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#FF6A00] text-black hover:bg-[#FF8124] shadow-[0_6px_18px_rgba(255,106,0,0.25)]',
  secondary: 'bg-[#111113] text-[#FAFAFA] border border-[#27272A] hover:border-[#FF6A00] hover:text-[#FF8124]',
  danger: 'bg-[#7f1d1d] text-[#FAFAFA] hover:bg-[#991b1b]',
  ghost: 'bg-transparent text-[#FAFAFA] border border-[#27272A] hover:border-[#FF6A00] hover:text-[#FF8124]',
  gradient: 'bg-gradient-to-r from-[#FF6A00] to-[#FF8124] text-black shadow-[0_6px_18px_rgba(255,106,0,0.3)] hover:brightness-105'
};

export function Button({ className, children, variant = 'primary', loading = false, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition duration-200 ease-in-out active:scale-95',
        'hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
