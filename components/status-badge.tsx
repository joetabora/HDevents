import { type ItemStatus } from '@/lib/types/domain';
import { cn } from '@/lib/utils/cn';

const badgeStyles: Record<ItemStatus, string> = {
  PROSPECT: 'bg-[#111113] text-[#A1A1AA] border-[#27272A]',
  CONTACTED: 'bg-[#FF6A00]/15 text-[#FF8124] border-[#FF6A00]/40',
  LOCKED_IN: 'bg-[#FF6A00]/25 text-[#FFB17A] border-[#FF8124]/45'
};

const labels: Record<ItemStatus, string> = {
  PROSPECT: 'Prospect',
  CONTACTED: 'Contacted',
  LOCKED_IN: 'Locked In'
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', badgeStyles[status])}>
      {labels[status]}
    </span>
  );
}
