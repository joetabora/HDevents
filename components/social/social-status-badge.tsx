import { type SocialPostStatus } from '@/lib/types/social';
import { cn } from '@/lib/utils/cn';

const styles: Record<SocialPostStatus, string> = {
  IDEA: 'border-[#27272A] bg-[#111113] text-[#A1A1AA]',
  FILMING: 'border-[#FF6A00]/40 bg-[#FF6A00]/10 text-[#FF8124]',
  EDITING: 'border-[#FF6A00]/35 bg-[#FF6A00]/8 text-[#FF9B51]',
  SCHEDULED: 'border-[#FF6A00]/45 bg-[#FF6A00]/16 text-[#FFB17A]',
  POSTED: 'border-[#fb923c] bg-[#fb923c]/18 text-[#fdba74]'
};

export function SocialStatusBadge({ status }: { status: SocialPostStatus }) {
  return (
    <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide', styles[status])}>{status}</span>
  );
}
