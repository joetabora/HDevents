'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { UserDepartment, UserRole } from '@/modules/users/constants';
import { Sidebar } from './sidebar';

export function AppShell({
  children,
  currentUser
}: {
  children: React.ReactNode;
  currentUser: { id: string; name: string; email: string; role: UserRole; department: UserDepartment } | null;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const handleChange = () => setIsDesktop(media.matches);

    handleChange();
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, []);

  if (pathname === '/login') {
    return <main className="min-h-screen p-4 md:p-8">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        currentUser={currentUser}
      />

      <motion.main
        animate={{ marginLeft: isDesktop ? (collapsed ? 92 : 260) : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="min-h-screen p-5 md:p-10"
      >
        <button
          type="button"
          className="mb-5 rounded-xl border border-[#27272A] bg-[#111113] p-2 text-[#FAFAFA] hover:border-[#FF6A00] md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
