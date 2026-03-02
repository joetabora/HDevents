'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

export function SubmitButton({
  children,
  pendingText,
  variant = 'primary',
  className
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient';
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} variant={variant} className={className}>
      {pending ? pendingText ?? 'Saving...' : children}
    </Button>
  );
}
