'use client';

import { Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      setError('Incorrect password');
      setLoading(false);
      return;
    }

    const nextPath = searchParams.get('next');
    router.push(nextPath && nextPath.startsWith('/') ? nextPath : '/');
    router.refresh();
  }

  return (
    <main className="mx-auto mt-24 max-w-md">
      <Card className="p-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#FF6A00]/15 p-2.5 text-[#FF8124]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#FAFAFA]">Admin Access</h1>
            <p className="text-sm text-[#A1A1AA]">Enter app password to continue.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label>
            <span className="mb-1 block text-sm font-medium text-[#A1A1AA]">Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <Button type="submit" loading={loading} className="w-full" variant="primary">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </main>
  );
}
