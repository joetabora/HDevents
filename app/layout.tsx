import type { Metadata } from 'next';
import './globals.css';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AppShell } from '@/components/app-shell';
import { AppToaster } from '@/components/providers/app-toaster';
import { getCurrentUser } from '@/modules/users/server';

export const metadata: Metadata = {
  title: 'HD Events Admin',
  description: 'Event operations admin dashboard'
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body>
        <LoadingScreen />
        <AppShell
          currentUser={
            user
              ? {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  department: user.department
                }
              : null
          }
        >
          {children}
        </AppShell>
        <AppToaster />
      </body>
    </html>
  );
}
