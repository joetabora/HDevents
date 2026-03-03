'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { href: '/social', label: 'Dashboard' },
  { href: '/social/pipeline', label: 'Pipeline' },
  { href: '/social/output', label: 'Daily Output' },
  { href: '/social/performance', label: 'Performance' },
  { href: '/social/ideas', label: 'Idea Vault' }
];

export function SocialNav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-2xl border px-4 py-2 text-sm font-semibold transition duration-200 ease-in-out',
              active
                ? 'border-[#FF6A00] bg-[#FF6A00]/15 text-[#FF8124]'
                : 'border-[#27272A] bg-[#111113] text-[#A1A1AA] hover:border-[#3f3f46] hover:text-[#FAFAFA]'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
