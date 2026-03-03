'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, LayoutDashboard, Radio, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { LogoutButton } from './logout-button';

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/social', label: 'Social', icon: Radio },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      <div className="mb-8 flex items-center justify-between gap-3">
        <AnimatePresence>
          {!collapsed ? (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="text-lg font-semibold tracking-wide text-[#FAFAFA]"
            >
              RALLY OPS
            </motion.p>
          ) : (
            <p className="text-sm font-semibold tracking-wide text-[#FAFAFA]">RO</p>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={onToggle}
          className="hidden rounded-xl border border-[#27272A] bg-[#111113] p-1.5 text-[#A1A1AA] hover:border-[#3f3f46] hover:text-[#FAFAFA] md:block"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="space-y-1.5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobile}
              className={cn(
                'flex items-center gap-3 rounded-r-2xl border-l-2 px-3 py-2.5 text-sm font-medium transition duration-200 ease-in-out',
                active
                  ? 'border-l-[#FF6A00] bg-[#18181B] text-[#FAFAFA]'
                  : 'border-l-transparent text-[#A1A1AA] hover:border-l-[#3f3f46] hover:bg-[#18181B] hover:text-[#FAFAFA]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? <span>{link.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <LogoutButton compact={collapsed} />
      </div>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.button
            type="button"
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onCloseMobile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close sidebar overlay"
          />
        ) : null}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 92 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[#27272A] bg-[#111113] p-4 md:flex',
          collapsed ? 'items-center' : ''
        )}
      >
        {sidebarContent}
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#27272A] bg-[#111113] p-4 md:hidden"
          >
            {sidebarContent}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
