'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="max-w-xl border-rose-500/50 bg-[#2a1212]">
      <h2 className="text-lg font-semibold text-rose-300">Something went wrong</h2>
      <p className="mt-2 text-sm text-rose-200/90">{error.message}</p>
      <Button type="button" onClick={reset} className="mt-4" variant="danger">
        Retry
      </Button>
    </Card>
  );
}
