import type { Metadata } from 'next';
import './globals.css';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AppShell } from '@/components/app-shell';
import { AppToaster } from '@/components/providers/app-toaster';

export const metadata: Metadata = {
  title: 'HD Events Admin',
  description: 'Event operations admin dashboard'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LoadingScreen />
        <AppShell>{children}</AppShell>
        <AppToaster />
      </body>
    </html>
  );
}
