import { SocialNav } from '@/components/social/social-nav';

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SocialNav />
      {children}
    </div>
  );
}
