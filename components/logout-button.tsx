'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/button';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsPending(true);
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
    setIsPending(false);
  };

  return (
    <Button
      type="button"
      onClick={handleLogout}
      loading={isPending}
      variant="ghost"
      className={`w-full ${compact ? 'px-2' : ''}`}
    >
      <LogOut className="h-4 w-4" />
      {!compact ? 'Sign out' : null}
    </Button>
  );
}
